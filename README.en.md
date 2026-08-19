🌐 Language: English | Versión en Español

💬 Chat App — Real-Time Instant Messaging Full-Stack

Distributed real-time bidirectional web messaging application featuring group channel support, direct 1-on-1 chats, hybrid authentication, and zero-latency state synchronization.

🔒 Real-Time Architecture & Atomic Persistence
⚡ Socket.IO Bidirectional Communication: Event-driven architecture handling dynamic rooms, message delivery, notifications, and real-time presence synchronization across multiple connected clients.

🛡️ Atomic Persistence in MongoDB: Database-level operations utilizing atomic operators ($addToSet, $pull) for contact management, preventing race conditions and ensuring data integrity.

🔐 Security & Hybrid Authentication: Dual authentication flow supported by encrypted JSON Web Tokens (JWT) for local accounts and native Google OAuth 2.0 integration for frictionless sign-in.

☁️ Cloud Multimedia Pipeline: On-the-fly image upload, optimization, and transformation powered by the Cloudinary API to minimize network overhead.

🛠️ Tech Stack
Frontend & State

Core: React 19, TypeScript

State Management: Redux Toolkit

Styling & UI: Tailwind CSS v4

Backend & Services

Server & Real-Time: Node.js, Express, Socket.IO

Database: MongoDB Atlas + Mongoose ORM

Authentication: JWT, Google OAuth 2.0

Media Storage: Cloudinary API

✨ Key Features
⚡ Real-Time Instant Messaging: Message emission and reception driven by Socket.IO event handling without UI page reloads.

🔐 Flexible Login: Sign in using Google social login or traditional email/password registration with secure password hashing.

💬 Channels & Direct Messages: Dynamic room management for group conversations and private 1-on-1 user interactions.

👤 Efficient Contact Management: Add or remove contacts with atomic, real-time updates across both client and server.

🖼️ Multimedia File Sharing: Optimized image uploading hosted securely in the cloud.

🌐 Distributed Deployment: Backend service deployed on Render and Frontend client hosted on Vercel with continuous integration (CI/CD).

💻 Local Installation & Setup
1. Clone the repository
Bash
git clone https://github.com/Federico-Aguirre/Chat-App.git
cd Chat-App
2. Backend Configuration
Bash
cd backend
npm install
Create a .env file in the backend directory with the following variables:

Fragmento de código
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
Start the backend server:

Bash
npm run dev
3. Frontend Configuration
In a new terminal:

Bash
cd frontend
npm install
Create a .env.local file in the frontend directory:

Fragmento de código
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
Start the client application:

Bash
npm run dev
Open http://localhost:5173 in your browser to view the application running.