from flask import Flask, Blueprint, request, jsonify
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models import Base, User

def create_app(test_config=None):
    app = Flask(__name__)
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads/vouchers')
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    CORS(app)

    if test_config:
        app.config.update(test_config)

    # SQLAlchemy setup
    mysql_uri = os.getenv('MYSQL_URI', 'mysql+mysqlconnector://root:@localhost/inventory_management')
    if test_config and 'MYSQL_URI' in test_config:
        mysql_uri = test_config['MYSQL_URI']

    engine = create_engine(mysql_uri, echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Store SQLAlchemy components in app context
    app.config['engine'] = engine
    app.config['SessionLocal'] = SessionLocal
    app.config['Base'] = Base

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Import and register blueprints after app is configured
    from routes.dashboard import dashboard_bp
    from routes.assets import assets_bp
    from routes.assignments import assignments_bp
    from routes.repairs import repairs_bp
    from routes.returns import returns_bp
    from routes.auction import auction_bp
    from flask import send_from_directory, abort
    from flask_login import login_required, current_user

    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(assets_bp, url_prefix='/api')
    app.register_blueprint(assignments_bp, url_prefix='/api')
    app.register_blueprint(repairs_bp, url_prefix='/api')
    app.register_blueprint(returns_bp, url_prefix='/api')
    app.register_blueprint(auction_bp, url_prefix='/api')

    # Registration endpoint
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        full_name = data.get('full_name')

        app.logger.info(f"Registration attempt: username={username}, email={email}, full_name={full_name}")

        if not username or not password or not email or not full_name:
            app.logger.warning("Registration failed: Missing required fields")
            return jsonify({'message': 'All fields are required'}), 400

        db = SessionLocal()
        try:
            app.logger.info("Checking for existing username")
            # Check if username exists
            existing_user = db.query(User).filter(User.username == username).first()
            if existing_user:
                app.logger.warning(f"Registration failed: Username {username} already exists")
                return jsonify({'message': 'Username already exists'}), 409

            app.logger.info("Checking for existing email")
            # Check if email exists
            existing_email = db.query(User).filter(User.email == email).first()
            if existing_email:
                app.logger.warning(f"Registration failed: Email {email} already registered")
                return jsonify({'message': 'Email already registered'}), 409

            app.logger.info("Hashing password and creating user")
            hashed_password = generate_password_hash(password)
            new_user = User(
                username=username,
                password=hashed_password,
                email=email,
                full_name=full_name
            )
            db.add(new_user)
            app.logger.info("Committing user to database")
            db.commit()
            app.logger.info("Registration successful")
            return jsonify({'message': 'Registration successful'}), 201
        except Exception as e:
            app.logger.error(f"Registration failed with exception: {str(e)}")
            db.rollback()
            return jsonify({'message': 'Registration failed', 'error': str(e)}), 500
        finally:
            db.close()

    # Login endpoint
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.get_json()
        email = data.get('username')  # Note: frontend sends as 'username', but it's email now
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Email and password required'}), 400

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return jsonify({'message': 'Invalid email or password'}), 401

            if not check_password_hash(user.password, password):
                return jsonify({'message': 'Invalid email or password'}), 401

            # Update last login
            user.last_login = datetime.utcnow()
            db.commit()
            return jsonify({'message': 'Login successful', 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'full_name': user.full_name, 'last_login': user.last_login.isoformat() if user.last_login else None, 'profile_picture': user.profile_picture}}), 200
        except Exception as e:
            return jsonify({'message': 'Login failed', 'error': str(e)}), 500
        finally:
            db.close()

    # Get profile endpoint
    @app.route('/api/auth/profile/<int:user_id>', methods=['GET'])
    def get_profile(user_id):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({'message': 'User not found'}), 404

            return jsonify({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'profile_picture': user.profile_picture
            }), 200
        except Exception as e:
            return jsonify({'message': 'Failed to get profile', 'error': str(e)}), 500
        finally:
            db.close()

    # Update profile endpoint
    @app.route('/api/auth/profile/<int:user_id>', methods=['PUT'])
    def update_profile(user_id):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return jsonify({'message': 'User not found'}), 404

            data = request.form  # Use form for file upload
            username = data.get('username')
            email = data.get('email')
            full_name = data.get('full_name')
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')

            # Validate required fields
            if not username or not email or not full_name:
                return jsonify({'message': 'Username, email, and full name are required'}), 400

            # Check if email is unique
            existing_email = db.query(User).filter(User.email == email, User.id != user_id).first()
            if existing_email:
                return jsonify({'message': 'Email already in use'}), 409

            # Update basic fields
            user.username = username
            user.email = email
            user.full_name = full_name

            # Handle password change
            if new_password:
                if not current_password:
                    return jsonify({'message': 'Current password required to change password'}), 400
                if not check_password_hash(user.password, current_password):
                    return jsonify({'message': 'Current password is incorrect'}), 400
                if new_password != confirm_password:
                    return jsonify({'message': 'New password and confirmation do not match'}), 400
                user.password = generate_password_hash(new_password)

            # Handle profile picture upload
            if 'profile_picture' in request.files:
                file = request.files['profile_picture']
                if file and file.filename:
                    # Create profiles folder if not exists
                    profiles_folder = os.path.join(os.path.dirname(__file__), 'uploads', 'profiles')
                    os.makedirs(profiles_folder, exist_ok=True)
                    # Save file
                    filename = f"{user_id}_{file.filename}"
                    file_path = os.path.join(profiles_folder, filename)
                    file.save(file_path)
                    user.profile_picture = f"/api/uploads/profiles/{filename}"

            db.commit()
            return jsonify({'message': 'Profile updated successfully'}), 200
        except Exception as e:
            db.rollback()
            return jsonify({'message': 'Failed to update profile', 'error': str(e)}), 500
        finally:
            db.close()

    # Serve profile pictures
    @app.route('/api/uploads/profiles/<path:filename>', methods=['GET'])
    def serve_profile_picture(filename):
        profiles_folder = os.path.join(os.path.dirname(__file__), 'uploads', 'profiles')
        try:
            return send_from_directory(profiles_folder, filename, as_attachment=False)
        except FileNotFoundError:
            abort(404)

    # Secure route to serve PDFs from /uploads/pdfs/
    @app.route('/api/vouchers/<path:voucher_path>', methods=['GET'])
    def serve_voucher(voucher_path):
        # Prevent directory traversal attacks
        if '..' in voucher_path or voucher_path.startswith('/'):
            abort(404)
        pdf_folder = os.path.join(os.path.dirname(__file__), 'uploads', 'pdfs')
        # Extract filename from path if full path is provided
        filename = os.path.basename(voucher_path)
        try:
            return send_from_directory(pdf_folder, filename, as_attachment=False)
        except FileNotFoundError:
            abort(404)

    return app

# Create default app instance
app = create_app()

if __name__ == '__main__':
    app.run(port=5000, debug=True)

