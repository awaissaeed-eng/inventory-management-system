from flask import Blueprint, request, jsonify
import sys
import os

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.database import get_db_session, get_models, handle_db_error, close_db_session
from utils.serializers import return_serializer
from werkzeug.utils import secure_filename
from sqlalchemy import and_, or_
from datetime import datetime
import uuid

returns_bp = Blueprint('returns', __name__)

# Get return statistics
@returns_bp.route('/returns/stats', methods=['GET'])
def get_return_stats():
    db = get_db_session()
    try:
        models = get_models()
        ReturnRecord = models.get('ReturnRecord')

        # Count buyback returns
        buyback_count = db.query(ReturnRecord).filter(ReturnRecord.return_type == 'buyback').count()

        # Count damaged returns
        damaged_count = db.query(ReturnRecord).filter(ReturnRecord.return_type == 'damaged').count()

        return jsonify({
            'buyback_count': buyback_count,
            'damaged_count': damaged_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

# Get total return count
@returns_bp.route('/returns/total-count', methods=['GET'])
def get_total_return_count():
    db = get_db_session()
    try:
        models = get_models()
        ReturnRecord = models.get('ReturnRecord')

        # Count all return records
        total_count = db.query(ReturnRecord).count()

        return jsonify({
            'total_return_count': total_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

# Get all returns
@returns_bp.route('/returns', methods=['GET'])
def get_returns():
    db = get_db_session()
    try:
        models = get_models()
        ReturnRecord = models.get('ReturnRecord')
        Asset = models.get('Asset')
        Assignment = models.get('Assignment')

        returns = db.query(ReturnRecord).order_by(ReturnRecord.return_date.desc()).all()
        enriched_returns = []

        for return_record in returns:
            oracle_number = return_record.oracle_number
            asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first() if oracle_number else None
            assignment = db.query(Assignment).filter(
                Assignment.oracle_number == oracle_number,
                Assignment.status == 'returned'
            ).first() if oracle_number else None

            return_data = return_serializer(return_record)

            if asset:
                return_data['asset_type'] = asset.device_type or ''
                return_data['asset_model'] = asset.model_name or ''
                return_data['serial_number'] = asset.serial_number or ''
                return_data['asset_status'] = asset.status or ''
            else:
                return_data['asset_type'] = ''
                return_data['asset_model'] = ''
                return_data['serial_number'] = ''
                return_data['asset_status'] = ''

            if assignment:
                return_data['employee_name'] = assignment.employee_name or ''
                return_data['employee_department'] = assignment.department or ''
                return_data['employee_designation'] = assignment.designation or ''
                return_data['allocation_date'] = assignment.assignment_date.isoformat() if assignment.assignment_date else ''
                return_data['expected_return_date'] = assignment.expected_return_date.isoformat() if assignment.expected_return_date else ''
            else:
                return_data['employee_name'] = ''
                return_data['employee_department'] = ''
                return_data['employee_designation'] = ''
                return_data['allocation_date'] = ''
                return_data['expected_return_date'] = ''

            enriched_returns.append(return_data)

        return jsonify(enriched_returns), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

# Add a new return
@returns_bp.route('/returns', methods=['POST'])
def add_return():
    db = get_db_session()
    try:
        models = get_models()
        ReturnRecord = models.get('ReturnRecord')
        Asset = models.get('Asset')
        Assignment = models.get('Assignment')

        # Handle file upload
        if 'voucher' in request.files:
            voucher_file = request.files['voucher']
            filename = secure_filename(voucher_file.filename)
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            if filename.lower().endswith('.pdf'):
                upload_folder = os.path.join('uploads', 'pdfs')
            else:
                upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            unique_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(upload_folder, unique_filename)
            voucher_file.save(file_path)
            # Save relative path for database
            if upload_folder.endswith('pdfs'):
                voucher_filename = os.path.join('uploads', 'pdfs', unique_filename)
            else:
                voucher_filename = unique_filename
        else:
            voucher_filename = None

        data = request.form
        required = ['oracle_number', 'return_option', 'return_date']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Check if asset is currently under repair
        RepairRequestForm = models.get('RepairRequestForm')
        under_repair = db.query(RepairRequestForm).filter(
            RepairRequestForm.oracle_number == data['oracle_number']
        ).first()
        if under_repair:
            return jsonify({'error': 'This asset is currently under repair and cannot be processed here.'}), 400

        # Set return_type exactly to chosen radio value, normalized
        return_type_raw = str(data['return_option']).strip().lower()
        # Map frontend values to backend statuses
        if return_type_raw == 'employee_buyback':
            return_type = 'buyback'
        elif return_type_raw == 'marked_as_damaged':
            return_type = 'damaged'
        else:
            return_type = return_type_raw

        reason = data.get('condition', '')
        notes = data.get('comments', '')

        # Parse return_date
        return_date = None
        try:
            return_date = datetime.fromisoformat(data['return_date'].replace('Z', '+00:00'))
        except:
            pass

        return_record = ReturnRecord(
            oracle_number=data['oracle_number'],
            return_type=return_type,
            return_date=return_date,
            reason=reason,
            notes=notes,
            timestamp=datetime.utcnow(),
            voucher_filename=voucher_filename
        )

        db.add(return_record)
        db.commit()

        # Update asset status based on return type
        asset = db.query(Asset).filter(Asset.oracle_number == data['oracle_number']).first()
        if asset:
            if return_type == 'returned_to_inventory':
                # When asset is returned, set status to 'used'
                asset.status = 'used'
                asset.assigned_to = ''
                asset.assignment_date = None
                asset.expected_return_date = None
            elif return_type == 'damaged':
                # For damaged, set status to damaged
                asset.status = 'damaged'
                asset.assigned_to = ''
                asset.assignment_date = None
                asset.expected_return_date = None
            elif return_type == 'buyback':
                # For employee buyback, set status to buyback
                asset.status = 'buyback'
                asset.assigned_to = ''
                asset.assignment_date = None
                asset.expected_return_date = None
            asset.updated_at = datetime.utcnow()
            db.commit()

        # Update assignment status if exists
        assignment = db.query(Assignment).filter(
            Assignment.oracle_number == data['oracle_number'],
            Assignment.status == 'assigned'
        ).first()
        if assignment:
            assignment.status = 'returned'
            assignment.actual_return_date = return_date
            db.commit()

        return jsonify({'id': return_record.id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

# Update voucher for a return
@returns_bp.route('/returns/<return_id>/voucher', methods=['POST'])
def update_return_voucher(return_id):
    db = get_db_session()
    try:
        models = get_models()
        ReturnRecord = models.get('ReturnRecord')

        if 'voucher' in request.files:
            voucher_file = request.files['voucher']
            filename = secure_filename(voucher_file.filename)
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            if filename.lower().endswith('.pdf'):
                upload_folder = os.path.join('uploads', 'pdfs')
            else:
                upload_folder = current_app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            unique_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(upload_folder, unique_filename)
            voucher_file.save(file_path)
            # Save relative path for database
            if upload_folder.endswith('pdfs'):
                voucher_filename = os.path.join('uploads', 'pdfs', unique_filename)
            else:
                voucher_filename = unique_filename

            return_record = db.query(ReturnRecord).filter(ReturnRecord.id == int(return_id)).first()
            if return_record:
                return_record.voucher_filename = voucher_filename
                db.commit()
                return jsonify({'message': 'Voucher updated successfully'}), 200
            else:
                return jsonify({'error': 'Return record not found'}), 404

        return jsonify({'error': 'No file provided'}), 400
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@returns_bp.route('/returns/<oracle_number>', methods=['GET'])
def get_returns_by_oracle_number(oracle_number):
    """Get return details for a specific asset by oracle number"""
    db = get_db_session()
    try:
        models = get_models()
        ReturnRecord = models.get('ReturnRecord')
        Asset = models.get('Asset')
        Assignment = models.get('Assignment')

        returns = db.query(ReturnRecord).filter(
            ReturnRecord.oracle_number == oracle_number
        ).order_by(ReturnRecord.return_date.desc()).all()

        enriched_returns = []

        for return_record in returns:
            asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first()
            assignment = db.query(Assignment).filter(
                Assignment.oracle_number == oracle_number,
                Assignment.status == 'returned'
            ).first()

            return_data = return_serializer(return_record)

            if asset:
                return_data['asset_type'] = asset.device_type or ''
                return_data['asset_model'] = asset.model_name or ''
                return_data['serial_number'] = asset.serial_number or ''
                return_data['asset_status'] = asset.status or ''
            else:
                return_data['asset_type'] = ''
                return_data['asset_model'] = ''
                return_data['serial_number'] = ''
                return_data['asset_status'] = ''

            if assignment:
                return_data['employee_name'] = assignment.employee_name or ''
                return_data['employee_department'] = assignment.department or ''
                return_data['employee_designation'] = assignment.designation or ''
                return_data['allocation_date'] = assignment.assignment_date.isoformat() if assignment.assignment_date else ''
                return_data['expected_return_date'] = assignment.expected_return_date.isoformat() if assignment.expected_return_date else ''
            else:
                return_data['employee_name'] = ''
                return_data['employee_department'] = ''
                return_data['employee_designation'] = ''
                return_data['allocation_date'] = ''
                return_data['expected_return_date'] = ''

            enriched_returns.append(return_data)

        return jsonify(enriched_returns), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)
