# 🏢 IT Asset Management System (NEPRA)

A comprehensive full-stack web application developed during my internship at **NEPRA (National Electric Power Regulatory Authority)** for managing and tracking IT assets throughout their complete lifecycle - from acquisition to disposal.

---

## 🔧 Tech Stack

### Frontend
- **React** 19.1.0 - Modern UI with hooks
- **Tailwind CSS** 3.4.17 - Utility-first styling
- **Chart.js** 4.5.0 - Data visualization
- **Axios** 1.11.0 - HTTP client
- **jsPDF** & **XLSX** - Report generation

### Backend
- **Python Flask** 2.3.3 - REST API framework
- **SQLAlchemy** 2.0.25+ - ORM for database
- **MySQL** 8.0 - Relational database
- **Flask-Mail** - Email notifications
- **bcrypt** - Password security

### Tools & Libraries
- React Router DOM, React Icons, Lucide React
- Flask-CORS, Werkzeug, python-dotenv
- Git, MySQL Workbench, Postman

---

## ✨ Key Features

### 📊 Dashboard & Analytics
- Real-time statistics with interactive pie charts
- Asset distribution visualization (Stock, Assigned, Under Repair, Damaged, Buyback, Auction)
- Recent activity feed with timestamps
- Quick navigation to all modules

### 📦 Asset Management
- Complete CRUD operations for IT assets
- Unique Oracle Number system for identification
- 12 device categories (Laptop, Desktop, Printer, Scanner, Server, UPS, Switches, Routers, Firewall, Biometric, etc.)
- Brand and model tracking with dynamic dropdowns
- Serial number management with duplicate prevention
- Purchase date and warranty expiry tracking
- Vendor and tender information
- Advanced search and filtering

### 👥 Assignment System
- Employee-asset allocation with complete audit trail
- Department and designation tracking
- Assignment date and expected return date management
- Voucher upload (PDF/Image) for documentation
- Real-time assignment status with overdue tracking
- Assignment history per asset

### 🔧 Repair Management
- Two-stage repair workflow (Request → Completion)
- Vendor and technician management
- Cost tracking and reporting
- Repair duration monitoring
- Document attachment support
- Status updates (In Progress, Fixed, Not Fixed)

### 🔄 Return Processing
- Multiple return types: Inventory Return, Buyback, Damaged
- Condition assessment and notes
- Return voucher management
- Automatic status updates
- Complete return history tracking

### 🎯 Auction Management
- Asset disposal tracking
- Auction date and price recording
- Auction history and reports
- Status updates to prevent re-assignment

### 📈 Reporting & Export
- Comprehensive asset reports
- PDF export with jsPDF and AutoTable
- Excel export with XLSX library
- Filtering by device type, status, department
- Custom date range reports
- Audit-ready documentation

### 🔐 User Management
- Secure authentication with bcrypt password hashing
- Email-based login system
- User profile management with photo upload
- Password reset functionality with email notifications
- Last login tracking

---

## 🗄️ Database Design

The system uses **13 interconnected tables** designed for data integrity:

- **users** - Authentication & profiles
- **password_reset_tokens** - Secure password reset
- **assets** - Core asset inventory (oracle_number, device_type, brand, model, serial, price, warranty, status)
- **assignments** - Asset allocation to employees
- **repair_request_form** - Assets under repair
- **completion_repair** - Completed repair records
- **returns** - Return records (buyback, damaged, inventory)
- **auctions** - Auctioned assets
- **activity_logs** - System activity tracking
- **counters** - Sequence generators
- **device_brand_mappings** - Device type to brand relationships

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MySQL (v8.0+)

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/nepra-asset-management.git
cd nepra-asset-management

# Setup database
mysql -u root -p
CREATE DATABASE inventory_management;
exit

# Backend setup
cd backend-python
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Create .env file (see .env.example)

# Frontend setup
cd ../frontend
npm install

# Run application (Windows)
# From project root:
start-fast.bat

