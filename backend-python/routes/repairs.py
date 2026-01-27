from flask import Blueprint, jsonify, request
import sys
import os

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.database import get_db_session, get_models, handle_db_error, close_db_session
from datetime import datetime
from werkzeug.utils import secure_filename
from models import RepairRequestForm, CompletionRepair, Asset

repairs_bp = Blueprint('repairs', __name__)

@repairs_bp.route("/repairs/stats", methods=["GET"])
def repair_stats():
    """Get repair statistics"""
    db = get_db_session()
    try:
        # Count repairs by table
        under_repair_count = db.query(RepairRequestForm).count()
        completed_count = db.query(CompletionRepair).count()

        return jsonify({
            "under_repair": under_repair_count,
            "completed": completed_count,
            "total": under_repair_count + completed_count
        })
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@repairs_bp.route("/repairs", methods=["GET"])
def get_repairs():
    """Get repairs with optional status filter"""
    db = get_db_session()
    try:
        status = request.args.get("status")

        repair_list = []

        # Get under repair records
        if not status or status == "in-progress":
            under_repairs = db.query(RepairRequestForm).order_by(RepairRequestForm.start_date.desc()).all()
            for repair in under_repairs:
                repair_data = {
                    "completion_date": None,
                    "repair_cost": repair.cost,
                    "return_date": None,
                    "status": "in-progress",
                    "oracle_number": repair.oracle_number,
                    "asset_type": repair.asset_type,
                    "asset_model": repair.asset_model,
                    "employee_name": repair.employee_name,
                    "designation": repair.designation,
                    "department": repair.department,
                    "repair_description": repair.repair_description,
                    "start_date": repair.start_date.isoformat() if repair.start_date else None,
                    "vendor_name": repair.vendor_name,
                    "is_fixed": False
                }
                repair_list.append(repair_data)

        # Get completed repair records
        if not status or status == "completed":
            completed_repairs = db.query(CompletionRepair).order_by(CompletionRepair.start_date.desc()).all()
            for repair in completed_repairs:
                repair_data = {
                    "completion_date": repair.completion_date.isoformat() if repair.completion_date else None,
                    "repair_cost": repair.cost,
                    "return_date": repair.return_date.isoformat() if repair.return_date else None,
                    "status": "completed",
                    "oracle_number": repair.oracle_number,
                    "asset_type": repair.asset_type,
                    "asset_model": repair.asset_model,
                    "employee_name": repair.employee_name,
                    "designation": repair.designation,
                    "department": repair.department,
                    "repair_description": repair.repair_description,
                    "start_date": repair.start_date.isoformat() if repair.start_date else None,
                    "vendor_name": repair.vendor_name,
                    "is_fixed": repair.is_fixed
                }
                repair_list.append(repair_data)

        # Sort combined list by start_date descending
        repair_list.sort(key=lambda x: x.get("start_date") or "", reverse=True)

        return jsonify(repair_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)



