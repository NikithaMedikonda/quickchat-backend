# Quick Chat Backend

This is the **backend** service for the Quick Chat Application – a real-time, end-to-end encrypted messaging application. Built with **Node.js**, **Express**, **PostgreSQL**, and **Socket.IO**, the backend handles authentication, messaging, user management, and secure data transmission.

---

## Features

### Authentication
- Phone number & password login
- Secure registration with validation
- Passwords hashed using **bcrypt**
- Session management via **JWT**

###  Messaging
- Real-time chat via **Socket.IO**
- End-to-end encryption using `crypto` (handled at the app level)
- Message persistence in PostgreSQL
- Unread message tracking

### User Management
- Profile creation and updates.
- Profile image upload.
- Block account functionality.
- Delete user functionality
- Delete account functionality.

### Notifications
- Trigger background push notifications (client-driven)
- User metadata exposed for frontend to determine when to notify

---

## Tech Stack

| Component     | Tech                     |
|---------------|--------------------------|
| Runtime       | Node.js                  |
| Framework     | Express.js               |
| Database      | PostgreSQL               |
| Real-Time     | Socket.IO                |
| Encryption    | bcrypt, crypto, jsonwebtoken |
| CI/CD         | Jenkins                  |

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v13+)
- Supabase (optional for cloud storage)
- Jenkins (for CI/CD integration)

### Clone and Install

```bash
git clone https://github.com/NikithaMedikonda/quickchat-backend.git
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5050
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=chatapp
JWT_SECRET=your_jwt_secret
```

---

##  Run the Server

```bash
npm start
```

The backend will be available at `http://localhost:5050`.

---

## CI/CD (Jenkins)

- Runs on every `git push`
- Installs dependencies, runs tests
- Deploys to staging automatically

---

## Security

- Passwords: Hash using **bcrypt**
- Sessions: Manag via **JWT**
- Messages: Encrypt via **crypto** at client level
- Blocked users: Prevent interaction via DB and socket rules

---

## Contact:
For any issues, questions or feedback, please contact:
- Email : nikithamedikonda@everest.engineering