# SmartDispatch Backend API Documentation

Base URL: `http://localhost:8001/api/v1` (Port may vary based on configuration)

## Common Headers
- **Content-Type**: `application/json` (Required for all requests with a body)
- **Authorization**: `Bearer <access_token>` (Required for endpoints where Auth is Yes)
  - *Alternative*: `Cookie: accessToken=<token>`

## Authentication (`/auth`)
| Method | Endpoint | Description | Request Body | Auth | Headers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/signup` | Register a new user | `name`, `email`, `password`, `phone_number` (opt), `role`, `profile_picture_url` (opt) | No | `Content-Type: application/json` |
| `POST` | `/login` | Login user | `email`, `password` | No | `Content-Type: application/json` |
| `POST` | `/refresh-token` | Refresh access token | `refreshToken` (in body or cookie) | No | `Content-Type: application/json` (if body) |
| `POST` | `/logout` | Logout user | `refreshToken` (in body or cookie) | Yes | `Authorization` |
| `GET` | `/me` | Get current user profile | None | Yes | `Authorization` |

## Users (`/users`)
| Method | Endpoint | Description | Request Body | Auth | Headers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PATCH` | `/me` | Update profile | `name` (opt), `phone_number` (opt), `profile_picture_url` (opt) | Yes | `Authorization`, `Content-Type: application/json` |

## Orders (Customer) (`/orders`)
| Method | Endpoint | Description | Request Body | Auth | Headers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Create delivery request | `pickupLocation` {`addressText`, `latitude`, `longitude`}, `destinationLocation` {`addressText`, `latitude`, `longitude`}, `packageDetails` {`weightKg`, `volumeCm3`, `type`}, `requestedVehicleType`, `specialInstructions` (opt) | Yes | `Authorization`, `Content-Type: application/json` |
| `GET` | `/customer` | Get my orders | Query: `status` (opt, comma-separated) | Yes | `Authorization` |
| `GET` | `/:orderId` | Get order details | None | Yes | `Authorization` |
| `POST` | `/:orderId/pay` | Confirm payment | `paymentMethod`, `paymentToken` | Yes | `Authorization`, `Content-Type: application/json` |
| `POST` | `/:orderId/rate` | Rate driver | `rating` (1-5), `comment` (opt) | Yes | `Authorization`, `Content-Type: application/json` |
| `PUT` | `/:orderId/cancel` | Cancel order | None | Yes | `Authorization` |

## Drivers (`/drivers`)
| Method | Endpoint | Description | Request Body | Auth | Headers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/me/profile` | Create driver profile | `driver_license_number` | Yes (Driver) | `Authorization`, `Content-Type: application/json` |
| `PUT` | `/me/status` | Update availability | `isAvailable` (boolean) | Yes (Driver) | `Authorization`, `Content-Type: application/json` |

## Driver Orders (`/orders`)
| Method | Endpoint | Description | Request Body | Auth | Headers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/driver` | Get my assigned/available orders | None | Yes (Driver) | `Authorization` |
| `PUT` | `/:orderId/accept` | Accept an order | None | Yes (Driver) | `Authorization` |
| `PUT` | `/:orderId/status` | Update order status | `status` ('picked_up', 'delivered') | Yes (Driver) | `Authorization`, `Content-Type: application/json` |
| `GET` | `/unassigned` | Get unassigned booked orders | None | Yes | `Authorization` |

## Admin (`/admin`)
| Method | Endpoint | Description | Request Body | Auth | Headers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/orders` | Get all orders | Query: `status`, `payment_status` | Yes (Admin) | `Authorization` |
| `PUT` | `/orders/:orderId/assign` | Assign driver | `driverId` | Yes (Admin) | `Authorization`, `Content-Type: application/json` |
| `GET` | `/users` | Get all users | Query: `page`, `limit`, `role` | Yes (Admin) | `Authorization` |

## AI Services (Proxy) (`/ai`)
| Method | Endpoint | Description | Query Parameters | Auth | Headers |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | AI Engine health check | None | No | None |
| `GET` | `/route` | Get route details | `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng` | No | None |
| `GET` | `/distance` | Get distance | `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng` | No | None |
| `GET` | `/eta` | Get ETA | `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng` | No | None |
| `GET` | `/route/traffic-aware` | Get traffic-aware route | `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng` | No | None |
| `GET` | `/predict/duration` | Predict duration | `distance_km`, `hour`, `day_of_week` | No | None |
| `GET` | `/predict/price` | Predict price | `distance_km`, `weight_kg`, `volume_l`, `urgency` | No | None |
| `GET` | `/forecast/demand` | Forecast demand | `hour`, `day_of_week` | No | None |
| `GET` | `/hotspots` | Get demand hotspots | `top_n` (opt) | No | None |
