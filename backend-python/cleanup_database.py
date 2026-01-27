#!/usr/bin/env python3
"""
Database Cleanup Script for Inventory Management System
Removes unused tables and columns from the MySQL database.
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def cleanup_database():
    """Remove unused tables and columns from the database"""

    # Database connection
    mysql_uri = os.getenv('MYSQL_URI', 'mysql+mysqlconnector://root:@localhost/inventory_management')

    try:
        # Create engine
        engine = create_engine(mysql_uri, echo=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        print("🧹 Starting database cleanup...")

        db = SessionLocal()

        # Check which tables exist before attempting to drop them
        result = db.execute(text("SHOW TABLES"))
        existing_tables = [row[0] for row in result.fetchall()]

        print(f"📋 Current tables in database: {', '.join(existing_tables)}")

        # Tables to remove
        tables_to_drop = ['under_repair', 'complete_repair', 'counters']

        # Drop unused tables
        for table in tables_to_drop:
            if table in existing_tables:
                print(f"🗑️  Dropping unused table: {table}")
                db.execute(text(f"DROP TABLE {table}"))
                print(f"✅ Successfully dropped table: {table}")
            else:
                print(f"ℹ️  Table {table} not found (already removed or never existed)")

        # Check for any unused columns in remaining tables
        # For now, we'll focus on table removal as requested

        # Add missing columns to repair_request_form table if not exist
        # This is to fix the missing column error in dashboard endpoint
        try:
            existing_columns = [row[0] for row in db.execute(text("SHOW COLUMNS FROM repair_request_form")).fetchall()]
            alter_queries = []
            if 'technician' not in existing_columns:
                alter_queries.append("ALTER TABLE repair_request_form ADD COLUMN technician VARCHAR(100);")
            if 'cost' not in existing_columns:
                alter_queries.append("ALTER TABLE repair_request_form ADD COLUMN cost FLOAT;")
            if 'notes' not in existing_columns:
                alter_queries.append("ALTER TABLE repair_request_form ADD COLUMN notes TEXT;")
            if 'vendor_name' not in existing_columns:
                alter_queries.append("ALTER TABLE repair_request_form ADD COLUMN vendor_name VARCHAR(100);")
            if 'employee_name' not in existing_columns:
                alter_queries.append("ALTER TABLE repair_request_form ADD COLUMN employee_name VARCHAR(100);")
            if 'department' not in existing_columns:
                alter_queries.append("ALTER TABLE repair_request_form ADD COLUMN department VARCHAR(100);")
            if 'designation' not in existing_columns:
                alter_queries.append("ALTER TABLE repair_request_form ADD COLUMN designation VARCHAR(100);")
            if 'voucher_file' not in existing_columns:
                alter_queries.append("ALTER TABLE repair_request_form ADD COLUMN voucher_file VARCHAR(255);")

            for query in alter_queries:
                print(f"Executing: {query}")
                db.execute(text(query))
            if alter_queries:
                print("✅ Added missing columns to repair_request_form table.")
            else:
                print("ℹ️ No missing columns found in repair_request_form table.")
        except Exception as e:
            print(f"❌ Error adding missing columns: {str(e)}")

        db.commit()
        db.close()

        print("✅ Database cleanup completed successfully!")
        print("📊 Removed tables: under_repair, complete_repair, counters")

        return True

    except Exception as e:
        print(f"❌ Error during cleanup: {str(e)}")
        return False

if __name__ == "__main__":
    success = cleanup_database()
    if success:
        print("\n🎉 Cleanup completed successfully!")
        print("🔍 You can now verify the updated database schema.")
    else:
        print("\n❌ Cleanup failed. Please check the error messages above.")
