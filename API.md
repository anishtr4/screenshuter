# Screenshot SaaS - API Reference

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All API endpoints require JWT authentication except for login/register endpoints.

### Headers
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Authentication Endpoints

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64a1b2c3d4e5f6789012345",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### Register
```http
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

## Projects API

### Get Projects
```http
GET /projects
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "64a1b2c3d4e5f6789012345",
        "name": "My Website",
        "description": "Homepage screenshots",
        "userId": "64a1b2c3d4e5f6789012344",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Create Project
```http
POST /projects
```

**Request Body:**
```json
{
  "name": "My Website",
  "description": "Homepage screenshots"
}
```

### Get Project
```http
GET /projects/:id
```

### Update Project
```http
PUT /projects/:id
```

**Request Body:**
```json
{
  "name": "Updated Website",
  "description": "Updated description"
}
```

### Delete Project
```http
DELETE /projects/:id
```

## Screenshots API

### Get Screenshots
```http
GET /screenshots/:projectId
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `collectionId` (optional): Filter by collection

**Response:**
```json
{
  "success": true,
  "data": {
    "screenshots": [
      {
        "id": "64a1b2c3d4e5f6789012346",
        "projectId": "64a1b2c3d4e5f6789012345",
        "url": "https://example.com",
        "imagePath": "/uploads/screenshot-123.png",
        "status": "completed",
        "collectionId": "64a1b2c3d4e5f6789012347",
        "timeFrame": 0,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Create Screenshot
```http
POST /screenshots
```

**Request Body:**
```json
{
  "projectId": "64a1b2c3d4e5f6789012345",
  "url": "https://example.com",
  "timeFrames": [0, 5, 10],
  "autoScroll": true,
  "collectionName": "Homepage Tests"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64a1b2c3d4e5f6789012346",
    "url": "https://example.com",
    "status": "processing",
    "collectionId": "64a1b2c3d4e5f6789012347"
  }
}
```

### Delete Screenshot
```http
DELETE /screenshots/:id
```

## Collections API

### Get Collections
```http
GET /collections/:projectId
```

### Delete Collection
```http
DELETE /collections/:id
```

## Users API (Admin Only)

### Get Users
```http
GET /users
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `role` (optional): Filter by role
- `active` (optional): Filter by active status

### Create User
```http
POST /users
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "user"
}
```

### Update User
```http
PUT /users/:id
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "admin",
  "active": true,
  "tokenCreationEnabled": true
}
```

### Delete User
```http
DELETE /users/:id
```

## API Keys (Tokens) API

### Get API Keys
```http
GET /tokens
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "64a1b2c3d4e5f6789012348",
      "name": "Production API Key",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "isActive": true
    }
  ]
}
```

### Create API Key
```http
POST /tokens
```

**Request Body:**
```json
{
  "name": "Production API Key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64a1b2c3d4e5f6789012348",
    "name": "Production API Key",
    "token": "sk_live_abc123def456...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Delete API Key
```http
DELETE /tokens/:id
```

## Configuration API

### Get Configuration
```http
GET /config
```

### Update Configuration
```http
PUT /config
```

**Request Body:**
```json
{
  "maxScreenshotsPerProject": 100,
  "allowedDomains": ["example.com", "test.com"],
  "screenshotTimeout": 30000
}
```

## WebSocket Events

The application uses Socket.IO for real-time updates.

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Screenshot Progress
```javascript
socket.on('screenshot-progress', (data) => {
  console.log(data);
  // {
  //   screenshotId: "64a1b2c3d4e5f6789012346",
  //   progress: 50,
  //   stage: "Capturing screenshot..."
  // }
});
```

#### Collection Progress
```javascript
socket.on('collection-progress', (data) => {
  console.log(data);
  // {
  //   collectionId: "64a1b2c3d4e5f6789012347",
  //   totalScreenshots: 3,
  //   completedScreenshots: 1,
  //   progress: 33,
  //   stage: "Captured 1/3 frames",
  //   isScrolling: false
  // }
});
```

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication**: 5 requests per minute
- **Screenshot Creation**: 10 requests per minute
- **General API**: 100 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## API Key Authentication

For external integrations, use API keys instead of JWT tokens:

```http
Authorization: Bearer sk_live_abc123def456...
```

API keys have the same permissions as the user who created them.

---

*Last Updated: January 2025*
