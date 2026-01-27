# --- Assets Routes with SQLAlchemy ---
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import datetime, timedelta
import json
import re
import sys
import os

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.database import get_db_session, get_models, handle_db_error, close_db_session
from utils.serializers import activity_serializer, asset_serializer

assets_bp = Blueprint('assets', __name__)

# Device type to brand mappings
DEVICE_BRAND_MAPPINGS = {
    'Laptop': ['Dell', 'HP', 'Lenovo'],
    'Desktop': ['Dell', 'HP', 'Lenovo'],
    'Scanner': ['HP', 'Xerox'],
    'Printer': ['HP', 'Matica'],
    'Screen': ['Samsung', 'HP', 'Dell'],
    'UPS': ['APC', 'Inforise', 'AMB On', 'Emerson'],
    'Access Point WiFi': ['Grandstream'],
    'Switches': ['Grandstream', 'Cisco'],
    'Server': ['Dell', 'H3C'],
    'Routers': ['Cisco'],
    'Firewall': ['Fortinet', 'Cisco'],
    'Biometric': ['ZKTeco'],
    'Other': []
}

def initialize_device_brand_mappings():
    """Initialize device brand mappings in database if not exists"""
    db = get_db_session()
    try:
        # Get the DeviceBrandMapping model
        models = get_models()
        DeviceBrandMapping = models.get('DeviceBrandMapping')

        if DeviceBrandMapping:
            count = db.query(DeviceBrandMapping).count()
            if count == 0:
                for device_type, brands in DEVICE_BRAND_MAPPINGS.items():
                    mapping = DeviceBrandMapping(
                        device_type=device_type,
                        brands=json.dumps(brands),
                        created_at=datetime.utcnow()
                    )
                    db.add(mapping)
                db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error initializing device brand mappings: {e}")
    finally:
        close_db_session(db)



