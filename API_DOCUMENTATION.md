# DocChecker AI API Documentation

Base URL

```text
http://localhost:5000/api
```

---

# Authentication APIs

## Register User

Endpoint

```http
POST /auth/register
```

Request

```json
{
  "name": "Vivek",
  "email": "vivek@gmail.com",
  "password": "password123"
}
```

Response

```json
{
  "message": "User registered successfully"
}
```

---

## Login User

Endpoint

```http
POST /auth/login
```

Request

```json
{
  "email": "vivek@gmail.com",
  "password": "password123"
}
```

Response

```json
{
  "token": "jwt_token"
}
```

---

# Document APIs

## Upload Document

Endpoint

```http
POST /documents/upload
```

Content Type

```text
multipart/form-data
```

Fields

```text
file
```

Response

```json
{
  "message": "Document processed successfully",
  "document_id": "..."
}
```

---

## Get User Documents

Endpoint

```http
GET /documents
```

Headers

```text
Authorization: Bearer TOKEN
```

Response

```json
{
  "documents": []
}
```

---

## Get Single Document

Endpoint

```http
GET /documents/{id}
```

Response

```json
{
  "document": {}
}
```

---

## Delete Document

Endpoint

```http
DELETE /documents/{id}
```

Response

```json
{
  "message": "Document deleted"
}
```

---

# Chat APIs

## Ask Questions About Document

Endpoint

```http
POST /chat
```

Request

```json
{
  "document_id": "...",
  "message": "What are the risks?"
}
```

Response

```json
{
  "response": "AI generated answer"
}
```

---

# Error Responses

```json
{
  "error": "Unauthorized"
}
```

```json
{
  "error": "Document not found"
}
```

```json
{
  "error": "AI analysis failed"
}
```

---

# HTTP Status Codes

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error
```
