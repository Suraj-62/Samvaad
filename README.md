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

### ⚡ All-in-One Deployment (Vercel)
The easiest way is to deploy both the frontend and backend on **Vercel** as a monorepo:

1. Push your code to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **New Project**.
3. Select this repository.
4. Vercel will automatically detect the `vercel.json` and configure the project.
5. **Environment Variables**: Add all your backend variables (`MONGO_URI`, `JWT_SECRET`, etc.) and frontend variables (`VITE_GOOGLE_CLIENT_ID`) in the Vercel dashboard.
6. **Important**: Set `VITE_BACKEND_URL` to your own Vercel domain followed by `/api` (e.g., `https://your-app.vercel.app`).


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
