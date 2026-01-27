#!/usr/bin/env python3
"""
Database Backup Script for Inventory Management System
Creates a SQL dump of the MySQL database for backup purposes.
"""

import os
import datetime
from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text

def backup_database():
    """Create a backup of the database"""

    # Database connection
    mysql_uri = os.getenv('MYSQL_URI', 'mysql+mysqlconnector://root:@localhost/inventory_management')

    try:
        # Create engine
        engine = create_engine(mysql_uri, echo=False)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        # Get current timestamp for backup file
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'inventory_management_backup_{timestamp}.sql'

        print(f"Starting database backup to {backup_filename}...")

        # Create backup directory if it doesn't exist
        backup_dir = 'backups'
        os.makedirs(backup_dir, exist_ok=True)
        backup_path = os.path.join(backup_dir, backup_filename)

        # Get all table names
        db = SessionLocal()
        result = db.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result.fetchall()]

        print(f"Found {len(tables)} tables: {', '.join(tables)}")

        # Create SQL dump
        with open(backup_path, 'w', encoding='utf-8') as f:
            # Write header
            f.write(f"-- Inventory Management Database Backup\n")
            f.write(f"-- Created: {datetime.datetime.now()}\n")
            f.write(f"-- Database: inventory_management\n\n")

            # Write table structures and data
            for table_name in tables:
                print(f"Backing up table: {table_name}")

                # Get table structure
                create_table_result = db.execute(text(f"SHOW CREATE TABLE {table_name}"))
                create_table_sql = create_table_result.fetchone()[1]

                f.write(f"-- Table structure for {table_name}\n")
                f.write(f"{create_table_sql};\n\n")

                # Get table data
                data_result = db.execute(text(f"SELECT * FROM {table_name}"))
                columns = data_result.keys()
                rows = data_result.fetchall()

                if rows:
                    f.write(f"-- Data for {table_name}\n")
                    f.write(f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES\n")

                    # Write data rows
                    for i, row in enumerate(rows):
                        values = []
                        for value in row:
                            if value is None:
                                values.append('NULL')
                            elif isinstance(value, str):
                                # Escape single quotes and wrap in quotes
                                escaped_value = value.replace("'", "''")
                                values.append(f"'{escaped_value}'")
                            elif isinstance(value, datetime.datetime):
                                values.append(f"'{value.strftime('%Y-%m-%d %H:%M:%S')}'")
                            elif isinstance(value, datetime.date):
                                values.append(f"'{value.strftime('%Y-%m-%d')}'")
                            elif isinstance(value, bool):
                                values.append('1' if value else '0')
                            else:
                                values.append(str(value))

                        row_sql = f"({', '.join(values)})"
                        if i < len(rows) - 1:
                            row_sql += ","
                        f.write(f"{row_sql}\n")

                    f.write(";\n\n")
                else:
                    f.write(f"-- No data in {table_name}\n\n")

        db.close()

        print(f"✅ Database backup completed successfully!")
        print(f"📁 Backup saved to: {backup_path}")
        print(f"📊 Total tables backed up: {len(tables)}")

        return backup_path

    except Exception as e:
        print(f"❌ Error during backup: {str(e)}")
        return None

if __name__ == "__main__":
    backup_path = backup_database()
    if backup_path:
        print(f"\n🔄 Backup completed. You can now safely proceed with database cleanup.")
    else:
        print("\n❌ Backup failed. Please check database connection and try again.")
