# SmartDispatch Backend API Documentation

Base URL: `http://localhost:8001/api/v1` (Port may vary based on configuration)

## Common Headers
- **Content-Type**: `application/json` (Required for all requests with a body)
- **Authorization**: `Bearer <access_token>` (Required for endpoints where Auth is Yes)

---

## Authentication (`/auth`)

### POST `/signup`
- **Description**: Register a new user.
- **Auth**: No
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phone_number": "+1234567890",
    "role": "customer", 
    "profile_picture_url": "https://example.com/avatar.jpg"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "id": "uuid-string",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "access_token": "jwt-token-string",
      "refresh_token": "jwt-token-string",
      "created_at": "2024-02-15T10:00:00Z"
    },
    "message": "User registered and logged in successfully",
    "success": true
  }
  ```

### POST `/login`
- **Description**: Login existing user.
- **Auth**: No
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "uuid-string",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "access_token": "jwt-token-string",
      "refresh_token": "jwt-token-string"
    },
    "message": "User logged in successfully",
    "success": true
  }
  ```

### POST `/refresh-token`
- **Description**: Refresh expired access token.
- **Auth**: No (Uses refresh token)
- **Request Body**:
  ```json
  {
    "refreshToken": "jwt-refresh-token-string"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "accessToken": "new-jwt-token-string"
    },
    "message": "Access token refreshed successfully",
    "success": true
  }
  ```

### POST `/logout`
- **Description**: Logout user and invalidate refresh token.
- **Auth**: Yes
- **Request Body**:
  ```json
  {
    "refreshToken": "jwt-refresh-token-string"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {},
    "message": "User logged out successfully",
    "success": true
  }
  ```

### GET `/me`
- **Description**: Get current user profile.
- **Auth**: Yes
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "uuid-string",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "phone_number": "+1234567890",
      "profile_picture_url": "https://example.com/avatar.jpg"
    },
    "message": "User profile fetched successfully",
    "success": true
  }
  ```

---

## Users (`/users`)

### PATCH `/me`
- **Description**: Update user profile.
- **Auth**: Yes
- **Request Body**:
  ```json
  {
    "name": "John Updated",
    "phone_number": "+9876543210"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "uuid-string",
      "name": "John Updated",
      "email": "john@example.com",
      "phone_number": "+9876543210",
      "updated_at": "2024-02-15T11:00:00Z"
    },
    "message": "Profile updated successfully.",
    "success": true
  }
  ```

---

## Orders (Customer) (`/orders`)

### POST `/`
- **Description**: Create a new delivery request.
- **Auth**: Yes
- **Request Body**:
  ```json
  {
    "pickupLocation": {
      "addressText": "123 Main St, Mumbai",
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "destinationLocation": {
      "addressText": "456 Park Ave, Mumbai",
      "latitude": 19.2183,
      "longitude": 72.9781
    },
    "packageDetails": {
      "weightKg": 5.5,
      "volumeCm3": 1000,
      "type": "box"
    },
    "requestedVehicleType": "bike",
    "specialInstructions": "Handle with care"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "orderId": "uuid-string",
      "estimatedAmount": 150.00,
      "status": "pending_payment"
    },
    "message": "Order created successfully",
    "success": true
  }
  ```

### POST `/:orderId/pay`
- **Description**: Confirm payment for an order.
- **Auth**: Yes
- **Request Body**:
  ```json
  {
    "paymentMethod": "card",
    "paymentToken": "tok_visa_valid"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "orderId": "uuid-string",
      "orderStatus": "booked"
    },
    "message": "Payment successful.",
    "success": true
  }
  ```

### GET `/customer`
- **Description**: Get authenticated customer's orders.
- **Auth**: Yes
- **Query Params**: `?status=booked,delivered` (optional)
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "uuid-string",
        "status": "delivered",
        "estimated_amount": 150.00,
        "pickup_location": { "address_line1": "..." },
        "destination_location": { "address_line1": "..." }
      }
    ],
    "message": "Orders retrieved successfully",
    "success": true
  }
  ```

### GET `/:orderId`
- **Description**: Get details of a specific order.
- **Auth**: Yes
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "uuid-string",
      "status": "booked",
      "estimated_amount": 150.00,
      "driver": { "user": { "name": "Driver Name" } }
    },
    "message": "Order details fetched successfully.",
    "success": true
  }
  ```

### POST `/:orderId/rate`
- **Description**: Rate a driver.
- **Auth**: Yes
- **Request Body**:
  ```json
  {
    "rating": 5,
    "comment": "Great service!"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "orderId": "uuid-string",
      "rating": 5,
      "comment": "Great service!"
    },
    "message": "Rating submitted successfully",
    "success": true
  }
  ```

### PUT `/:orderId/cancel`
- **Description**: Cancel an order.
- **Auth**: Yes
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "orderId": "uuid-string",
      "orderStatus": "cancelled"
    },
    "message": "Order cancelled successfully.",
    "success": true
  }
  ```

---

## Drivers (`/drivers`)

### POST `/me/profile`
- **Description**: Create a driver profile.
- **Auth**: Yes (Driver role)
- **Request Body**:
  ```json
  {
    "driver_license_number": "DL-1234567890"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "id": "uuid-string",
      "driver_license_number": "DL-1234567890",
      "is_available": false,
      "is_verified": false
    },
    "message": "Driver profile created successfully...",
    "success": true
  }
  ```

