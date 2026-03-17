Certainly! Below is a comprehensive **Frontend Developer Documentation** for your Lost & Found application. This document provides all the necessary details for a frontend developer to integrate with the backend APIs, including endpoints, request/response formats, and authentication mechanisms.

---

# **Frontend Developer Documentation**

This document outlines the backend API structure, endpoints, and how to interact with them from the frontend. It also includes details about authentication, error handling, and best practices for integrating the frontend with the backend.

---

## **1. Base URL**
- **Development**: `http://localhost:5000/api/v1` (or the appropriate base URL where your server is running)
- **Production**: Replace with your production API URL (e.g., `https://your-production-domain.com/api/v1`).

---

## **2. Authentication**

### **a. Register a User**
- **Endpoint**: `POST /auth/register`
- **Description**: Registers a new user.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "_id": "652f8e2b3d4c9d1a4c8b4567",
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }
  ```

---

### **b. Login a User**
- **Endpoint**: `POST /auth/login`
- **Description**: Logs in a user and returns a JWT token.
- **Request Body**:
  ```json
  {
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Login successful",
    "token": "your-jwt-token"
  }
  ```

- **Note**: Store the JWT token securely (e.g., in localStorage or cookies) and include it in the `Authorization` header for authenticated requests:
  ```
  Authorization: Bearer <token>
  ```

---

## **3. Items API**

### **a. Create an Item**
- **Endpoint**: `POST /items`
- **Description**: Creates a new lost/found item.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token from login)
- **Request Body**:
  ```json
  {
    "title": "Lost Wallet",
    "description": "Black leather wallet lost near the library.",
    "category": "Accessories",
    "tags": ["black", "leather"],
    "status": "Unclaimed",
    "location": "Library"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Item created successfully",
    "item": {
      "_id": "652f8e2b3d4c9d1a4c8b4568",
      "title": "Lost Wallet",
      "description": "Black leather wallet lost near the library.",
      "category": "Accessories",
      "tags": ["black", "leather"],
      "status": "Unclaimed",
      "location": "Library",
      "postedBy": "652f8e2b3d4c9d1a4c8b4567"
    }
  }
  ```

---

### **b. Get All Items**
- **Endpoint**: `GET /items`
- **Description**: Fetches all items with optional filters (pagination, sorting, search).
- **Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`)
  - `sortBy`: Field to sort by (default: `createdAt`)
  - `order`: Sort order (`asc` or `desc`, default: `desc`)
  - `search`: Search term (optional)
- **Example Request**:
  ```
  GET /items?page=1&limit=5&sortBy=title&order=asc&search=wallet
  ```
- **Response**:
  ```json
  {
    "message": "Items fetched successfully",
    "items": [
      {
        "_id": "652f8e2b3d4c9d1a4c8b4568",
        "title": "Lost Wallet",
        "description": "Black leather wallet lost near the library.",
        "category": "Accessories",
        "tags": ["black", "leather"],
        "status": "Unclaimed",
        "location": "Library",
        "postedBy": {
          "_id": "652f8e2b3d4c9d1a4c8b4567",
          "name": "John Doe",
          "email": "john.doe@example.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalResults": 10
    }
  }
  ```

---

### **c. Get Details of a Specific Item**
- **Endpoint**: `GET /items/:id`
- **Description**: Fetches details of a specific item by its ID.
- **Path Parameter**:
  - Replace `:id` with the `_id` of the item.
- **Response**:
  ```json
  {
    "item": {
      "_id": "652f8e2b3d4c9d1a4c8b4568",
      "title": "Lost Wallet",
      "description": "Black leather wallet lost near the library.",
      "category": "Accessories",
      "tags": ["black", "leather"],
      "status": "Unclaimed",
      "location": "Library",
      "postedBy": {
        "_id": "652f8e2b3d4c9d1a4c8b4567",
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    }
  }
  ```

---

### **d. Update an Item**
- **Endpoint**: `PUT /items/:id`
- **Description**: Updates an existing item.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token from login)
- **Path Parameter**:
  - Replace `:id` with the `_id` of the item.
