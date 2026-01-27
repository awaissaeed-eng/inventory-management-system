"""
Common serializer functions to eliminate duplicate code
"""

def activity_serializer(activity):
    """Standard activity serializer used across multiple routes"""
    return {
        'id': activity.id,
        'activityType': activity.activity_type,
        'assetType': activity.asset_type,
        'brandName': activity.brand_name,
        'assetName': activity.asset_name,
        'employeeName': activity.employee_name,
        'departmentName': activity.department_name,
        'timestamp': activity.timestamp.isoformat() if activity.timestamp else '',
        'remarks': activity.remarks
    }

def asset_serializer(asset):
    """Standard asset serializer"""
    return {
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
        'status': asset.status,
        'assigned_to': asset.assigned_to,
        'assignment_date': asset.assignment_date.isoformat() if asset.assignment_date else '',
        'expected_return_date': asset.expected_return_date.isoformat() if asset.expected_return_date else '',
        'created_at': asset.created_at.isoformat() if asset.created_at else '',
        'updated_at': asset.updated_at.isoformat() if asset.updated_at else ''
    }

def assignment_serializer(assignment, asset_status='assigned'):
    """Standard assignment serializer"""
    return {
        'id': assignment.id,
        'oracle_number': assignment.oracle_number or '',
        'employee_name': assignment.employee_name or '',
        'designation': assignment.designation or '',
        'department': assignment.department or '',
        'assignment_date': assignment.assignment_date.isoformat() if assignment.assignment_date else '',
        'expected_return_date': assignment.expected_return_date.isoformat() if assignment.expected_return_date else '',
        'actual_return_date': assignment.actual_return_date.isoformat() if assignment.actual_return_date else '',
        'status': asset_status,
        'notes': assignment.notes or '',
        'allocation_voucher_path': assignment.allocation_voucher_path or '',
        'has_allocation_voucher': bool(assignment.allocation_voucher_path),
        'timestamp': assignment.timestamp.isoformat() if assignment.timestamp else '',
        'device_name': '',
        'asset_type': '',
        'model': '',
        'brand': '',
        'serial_number': ''
    }

def return_serializer(return_record):
    """Standard return serializer"""
    return {
        'id': return_record.id,
        'oracle_number': return_record.oracle_number or '',
        'return_type': return_record.return_type or '',
        'return_date': return_record.return_date.isoformat() if return_record.return_date else '',
        'reason': return_record.reason or '',
        'condition': return_record.reason or '',
        'notes': return_record.notes or '',
        'timestamp': return_record.timestamp.isoformat() if return_record.timestamp else '',
        'voucher_filename': getattr(return_record, 'voucher_filename', '') or ''
    }