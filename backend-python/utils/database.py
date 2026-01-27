"""
Database utility functions to eliminate duplicate code across routes
"""
from flask import current_app

def get_db_session():
    """Get SQLAlchemy database session"""
    return current_app.config['SessionLocal']()

def get_models():
    """Get SQLAlchemy models from app context"""
    return current_app.config['Base'].registry._class_registry

def handle_db_error(db, error):
    """Standard database error handling"""
    db.rollback()
    return {'error': str(error)}, 500

def close_db_session(db):
    """Safely close database session"""
    if db:
        db.close()