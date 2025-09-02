# A Secure RESTful API for Health-record Management

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/json%20web%20tokens-323330?style=for-the-badge&logo=json-web-tokens&logoColor=pink" alt="JWT">
  <img src="https://img.shields.io/badge/REST%20API-Level%203-brightgreen?style=for-the-badge" alt="REST API Level 3">
</p>

This repository contains the source code for a full-stack health-record management application. Its primary purpose is to serve as a reference implementation of a backend service architected according to the strict principles of Representational State Transfer (REST).

The backend is built with Node.js and Express, providing a secure, role-based API for managing patient data. It is paired with a React frontend that consumes this API.


---

## Core Architectural Philosophy: A Strict Adherence to REST

The design of this API is not arbitrary; it is a deliberate and disciplined implementation of the six architectural constraints that define a system as RESTful. This approach ensures the system is decoupled, scalable, and maintainable.

| **Principle**         | **Key Implementation Details**                                                                                                                              |
| :-------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Client-Server**     | • A fully decoupled architecture where the client (UI) and server (logic/data) are independent.<br>• Communication occurs exclusively via the HTTP API. |
| **Stateless**         | • No server-side session storage; each request is self-contained.<br>• Authentication is managed per-request via a **JSON Web Token (JWT)**.             |
| **Cacheable**         | • Responses include `ETag` and `Cache-Control` headers.<br>• This allows clients and proxies to cache data, reducing server load and improving performance. |
| **Uniform Interface** | • Uses resource-based URIs, standard HTTP verbs (`GET`, `PUT`), and JSON representations.<br>• **HATEOAS** is implemented via `_links` in responses to enable API discovery. |
| **Layered System**    | • The client is agnostic to the backend infrastructure.<br>• Intermediaries (proxies, load balancers) can be added without affecting the client.       |
| **Code on Demand**    | • **Intentionally omitted** to enforce a strict separation of concerns.<br>• The API transfers data (JSON) only, not executable code.                      |
---

## Key System Features

*   **Secure JWT-based Authentication:** Utilizes stateless JSON Web Tokens for authenticating API requests, with password hashing handled by `bcrypt`.
*   **Role-Based Access Control (RBAC):**
    *   **Administrator Role:** Provides a system-wide view with privileges to manage all patient records.
    *   **Patient Role:** Provides a scoped view, granting access only to the user's own personal data.
*   **Intent-Based Authorization:** The login endpoint verifies not only credentials but also the user's intended role, preventing unauthorized access even with valid credentials for a different role.
*   **Full CRUD Operations:** The API provides comprehensive endpoints for Create, Read, Update, and Delete operations on patient resources.

---

## Technology Stack

| Area          | Technology                                         |
| ------------- | -------------------------------------------------- |
| **Backend**   | Node.js, Express.js                                |
| **Frontend**  | React.js                                           |
| **Database**  | MySQL                                              |
| **Security**  | JSON Web Tokens (JWT), bcrypt.js                   |
| **API Design**| RESTful Architecture (Level 3 - HATEOAS Compliant) |

---

## Setup and Installation

### Prerequisites

*   Node.js (v14 or later)
*   MySQL Server

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/kamalesh0111/health-record-app.git
cd health-record-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install jwt-decode
```

### 2. Configure the Environment

In the `/backend` directory, create a `.env` file and provide the necessary configuration values.

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=healthcare_db
JWT_SECRET=a_cryptographically_secure_random_string
```

### 3. Initialize the Database

Connect to your MySQL instance and execute the following SQL script to create the required database and tables.


### 4. Provision an Administrator Account

1.  Start the application as described in the next step.
2.  Use the registration interface to create a new user account (e.g., `admin_user`).
3.  Execute the following SQL command to elevate this user's privileges to `admin`.
    ```sql
    UPDATE users SET role = 'admin' WHERE username = 'admin_user';
    ```

### 5. Run the Application

*   **Terminal 1: Start the Backend Server** (from the `/backend` folder):
    ```bash
    node index.js
    ```
*   **Terminal 2: Start the Frontend Application** (from the `/frontend` folder):
    ```bash
    npm run dev
    ```

The frontend will be accessible at `http://localhost:3000`. Use the credentials of the provisioned administrator to access the admin panel.
