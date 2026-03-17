### **API Documentation for Lost and Found Platform**

This document provides a comprehensive guide to all API endpoints in the Lost and Found Platform for College. It includes details on how to use each endpoint, the required request formats, and the expected responses. Use this guide to test the API using tools like Postman and to integrate with the frontend.

---

### **Base URL**

- `http://localhost:5000/api/v1` (or your deployed server's base URL)

---

### **Authentication**

- Most endpoints require authentication via a JSON Web Token (JWT).
- To authenticate, include the JWT token in the `Authorization` header as `Bearer <token>`.
- Obtain the token by logging in via the `/auth/login` endpoint.

---

## **Authentication APIs**

### **1. Register a User**

- **Endpoint**: `POST /auth/register`
- **Description**: Registers a new user account.
- **Request Body**:
  ```json
  {
  	"name": "string",
  	"email": "string",
  	"password": "string"
  }
  ```
- **Response (Success)**:
  ```json
  {
  	"message": "User registered successfully",
  	"user": {
  		"_id": "string",
  		"name": "string",
  		"email": "string"
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "User already exists",
  	"code": "USER_EXISTS"
  }
  ```

---

### **2. Login a User**

- **Endpoint**: `POST /auth/login`
- **Description**: Authenticates a user and returns a JWT token.
- **Request Body**:
  ```json
  {
  	"email": "string",
  	"password": "string"
  }
  ```
- **Response (Success)**:
  ```json
  {
  	"message": "Login successful",
  	"token": "string",
  	"user": {
  		"_id": "string",
  		"name": "string",
  		"email": "string",
  		"role": "string"
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "Invalid credentials or user inactive",
  	"code": "INVALID_CREDENTIALS"
  }
  ```

---

## **Item APIs**

### **1. Create an Item**

- **Endpoint**: `POST /items`
- **Description**: Creates a new lost or found item.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Request Body** (multipart/form-data for file uploads):
  - `title`: string
  - `description`: string
  - `category`: string (category ID)
  - `tags`: array of strings (optional)
  - `status`: string (e.g., "Lost", "Found")
  - `location`: string
  - `image`: file (optional)
- **Response (Success)**:
  ```json
  {
  	"message": "Item created successfully",
  	"item": {
  		"_id": "string",
  		"title": "string",
  		"description": "string",
  		"category": "string",
  		"tags": ["string"],
  		"status": "string",
  		"location": "string",
  		"image": "string",
  		"postedBy": "string",
  		"isActive": true
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [...]
  }
  ```

---

### **2. Get All Items**

- **Endpoint**: `GET /items`
- **Description**: Retrieves a list of items with optional filtering, sorting, and pagination.
- **Query Parameters**:
  - `page`: integer (default: 1)
  - `limit`: integer (default: 10)
  - `sortBy`: string (e.g., "createdAt", "title")
  - `order`: string ("asc" or "desc")
  - `search`: string (searches title, description, tags)
- **Response (Success)**:
  ```json
  {
  	"message": "Items fetched successfully",
  	"items": [
  		{
  			"_id": "string",
  			"title": "string",
  			"description": "string",
  			"category": {
  				"_id": "string",
  				"name": "string"
  			},
  			"tags": ["string"],
  			"status": "string",
  			"location": "string",
  			"image": "string",
  			"postedBy": {
  				"_id": "string",
  				"name": "string",
  				"email": "string"
  			},
  			"isActive": true
  		}
  	],
  	"pagination": {
  		"currentPage": 1,
  		"totalPages": 2,
  		"totalResults": 15
  	}
  }
  ```

---

### **3. Get a Specific Item**

- **Endpoint**: `GET /items/:id`
- **Description**: Retrieves details of a specific item by ID.
- **Path Parameter**:
  - `id`: string (item ID)
- **Response (Success)**:
  ```json
  {
  	"item": {
  		"_id": "string",
  		"title": "string",
  		"description": "string",
  		"category": {
  			"_id": "string",
  			"name": "string"
  		},
  		"tags": ["string"],
  		"status": "string",
  		"location": "string",
  		"image": "string",
  		"postedBy": {
  			"_id": "string",
  			"name": "string",
  			"email": "string"
  		},
  		"isActive": true
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "Item not found",
  	"code": "NOT_FOUND"
  }
  ```

---

### **4. Update an Item**

- **Endpoint**: `PUT /items/:id`
- **Description**: Updates an existing item's details.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (item ID)
- **Request Body**:
  - Any fields to update (e.g., `title`, `description`, etc.)
- **Response (Success)**:
  ```json
  {
  	"message": "Item updated successfully",
  	"item": {
  		"_id": "string",
  		"title": "string"
  		// updated fields
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "You are not authorized to update this item",
  	"code": "FORBIDDEN"
  }
  ```

---

### **5. Delete an Item**

- **Endpoint**: `DELETE /items/:id`
- **Description**: Deletes an item by ID (soft delete).
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (item ID)
- **Response (Success)**:
  ```json
  {
  	"message": "Item deleted successfully"
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "Item not found",
  	"code": "NOT_FOUND"
  }
  ```

---

### **6. Claim an Item**

- **Endpoint**: `POST /items/:id/claim`
- **Description**: Marks an item as claimed by the authenticated user.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (item ID)
- **Response (Success)**:
  ```json
  {
  	"message": "Item claimed successfully",
  	"item": {
  		"_id": "string",
  		"status": "Claimed",
  		"claimedBy": "string",
  		"isClaimed": true
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "This item has already been claimed",
  	"code": "ALREADY_CLAIMED"
  }
  ```

---

### **7. Mark an Item as Returned**

- **Endpoint**: `POST /items/:id/return`
- **Description**: Marks an item as returned.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (item ID)
- **Response (Success)**:
  ```json
  {
  	"message": "Item marked as returned successfully",
  	"item": {
  		"_id": "string",
  		"status": "Returned"
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "This item has already been marked as returned",
  	"code": "ALREADY_RETURNED"
  }
  ```

---

### **8. Assign a Keeper to an Item**

- **Endpoint**: `POST /items/:id/assign-keeper`
- **Description**: Assigns a keeper to an item.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (item ID)
- **Request Body**:
  ```json
  {
  	"keeperId": "string"
  }
  ```
- **Response (Success)**:
  ```json
  {
  	"message": "Item assigned to keeper successfully",
  	"item": {
  		"_id": "string",
  		"keeper": "string"
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "This item already has a keeper assigned",
  	"code": "KEEPER_ALREADY_ASSIGNED"
  }
  ```

---

### **9. Generate QR Code for an Item**

- **Endpoint**: `POST /items/:id/generate-qr`
- **Description**: Generates a QR code for an item.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (item ID)
- **Response (Success)**:
  ```json
  {
  	"message": "QR code generated successfully",
  	"qrCode": "string" // base64 encoded image
  }
  ```

---

### **10. Scan QR Code for an Item**

- **Endpoint**: `POST /items/:id/scan-qr`
- **Description**: Verifies an item's QR code.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (item ID)
- **Request Body**:
  ```json
  {
  	"qrData": "string"
  }
  ```
- **Response (Success)**:
  ```json
  {
  	"message": "QR code verified successfully",
  	"item": {
  		"_id": "string",
  		"status": "string"
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "QR code data is invalid or outdated",
  	"code": "INVALID_QR_DATA"
  }
  ```

---

### **11. Generate OTP for Claiming an Item**

- **Endpoint**: `POST /items/:id/generate-otp`
- **Description**: Generates an OTP for claiming an item.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (item ID)
- **Response (Success)**:
  ```json
  {
  	"message": "OTP generated successfully",
  	"otp": "string"
  }
  ```

---

### **12. Verify OTP for Claiming an Item**

- **Endpoint**: `POST /items/:id/verify-otp`
- **Description**: Verifies the OTP to claim an item.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (item ID)
- **Request Body**:
  ```json
  {
  	"otp": "string"
  }
  ```
- **Response (Success)**:
  ```json
  {
  	"message": "OTP verified successfully. Item claimed.",
  	"item": {
  		"_id": "string",
  		"status": "Claimed",
  		"claimedBy": "string",
  		"isClaimed": true
  	}
  }
  ```
- **Response (Error)**:
  ```json
  {
  	"message": "Invalid or expired OTP",
  	"code": "INVALID_OTP"
  }
  ```

---

## **Message APIs**

### **1. Get Messages in a Conversation**

- **Endpoint**: `GET /conversations/:id/messages`
- **Description**: Retrieves messages in a specific conversation.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (conversation ID)
- **Query Parameters**:
  - `page`: integer (default: 1)
  - `limit`: integer (default: 10)
- **Response (Success)**:
  ```json
  {
  	"messages": [
  		{
  			"_id": "string",
  			"conversation": "string",
  			"sender": {
  				"_id": "string",
  				"name": "string",
  				"email": "string"
  			},
  			"text": "string",
  			"createdAt": "string"
  		}
  	]
  }
  ```

---

### **2. Send a Message in a Conversation**

- **Endpoint**: `POST /messages/:id/messages`
- **Description**: Sends a new message in a conversation.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (conversation ID)
- **Request Body**:
  ```json
  {
  	"text": "string"
  }
  ```
- **Response (Success)**:
  ```json
  {
  	"message": "Message sent successfully",
  	"message": {
  		"_id": "string",
  		"conversation": "string",
  		"sndedBy": {
  			"_id": "string",
  			"name": "string",
  			"email": "string"
  		},
  		"text": "string",
  		"createdAt": "string"
  	}
  }
  ```

---

## **Search APIs**

### **1. Search for Items**

- **Endpoint**: `GET /search/items/search`
- **Description**: Searches for items based on various criteria.
- **Query Parameters**:
  - `page`: integer (default: 1)
  - `limit`: integer (default: 10)
  - `sortBy`: string (e.g., "createdAt", "title")
  - `order`: string ("asc" or "desc")
  - `search`: string (searches title, description, tags, category, location)
- **Response (Success)**:
  ```json
  {
  	"message": "Items fetched successfully",
  	"items": [
  		{
  			"_id": "string",
  			"title": "string",
  			"description": "string"
  			// other item fields
  		}
  	],
  	"pagination": {
  		"currentPage": 1,
  		"totalPages": 2,
  		"totalResults": 15
  	}
  }
  ```

---

## **Keeper APIs**

### **1. Get Available Keepers**

- **Endpoint**: `GET /keepers`
- **Description**: Retrieves a list of available keepers.
- **Response (Success)**:
  ```json
  {
  	"keepers": [
  		{
  			"_id": "string",
  			"name": "string",
  			"email": "string",
  			"createdAt": "string"
  		}
  	]
  }
  ```

---

## **Testing Tips for Postman**

1. **Set Up Environment Variables**:

   - Create an environment in Postman and store your JWT token as `{{token}}`.
   - Use this variable in the `Authorization` header for authenticated requests: `Bearer {{token}}`.

2. **Authentication**:

   - Use `/auth/login` to get a token and set it in your environment.
   - Ensure the token is updated if it expires.

3. **File Uploads**:

   - For endpoints like `/items` (create item with image), use `form-data` in Postman.
   - Add a key named `image` and select the file to upload.

4. **Query Parameters**:

   - Test pagination, sorting, and searching by adjusting query parameters (e.g., `?page=2&limit=5&sortBy=title&order=asc&search=wallet`).

5. **Error Handling**:
   - Test invalid inputs, missing fields, and unauthorized access to verify error responses.

---

### **Conclusion**

This documentation covers all endpoints in the Lost and Found Platform, providing a clear guide for testing and integration. Use Postman to verify each API's functionality, and refer to this document for request/response details. If you need further assistance or clarification, feel free to ask!


## **User APIs**

### **1. Get Current User's Profile**

- **Endpoint**: `GET /users/me`
- **Description**: Retrieves the authenticated user's profile.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response (Success)**:
  ```json
  {
  "message": "Profile fetched successfully",
  "user": {
  "_id": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "isActive": true
  }
  }
  ```
- **Response (Error)**:
  ```json
  {
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
  }
  ```

### **2. Update Current User's Profile**

- **Endpoint**: `PUT /users/me`
- **Description**: Updates the authenticated user's profile.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
  "name": "string", // optional
  "email": "string", // optional
  "password": "string" // optional
  }
  ```
- **Response (Success)**:
  ```json
  {
  "message": "Profile updated successfully",
  "user": {
  "_id": "string",
  "name": "string",
  "email": "string",
  "role": "string"
  }
  }
  ```
- **Response (Error)**:
  ```json
  {
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [...]
  }
  ```

### **3. Delete Current User's Account**

- **Endpoint**: `DELETE /users/me`
- **Description**: Deletes the authenticated user's account (soft delete).
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response (Success)**:
  ```json
  {
  "message": "Account deleted successfully"
  }
  ```
- **Response (Error)**:
  ```json
  {
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
  }
  ```

## **Conversation APIs**

### **1. Create a Conversation**

- **Endpoint**: `POST /conversations`
- **Description**: Creates a new conversation about an item.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
  "item": "string", // item ID
  "participants": ["string"] // array of user IDs, min 2
  }
  ```