- **Request Body**:
  ```json
  {
    "title": "Updated Wallet Title",
    "description": "Updated description."
  }
  ```
- **Response**:
  ```json
  {
    "message": "Item updated successfully",
    "item": {
      "_id": "652f8e2b3d4c9d1a4c8b4568",
      "title": "Updated Wallet Title",
      "description": "Updated description."
    }
  }
  ```

---

### **e. Delete an Item**
- **Endpoint**: `DELETE /items/:id`
- **Description**: Deletes an item by its ID.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token from login)
- **Path Parameter**:
  - Replace `:id` with the `_id` of the item.
- **Response**:
  ```json
  {
    "message": "Item deleted successfully"
  }
  ```

---

### **f. Claim an Item**
- **Endpoint**: `POST /items/:id/claim`
- **Description**: Marks an item as claimed.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token from login)
- **Path Parameter**:
  - Replace `:id` with the `_id` of the item.
- **Response**:
  ```json
  {
    "message": "Item claimed successfully",
    "item": {
      "_id": "652f8e2b3d4c9d1a4c8b4568",
      "title": "Lost Wallet",
      "status": "Claimed"
    }
  }
  ```

---

### **g. Mark an Item as Returned**
- **Endpoint**: `POST /items/:id/return`
- **Description**: Marks an item as returned.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token from login)
- **Path Parameter**:
  - Replace `:id` with the `_id` of the item.
- **Response**:
  ```json
  {
    "message": "Item marked as returned successfully",
    "item": {
      "_id": "652f8e2b3d4c9d1a4c8b4568",
      "title": "Lost Wallet",
      "status": "Returned"
    }
  }
  ```

---

### **h. Assign a Keeper to an Item**
- **Endpoint**: `POST /items/:id/assign-keeper`
- **Description**: Assigns a keeper to an item.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token from login)
- **Path Parameter**:
  - Replace `:id` with the `_id` of the item.
- **Request Body**:
  ```json
  {
    "keeperId": "652f8e2b3d4c9d1a4c8b4567"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Item assigned to keeper successfully",
    "item": {
      "_id": "652f8e2b3d4c9d1a4c8b4568",
      "title": "Lost Wallet",
      "keeper": "652f8e2b3d4c9d1a4c8b4567"
    }
  }
  ```

---

## **4. Messages API**

### **a. Get Messages in a Conversation**
- **Endpoint**: `GET /conversations/:id/messages`
- **Description**: Fetches all messages in a specific conversation.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token from login)
- **Path Parameter**:
  - Replace `:id` with the `_id` of the conversation.
- **Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Messages per page (default: `10`)
- **Response**:
  ```json
  {
    "messages": [
      {
        "_id": "652f8e2b3d4c9d1a4c8b4569",
        "conversation": "652f8e2b3d4c9d1a4c8b4568",
        "sender": {
          "_id": "652f8e2b3d4c9d1a4c8b4567",
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "text": "Hello, how are you?",
        "createdAt": "2023-10-15T12:34:56.789Z"
      }
    ]
  }
  ```

---

### **b. Send a Message**
- **Endpoint**: `POST /conversations/:id/send-message`
- **Description**: Sends a message in a specific conversation.
- **Headers**:
  - `Authorization: Bearer <token>` (JWT token from login)
- **Path Parameter**:
  - Replace `:id` with the `_id` of the conversation.
- **Request Body**:
  ```json
  {
    "text": "Hello, how are you?"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Message sent successfully",
    "message": {
      "_id": "652f8e2b3d4c9d1a4c8b4569",
      "conversation": "652f8e2b3d4c9d1a4c8b4568",
      "sender": {
        "_id": "652f8e2b3d4c9d1a4c8b4567",
        "name": "John Doe",
        "email": "john.doe@example.com"
      },
      "text": "Hello, how are you?",
      "createdAt": "2023-10-15T12:34:56.789Z"
    }
  }
  ```

  ---

## **5. Search API**

