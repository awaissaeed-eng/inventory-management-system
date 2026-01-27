from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime

# SQLAlchemy setup
Base = declarative_base()

# Define SQLAlchemy Models
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    last_login = Column(DateTime, nullable=True)
    profile_picture = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Asset(Base):
    __tablename__ = 'assets'
    id = Column(Integer, primary_key=True, autoincrement=True)
    oracle_number = Column(String(50), unique=True, nullable=False)
    device_type = Column(String(100), nullable=False)
    brand_name = Column(String(100))
    model_name = Column(String(100))
    serial_number = Column(String(100))
    unit_price = Column(Float)
    purchase_date = Column(DateTime)
    warranty_expiry = Column(DateTime)
    vendor_name = Column(String(100))
    tender_no = Column(String(100))
    notes = Column(Text)
    status = Column(String(50), default='new')
    assigned_to = Column(String(100))
    assignment_date = Column(DateTime)
    expected_return_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Assignment(Base):
    __tablename__ = 'assignments'
    id = Column(Integer, primary_key=True, autoincrement=True)
    oracle_number = Column(String(50), nullable=False)
    employee_name = Column(String(100), nullable=False)
    designation = Column(String(100))
    department = Column(String(100))
    assignment_date = Column(DateTime, nullable=False)
    expected_return_date = Column(DateTime)
    actual_return_date = Column(DateTime)
    status = Column(String(50), default='assigned')
    notes = Column(Text)
    allocation_voucher_path = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow)

class RepairRequestForm(Base):
    __tablename__ = 'repair_request_form'
    id = Column(Integer, primary_key=True, autoincrement=True)
    oracle_number = Column(String(50))
    asset_type = Column(String(100))
    asset_model = Column(String(100))
    repair_description = Column(Text)
    start_date = Column(DateTime, default=datetime.utcnow)
    technician = Column(String(100))
    cost = Column(Float)
    notes = Column(Text)
    vendor_name = Column(String(100))
    employee_name = Column(String(100))
    department = Column(String(100))
    designation = Column(String(100))
    voucher_file = Column(String(255))

class CompletionRepair(Base):
    __tablename__ = 'completion_repair'
    id = Column(Integer, primary_key=True, autoincrement=True)
    oracle_number = Column(String(50))
    asset_type = Column(String(100))
    asset_model = Column(String(100))
    repair_description = Column(Text)
    start_date = Column(DateTime, default=datetime.utcnow)
    completion_date = Column(DateTime)
    technician = Column(String(100))
    cost = Column(Float)
    notes = Column(Text)
    is_fixed = Column(String(50), default='not_fixed')
    vendor_name = Column(String(100))
    employee_name = Column(String(100))
    department = Column(String(100))
    designation = Column(String(100))
    return_date = Column(DateTime)
    voucher_file = Column(String(255))

class ReturnRecord(Base):
    __tablename__ = 'returns'
    id = Column(Integer, primary_key=True, autoincrement=True)
    oracle_number = Column(String(50), nullable=False)
    return_type = Column(String(50), nullable=False)
    return_date = Column(DateTime, nullable=False)
    reason = Column(String(100))
    notes = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    voucher_filename = Column(String(255))

class ActivityLog(Base):
    __tablename__ = 'activity_logs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    activity_type = Column(String(100), nullable=False)
    asset_type = Column(String(100))
    brand_name = Column(String(100))
    asset_name = Column(String(100))
    employee_name = Column(String(100))
    department_name = Column(String(100))
    timestamp = Column(DateTime, default=datetime.utcnow)
    remarks = Column(Text)

class Counter(Base):
    __tablename__ = 'counters'
    id = Column(String(50), primary_key=True)
    seq = Column(Integer, default=0)

class DeviceBrandMapping(Base):
    __tablename__ = 'device_brand_mappings'
    id = Column(Integer, primary_key=True, autoincrement=True)
    device_type = Column(String(100), unique=True, nullable=False)
    brands = Column(Text)  # JSON string of brands list
    created_at = Column(DateTime, default=datetime.utcnow)

class Auction(Base):
    __tablename__ = 'auctions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    oracle_number = Column(String(50), nullable=False)
    asset_type = Column(String(100))
    brand_name = Column(String(100))
    model_name = Column(String(100))
    serial_number = Column(String(100))
    price = Column(Float, nullable=False)
    auction_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
