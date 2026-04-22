# Samvaad AI - Human-Led & Collaborative Interview Platform

Samvaad is a comprehensive interview preparation platform that bridges the gap between AI-driven practice and real-world human interaction. It offers human-led mock interviews, collaborative group discussions, and seamless authentication.

## 🚀 Key Features

- **Human-Led Mock Interviews**: Students can book slots with real interviewers based on availability.
- **Dynamic Slot Management**: Interviewers can define their availability with precise time ranges (e.g., 10:00 AM - 11:00 AM).
- **Group Discussions (New)**: Create collaborative study sessions and invite up to 5 friends via automated email invitations with secure meeting credentials.
- **Instant Meetings**: Interviewers can generate instant meeting links for immediate sessions.
- **Google Authentication**: One-click secure login for students and interviewers.
- **Automated Email System**: Real-time notifications for bookings, approvals, and group invites.
- **Resume Parsing**: AI-powered resume analysis to tailor interview questions.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Vanilla CSS, Framer Motion
- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Authentication**: JWT & Google OAuth 2.0
- **Communications**: Nodemailer (Gmail SMTP)
- **File Handling**: Multer & PDF-Parse

## 📦 Project Structure

```text
samvad/
├── frontend/          # React + Vite application
└── backend/           # Node.js + Express server
```

## ⚙️ Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in `frontend/`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Run the Project
- **Backend**: `npm run dev` (starts on port 5000)
- **Frontend**: `npm run dev` (starts on port 5173)

## 🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

---
Built with ❤️ for better interview preparation.
