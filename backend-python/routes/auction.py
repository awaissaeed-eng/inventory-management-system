from flask import Blueprint, request, jsonify
import sys
import os

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.database import get_db_session, get_models, handle_db_error, close_db_session
from datetime import datetime
from models import RepairRequestForm, Assignment

auction_bp = Blueprint('auction', __name__)

@auction_bp.route('/auctions', methods=['GET'])
def get_auctions():
    db = get_db_session()
    try:
        models = current_app.config['Base'].registry._class_registry
        Auction = models.get('Auction')
        RepairRequestForm = models.get('RepairRequestForm')

        auctions = db.query(Auction).order_by(Auction.created_at.desc()).all()

        # Get oracle numbers under repair
        under_repair_oracle_numbers = [r.oracle_number for r in db.query(RepairRequestForm).all()]

        auction_list = []
        for auction in auctions:
            # Skip auctions for assets currently under repair
            if auction.oracle_number in under_repair_oracle_numbers:
                continue
            auction_list.append({
                'id': auction.id,
                'oracle_number': auction.oracle_number,
                'asset_type': auction.asset_type,
                'brand_name': auction.brand_name,
                'model_name': auction.model_name,
                'serial_number': auction.serial_number,
                'price': auction.price,
                'auction_date': auction.auction_date.isoformat() if auction.auction_date else '',
                'created_at': auction.created_at.isoformat() if auction.created_at else ''
            })

        return jsonify(auction_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@auction_bp.route('/auctions', methods=['POST'])
def add_auction():
    data = request.json
    required_fields = ['oracle_number', 'price', 'auction_date']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    oracle_number = data['oracle_number']
    price = data['price']
    auction_date_str = data['auction_date']

    try:
        auction_date = datetime.fromisoformat(auction_date_str)
    except Exception:
        return jsonify({'error': 'Invalid auction_date format. Use ISO format.'}), 400

    db = get_db_session()
    try:
        models = current_app.config['Base'].registry._class_registry
        Auction = models.get('Auction')
        Asset = models.get('Asset')

        # Fetch asset details by oracle_number
        asset = db.query(Asset).filter(Asset.oracle_number == oracle_number).first()
        if not asset:
            return jsonify({'error': 'Asset not found for the given Oracle Number'}), 404

        # Check if asset is currently under repair
        under_repair = db.query(RepairRequestForm).filter(
            RepairRequestForm.oracle_number == oracle_number
        ).first()
        if under_repair:
            return jsonify({'error': 'This asset is currently under repair and cannot be sent for auction.'}), 400

        # Check if asset has already been auctioned
        if asset.status == 'auctioned':
            return jsonify({'error': 'This asset has already been auctioned and cannot be processed again.'}), 400

        auction = Auction(
            oracle_number=oracle_number,
            asset_type=asset.device_type,
            brand_name=asset.brand_name,
            model_name=asset.model_name,
            serial_number=asset.serial_number,
            price=price,
            auction_date=auction_date,
            created_at=datetime.utcnow()
        )
        db.add(auction)

        # Update asset status to 'auctioned'
        asset.status = 'auctioned'
        asset.updated_at = datetime.utcnow()

        # Clear assignment fields to remove from Assigned Card
        asset.assigned_to = None
        asset.assignment_date = None
        asset.expected_return_date = None

        # Delete any repair requests for this asset to remove from Under Repair
        db.query(RepairRequestForm).filter(RepairRequestForm.oracle_number == oracle_number).delete()

        # Update assignment record status if exists
        assignment = db.query(Assignment).filter(Assignment.oracle_number == oracle_number, Assignment.status == 'assigned').first()
        if assignment:
            assignment.status = 'auctioned'
            assignment.actual_return_date = datetime.utcnow()

        db.commit()

        return jsonify({'message': 'Auction details saved successfully'}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@auction_bp.route('/auctions/<oracle_number>', methods=['GET'])
def get_auctions_by_oracle_number(oracle_number):
    """Get auction details for a specific asset by oracle number"""
    db = get_db_session()
    try:
        models = current_app.config['Base'].registry._class_registry
        Auction = models.get('Auction')

        auctions = db.query(Auction).filter(
            Auction.oracle_number == oracle_number
        ).order_by(Auction.auction_date.desc()).all()

        auction_list = []
        for auction in auctions:
            auction_list.append({
                'id': auction.id,
                'oracle_number': auction.oracle_number,
                'asset_type': auction.asset_type,
                'brand_name': auction.brand_name,
                'model_name': auction.model_name,
                'serial_number': auction.serial_number,
                'price': auction.price,
                'auction_date': auction.auction_date.isoformat() if auction.auction_date else '',
                'created_at': auction.created_at.isoformat() if auction.created_at else ''
            })

        return jsonify(auction_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)

@auction_bp.route('/auctions/auctioned/oracle-numbers', methods=['GET'])
def get_auctioned_oracle_numbers():
    """Get Oracle numbers of assets that have been auctioned"""
    db = get_db_session()
    try:
        models = current_app.config['Base'].registry._class_registry
        Asset = models.get('Asset')

        # Find all assets with status 'auctioned' and get distinct oracle numbers
        auctioned_assets = db.query(Asset.oracle_number).filter(Asset.status == 'auctioned').distinct().all()

        # Extract oracle numbers from the result
        oracle_numbers = [item[0] for item in auctioned_assets]

        return jsonify({
            "oracle_numbers": oracle_numbers,
            "count": len(oracle_numbers)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        close_db_session(db)