### PUT `/me/status`
- **Description**: Update availability.
- **Auth**: Yes (Driver role)
- **Request Body**:
  ```json
  {
    "isAvailable": true
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "isAvailable": true
    },
    "message": "Driver status updated successfully.",
    "success": true
  }
  ```

---

## Driver Orders (`/orders`)

### GET `/driver`
- **Description**: Get assigned and available orders for current driver.
- **Auth**: Yes (Driver role)
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "uuid-string",
        "status": "booked",
        "pickup_location": { "address_line1": "..." },
        "destination_location": { "address_line1": "..." }
      }
    ],
    "message": "Driver orders fetched successfully.",
    "success": true
  }
  ```

### PUT `/:orderId/accept`
- **Description**: Accept an available order.
- **Auth**: Yes (Driver role)
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "orderStatus": "assigned"
    },
    "message": "Order accepted successfully.",
    "success": true
  }
  ```

### PUT `/:orderId/status`
- **Description**: Update order status (picked_up, delivered).
- **Auth**: Yes (Driver role)
- **Request Body**:
  ```json
  {
    "status": "picked_up"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "orderStatus": "picked_up"
    },
    "message": "Order status updated successfully.",
    "success": true
  }
  ```
  
### GET `/unassigned`
- **Description**: Get unassigned orders (booked but no driver).
- **Auth**: Yes
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "uuid-string",
        "status": "booked",
        "pickup_location": { "address_line1": "..." }
      }
    ],
    "message": "Unassigned orders fetched successfully.",
    "success": true
  }
  ```

---

## Admin (`/admin`)

### GET `/orders`
- **Description**: Get all orders with filtering.
- **Auth**: Yes (Admin role)
- **Query Params**: `?status=booked` or `?payment_status=paid`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": [
      {
        "id": "uuid-string",
        "status": "booked",
        "customer": { "name": "..." },
        "driver": null
      }
    ],
    "message": "All orders retrieved successfully",
    "success": true
  }
  ```

### PUT `/orders/:orderId/assign`
- **Description**: Manually assign a driver to an order.
- **Auth**: Yes (Admin role)
- **Request Body**:
  ```json
  {
    "driverId": "uuid-driver-id"
  }
  ```
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "id": "uuid-string",
      "status": "assigned",
      "driver_id": "uuid-driver-id"
    },
    "message": "Driver assigned to order successfully",
    "success": true
  }
  ```

### GET `/users`
- **Description**: Get all users with pagination.
- **Auth**: Yes (Admin role)
- **Query Params**: `?page=1&limit=10&role=driver`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "users": [
        { "id": "...", "name": "...", "role": "driver" }
      ],
      "pagination": {
        "totalUsers": 50,
        "totalPages": 5,
        "currentPage": 1,
        "limit": 10
      }
    },
    "message": "Users retrieved successfully",
    "success": true
  }
  ```

---

## AI Services (Proxy) (`/ai`)

### GET `/health`
- **Description**: Check AI engine health.
- **Auth**: No
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": { "status": "ok" },
    "message": "Health check successful",
    "success": true
  }
  ```

### GET `/route`
- **Description**: Get route between two points.
- **Query Params**: `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "distance_m": 7367,
      "distance_km": 7.37,
      "duration_s": 497.7,
      "duration_min": 8.29
    },
    "message": "Route fetched successfully",
    "success": true
  }
  ```

### GET `/distance`
- **Description**: Get direct distance.
- **Query Params**: `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "distance_km": 7.37,
      "duration_min": 8.29
    },
    "message": "Distance fetched successfully",
    "success": true
  }
  ```

### GET `/eta`
- **Description**: Get ETA.
- **Query Params**: `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "distance_km": 7.37,
      "duration_min": 8.12,
      "departure_at": "2026-02-14T11:55:44.056631+00:00",
      "eta_at": "2026-02-14T12:03:51.256631+00:00"
    },
    "message": "ETA fetched successfully",
    "success": true
  }
  ```

### GET `/route/traffic-aware`
- **Description**: Get traffic-adjusted route.
- **Query Params**: `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "distance_km": 7.37,
      "duration_min_osrm": 8.29,
      "duration_min_traffic_adjusted": 8.12
    },
    "message": "Traffic aware route fetched successfully",
    "success": true
  }
  ```

### GET `/predict/duration`
- **Description**: Predict duration based on historical data.
- **Query Params**: `distance_km`, `hour`, `day_of_week`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "duration_min": 15.17
    },
    "message": "Duration prediction fetched successfully",
    "success": true
  }
  ```

### GET `/predict/price`
- **Description**: Predict delivery price.
- **Query Params**: `distance_km`, `weight_kg`, `volume_l`, `urgency`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "price_inr": 259.17
    },
    "message": "Price prediction fetched successfully",
    "success": true
  }
  ```

### GET `/forecast/demand`
- **Description**: Forecast demand for a specific time.
- **Query Params**: `hour`, `day_of_week`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "demand_forecast": 5.5
    },
    "message": "Demand forecast fetched successfully",
    "success": true
  }
  ```

### GET `/hotspots`
- **Description**: Get current demand hotspots.
- **Query Params**: `top_n`
- **Expected Output**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "hotspots": [
        { "lat": 19.1688, "lng": 72.8591, "rank": 1 },
        { "lat": 18.9989, "lng": 72.8176, "rank": 2 }
      ]
    },
    "message": "Hotspots fetched successfully",
    "success": true
  }
  ```
