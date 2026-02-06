from flask import Flask, Blueprint, request, jsonify
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from flask_cors import CORS
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets
from models import Base, User, PasswordResetToken

# Load environment variables from .env file
load_dotenv()

def create_app(test_config=None):
    app = Flask(__name__)
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads/vouchers')
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    CORS(app)

    # Email configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', '')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@nepra.com')
    
    mail = Mail(app)

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
        password = data.get('password')
        email = data.get('email')
        full_name = data.get('full_name')

        app.logger.info(f"Registration attempt: email={email}, full_name={full_name}")

        if not password or not email or not full_name:
            app.logger.warning("Registration failed: Missing required fields")
            return jsonify({'message': 'All fields are required'}), 400

        db = SessionLocal()
        try:
            app.logger.info("Checking for existing email")
            # Check if email exists
            existing_email = db.query(User).filter(User.email == email).first()
            if existing_email:
                app.logger.warning(f"Registration failed: Email {email} already registered")
                return jsonify({'message': 'Email already registered'}), 409

            app.logger.info("Hashing password and creating user")
            hashed_password = generate_password_hash(password)
            new_user = User(
                username=email,  # Use email as username for backward compatibility
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
        email = data.get('email')
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
            return jsonify({'message': 'Login successful', 'user': {'id': user.id, 'email': user.email, 'full_name': user.full_name, 'last_login': user.last_login.isoformat() if user.last_login else None, 'profile_picture': user.profile_picture}}), 200
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
            email = data.get('email')
            full_name = data.get('full_name')
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')

            # Validate required fields
            if not email or not full_name:
                return jsonify({'message': 'Email and full name are required'}), 400

            # Check if email is unique
            existing_email = db.query(User).filter(User.email == email, User.id != user_id).first()
            if existing_email:
                return jsonify({'message': 'Email already in use'}), 409

            # Update basic fields
            user.username = email  # Keep username synced with email
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

    # Forgot Password endpoint
    @app.route('/api/auth/forgot-password', methods=['POST'])
    def forgot_password():
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'message': 'Email is required'}), 400

        db = SessionLocal()
        try:
            # Check if user exists
            user = db.query(User).filter(User.email == email).first()
            if not user:
                # Don't reveal if email exists or not for security
                app.logger.info(f"Password reset requested for non-existent email: {email}")
                return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200

            # Generate secure token
            token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(hours=1)

            # Delete any existing unused tokens for this user
            db.query(PasswordResetToken).filter(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used == False
            ).delete()

            # Create new reset token
            reset_token = PasswordResetToken(
                user_id=user.id,
                token=token,
                expires_at=expires_at
            )
            db.add(reset_token)
            db.commit()

            reset_url = f"http://localhost:3000/reset-password?token={token}"
            
            # Check if email is configured
            email_configured = (
                app.config.get('MAIL_USERNAME') and 
                app.config['MAIL_USERNAME'] != 'your-email@gmail.com' and
                app.config.get('MAIL_PASSWORD') and
                app.config['MAIL_PASSWORD'] != 'your-app-password-here'
            )

            if not email_configured:
                # Development mode - log to console instead of sending email
                print("\n" + "="*80)
                print("🔐 PASSWORD RESET REQUEST (Development Mode)")
                print("="*80)
                print(f"User: {user.full_name} ({email})")
                print(f"Reset Link: {reset_url}")
                print(f"Token expires in: 1 hour")
                print("="*80)
                print("\n⚠️  Email not configured! Copy the link above to reset password.")
                print("To enable email: Configure MAIL_USERNAME and MAIL_PASSWORD in .env file\n")
                
                app.logger.warning("Email not configured - reset link logged to console")
                return jsonify({
                    'message': 'If the email exists, a reset link has been sent',
                    'dev_mode': True,
                    'reset_url': reset_url  # Only in dev mode
                }), 200

            # Send email
            try:
                msg = Message(
                    subject='Password Reset Request - NEPRA IT Asset Management',
                    recipients=[email],
                    sender=app.config['MAIL_DEFAULT_SENDER']
                )
                msg.html = f"""
                <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #16a34a;">Password Reset Request</h2>
                            <p>Hello {user.full_name},</p>
                            <p>We received a request to reset your password for your NEPRA IT Asset Management account.</p>
                            <p>Click the button below to reset your password:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="{reset_url}" 
                                   style="background: linear-gradient(to right, #16a34a, #059669); 
                                          color: white; 
                                          padding: 12px 30px; 
                                          text-decoration: none; 
                                          border-radius: 8px; 
                                          display: inline-block;
                                          font-weight: bold;">
                                    Reset Password
                                </a>
                            </div>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style="background: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all;">
                                {reset_url}
                            </p>
                            <p style="color: #ef4444; font-weight: bold;">This link will expire in 1 hour.</p>
                            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                            <p style="color: #6b7280; font-size: 12px;">
                                This is an automated email from NEPRA IT Asset Management System. Please do not reply to this email.
                            </p>
                        </div>
                    </body>
                </html>
                """
                mail.send(msg)
                app.logger.info(f"Password reset email sent successfully to {email}")
                print(f"✅ Password reset email sent to {email}")
            except Exception as e:
                app.logger.error(f"Failed to send email: {str(e)}")
                print(f"\n❌ Failed to send email to {email}")
                print(f"Error: {str(e)}")
                print("Check your email configuration in .env file\n")
                # Continue anyway - don't reveal email sending failure
                pass

            return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
        except Exception as e:
            db.rollback()
            app.logger.error(f"Forgot password error: {str(e)}")
            return jsonify({'message': 'An error occurred. Please try again later.'}), 500
        finally:
            db.close()

    # Reset Password endpoint
    @app.route('/api/auth/reset-password', methods=['POST'])
    def reset_password():
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('new_password')

        if not token or not new_password:
            return jsonify({'message': 'Token and new password are required'}), 400

        if len(new_password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters long'}), 400

        db = SessionLocal()
        try:
            # Find the reset token
            reset_token = db.query(PasswordResetToken).filter(
                PasswordResetToken.token == token,
                PasswordResetToken.used == False
            ).first()

            if not reset_token:
                return jsonify({'message': 'Invalid or expired reset token'}), 400

            # Check if token has expired
            if datetime.utcnow() > reset_token.expires_at:
                return jsonify({'message': 'Reset token has expired'}), 400

            # Get the user
            user = db.query(User).filter(User.id == reset_token.user_id).first()
            if not user:
                return jsonify({'message': 'User not found'}), 404

            # Update password
            user.password = generate_password_hash(new_password)
            
            # Mark token as used
            reset_token.used = True
            
            db.commit()

            return jsonify({'message': 'Password reset successful'}), 200
        except Exception as e:
            db.rollback()
            app.logger.error(f"Reset password error: {str(e)}")
            return jsonify({'message': 'Failed to reset password', 'error': str(e)}), 500
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

