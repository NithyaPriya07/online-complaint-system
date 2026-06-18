# Online Complaint Registration & Management System

## Overview

The Online Complaint Registration & Management System is a full-stack MERN application developed to streamline complaint registration, tracking, and resolution. The system provides separate portals for Users, Agents, and Administrators, ensuring secure and efficient complaint handling.

---

## Features

### User Module

* User Registration and Login
* Secure JWT Authentication
* Submit New Complaints
* Track Complaint Status
* View Complaint History
* Receive Complaint Updates

### Agent Module

* Secure Agent Login
* View Assigned Complaints
* Update Complaint Status
* Add Remarks and Responses
* Communicate with Users
* Mark Complaints as Resolved

### Admin Module

* Secure Admin Login
* View All Complaints
* Assign Complaints to Agents
* Manage Users and Agents
* Monitor Complaint Progress
* Update Complaint Status
* Resolve Complaints
* Dashboard for Complaint Monitoring

---

## Roles and Permissions

| Feature                  | User | Agent | Admin |
| ------------------------ | ---- | ----- | ----- |
| Register/Login           | ✅    | ✅     | ✅     |
| Submit Complaint         | ✅    | ❌     | ❌     |
| View Own Complaints      | ✅    | ❌     | ❌     |
| View Assigned Complaints | ❌    | ✅     | ✅     |
| Update Complaint Status  | ❌    | ✅     | ✅     |
| Resolve Complaint        | ❌    | ✅     | ✅     |
| Assign Complaints        | ❌    | ❌     | ✅     |
| Manage Users             | ❌    | ❌     | ✅     |
| View All Complaints      | ❌    | ❌     | ✅     |

---

## Technology Stack

### Frontend

* React.js
* HTML5
* CSS3
* JavaScript
* Axios

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

### Authentication

* JWT (JSON Web Token)
* bcrypt.js

---

## Project Structure

complaint-management-system/

├── backend/

│   ├── routes/

│   ├── models/

│   ├── middleware/

│   ├── controllers/

│   ├── server.js

│   └── .env

│

├── frontend/

│   ├── public/

│   ├── src/

│   │   ├── components/

│   │   ├── pages/

│   │   ├── context/

│   │   └── App.js

│   └── package.json

│

└── README.md

---

## Installation and Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd complaint-management-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
```

Start Backend:

```bash
npm start
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

Backend runs on:

```text
http://localhost:5000
```

---

## API Endpoints

### Authentication

| Method | Endpoint           |
| ------ | ------------------ |
| POST   | /api/auth/register |
| POST   | /api/auth/login    |

### Complaints

| Method | Endpoint         |
| ------ | ---------------- |
| POST   | /api/complaints  |
| GET    | /api/complaints  |
| PUT    | /api/complaints/ |
| DELETE | /api/complaints/ |

---

## Deployment

### Frontend

* Netlify

### Backend

* Render

### Database

* MongoDB Atlas

---

## System Workflow

1. User registers and logs into the system.
2. User submits a complaint.
3. Admin reviews the complaint.
4. Admin assigns the complaint to an Agent.
5. Agent investigates and updates the complaint status.
6. User can track complaint progress.
7. Agent/Admin marks the complaint as resolved.
8. Complaint status is updated for the user.

---

## Future Enhancements

* Email Notifications
* SMS Alerts
* File Upload Support
* Complaint Priority Levels
* Real-Time Notifications
* Analytics Dashboard
* Report Generation

---

## Author

Nithya Priya

---

## License

This project is developed for educational and learning purposes.