@assets_bp.route('/recent-activities', methods=['GET'])
def get_recent_activities():
    db = get_db_session()
    try:
        models = get_models()
        ActivityLog = models.get('ActivityLog')

        activities = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(10).all()

        db.commit()
        return jsonify([activity_serializer(a) for a in activities]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets', methods=['GET'])
def get_assets():
    db = get_db_session()
    try:
        models = get_models()
        Asset = models.get('Asset')
        Assignment = models.get('Assignment')
        ReturnRecord = models.get('ReturnRecord')
        RepairRequestForm = models.get('RepairRequestForm')

        query = db.query(Asset)

        # Apply filters
        device_type = request.args.get('device_type')
        brand_name = request.args.get('brand_name')
        oracle_number = request.args.get('oracle_number')
        search = request.args.get('search')

        if device_type and device_type != 'All':
            query = query.filter(Asset.device_type == device_type)
        if brand_name and brand_name != 'All':
            query = query.filter(Asset.brand_name == brand_name)

        # Oracle number search (partial match)
        if oracle_number:
            query = query.filter(Asset.oracle_number.ilike(f'%{oracle_number}%'))

        # General search across multiple fields
        if search:
            query = query.filter(
                or_(
                    Asset.oracle_number.ilike(f'%{search}%'),
                    Asset.device_type.ilike(f'%{search}%'),
                    Asset.brand_name.ilike(f'%{search}%'),
                    Asset.model_name.ilike(f'%{search}%'),
                    Asset.serial_number.ilike(f'%{search}%')
                )
            )

        # Status filter
        status = request.args.get('status')
        if status:
            query = query.filter(Asset.status == status)

        # Check for new assets filter
        if request.args.get('new') == 'true':
            query = query.filter(
                and_(
                    or_(Asset.assigned_to.is_(None), Asset.assigned_to == ''),
                    Asset.status != 'under repair',
                    ~Asset.status.in_(['damaged', 'auctioned'])
                )
            )

        # Check for stock assets filter
        if request.args.get('stock') == 'true':
            query = query.filter(
                or_(
                    and_(
                        or_(Asset.assigned_to.is_(None), Asset.assigned_to == ''),
                        ~Asset.status.in_(['under repair', 'damaged', 'auctioned'])
                    ),
                    and_(
                        Asset.status == 'under repair',
                        or_(Asset.assigned_to.is_(None), Asset.assigned_to == '')
                    )
                )
            )

        # Check for unassigned assets filter
        if request.args.get('unassigned') == 'true':
            query = query.filter(or_(Asset.assigned_to.is_(None), Asset.assigned_to == ''))

        assets = query.all()

        # Enrich assets with return information, repair status, and current holder
        enriched_assets = []
        for asset in assets:
            asset_data = asset_serializer(asset)

            # Get current holder from assignments
            assignment = db.query(Assignment).filter(
                and_(
                    Assignment.oracle_number == asset.oracle_number,
                    Assignment.status == 'assigned'
                )
            ).first()

            # Debug logging
            print(f"Debug: Asset {asset.oracle_number}, Assignment found: {assignment is not None}")
            if assignment:
                print(f"Debug: Assignment employee: {assignment.employee_name}, status: {assignment.status}")
                asset_data['current_holder'] = assignment.employee_name
                asset_data['assignment_date'] = assignment.assignment_date.isoformat() if assignment.assignment_date else ''
                asset_data['return_date'] = assignment.actual_return_date.isoformat() if assignment.actual_return_date else ''
            else:
                print(f"Debug: No assignment found for {asset.oracle_number}")
                asset_data['current_holder'] = 'Not Assigned'
                asset_data['assignment_date'] = ''
                asset_data['return_date'] = ''

            # Check if asset has been returned with buyback
            return_record = db.query(ReturnRecord).filter(
                and_(
                    ReturnRecord.oracle_number == asset.oracle_number,
                    ReturnRecord.return_type == 'buyback'
                )
            ).order_by(ReturnRecord.timestamp.desc()).first()

            if return_record:
                asset_data['return_type'] = 'buyback'

            # Check if asset is under repair
            repair = db.query(RepairRequestForm).filter(
                RepairRequestForm.oracle_number == asset.oracle_number
            ).first()

            if repair:
                asset_data['status'] = 'under repair'

            enriched_assets.append(asset_data)

        db.commit()
        return jsonify(enriched_assets), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/device-types', methods=['GET'])
def get_device_types():
    initialize_device_brand_mappings()
    db = get_db_session()
    try:
        models = get_models()
        DeviceBrandMapping = models.get('DeviceBrandMapping')

        device_types = db.query(DeviceBrandMapping.device_type).distinct().all()
        device_types = [dt[0] for dt in device_types]

        db.commit()
        return jsonify(device_types), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/brands/<device_type>', methods=['GET'])
def get_brands_for_device(device_type):
    initialize_device_brand_mappings()
    db = get_db_session()
    try:
        models = get_models()
        DeviceBrandMapping = models.get('DeviceBrandMapping')
        Asset = models.get('Asset')

        # Get predefined brands
        mapping = db.query(DeviceBrandMapping).filter(DeviceBrandMapping.device_type == device_type).first()
        brands = []
        if mapping:
            brands = json.loads(mapping.brands) if mapping.brands else []

        # Also include any custom brands from assets
        custom_brands = db.query(Asset.brand_name).filter(
            and_(
                Asset.device_type == device_type,
                Asset.brand_name.isnot(None),
                Asset.brand_name != ''
            )
        ).distinct().all()
        custom_brands = [cb[0] for cb in custom_brands]

        all_brands = list(set(brands + custom_brands))
        db.commit()
        return jsonify(all_brands), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/oracle-numbers/<device_type>', methods=['GET'])
def get_new_oracle_numbers(device_type):
    """Get new oracle numbers for a specific device type"""
    db = get_db_session()
    try:
        models = get_models()
        Asset = models.get('Asset')
        Assignment = models.get('Assignment')

        # Get all assigned oracle numbers
        assigned_oracle_numbers = db.query(Assignment.oracle_number).filter(Assignment.status == 'assigned').all()
        assigned_oracle_numbers = set(aon[0] for aon in assigned_oracle_numbers if aon[0])

        # Get new assets by device type
        new_assets = db.query(Asset).filter(
            and_(
                Asset.device_type == device_type,
                Asset.oracle_number.isnot(None),
                Asset.oracle_number != ''
            )
        ).all()

        # Filter out assigned oracle numbers
        new_oracle_numbers = [
            {
                'oracle_number': asset.oracle_number,
                'device_name': asset.device_type,
                'brand_name': asset.brand_name,
                'model_name': asset.model_name
            }
            for asset in new_assets
            if asset.oracle_number not in assigned_oracle_numbers
        ]

        db.commit()
        return jsonify(new_oracle_numbers), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/oracle/<oracle_number>', methods=['GET'])
def get_asset_by_oracle_number(oracle_number):
    """Get asset and employee details by oracle number"""
    db = get_db_session()
    try:
        models = get_models()
        Asset = models.get('Asset')
        Assignment = models.get('Assignment')

        # Get asset details
        asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first()
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404

        # Get assignment details
        assignment = db.query(Assignment).filter(
            and_(
                Assignment.oracle_number == oracle_number,
                Assignment.status == 'assigned'
            )
        ).first()

        asset_data = {
            'asset_type': asset.device_type,
            'model': asset.model_name,  # Keep for backward compatibility
            'model_name': asset.model_name,  # Add this for consistency
            'brand_name': asset.brand_name,
            'serial_number': asset.serial_number
        }

        if assignment:
            asset_data.update({
                'employee_name': assignment.employee_name,
                'designation': assignment.designation,
                'department': assignment.department
            })
        else:
            asset_data.update({
                'employee_name': '',
                'designation': '',
                'department': ''
            })

        db.commit()
        return jsonify(asset_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/<oracle_number>', methods=['GET'])
def get_asset_details(oracle_number):
    """Get comprehensive asset details by oracle number"""
    db = get_db_session()
    try:
        models = get_models()
        Asset = models.get('Asset')
        Assignment = models.get('Assignment')

        # Get asset details
        asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first()
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404

        # Get assignment details
        assignment = db.query(Assignment).filter(
            and_(
                Assignment.oracle_number == oracle_number,
                Assignment.status == 'assigned'
            )
        ).first()

        asset_data = {
            'oracle_number': asset.oracle_number,
            'device_type': asset.device_type,
            'brand_name': asset.brand_name,
            'model_name': asset.model_name,
            'serial_number': asset.serial_number,
            'unit_price': asset.unit_price,
            'status': asset.status,
            'purchase_date': asset.purchase_date.isoformat() if asset.purchase_date else None,
            'warranty_expiry': asset.warranty_expiry or '',
            'vendor_name': asset.vendor_name,
            'tender_no': asset.tender_no,
            'assigned_to': assignment.employee_name if assignment else None,
            'assignment_date': assignment.assignment_date.isoformat() if assignment and assignment.assignment_date else None,
            'designation': assignment.designation if assignment else None,
            'department': assignment.department if assignment else None,
            'return_date': assignment.actual_return_date.isoformat() if assignment and assignment.actual_return_date else None,
            'allocation_voucher': assignment.allocation_voucher_path if assignment else None
        }

        db.commit()
        return jsonify(asset_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/<oracle_number>/assignment-history', methods=['GET'])
def get_assignment_history(oracle_number):
    """Get all assignment history for a specific asset"""
    db = get_db_session()
    try:
        models = get_models()
        Assignment = models.get('Assignment')

        # Get all assignments for the asset, ordered by assignment_date descending
        assignments = db.query(Assignment).filter(
            Assignment.oracle_number == oracle_number
        ).order_by(Assignment.assignment_date.desc()).all()

        assignment_history = []
        for assignment in assignments:
            assignment_data = {
                'id': assignment.id,
                'employee_name': assignment.employee_name,
                'assignment_date': assignment.assignment_date.isoformat() if assignment.assignment_date else '',
                'designation': assignment.designation or '',
                'department': assignment.department or '',
                'return_date': assignment.actual_return_date.isoformat() if assignment.actual_return_date else '',
                'status': assignment.status
            }
            assignment_history.append(assignment_data)

        db.commit()
        return jsonify(assignment_history), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

def log_activity(activity_type, asset):
    db = get_db_session()
    try:
        models = get_models()
        ActivityLog = models.get('ActivityLog')
        Assignment = models.get('Assignment')

        employee_name = asset.assigned_to or ''
        department_name = ''
        if employee_name:
            assignment = db.query(Assignment).filter(
                and_(Assignment.employee_name == employee_name, Assignment.status == 'assigned')
            ).first()
            if assignment:
                department_name = assignment.department

        activity = ActivityLog(
            activity_type=activity_type,
            asset_type=asset.device_type,
            brand_name=asset.brand_name,
            asset_name=asset.model_name,
            employee_name=employee_name,
            department_name=department_name,
            timestamp=datetime.utcnow(),
            remarks=''
        )
        db.add(activity)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error logging activity: {e}")
    finally:
        close_db_session(db)

@assets_bp.route('/assets/update-status', methods=['POST'])
def update_asset_status():
    """Update asset status by oracle number"""
    data = request.json
    oracle_number = data.get('oracle_number')
    status = data.get('status')

    if not oracle_number or not status:
        return jsonify({'error': 'Oracle number and status are required'}), 400

    db = get_db_session()
    try:
        models = get_models()
        Asset = models.get('Asset')

        # Update the asset status
        asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first()
        if not asset:
            return jsonify({'error': 'Asset not found with the provided Oracle number'}), 404

        asset.status = status
        asset.updated_at = datetime.utcnow()
        db.commit()

        return jsonify({'success': True, 'message': 'Asset status updated successfully'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/assigned', methods=['GET'])
def get_assigned_oracle_numbers():
    """Get all Oracle numbers that are currently assigned"""
    db = get_db_session()
    try:
        models = get_models()
        Assignment = models.get('Assignment')
        Asset = models.get('Asset')

        # Get all assigned oracle numbers with status 'assigned'
        assigned_assignments = db.query(Assignment).filter(Assignment.status == 'assigned').all()

        oracle_numbers = []
        for assignment in assigned_assignments:
            if assignment.oracle_number:
                # Check asset status to exclude damaged and auctioned
                asset = db.query(Asset).filter(Asset.oracle_number == assignment.oracle_number).first()
                if asset and asset.status not in ['damaged', 'auctioned']:
                    oracle_numbers.append(assignment.oracle_number)

        db.commit()
        return jsonify(oracle_numbers), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/<oracle_number>/assignment-details', methods=['GET'])
def get_assignment_details(oracle_number):
    """Get assignment details for a specific Oracle number"""
    db = get_db_session()
    try:
        models = get_models()
        Assignment = models.get('Assignment')
        Asset = models.get('Asset')

        # Get the current assignment
        assignment = db.query(Assignment).filter(
            and_(
                Assignment.oracle_number == oracle_number,
                Assignment.status == 'assigned'
            )
        ).first()

        if not assignment:
            return jsonify({'error': 'No active assignment found for this Oracle number'}), 404

        # Get asset details
        asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first()
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404

        assignment_data = {
            'asset_type': asset.device_type,
            'asset_model': asset.model_name,
            'employee_name': assignment.employee_name,
            'employee_department': assignment.department,
            'employee_designation': assignment.designation,
            'allocation_date': assignment.assignment_date.isoformat() if assignment.assignment_date else '',
            'expected_return_date': assignment.expected_return_date.isoformat() if assignment.expected_return_date else ''
        }

        db.commit()
        return jsonify(assignment_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/add-brand', methods=['POST'])
def add_brand_to_device_type():
    """Add a new brand to a specific device type"""
    data = request.json
    device_type = data.get('device_type')
    brand_name = data.get('brand_name')

    if not device_type or not brand_name:
        return jsonify({'error': 'Device type and brand name are required'}), 400

    db = get_db_session()
    try:
        models = get_models()
        DeviceBrandMapping = models.get('DeviceBrandMapping')

        # Get or create the device brand mapping
        mapping = db.query(DeviceBrandMapping).filter(DeviceBrandMapping.device_type == device_type).first()
        if mapping:
            brands = json.loads(mapping.brands) if mapping.brands else []
            if brand_name not in brands:
                brands.append(brand_name)
                mapping.brands = json.dumps(brands)
        else:
            mapping = DeviceBrandMapping(
                device_type=device_type,
                brands=json.dumps([brand_name]),
                created_at=datetime.utcnow()
            )
            db.add(mapping)

        db.commit()
        return jsonify({'success': True, 'message': 'Brand added successfully'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/check-oracle/<oracle_number>', methods=['GET'])
def check_oracle_number(oracle_number):
    db = get_db_session()
    try:
        models = get_models()
        Asset = models.get('Asset')
        exists = db.query(Asset).filter(Asset.oracle_number == oracle_number).first() is not None
        db.commit()
        return jsonify({'exists': exists}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@assets_bp.route('/assets/check-serial/<serial_number>', methods=['GET'])
def check_serial_number(serial_number):
    db = get_db_session()
    try:
        models = get_models()
        Asset = models.get('Asset')
        exists = db.query(Asset).filter(Asset.serial_number == serial_number).first() is not None
        db.commit()
        return jsonify({'exists': exists}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

def parse_warranty_expiry(expiry_input):
    """
    Parse warranty expiry input string and return a datetime object.
    Handles inputs like '5 years', '3 year', or valid date strings.
    Returns None for invalid inputs.
    """
    if not expiry_input or expiry_input.strip() == '':
        return None

    expiry_input = expiry_input.strip()

    # Check for year format (e.g., "5 years", "3 year", "2.5 years")
    year_match = re.match(r'^(\d+(?:\.\d+)?)\s*(?:year|years?)$', expiry_input, re.IGNORECASE)
    if year_match:
        try:
            years = float(year_match.group(1))
            # Calculate expiry date: current date + years
            current_date = datetime.utcnow().date()
            expiry_date = current_date + timedelta(days=int(years * 365.25))  # Account for leap years
            return datetime.combine(expiry_date, datetime.min.time())
        except (ValueError, OverflowError):
            return None

    # Try to parse as a date string
    try:
        # Handle various date formats
        if 'T' in expiry_input:
            # ISO format with time
            parsed_date = datetime.fromisoformat(expiry_input.replace('Z', '+00:00'))
        else:
            # Date only format
            parsed_date = datetime.strptime(expiry_input, '%Y-%m-%d')
        return parsed_date
    except (ValueError, TypeError):
        pass

    # If all parsing fails, return None
    return None

@assets_bp.route('/assets', methods=['POST'])
def add_asset():
    data = request.json
    required = ['oracle_number', 'device_type']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    db = get_db_session()
    try:
        models = get_models()
        Asset = models.get('Asset')

        # Check oracle number uniqueness
        existing_asset = db.query(Asset).filter(Asset.oracle_number == data['oracle_number']).first()
        if existing_asset:
            return jsonify({'error': 'Oracle Number already exists'}), 400

        # Parse dates if provided
        purchase_date = None
        if data.get('purchase_date'):
            try:
                purchase_date = datetime.fromisoformat(data['purchase_date'].replace('Z', '+00:00'))
            except:
                purchase_date = None

        # Parse warranty expiry input
        warranty_expiry = parse_warranty_expiry(data.get('warranty_expiry', ''))
        
        asset = Asset(
            oracle_number=data['oracle_number'],
            device_type=data['device_type'],
            brand_name=data.get('brand_name', ''),
            model_name=data.get('model_name', ''),
            serial_number=data.get('serial_number', ''),
            unit_price=float(data.get('unit_price', 0)) if data.get('unit_price') else None,
            purchase_date=purchase_date,
            warranty_expiry=warranty_expiry,
            vendor_name=data.get('vendor_name', ''),
            tender_no=data.get('tender_no', ''),
            notes=data.get('notes', ''),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(asset)
        db.commit()

        log_activity('Added', asset)
        return jsonify({'id': asset.id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)
