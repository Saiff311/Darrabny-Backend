# 🚀 Darrabny (درّبني) - Backend

[![Backend Capabilities](https://img.shields.io/badge/Backend-Robust%20%26%20Scalable-blue?style=for-the-badge)](https://github.com/Saiff311/Darrabny-Backend)
[![Machine Learning](https://img.shields.io/badge/AI%2FML-Integrated-green?style=for-the-badge)](#)
[![Architecture](https://img.shields.io/badge/Architecture-MVC%20%2F%20RESTful-orange?style=for-the-badge)](#)

**Darrabny (درّبني)** is an enterprise-grade backend platform built to power a smart internship and field-training ecosystem. The system connects university students, academic supervisors, and corporate entities into a single unified workspace. By leveraging automated workflows and intelligent matching mechanisms, Darrabny streamlines the journey from training application to graduation evaluation.

---

## 📌 Table of Contents
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack & Tools](#%EF%B8%8F-tech-stack--tools)
- [🏗️ System Architecture](#%EF%B8%8F-system-architecture)
- [📂 Project Directory Structure](#-project-directory-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Local Setup](#installation--local-setup)
  - [Environment Variables](#environment-variables)
- [🔌 API Documentation Overview](#-api-documentation-overview)
- [🤖 Machine Learning & Data Science Integration](#-machine-learning--data-science-integration)
- [👥 Team & Contribution](#-team--contribution)

---

## ✨ Key Features

### 👤 1. Multi-Role Authentication & RBAC
- Fully secure authentication protocols using **JWT (JSON Web Tokens)**.
- **Role-Based Access Control (RBAC)** distinguishing between **Students**, **Company Recruiters**, **Academic Supervisors**, and **System Administrators**.

### 💼 2. Internship Management & Lifecycle
- **Companies:** Post training opportunities, define prerequisites, manage applications, and shortlist candidates.
- **Students:** Build comprehensive professional profiles, upload resumes, and track application lifecycles (Applied, Shortlisted, Interviewing, Accepted, Rejected).

### 🤖 3. Intelligent Recommendation Engine
- Machine learning pipelines analyze student profiles, skills, and academic backgrounds to recommend the most relevant training opportunities.

### 📊 4. Academic Evaluation & Progress Tracking
- Seamless workflow for students to upload weekly progress reports.
- Dedicated dashboard for Academic Supervisors to grade reports, track attendance, and log mid-term/final evaluation metrics.

---

## 🛠️ Tech Stack & Tools

- **Core Runtime & Framework:** Node.js (Express.js) *or* Python (FastAPI / Django)
- **Database & ODM/ORM:** MongoDB (Mongoose) / PostgreSQL (Sequelize / SQLAlchemy)
- **Machine Learning Environment:** Anaconda Workspace, Jupyter Notebooks
- **Deep Learning Frameworks:** TensorFlow / Keras (CNN models for document/resume verification or classification)
- **Security:** Helmet, Bcrypt, JWT
- **API Styling & Design:** RESTful Architecture, JSON interaction

---

## 🏗️ System Architecture

The project is structured according to clean code principles, ensuring separation of concerns via an **MVC / Controller-Service-Repository** design pattern:

```
┌────────────────────────────────────────────────────────┐
│                   Client Layer (Client App)            │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS Requests (REST API)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Routing & Middleware                 │
│         (Auth, Rate Limiting, Request Validation)      │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Controllers Layer                    │
│             (HTTP Request/Response Handling)           │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Services Layer                     │
│               (Core Business Logic & ML)               │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│               Data Access / Repository                 │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Database & Storage                   │
└────────────────────────────────────────────────────────┘
```

---

## 📂 Project Directory Structure

```microstructure
.
├── config/             # Database connections and third-party API configurations
├── controllers/        # Request handlers (extracts parameters, sends responses)
├── middlewares/        # Authentication, RBAC, error handling, logging
├── models/             # Database schemas (Student, Company, Supervisor, Internship, Report)
├── routes/             # RESTful route definitions map to specific controllers
├── services/           # Heavy business logic, validation, and third-party integrations
├── ml_models/          # Python/Jupyter scripts, saved models, and CNN pipelines
├── utils/              # Helper functions (token generators, formatters)
├── .env.example        # Reference file for environmental setups
├── server.js / main.py # Application entry point
└── package.json        # Dependencies management
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your system:
- **Runtime:** Node.js (v16+) or Python (3.9+)
- **Database:** MongoDB Community Server / PostgreSQL instance
- **AI Workspace:** Anaconda Distribution & Jupyter Notebook (for ML module maintenance)

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Saiff311/Darrabny-Backend.git
   cd Darrabny-Backend
   ```

2. **Install project dependencies:**
   *For Node.js backends:*
   ```bash
   npm install
   ```
   *For Python backends:*
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory based on the configuration guide below.

4. **Run the application:**
   *Development Mode:*
   ```bash
   npm run dev   # or python main.py
   ```
   *Production Mode:*
   ```bash
   npm start
   ```

### Environment Variables
Configure your `.env` file with these key parameters:
```env
PORT=5000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_ultra_secure_jwt_secret_key
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:8000 # If ML is running as a microservice
```

---

## 🔌 API Documentation Overview

The backend exposes a collection of secure endpoints. Here is a snapshot of primary endpoints:

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Registers a new user (Student, Company, Supervisor) |
| **POST** | `/api/auth/login` | Public | Validates credentials and issues secure JWT token |
| **GET** | `/api/internships` | Authenticated | Retrieves available training opportunities with filters |
| **POST** | `/api/internships/create` | Company | Publishes a new training opportunity |
| **POST** | `/api/applications/apply/:id` | Student | Submits an application for a training slot |
| **GET** | `/api/supervisors/my-students`| Supervisor | Lists all assigned students and their current status |

---

## 🤖 Machine Learning & Data Science Integration

The intelligence layer of **Darrabny** is engineered using modern data science notebooks:
- Developed and verified inside **Anaconda Environments** utilizing **Jupyter Notebooks**.
- Features automated data preprocessing pipelines to standardize resume attributes and skill keywords.
- Implements custom **Convolutional Neural Networks (CNN)** or matching classifiers to parse structural documentation, verify certificates, and generate optimal recommendations.

---

## 👥 Team & Contribution

This backend repository is part of a **Graduation Project** developed at the **Faculty of Science, Alexandria University**. 

- **Lead Backend Developer:** [Saif](https://github.com/Saiff311)
- **Academic Institution:** Alexandria University, Faculty of Science.

---
*Developed with passion to bridge the gap between academic education and professional career paths.*