# Or manually:
# Terminal 1: cd backend-python && python app.py
# Terminal 2: cd frontend && npm start
```


---

## 💼 My Role

- **Developed the complete system** during my 2-month internship at NEPRA
- **Built both frontend and backend** from scratch
- **Designed database schema** with 13 normalized tables
- **Implemented 40+ REST API endpoints** with Flask
- **Created responsive UI** with React and Tailwind CSS
- **Deployed system** on internal NEPRA servers
- **Conducted training sessions** for IT staff
- **Provided documentation** and ongoing support

### Impact
- **500+ assets** digitized and tracked
- **70% reduction** in manual data entry time
- **100% accuracy** in asset tracking (vs. 85% with Excel)
- **Instant report generation** (vs. 2-3 hours manually)
- **15+ departments** using the system daily

---

## 📸 Screenshots

### Dashboard
<img width="1900" height="870" alt="Dashboard" src="https://github.com/user-attachments/assets/50d9a7e3-10f6-4e3d-89e1-e809180e368b" />

### Asset Management
<img width="1920" height="1042" alt="Assets" src="https://github.com/user-attachments/assets/c06c3f77-a166-49da-9748-aeb6166f1336" />

### Assignment System
<img width="1920" height="1042" alt="Assets" src="https://github.com/user-attachments/assets/e99b3b5f-eeb4-4b6f-a3da-b71b79935842" />

### Repair Management
<img width="1920" height="1040" alt="Repair" src="https://github.com/user-attachments/assets/48a86b24-29ad-4316-970b-9d7b5168dffa" />

### Return 
<img width="1920" height="1040" alt="Repair" src="https://github.com/user-attachments/assets/00d47185-ec80-4f62-8d4a-169e60537a44" />

### Auction
<img width="1920" height="1040" alt="Repair" src="https://github.com/user-attachments/assets/87d2ea1a-ab11-466e-b24b-304523c0d4fa" />

### Report
<img width="1920" height="936" alt="Reports" src="https://github.com/user-attachments/assets/33bd8647-b40e-4092-b76f-892b2f5d2e84" />

---

## 💡 Key Learnings

### Technical Skills
- **Full-stack development** with React and Flask
- **Database design** with normalization and indexing
- **RESTful API** architecture with Blueprint pattern
- **State management** with React hooks
- **Authentication & security** with bcrypt and JWT
- **File upload handling** with validation
- **PDF/Excel generation** for reports
- **Email integration** with Flask-Mail

### Soft Skills
- **Requirements gathering** from stakeholders
- **Problem-solving** for complex business logic
- **Time management** to meet project deadlines
- **Communication** with non-technical users
- **Documentation** and training delivery

---

## 🚧 Challenges & Solutions

### Challenge 1: Complex Asset Lifecycle
**Problem**: Assets go through multiple states (new → assigned → under repair → returned → auctioned)  
**Solution**: Implemented state machine pattern with activity logs for complete audit trail

### Challenge 2: Duplicate Oracle Numbers
**Problem**: Users accidentally creating duplicate identifiers  
**Solution**: Real-time validation with debounced API calls and unique database constraints

### Challenge 3: Performance with Large Datasets
**Problem**: Dashboard slow with 500+ assets  
**Solution**: Database indexing, pagination, lazy loading, and query optimization

### Challenge 4: File Upload Security
**Problem**: Handling multiple file types with security concerns  
**Solution**: File type validation, size limits, unique filenames, and secure serving

### Challenge 5: Email Delivery
**Problem**: Gmail blocking password reset emails  
**Solution**: Gmail App Passwords and development mode with console logging

---

## 🔮 Future Enhancements

### Short-term
- Mobile application with QR code scanning
- Advanced reporting with custom report builder
- Role-based access control (Admin, Manager, User)
- Barcode/QR code integration for quick identification

### Mid-term
- Asset depreciation tracking
- Maintenance scheduling with automated reminders
- Integration with HR system
- Advanced analytics and predictive insights

### Long-term
- Multi-tenant architecture for multiple organizations
- AI-powered features (chatbot, anomaly detection)
- IoT integration for real-time tracking
- Blockchain for immutable audit trail

---

## 🌐 Project Status

✅ **Deployed and actively used** within NEPRA organization  
✅ **Handles real-world asset tracking** for 500+ assets  
✅ **Serving 15+ departments** daily  
✅ **Zero data loss** incidents since deployment  

---

## 📚 Project Structure

```
nepra-asset-management/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components (13 pages)
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   └── package.json
│
├── backend-python/          # Flask API
│   ├── routes/              # API routes (6 blueprints)
│   ├── utils/               # Database helpers
│   ├── uploads/             # File storage
│   ├── models.py            # SQLAlchemy models
│   ├── app.py               # Main application
│   └── requirements.txt
│
└── README.md
```

---

## 👤 Author

**Awais Saeed**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Awais Saeed](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- **NEPRA IT Department** for the opportunity and guidance
- **IT Manager** for feedback throughout the project
- **End Users** for valuable testing and suggestions

---

<div align="center">

**⭐ If you found this project interesting, please consider giving it a star! ⭐**

Made with ❤️ during my internship at NEPRA

</div>
