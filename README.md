# 🛡️ DocChecker AI

> AI-Powered Contract & Document Risk Analysis Platform

DocChecker AI is an intelligent document auditing platform that helps users analyze contracts, agreements, offer letters, NDAs, legal documents, invoices, and business paperwork using advanced AI-powered risk detection and document intelligence.

The system automatically extracts document content, identifies legal and financial risks, generates executive summaries, highlights liabilities, tracks deadlines, and provides an interactive AI chat experience for document understanding.

---

## 🚀 Live Demo
👉 https://docchecker-ai.onrender.com/



## 🚀 Key Features

### 📄 Intelligent Document Analysis

* Upload PDF documents
* Upload Images (PNG, JPG, JPEG)
* Automatic text extraction
* AI-powered document understanding
* Executive summaries
* Risk assessment engine
* Classification of document types

### ⚠️ Risk Detection Engine

Automatically identifies:

* Legal Risks
* Financial Risks
* Liability Clauses
* Termination Clauses
* Confidentiality Concerns
* Intellectual Property Issues
* Compliance Risks
* Missing Contract Terms

### 💰 Financial Liability Tracking

Extracts:

* Payment Obligations
* Financial Commitments
* Compensation Clauses
* Recurring Payments
* One-Time Costs
* Contractual Penalties

### 📅 Deadline Detection

Automatically detects:

* Contract Start Dates
* Contract End Dates
* Renewal Dates
* Expiry Dates
* Notice Periods
* Compliance Deadlines

### 🤖 AI Contract Assistant

Interactive document chat system:

* Ask questions about uploaded documents
* Clause explanations
* Risk explanations
* Contract summaries
* Liability discussions
* Context-aware responses

### 🔒 Security & Authentication

* JWT Authentication
* Password Hashing using bcrypt
* Protected API Routes
* User-based document isolation
* Secure file storage
* Environment-based secret management

---

# 🏗️ System Architecture

```text
User
 │
 ▼
Frontend (HTML + CSS + JavaScript)
 │
 ▼
Flask Backend API
 │
 ├── Authentication Module
 │
 ├── Document Processing Engine
 │
 ├── AI Analysis Layer
 │
 ├── Chat Engine
 │
 └── Activity Logging
 │
 ▼
MongoDB Atlas
 │
 ▼
Gemini AI
```

---

# 🧠 AI Processing Workflow

```text
Upload Document
       │
       ▼
Extract Text
       │
       ▼
AI Classification
       │
       ▼
Risk Analysis
       │
       ▼
Liability Detection
       │
       ▼
Deadline Extraction
       │
       ▼
Executive Summary
       │
       ▼
Store Results
       │
       ▼
Interactive AI Chat
```

---

# 📁 Project Structure

```text
DocChecker-AI
│
├── app.py
├── config.py
├── requirements.txt
│
├── backend
│   ├── auth
│   ├── documents
│   ├── models
│   ├── services
│   └── middleware.py
│
├── frontend
│   ├── index.html
│   ├── dashboard.html
│   ├── document.html
│   └── js
│
├── uploads
│
└── .env
```

---

# 🗄️ Database Design

## Users Collection

```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "password": "hashed",
  "plan": "free/pro",
  "doc_quota": 5
}
```

## Documents Collection

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "filename": "string",
  "classification": "string",
  "status": "processing/completed",
  "analysis_results": {}
}
```

## Activity Logs Collection

```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "action": "UPLOAD",
  "details": "Document uploaded",
  "timestamp": "datetime"
}
```

---

# ⚙️ Tech Stack

## Frontend

* HTML5
* CSS3
* Vanilla JavaScript

## Backend

* Python
* Flask
* Flask-CORS
* JWT Authentication
* Bcrypt

## Database

* MongoDB Atlas
* PyMongo

## AI Layer

* Google Gemini 2.5 Flash
* OCR-based text understanding
* Risk intelligence engine

---

# 🔑 Environment Variables

Create a `.env` file:

```env
SECRET_KEY=your_secret_key

JWT_SECRET=your_jwt_secret

MONGO_URI=your_mongodb_connection_string

DB_NAME=docchecker_db

GEMINI_API_KEY=your_gemini_api_key
```

---

# 🛠️ Local Installation

Clone Repository

```bash
git clone https://github.com/vivektyagi05/DocChecker-AI.git
```

Move into project

```bash
cd DocChecker-AI
```

Create virtual environment

```bash
python -m venv venv
```

Activate environment

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Start server

```bash
python app.py
```

Application:

```text
http://localhost:5000
```

---

# 🌍 Deployment

## Backend Hosting

* Render
* Railway
* VPS
* Docker

## Database

* MongoDB Atlas

## AI Layer

* Gemini API

---

# 📈 Future Roadmap

### Phase 1

* Multi-format document support
* Enhanced OCR engine
* Smart clause highlighting

### Phase 2

* AI contract comparison
* Red flag dashboard
* Contract scoring engine

### Phase 3

* Team collaboration
* Shared workspaces
* Version history

### Phase 4

* Enterprise compliance reports
* Audit exports
* Legal workflow automation

---

# 🔒 Security Practices

* API keys stored in environment variables
* Git secret protection
* JWT secured routes
* Password hashing
* MongoDB Atlas access control
* User-level document isolation

---

# 👨‍💻 Author

**Vivek Kumar**

B.Tech Computer Science
GLA University

GitHub:
https://github.com/vivektyagi05

---

# 📜 License

This project is licensed under the MIT License.

---

# ⭐ Support

If you found this project useful:

* Star the repository
* Fork the project
* Share feedback
* Contribute improvements

Building AI-powered document intelligence for smarter decision making.