- **Response (Success)**:
  ```json
  {
  "message": "Conversation created successfully",
  "conversation": {
  "_id": "string",
  "item": "string",
  "participants": ["string"],
  "lastMessage": "string"
  }
  }
  ```
- **Response (Error)**:
  ```json
  {
  "message": "Invalid item or participants",
  "code": "VALIDATION_ERROR"
  }
  ```

### **2. Get User Conversations**

- **Endpoint**: `GET /conversations/:userId`
- **Description**: Retrieves all conversations for a specific user.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `userId`: string (user ID)
- **Query Parameters**:
  - `page`: integer (default: 1)
  - `limit`: integer (default: 10)
- **Response (Success)**:
  ```json
  {
  "message": "Conversations fetched successfully",
  "conversations": [
  {
  "_id": "string",
  "item": {
  "_id": "string",
  "title": "string"
  },
  "participants": [
  {
  "_id": "string",
  "name": "string"
  }
  ],
  "lastMessage": {
  "_id": "string",
  "content": "string"
  }
  }
  ],
  "pagination": {
  "currentPage": 1,
  "totalPages": 2,
  "totalResults": 5
  }
  }
  ```

## **Notification APIs**

### **1. Get User Notifications**

- **Endpoint**: `GET /notifications`
- **Description**: Retrieves notifications for the authenticated user.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page`: integer (default: 1)
  - `limit`: integer (default: 10)
- **Response (Success)**:
  ```json
  {
  "message": "Notifications fetched successfully",
  "notifications": [
  {
  "_id": "string",
  "userId": "string",
  "itemId": "string",
  "type": "string",
  "message": "string",
  "isRead": false,
  "createdAt": "string"
  }
  ],
  "pagination": {
  "currentPage": 1,
  "totalPages": 2,
  "totalResults": 8
  }
  }
  ```

### **2. Mark Notification as Read**

- **Endpoint**: `PUT /notifications/:id/read`
- **Description**: Marks a notification as read.
- **Headers**:
  - `Authorization: Bearer <token>`
- **Path Parameter**:
  - `id`: string (notification ID)
- **Response (Success)**:
  ```json
  {
  "message": "Notification marked as read",
  "notification": {
  "_id": "string",
  "isRead": true
  }
  }
  ```
- **Response (Error)**:
  ```json
  {
  "message": "Notification not found",
  "code": "NOT_FOUND"
  }
  ```
