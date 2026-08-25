# CRIMSON CODE

A security-focused web application built around encrypted data capsules, secure client–server communication, and a Fastify + PostgreSQL backend.

## 🚀 Live Demo

**Frontend:**  
https://crimson-code.onrender.com

**Backend:**  
https://crimson-code-backend.onrender.com

**Health Check:**  
https://crimson-code-backend.onrender.com/api/health

---

## 🛡️ Overview

CRIMSON CODE is designed with security and privacy as core principles.

The application uses a frontend/backend architecture where sensitive capsule data is encrypted on the client side before being transmitted to the backend. The backend provides the API layer and PostgreSQL persistence while keeping the application logic separated from the frontend.

The latest implementation also aligns the frontend capsule encryption/decryption flow with the backend capsule API contract.

---

## ✨ Key Features

- 🔐 Client-side capsule encryption/decryption
- 🛡️ Security-focused data handling
- ⚡ Fastify-based backend API
- 🗄️ PostgreSQL database
- 🚦 API rate limiting
- 🌐 CORS configuration
- ✅ Zod-based validation
- 🔄 Frontend ↔ backend API integration
- 🩺 Backend health-check endpoint
- 🚀 Production deployment using Render
- 🔧 TypeScript across the application stack



## 🏗️ Architecture
text
                    ┌──────────────────────┐
                    │      Frontend        │
                    │   React + Vite       │
                    └──────────┬───────────┘
                               │
                         HTTPS / API
                               │
                               ▼
                    ┌──────────────────────┐
                    │      Backend         │
                    │  Fastify + TypeScript│
                    └──────────┬───────────┘
                               │
                       PostgreSQL
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Database       │
                    │      PostgreSQL      │
                    └──────────────────────┘
Capsule Flow
User Data
   │
   ▼
Client-side Encryption
   │
   ▼
Encrypted Capsule
   │
   ▼
Backend API
   │
   ▼
PostgreSQL

Decryption is performed on the client side when the capsule is retrieved.

🔐 Security

Security considerations are incorporated throughout the application:

Sensitive capsule content is handled through client-side encryption.
Backend requests are validated using Zod.
API rate limiting helps mitigate abusive request patterns.
CORS is explicitly configured.
Secrets and deployment configuration are supplied through environment variables rather than committed to the repository.
PostgreSQL is used for persistent backend storage.
The production backend is served over HTTPS.

Secret values are intentionally excluded from this repository.

🧰 Tech Stack
Frontend
React
Vite
TypeScript
Backend
Node.js
Fastify
TypeScript
Zod
@fastify/cors
@fastify/rate-limit
dotenv
Database
PostgreSQL
pg
Testing / Development
Vitest
tsx
TypeScript
Deployment
Render
📁 Backend Scripts
npm run dev

Runs the backend in development mode with automatic reload.

npm run build

Compiles the TypeScript backend.

npm start

Starts the compiled production server.

npm test

Runs the test suite.

npm run typecheck

Runs TypeScript type checking without emitting files.

⚙️ Environment Variables

The application uses environment variables for deployment-specific configuration.

Example:

PORT=3000
HOST=0.0.0.0
DATABASE_URL=***
NODE_ENV=production

Frontend:

VITE_API_BASE_URL=***

Actual secret values are never committed to Git.

🩺 Health Check

The production backend exposes:

GET /api/health

Expected response:

{
  "status": "ok"
}
🚀 Deployment

The application is deployed as separate frontend and backend services.

Backend

The backend runs as a Node.js web service and connects to the production PostgreSQL instance through DATABASE_URL.

Frontend

The frontend is built with Vite and deployed as a static site.

Production API communication is configured through:

VITE_API_BASE_URL
🔭 Future Improvements

Potential future improvements include:

Expanded automated security testing
More comprehensive API test coverage
Improved observability and monitoring
Additional security hardening
More extensive frontend error handling
Performance optimisation and caching
Expanded documentation for the capsule protocol
👥 Team

Built by the CRIMSON CODE team.

📄 License

This project is currently provided for the purposes of the competition / demonstration.
