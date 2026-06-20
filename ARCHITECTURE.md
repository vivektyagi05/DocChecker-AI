# DocChecker AI Architecture

## High-Level Architecture

```text
User Browser
     │
     ▼
Frontend Layer
(HTML + CSS + JavaScript)
     │
     ▼
REST API Layer
(Flask)
     │
     ├─────────────── Authentication Module
     │
     ├─────────────── Document Processing Module
     │
     ├─────────────── AI Analysis Engine
     │
     ├─────────────── Chat Assistant Engine
     │
     └─────────────── Activity Logging System
     │
     ▼
MongoDB Atlas
     │
     ▼
Gemini AI Platform
```

---

## Component Breakdown

### Frontend Layer

Responsibilities:

* User Authentication
* Dashboard Management
* Document Upload Interface
* Audit Report Visualization
* Interactive Chat Console

Files:

```text
frontend/
├── index.html
├── auth.html
├── dashboard.html
├── document.html
└── js/
```

---

### Authentication Layer

Responsibilities:

* User Registration
* User Login
* JWT Token Generation
* Route Protection
* Session Validation

Files:

```text
backend/auth/
├── controllers.py
└── services.py
```

---

### Document Processing Layer

Responsibilities:

* File Validation
* File Storage
* PDF Parsing
* OCR Text Extraction
* Metadata Processing

Files:

```text
backend/documents/
├── controllers.py
├── services.py
└── utils.py
```

---

### AI Analysis Layer

Responsibilities:

* Contract Classification
* Executive Summary Generation
* Risk Assessment
* Liability Extraction
* Deadline Detection
* Action Recommendations

Files:

```text
backend/services/
└── gemini_service.py
```

---

### Database Layer

Technology:

* MongoDB Atlas
* PyMongo

Collections:

```text
users
documents
activity_logs
chat_messages
```

Indexes:

```text
users.email
documents.user_id
documents.created_at
chat_messages.document_id
```

---

## Request Flow

```text
Upload Document
      │
      ▼
Validate File
      │
      ▼
Store Document
      │
      ▼
Extract Text
      │
      ▼
Gemini AI Analysis
      │
      ▼
Save Audit Results
      │
      ▼
Return Dashboard Report
```

---

## Security Architecture

* JWT Authentication
* Password Hashing (bcrypt)
* Environment Variables
* MongoDB Access Controls
* User Document Isolation
* Secure File Upload Handling

---

## Deployment Architecture

```text
Frontend
      │
      ▼
Render Web Service
      │
      ▼
Flask Backend
      │
      ▼
MongoDB Atlas
      │
      ▼
Gemini AI API
```
