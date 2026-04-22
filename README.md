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

## 🌐 Deployment Instructions

### 1. Backend (Koyeb or Railway)
Since Render's free tier is limited, **Koyeb** is a great alternative for the backend:

1. Create a new service on [Koyeb](https://www.koyeb.com/).
2. Connect your GitHub repository.
3. Set the **Root Directory** to `backend`.
4. Koyeb will automatically use the `Dockerfile`.
5. Add your **Environment Variables** in the Koyeb dashboard.

### 2. Frontend (Netlify or Vercel)
**Netlify** is excellent for the frontend:

1. Create a new site on [Netlify](https://www.netlify.com/).
2. Connect your GitHub repository.
3. **Base Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Publish Directory**: `dist`
6. Add your **Environment Variables**:
   - `VITE_BACKEND_URL`: Your Koyeb backend URL.
   - `VITE_GOOGLE_CLIENT_ID`: Your Google Client ID.

*Note: I've already added a `public/_redirects` file to handle React Router navigation on Netlify.*


### 3. Run the Project
- **Backend**: `npm run dev` (starts on port 5000)
- **Frontend**: `npm run dev` (starts on port 5173)

## 🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

## 🐳 Docker Deployment

You can run the entire stack using Docker and Docker Compose:

1. **Build and Start**:
   ```bash
   docker-compose up --build -d
   ```

2. **Access**:
   - Frontend: `http://localhost` (on port 80)
   - Backend: `http://localhost:5000`

3. **Stop**:
   ```bash
   docker-compose down
   ```

---
Built with ❤️ for better interview preparation.
