<<<<<<< HEAD
# 🎓 BYOD Classroom Management System

## Overview
This platform is fundamentally built around **Securing** and **Increasing Productivity** of BYOD (Bring Your Own Device) classroom environments. 

It accomplishes this by dividing the architecture into specialized Student and Teacher dashboards, enabling tight oversight, real-time communication, and strict productivity tracking without needing MDM (Mobile Device Management) level intrusive hardware controls—making it perfect for personal BYOD environments.

## 🚀 Key Productivity & Security Features

### 1. **Real-Time Focus Connectivity (Socket.IO)**
The backbone of the application runs on real-time persistent websockets. Teachers can instantly broadcast announcements and alerts to all connected student devices globally. This builds immediate compliance and removes the latency of emails or LMS updates. 

### 2. **Productivity Tracking Engine**
Students log their tasks directly on their dashboard and track their engaged time using a robust real-time timer metric. Every action (starting a task, pressing stop) generates an immutable timestamped log sent to the Node.js backend. Teachers can audit this database visually or export it instantly to `.gz` format to enforce accountability.

### 3. **Dynamic Website Filtering & Security Layer**
To enforce focus during work sessions without heavy MDM software, the application uses an active "Website Access Checker". Teachers maintain a dynamic global blocklist of URLs via their Teacher Panel. Students can check (or are forced to check) domains, which queries the database for approval statuses. If denied, it visibly flags as a blocked resource—an organic, software-level approach to BYOD securing.

### 4. **Secure Authentication & Identity Matrix**
User security relies on heavily curated JSON Web Tokens (`jwt`) managed via robust httpOnly cookie-parsers and session storage protocols, utilizing bcrypt hashing mechanisms preventing credential compromises, fulfilling the core *Securing* directive.

## 🛠 Project Structure

The project has been separated into two distinct micro-architectures for scaling:
- **`/backend`**: Node.js, Express, MongoDB (Mongoose), Socket.IO server.
- **`/frontend`**: High-performance Vanilla Vite server with a highly refined Glassmorphism interface.

## 💻 How to Run Locally

### 1. Backend Server
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Establish your `.env` file containing `MONGO_URI`, `JWT_SECRET`, and `SESSION_SECRET`.
4. (Optional) Seed dummy data for testing:
   ```bash
   node scripts/seed.js
   ```
5. Start the API using Dev mode:
   ```bash
   npm run dev
   ```
   *The backend defaults to port 3000.*

### 2. Frontend Development Server
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install the Vite dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *Vite typically maps to `http://localhost:5173`.*

> **Test Credentials:** If you ran the database seed script, you can log in as the teacher (`teacher@school.edu` / `teacher123`) or a student (`alice@school.edu` / `student123`).

## 🎨 Premium UI Guidelines
The frontend utilizes a state-of-the-art Glassmorphism dark mode featuring heavily curated gradients (`var(--primary)`, `var(--secondary)`, `var(--accent)`), fluid micro-animations (cards hover transforms, glowing borders on focus), ensuring a visually stunning interaction that commands modern engagement standards.
=======
# BYOD
>>>>>>> f57a282fbd6b8ed1f01f62e17e541c9dcbd6b213

🌐 Live Demo
https://byod-umber.vercel.app/
