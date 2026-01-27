from flask import Blueprint, request, jsonify
import sys
import os

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.database import get_db_session, get_models, handle_db_error, close_db_session
from utils.serializers import assignment_serializer
from datetime import datetime
from werkzeug.utils import secure_filename
from models import Assignment, Asset, RepairRequestForm

assignments_bp = Blueprint('assignments', __name__)

# Get all assignments
@assignments_bp.route('/assignments', methods=['GET'])
def get_assignments():
    db = get_db_session()
    try:
        # Only fetch assignments with status 'assigned'
        assignments = db.query(Assignment).filter(Assignment.status == 'assigned').all()
        enriched_assignments = []
        for assignment in assignments:
            oracle_number = assignment.oracle_number
            asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first() if oracle_number else None
            asset_status = 'assigned'
            if asset:
                # Check if asset is under repair
                repair_request = db.query(RepairRequestForm).filter(
                    RepairRequestForm.oracle_number == oracle_number
                ).first()
                if repair_request:
                    asset_status = 'under repair'
                else:
                    asset_status = asset.status

            assignment_data = assignment_serializer(assignment, asset_status)
            if asset:
                assignment_data['device_name'] = asset.model_name or asset.device_type
                assignment_data['asset_type'] = asset.device_type
                assignment_data['model'] = asset.model_name
                assignment_data['brand'] = asset.brand_name
                assignment_data['serial_number'] = asset.serial_number
            else:
                assignment_data['device_name'] = ''
                assignment_data['asset_type'] = ''
                assignment_data['model'] = ''
                assignment_data['brand'] = ''
                assignment_data['serial_number'] = ''
            enriched_assignments.append(assignment_data)
        db.commit()
        return jsonify(enriched_assignments), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

# Get all assignments with full details
@assignments_bp.route('/assignments/all', methods=['GET'])
def get_all_assignments():
    db = get_db_session()
    try:
        # Only fetch assignments with status 'assigned'
        assignments = db.query(Assignment).filter(Assignment.status == 'assigned').all()
        enriched_assignments = []
        for assignment in assignments:
            oracle_number = assignment.oracle_number
            asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first() if oracle_number else None
            asset_status = 'assigned'
            if asset:
                # Check if asset is under repair
                repair_request = db.query(RepairRequestForm).filter(
                    RepairRequestForm.oracle_number == oracle_number
                ).first()
                if repair_request:
                    asset_status = 'under repair'
                else:
                    asset_status = asset.status

            assignment_data = assignment_serializer(assignment, asset_status)
            if asset:
                assignment_data['device_name'] = asset.model_name or asset.device_type
                assignment_data['asset_type'] = asset.device_type
                assignment_data['model'] = asset.model_name
                assignment_data['brand'] = asset.brand_name
                assignment_data['serial_number'] = asset.serial_number
            else:
                assignment_data['device_name'] = ''
                assignment_data['asset_type'] = ''
                assignment_data['model'] = ''
                assignment_data['brand'] = ''
                assignment_data['serial_number'] = ''
            enriched_assignments.append(assignment_data)
        db.commit()
        return jsonify(enriched_assignments), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

# Get assigned assets count
@assignments_bp.route('/assignments/count', methods=['GET'])
def get_assignments_count():
    db = get_db_session()
    try:
        count = db.query(Assignment).filter(Assignment.status == 'assigned').count()
        db.commit()
        return jsonify({'assigned_count': count}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

# Add a new assignment
@assignments_bp.route('/assignments', methods=['POST'])
def add_assignment():
    db = get_db_session()
    try:
        data = request.form
        required = ['oracle_number', 'employee_name', 'designation', 'department', 'assignment_date', 'expected_return_date']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Check if asset exists and is not damaged
        asset = db.query(Asset).filter(Asset.oracle_number == data['oracle_number']).first()
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404

        if asset.status == 'damaged':
            return jsonify({'error': 'Cannot assign a damaged asset'}), 400

        # Parse dates
        assignment_date = None
        expected_return_date = None
        actual_return_date = None

        try:
            assignment_date = datetime.fromisoformat(data['assignment_date'].replace('Z', '+00:00'))
            expected_return_date = datetime.fromisoformat(data['expected_return_date'].replace('Z', '+00:00'))
            if data.get('actual_return_date'):
                actual_return_date = datetime.fromisoformat(data['actual_return_date'].replace('Z', '+00:00'))
        except:
            pass

        allocation_voucher_path = ''
        # Handle file upload
        if 'allocation_voucher' in request.files:
            file = request.files['allocation_voucher']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                if filename.lower().endswith('.pdf'):
                    upload_folder = os.path.join('uploads', 'pdfs')
                else:
                    upload_folder = 'uploads/vouchers'
                os.makedirs(upload_folder, exist_ok=True)
                unique_filename = f"{timestamp}_{filename}"
                file_path = os.path.join(upload_folder, unique_filename)
                file.save(file_path)
                # Save relative path for database
                if upload_folder.endswith('pdfs'):
                    allocation_voucher_path = os.path.join('uploads', 'pdfs', unique_filename)
                else:
                    allocation_voucher_path = file_path

        assignment = Assignment(
            oracle_number=data['oracle_number'],
            employee_name=data['employee_name'],
            designation=data['designation'],
            department=data['department'],
            assignment_date=assignment_date,
            expected_return_date=expected_return_date,
            actual_return_date=actual_return_date,
            status='assigned',
            notes=data.get('notes', ''),
            allocation_voucher_path=allocation_voucher_path,
            timestamp=datetime.utcnow()
        )

        db.add(assignment)
        db.commit()

        # Update asset status and assigned_to field
        asset.status = 'assigned'
        asset.assigned_to = data['employee_name']
        asset.assignment_date = assignment_date
        asset.expected_return_date = expected_return_date
        asset.updated_at = datetime.utcnow()
        db.commit()

        return jsonify({'id': assignment.id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)
