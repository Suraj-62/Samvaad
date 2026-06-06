# Samvaad AI - Project Technical Documentation

This document provides a comprehensive overview of the technology stack, database architecture, system flow, and key features of the **Samvaad AI** platform.

---

## 🚀 Tech Stack

### 💻 Frontend (Client-Side)
- **Framework**: [React.js 19](https://react.dev/) (Build tool: [Vite](https://vitejs.dev/))
- **Routing**: `react-router-dom` (Version 7+)
- **State Management & API Calls**: `Axios` for backend communication.
- **Authentication**: Custom JWT-based auth + [Google OAuth 2.0](https://developers.google.com/identity/gsi/web/guides/overview) (`@react-oauth/google`).
- **Styling**: Vanilla CSS with a **Modern Glassmorphism Design System**. Custom CSS variables are used for a consistent premium dark theme.
- **Icons**: SVG-based custom icons.

### ⚙️ Backend (Server-Side)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js 5](https://expressjs.com/) (Next-gen Express for better performance).
- **AI Integration**: [Google Generative AI SDK](https://ai.google.dev/) (Gemini AI) used for conducting mock interviews and generating feedback.
- **File Handling**: `Multer` for resume uploads and `pdf-parse` for extracting text from PDF resumes.
- **Security**: `bcryptjs` for password hashing and `jsonwebtoken` (JWT) for secure session management.

### 🗄️ Database
- **Primary Database**: [MongoDB](https://www.mongodb.com/) (NoSQL)
- **ORM**: [Mongoose](https://mongoosejs.com/)
- **Data Models**:
  - `User`: Stores profiles for Students, Interviewers, and Admins.
  - `Availability`: Stores time slots created by interviewers.
  - `Interview`: Stores records of scheduled and completed sessions.
  - `Feedback`: Stores AI-generated or human-provided feedback.

---

## 📧 Email System (Communication)

The project uses a robust automated email notification system to keep users updated on their interview status.

- **Service**: [Nodemailer](https://nodemailer.com/)
- **Provider**: Gmail SMTP (via App Passwords)
- **Email Types**:
  - **Welcome Email**: Sent upon successful registration.
  - **Interviewer Alert**: Notifies interviewers when a student books their slot.
  - **Pending Request**: Notifies students that their request is waiting for interviewer approval.
  - **Confirmation Email**: Sent to both parties once an interview is accepted, containing the **Join Link**.
  - **Group Discussion Invitations**: Sent to participants invited to a GD session.

---

## 🔄 Application Flow (Workflow)

### 1. User Onboarding
- Users can sign up as a **Student** or an **Interviewer**.
- Interviewers require Admin approval before they can start listing slots.
- Google Login provides a seamless one-click onboarding experience.

### 2. AI Mock Interview (Gemini Powered)
- Student uploads their **Resume (PDF)**.
- Backend parses the resume using `pdf-parse`.
- Gemini AI analyzes the resume and the job role to generate relevant technical and behavioral questions.
- Real-time interaction happens via the AI Interview interface.

### 3. Human Mock Interview (Interviewer Booking)
- **Interviewer** adds available time slots in their dashboard.
- **Student** browses available interviewers and "Requests" a slot.
- **Backend** sends an email to the interviewer with "Accept" and "Reject" buttons.
- Upon acceptance, the system generates a unique **Meeting ID** and sends confirmation emails to both.

### 4. Group Discussions (GD)
- A host creates a GD topic.
- Invitations are sent via email to multiple participants.
- Real-time collaboration platform for collective interview prep.

---

## 🛠️ Folder Structure

- `/frontend`: Contains the React source code, components, and assets.
- `/backend`: Contains the Node/Express server, Mongoose models, and AI/Email services.
- `/backend/src/services/emailService.js`: The core logic for all automated emails.
- `/backend/src/controllers/interviewController.js`: Manages the business logic for scheduling.

---

## 🚀 Deployment & DevOps

The project is designed to be highly portable and scalable:
- **Containerization**: Both frontend and backend are containerized using **Docker**.
  - `Dockerfile`: Multi-stage builds for optimized production images.
  - `docker-compose.yml`: Allows running the entire stack (Frontend, Backend, MongoDB) with a single command.
- **Hosting**:
  - **Backend**: Can be deployed on platforms like Render, Railway, or AWS.
  - **Frontend**: Configured for **Vercel** (`vercel.json` included) or Netlify.
- **Environment Variables**: Managed via `.env` files for security (DB URIs, API Keys, Email Credentials).

---

## 🔑 Key Dependencies
| Package | Purpose |
| :--- | :--- |
| `@google/generative-ai` | Powers the AI Mock Interview (Gemini) |
| `mongoose` | Connects and interacts with MongoDB |
| `nodemailer` | Sends all transactional emails |
| `jsonwebtoken` | Handles secure user authentication |
| `pdf-parse` | Extracts text from resumes |
| `axios` | Handles frontend-to-backend API requests |

---
*Documentation generated by Samvaad AI Dev Team.*
