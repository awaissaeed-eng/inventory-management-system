# 🏢 IT Asset Management System

A comprehensive full-stack web application for managing organizational IT assets throughout their entire lifecycle - from acquisition to disposal.

![React](https://img.shields.io/badge/React-19.1.0-blue)
![Flask](https://img.shields.io/badge/Flask-2.3.3-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![Python](https://img.shields.io/badge/Python-3.8+-yellow)

## 🚀 Features

### 📊 Dashboard
- Real-time asset statistics with interactive charts
- Recent activity tracking
- Quick access to all major functions

### 💻 Asset Management
- Complete asset lifecycle tracking
- Device categorization (Laptops, Desktops, Printers, etc.)
- Serial number and warranty management
- Status tracking (New, Assigned, Under Repair, Damaged, Auctioned)

### 👥 Assignment System
- Employee asset allocation
- Department and designation tracking
- Assignment history and return dates
- Voucher upload and management

### 🔧 Repair Management
- Two-stage repair process (Request → Completion)
- Cost tracking and vendor management
- Repair status monitoring
- Document attachment support

### 📋 Return Processing
- Multiple return types (Inventory, Buyback, Damaged)
- Condition assessment
- Return voucher management

### 🏷️ Auction Management
- Asset disposal tracking
- Auction date and price recording
- Status updates

### 📈 Reporting
- Comprehensive asset reports
- Export capabilities (PDF, CSV)
- Filtering and search functionality

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - Modern UI framework
- **React Router 7.7.1** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **React Icons** - Icon library

### Backend
- **Flask 2.3.3** - Python web framework
- **SQLAlchemy 2.0+** - ORM for database operations
- **Flask-CORS** - Cross-origin resource sharing
- **MySQL Connector** - Database connectivity
- **Werkzeug** - WSGI utilities
- **bcrypt** - Password hashing

### Database
- **MySQL 8.0** - Relational database
- Comprehensive schema with 10+ tables
- Foreign key relationships and constraints

## 📁 Project Structure

```
inventory-management/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Main page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── config.js       # API configuration
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
├── backend-python/          # Flask backend application
│   ├── routes/             # API route handlers
│   ├── utils/              # Shared utilities
│   ├── uploads/            # File upload storage
│   ├── models.py           # Database models
│   ├── app.py              # Main application file
│   └── requirements.txt    # Python dependencies
│
├── start-fast.bat          # Quick startup script
└── README.md               # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MySQL** (v8.0 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/inventory-management.git
   cd inventory-management
   ```

2. **Backend Setup**
   ```bash
   cd backend-python
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE inventory_management;
   
   # Update connection string in app.py if needed
   # Default: mysql+mysqlconnector://root:@localhost/inventory_management
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

5. **Environment Configuration**
   ```bash
   # Frontend: Create .env file in frontend directory
   REACT_APP_API_URL=http://localhost:5000
   
   # Backend: Set MySQL URI (optional)
   MYSQL_URI=mysql+mysqlconnector://username:password@localhost/inventory_management
   ```

### Running the Application

**Option 1: Quick Start (Recommended)**
```bash
# From project root
start-fast.bat
```

**Option 2: Manual Start**
```bash
# Terminal 1 - Backend
cd backend-python
python app.py

# Terminal 2 - Frontend  
cd frontend
npm start
```

### Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## 📊 Database Schema

The application uses a comprehensive MySQL schema with the following main tables:

- **users** - User authentication and profiles
- **assets** - Core asset information
- **assignments** - Asset-employee relationships
- **repair_request_form** - Repair requests
- **completion_repair** - Completed repairs
- **returns** - Asset returns
- **auctions** - Asset auctions
- **activity_log** - System activity tracking

## 🔧 API Endpoints

### Assets
- `GET /api/assets` - List all assets
- `POST /api/assets` - Create new asset
- `GET /api/assets/{oracle_number}` - Get asset details

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment

### Repairs
- `GET /api/repairs` - List repairs
- `POST /api/repairs/request` - Create repair request
- `POST /api/repairs/complete` - Complete repair

### Returns
- `GET /api/returns` - List returns
- `POST /api/returns` - Process return

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## 🎨 Key Features

### Performance Optimizations
- ✅ Centralized database utilities
- ✅ Optimized API responses
- ✅ Efficient state management
- ✅ Minimal bundle size

### Security Features
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ File upload security
- ✅ SQL injection prevention

### User Experience
- ✅ Responsive design
- ✅ Real-time updates
- ✅ Intuitive navigation
- ✅ Export capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Optimized for performance and maintainability
- Designed for enterprise-level asset management

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation

---

**Made with ❤️ for efficient IT asset management**