@repairs_bp.route("/repairs/request", methods=["POST"])
def create_repair_request():
    """Create a new repair request from the form"""
    db = get_db_session()
    try:

        data = request.get_json()

        # Validate required fields
        required_fields = ["oracle_number", "repair_description"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400

        oracle_number = data["oracle_number"]

        # Check if asset is already under repair
        existing_repair = db.query(RepairRequestForm).filter(
            RepairRequestForm.oracle_number == oracle_number
        ).first()
        if existing_repair:
            return jsonify({"error": "This asset is already under repair and cannot be requested or sent to auction."}), 400

        # Get asset details to include in repair record
        asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first()
        if not asset:
            return jsonify({"error": "Asset not found with the provided Oracle number"}), 404

        # Check if asset has already been auctioned
        if asset.status == 'auctioned':
            return jsonify({"error": "This asset is currently auctioned and cannot be repaired"}), 400

        # Create repair record in repair_request_form table
        repair = RepairRequestForm(
            oracle_number=oracle_number,
            asset_type=asset.device_type,
            asset_model=asset.model_name,
            repair_description=data["repair_description"],
            start_date=datetime.utcnow(),
            employee_name=data.get("employee_name", ""),
            department=data.get("department", ""),
            designation=data.get("designation", ""),
            technician=data.get("technician", ""),
            cost=data.get("cost"),
            notes=data.get("notes", "")
        )

        db.add(repair)

        # Update asset status to "under repair"
        asset.status = "under repair"
        asset.updated_at = datetime.utcnow()

        db.commit()

        return jsonify({
            "message": "Repair request created successfully and asset status updated to 'Under Repair'",
            "id": repair.id
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@repairs_bp.route("/repairs/complete", methods=["POST"])
def complete_repair():
    """Complete a repair and restore asset status"""
    db = get_db_session()
    try:

        data = request.form

        # Validate required fields
        required_fields = ["oracle_number", "repair_description", "is_fixed"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400

        # Get the repair record from repair_request_form table
        repair = db.query(RepairRequestForm).filter(
            RepairRequestForm.oracle_number == data["oracle_number"]
        ).first()
        if not repair:
            return jsonify({"error": "Repair not found or already completed"}), 404

        # Parse dates if provided
        completion_date = None
        return_date = None

        try:
            if data.get("completion_date"):
                completion_date = datetime.fromisoformat(data["completion_date"].replace('Z', '+00:00'))
            if data.get("return_date"):
                return_date = datetime.fromisoformat(data["return_date"].replace('Z', '+00:00'))
        except:
            pass

        # Handle voucher file upload
        voucher_file_path = None
        if 'voucher_file' in request.files:
            voucher_file = request.files['voucher_file']
            if voucher_file.filename != '':
                # Generate unique filename with timestamp
                filename = secure_filename(voucher_file.filename)
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                if filename.lower().endswith('.pdf'):
                    upload_folder = os.path.join('uploads', 'pdfs')
                else:
                    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads/vouchers')

                # Ensure upload directory exists
                os.makedirs(upload_folder, exist_ok=True)

                unique_filename = f"{timestamp}_{filename}"
                file_path = os.path.join(upload_folder, unique_filename)
                voucher_file.save(file_path)
                # Save relative path for database
                if upload_folder.endswith('pdfs'):
                    voucher_file_path = os.path.join('uploads', 'pdfs', unique_filename)
                else:
                    voucher_file_path = unique_filename

        # Use is_fixed string value directly
        is_fixed_value = data.get("is_fixed", "not_fixed")

        # Create completed repair record in completion_repair table
        completed_repair = CompletionRepair(
            oracle_number=repair.oracle_number,
            asset_type=repair.asset_type,
            asset_model=repair.asset_model,
            repair_description=data["repair_description"],
            start_date=repair.start_date,
            completion_date=completion_date or datetime.utcnow(),
            technician=data.get("technician") or repair.technician,
            cost=data.get("repair_cost") or repair.cost,
            notes=data.get("notes", "") or repair.notes,
            is_fixed=is_fixed_value,
            vendor_name=data.get("vendor_name", "") or repair.vendor_name,
            employee_name=repair.employee_name,
            department=repair.department,
            designation=repair.designation,
            return_date=return_date,
            voucher_file=voucher_file_path
        )

        db.add(completed_repair)

        # Remove the record from under_repair table
        db.delete(repair)

        # Get the asset
        asset = db.query(Asset).filter(Asset.oracle_number == data["oracle_number"]).first()
        if not asset:
            return jsonify({"error": "Asset not found"}), 404

        # Restore asset status to its previous status (or 'assigned' as fallback)
        previous_status = getattr(repair, 'previous_status', None)
        restored_status = previous_status if previous_status else "assigned"
        asset.status = restored_status
        asset.updated_at = datetime.utcnow()

        db.commit()

        return jsonify({
            "message": f"Repair completed successfully and asset status restored to '{restored_status.capitalize()}'"
        }), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@repairs_bp.route("/repairs/under-repair/oracle-numbers", methods=["GET"])
def get_under_repair_oracle_numbers():
    """Get Oracle numbers of assets currently under repair"""
    db = get_db_session()
    try:

        # Find all repairs in repair_request_form table and get distinct oracle numbers
        under_repair_assets = db.query(RepairRequestForm.oracle_number).distinct().all()

        # Extract oracle numbers from the result
        oracle_numbers = [item[0] for item in under_repair_assets]

        return jsonify({
            "oracle_numbers": oracle_numbers,
            "count": len(oracle_numbers)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@repairs_bp.route("/repairs/<oracle_number>", methods=["GET"])
def get_repairs_by_oracle_number(oracle_number):
    """Get repair history for a specific asset by oracle number"""
    db = get_db_session()
    try:
        repair_list = []

        # Get under repair records for this oracle number
        under_repairs = db.query(RepairRequestForm).filter(
            RepairRequestForm.oracle_number == oracle_number
        ).order_by(RepairRequestForm.start_date.desc()).all()

        for repair in under_repairs:
            repair_data = {
                "completion_date": None,
                "repair_cost": repair.cost,
                "return_date": None,
                "status": "in-progress",
                "oracle_number": repair.oracle_number,
                "asset_type": repair.asset_type,
                "asset_model": repair.asset_model,
                "employee_name": repair.employee_name,
                "designation": repair.designation,
                "department": repair.department,
                "repair_description": repair.repair_description,
                "start_date": repair.start_date.isoformat() if repair.start_date else None,
                "vendor_name": repair.vendor_name,
                "technician": repair.technician,
                "is_fixed": False,
                "voucher": repair.voucher_file
            }
            repair_list.append(repair_data)

        # Get completed repair records for this oracle number
        completed_repairs = db.query(CompletionRepair).filter(
            CompletionRepair.oracle_number == oracle_number
        ).order_by(CompletionRepair.start_date.desc()).all()

        for repair in completed_repairs:
            repair_data = {
                "completion_date": repair.completion_date.isoformat() if repair.completion_date else None,
                "repair_cost": repair.cost,
                "return_date": repair.return_date.isoformat() if repair.return_date else None,
                "status": "completed",
                "oracle_number": repair.oracle_number,
                "asset_type": repair.asset_type,
                "asset_model": repair.asset_model,
                "employee_name": repair.employee_name,
                "designation": repair.designation,
                "department": repair.department,
                "repair_description": repair.repair_description,
                "start_date": repair.start_date.isoformat() if repair.start_date else None,
                "vendor_name": repair.vendor_name,
                "technician": repair.technician,
                "is_fixed": repair.is_fixed,
                "voucher": repair.voucher_file
            }
            repair_list.append(repair_data)

        # Sort combined list by start_date descending
        repair_list.sort(key=lambda x: x.get("start_date") or "", reverse=True)

        return jsonify(repair_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)
