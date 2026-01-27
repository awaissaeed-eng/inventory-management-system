from flask import Blueprint, jsonify, request
import sys
import os

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.database import get_db_session, get_models, handle_db_error, close_db_session
from utils.serializers import activity_serializer
from sqlalchemy import and_, or_, func
import requests
import logging
import traceback
from models import Asset, ReturnRecord, RepairRequestForm, ActivityLog, Assignment

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route("/dashboard", methods=["GET"])
def dashboard_stats():
    db = get_db_session()
    try:

        # 1. Total Assets: all assets
        total_assets = db.query(Asset).count()
        # 2. Assigned: assigned_to is not empty/null and status is not damaged
        assigned = db.query(Asset).filter(
            and_(Asset.assigned_to.isnot(None), Asset.assigned_to != '', Asset.status != 'damaged')
        ).count()
        # 3. Unassigned: total - assigned (this includes under repair and damaged assets)
        unassigned = total_assets - assigned
        # 4. Under Repair: status is 'under repair'
        # Update to count assets with status 'under repair' or assets in under_repair table
        under_repair_asset_count = db.query(Asset).filter(Asset.status == 'under repair').count()
        under_repair_table_count = db.query(RepairRequestForm).count()
        under_repair = max(under_repair_asset_count, under_repair_table_count)
        # 5. Damaged: return records with return_type 'damaged' and asset status 'damaged'
        damaged = db.query(ReturnRecord).join(Asset, ReturnRecord.oracle_number == Asset.oracle_number).filter(
            and_(ReturnRecord.return_type == 'damaged', Asset.status == 'damaged')
        ).count()

        # 6. Auctioned: status is 'auctioned'
        auctioned = db.query(Asset).filter(Asset.status == 'auctioned').count()

        # 7. Available assets: not assigned, not under repair, not damaged, not auctioned, not buyback
        available = db.query(Asset).filter(
            and_(or_(Asset.assigned_to.is_(None), Asset.assigned_to == ''),
                 Asset.status.notin_(['under repair', 'damaged', 'auctioned', 'buyback']))
        ).count()

        # 7. Under Repair (not assigned): assets with status 'under repair' and not assigned
        under_repair_not_assigned = db.query(Asset).filter(
            and_(Asset.status == 'under repair',
                 or_(Asset.assigned_to.is_(None), Asset.assigned_to == ''))
        ).count()

        # 8. Stock count: available + under repair (not assigned)
        stock_count = available + under_repair_not_assigned

        # Optional: group by department (using assignments since assets don't have department)
        # For now, return empty list as department stats require assignment data
        department_stats = []

        # Buyback count from returns
        buyback_count = db.query(ReturnRecord).filter(ReturnRecord.return_type == 'buyback').count()

        db.commit()
        return jsonify({
            "total_assets": total_assets,
            "assigned": assigned,
            "unassigned": unassigned,  # All unassigned assets (including under repair and damaged)
            "under_repair": under_repair,
            "damaged": damaged,
            "auctioned": auctioned,
            "available": available,
            "under_repair_not_assigned": under_repair_not_assigned,
            "stock_count": stock_count,
            "buyback_count": buyback_count,
            "departments": department_stats
        })
    except Exception as e:
        logging.error(f"Error in dashboard_stats: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@dashboard_bp.route("/assets", methods=["GET"])
def get_assets():
    db = get_db_session()
    try:
        stock = request.args.get("stock")
        status = request.args.get("status")

        query = db.query(Asset)

        if stock and stock.lower() == "true":
            query = query.filter(Asset.status.in_(["new", "used"]))

        if status:
            query = query.filter(Asset.status == status)
        assets = query.all()
        asset_list = []
        for asset in assets:
            asset_list.append({
                'id': asset.id,
                'oracle_number': asset.oracle_number,
                'device_type': asset.device_type,
                'brand_name': asset.brand_name,
                'model_name': asset.model_name,
                'serial_number': asset.serial_number,
                'unit_price': asset.unit_price,
                'purchase_date': asset.purchase_date.isoformat() if asset.purchase_date else '',
                'warranty_expiry': asset.warranty_expiry.isoformat() if asset.warranty_expiry else '',
                'vendor_name': asset.vendor_name,
                'tender_no': asset.tender_no,
                'notes': asset.notes,
                'created_at': asset.created_at.isoformat() if asset.created_at else '',
                'updated_at': asset.updated_at.isoformat() if asset.updated_at else '',
                'status': asset.status,
                'assigned_to': asset.assigned_to,
                'assignment_date': asset.assignment_date.isoformat() if asset.assignment_date else '',
                'expected_return_date': asset.expected_return_date.isoformat() if asset.expected_return_date else ''
            })
        db.commit()
        return jsonify(asset_list)
    except Exception as e:
        logging.error(f"Error in get_assets: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)


# Endpoint for recent activity logs
@dashboard_bp.route("/activity-logs", methods=["GET"])
def get_activity_logs():
    db = get_db_session()
    try:
        logs = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(10).all()
        db.commit()
        return jsonify([activity_serializer(a) for a in logs]), 200
    except Exception as e:
        logging.error(f"Error in get_activity_logs: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)