### **a. Search for Items**
- **Endpoint**: `GET /search/items/search`
- **Description**: Searches for items based on title, description, tags, category, or location.
- **Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`)
  - `sortBy`: Field to sort by (default: `createdAt`)
  - `order`: Sort order (`asc` or `desc`, default: `desc`)
  - `search`: Search term (optional, case-insensitive)
- **Example Request**:
  ```
  GET /search/items/search?page=1&limit=5&sortBy=title&order=asc&search=wallet
  ```
- **Response**:
  ```json
  {
    "message": "Items fetched successfully",
    "items": [
      {
        "_id": "652f8e2b3d4c9d1a4c8b4568",
        "title": "Lost Wallet",
        "description": "Black leather wallet lost near the library.",
        "category": "Accessories",
        "tags": ["black", "leather"],
        "status": "Unclaimed",
        "location": "Library",
        "postedBy": {
          "_id": "652f8e2b3d4c9d1a4c8b4567",
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "createdAt": "2023-10-15T12:34:56.789Z",
        "updatedAt": "2023-10-15T12:34:56.789Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalResults": 10
    }
  }
  ```

---

## **6. Keepers API**

### **a. Get Available Keepers**
- **Endpoint**: `GET /keepers`
- **Description**: Fetches a list of available keepers.
- **Response**:
  ```json
  {
    "keepers": [
      {
        "_id": "652f8e2b3d4c9d1a4c8b4567",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "createdAt": "2023-10-15T12:34:56.789Z"
      }
    ]
  }
  ```

---

## **7. Error Handling**

### **a. Standard Error Response**
All API endpoints return error responses in the following format:
```json
{
  "error": "Error message describing the issue",
  "details": {
    // Additional details about the error (if applicable)
  }
}
```

### **b. Common HTTP Status Codes**
- `200 OK`: Successful request.
- `201 Created`: Resource created successfully.
- `400 Bad Request`: Invalid input or missing fields.
- `401 Unauthorized`: Missing or invalid JWT token.
- `403 Forbidden`: User does not have permission to perform the action.
- `404 Not Found`: Resource not found.
- `500 Internal Server Error`: Unexpected server error.

---

## **8. Best Practices for Frontend Integration**

### **a. Authentication**
- Always include the JWT token in the `Authorization` header for authenticated requests:
  ```
  Authorization: Bearer <token>
  ```
- Store the token securely (e.g., in localStorage or cookies) and handle token expiration gracefully.

### **b. Pagination**
- Use the `pagination` object in the response to implement pagination in your frontend.
- Example:
  ```javascript
  const { currentPage, totalPages } = response.pagination;
  ```

### **c. File Uploads**
- For endpoints that require file uploads (e.g., creating an item with an image), use `multipart/form-data` for the request body.
- Example using `FormData` in JavaScript:
  ```javascript
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('title', 'Lost Wallet');
  formData.append('description', 'Black leather wallet lost near the library.');
  fetch('/api/v1/items', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  ```

### **d. Real-Time Updates**
- If your application supports real-time updates (e.g., notifications or messages), consider integrating **Socket.IO** or **WebSockets**.
- Example:
  ```javascript
  const socket = io('http://localhost:5000');
  socket.on('newNotification', (notification) => {
    console.log('New notification:', notification);
  });
  ```

---

## **9. Testing APIs Locally**
To test the APIs locally:
1. Use tools like **Postman** or **Insomnia** to manually test endpoints.
2. Automate API testing using libraries like **Jest** or **Cypress**.
3. Simulate user interactions and ensure all endpoints work as expected.

---

## **10. Deployment Considerations**
- Replace the development base URL (`http://localhost:5000`) with the production base URL in your frontend code.
- Ensure CORS is properly configured on the backend to allow requests from your frontend domain.
- Use environment variables to manage API URLs and other sensitive data.

---

## **Conclusion**
This documentation provides a comprehensive guide for frontend developers to integrate with the Lost & Found application's backend APIs. It includes details about authentication, endpoints, request/response formats, and best practices for implementation. If you have any questions or need further clarification, feel free to ask! 🚀