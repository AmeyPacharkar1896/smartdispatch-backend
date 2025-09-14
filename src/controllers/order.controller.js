import { supabase } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @description Creates a new delivery request after validating input and saving locations.
 * @route POST /api/orders
 * @access Private (Customer)
 */
const requestNewDelivery = asyncHandler(async (req, res) => {
  // Get authenticated customer ID from protect middleware
  const customerId = req.user.id;

  // Extract request body data
  const {
    pickupLocation,
    destinationLocation,
    packageDetails,
    requestedVehicleType,
    specialInstructions
  } = req.body;

  // --- Start: Comprehensive Input Validation ---
  if (!pickupLocation || !destinationLocation || !packageDetails || !requestedVehicleType) {
    throw new ApiError(400, 'Missing required fields: pickupLocation, destinationLocation, packageDetails, and requestedVehicleType are required');
  }
  if (!pickupLocation.addressText || !pickupLocation.latitude || !pickupLocation.longitude) {
    throw new ApiError(400, 'pickupLocation must include addressText, latitude, and longitude');
  }
  if (!destinationLocation.addressText || !destinationLocation.latitude || !destinationLocation.longitude) {
    throw new ApiError(400, 'destinationLocation must include addressText, latitude, and longitude');
  }
  if (!packageDetails.weightKg || !packageDetails.volumeCm3 || !packageDetails.type) {
    throw new ApiError(400, 'packageDetails must include weightKg, volumeCm3, and type');
  }
  const isValidLatitude = (lat) => lat >= -90 && lat <= 90;
  const isValidLongitude = (lng) => lng >= -180 && lng <= 180;
  if (!isValidLatitude(pickupLocation.latitude) || !isValidLongitude(pickupLocation.longitude)) {
    throw new ApiError(400, 'Invalid pickupLocation coordinates');
  }
  if (!isValidLatitude(destinationLocation.latitude) || !isValidLongitude(destinationLocation.longitude)) {
    throw new ApiError(400, 'Invalid destinationLocation coordinates');
  }
  if (typeof packageDetails.weightKg !== 'number' || packageDetails.weightKg <= 0) {
    throw new ApiError(400, 'packageDetails.weightKg must be a positive number');
  }
  if (typeof packageDetails.volumeCm3 !== 'number' || packageDetails.volumeCm3 <= 0) {
    throw new ApiError(400, 'packageDetails.volumeCm3 must be a positive number');
  }
  const allowedVehicleTypes = ['bike', 'car', 'van'];
  if (!allowedVehicleTypes.includes(requestedVehicleType)) {
    throw new ApiError(400, `requestedVehicleType must be one of: ${allowedVehicleTypes.join(', ')}`);
  }
  // --- End: Comprehensive Input Validation ---


  // --- Start: Database Operations Aligned with SQL Schema ---

  // 1. Insert Pickup Location into the 'locations' table
  const newPickupLocation = {
    id: uuidv4(),
    address_line1: pickupLocation.addressText,
    street_name: pickupLocation.addressText.split(',')[0].trim(), // Example parsing
    city: 'Mumbai', // Placeholder
    state: 'Maharashtra', // Placeholder
    country: 'India', // Placeholder
    latitude: pickupLocation.latitude,
    longitude: pickupLocation.longitude,
  };
  const { data: insertedPickupLocation, error: pickupError } = await supabase
    .from('locations')
    .insert(newPickupLocation)
    .select('id')
    .single();

  if (pickupError) {
    throw new ApiError(500, 'Failed to save pickup location.', pickupError.message);
  }
  const pickupLocationId = insertedPickupLocation.id;

  // 2. Insert Destination Location into the 'locations' table
  const newDestinationLocation = {
    id: uuidv4(),
    address_line1: destinationLocation.addressText,
    street_name: destinationLocation.addressText.split(',')[0].trim(), // Example parsing
    city: 'Pune', // Placeholder
    state: 'Maharashtra', // Placeholder
    country: 'India', // Placeholder
    latitude: destinationLocation.latitude,
    longitude: destinationLocation.longitude,
  };
  const { data: insertedDestinationLocation, error: destinationError } = await supabase
    .from('locations')
    .insert(newDestinationLocation)
    .select('id')
    .single();

  if (destinationError) {
    throw new ApiError(500, 'Failed to save destination location.', destinationError.message);
  }
  const destinationLocationId = insertedDestinationLocation.id;

  // 3. Placeholder for estimated price calculation
  // TODO: Replace with AI service integration
  const basePrice = parseFloat(process.env.BASE_DELIVERY_PRICE || '50.00');
  const weightMultiplier = 10; // Price per kg
  const estimatedAmount = basePrice + (packageDetails.weightKg * weightMultiplier);

  // 4. Construct and Insert Order into the 'orders' table
  const orderId = uuidv4();
  const orderData = {
    id: orderId,
    customer_id: customerId,
    pickup_location_id: pickupLocationId,
    destination_location_id: destinationLocationId,
    total_weight_kg: packageDetails.weightKg,
    total_volume_cm3: packageDetails.volumeCm3,
    requested_vehicle_type: requestedVehicleType,
    special_instructions: specialInstructions || null,
    estimated_amount: estimatedAmount,
    status: 'pending_payment', // As per API contract
    payment_status: 'pending'   // As per schema
  };

  const { error: orderInsertError } = await supabase
    .from('orders')
    .insert(orderData);

  if (orderInsertError) {
    console.error('Database insertion error:', orderInsertError);
    throw new ApiError(500, 'Failed to create order. Please try again.');
  }
  // --- End: Database Operations ---

  // Return success response as per API contract
  return res.status(201).json(
    new ApiResponse(201, {
      orderId, // This is the 'id' from the orders table
      estimatedAmount,
      status: 'pending_payment'
    }, 'Order created successfully')
  );
});

/**
 * @description Confirms payment for an order, creating a payment record and updating order status.
 * @route POST /api/orders/:orderId/pay
 * @access Private (Customer)
 */
const confirmOrderPayment = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { orderId } = req.params;
  const { paymentMethod, paymentToken } = req.body;

  if (!paymentMethod || !paymentToken) {
    throw new ApiError(400, 'Missing required fields: paymentMethod and paymentToken are required');
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    throw new ApiError(400, 'Invalid orderId format');
  }
  const allowedPaymentMethods = ['card', 'upi', 'cash'];
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    throw new ApiError(400, `paymentMethod must be one of: ${allowedPaymentMethods.join(', ')}`);
  }

  // Fetch order using `id` column from schema
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, customer_id, status, payment_status, estimated_amount')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    throw new ApiError(404, 'Order not found.');
  }

  if (order.customer_id !== customerId) {
    throw new ApiError(403, 'Access denied. You can only confirm payment for your own orders.');
  }

  if (order.status !== 'pending_payment' || order.payment_status !== 'pending') {
    throw new ApiError(400, 'Order is not in pending payment status.');
  }

  // --- Start: Payment Processing Aligned with SQL Schema ---

  // 1. Simulate payment gateway
  // TODO: Replace with actual payment gateway integration
  const paymentSuccessful = true; // Placeholder: always successful for now

  if (!paymentSuccessful) {
    throw new ApiError(400, 'Payment failed. Please try again.');
  }

  // 2. Insert a record into the 'payments' table
  const paymentData = {
    id: uuidv4(),
    order_id: order.id,
    amount: order.estimated_amount,
    status: 'successful',
    payment_method: paymentMethod,
    transaction_id: paymentToken, // Using paymentToken as a placeholder for transaction_id
    paid_at: new Date().toISOString()
  };
  const { error: paymentInsertError } = await supabase
    .from('payments')
    .insert(paymentData);

  if (paymentInsertError) {
    throw new ApiError(500, 'Failed to record payment. Please contact support.');
  }

  // 3. Update order status in the 'orders' table
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'booked',
      payment_status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    // Note: In a real-world scenario, you'd need a rollback/reconciliation strategy
    // if this update fails after the payment record was inserted.
    console.error('Database update error after payment:', updateError);
    throw new ApiError(500, 'Payment recorded but failed to update order status. Please contact support.');
  }
  // --- End: Payment Processing ---

  // Return success response as per API contract
  return res.status(200).json(
    new ApiResponse(200, {
      orderId: order.id,
      orderStatus: 'booked'
    }, 'Payment successful.')
  );
});

/**
 * @description Retrieves all orders for the authenticated customer.
 * @route GET /api/orders/customer
 * @access Private (Customer)
 */
const getCustomerOrders = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { status } = req.query;

  // Use `customer_id` from schema for query with optimized select and joins
  let query = supabase
    .from('orders')
    .select(`
      id, status, estimated_amount, final_amount, requested_at, delivered_at, created_at, 
      pickup_location:pickup_location_id(address_line1, latitude, longitude), 
      destination_location:destination_location_id(address_line1, latitude, longitude),
      driver:driver_id ( user:user_id (name, phone_number, profile_picture_url) )
    `)
    .eq('customer_id', customerId);

  if (status) {
    const statusList = status.split(',').map(s => s.trim()).filter(Boolean);
    if (statusList.length > 0) {
      query = query.in('status', statusList);
    }
  }

  query = query.order('created_at', { ascending: false });

  const { data: orders, error } = await query;

  if (error) {
    console.error('Database fetch error:', error);
    throw new ApiError(500, 'Failed to fetch orders. Please try again.');
  }

  return res.status(200).json(
    new ApiResponse(200, orders || [], 'Orders retrieved successfully')
  );
});


/**
 * @description Allows customers to rate a driver after order delivery.
 * @route POST /api/orders/:orderId/rate
 * @access Private (Customer)
 */
const customerRateDriver = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { orderId } = req.params;
  const { rating, review } = req.body;

  // Input validation
  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be a number between 1 and 5');
  }

  // Validate orderId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    throw new ApiError(400, 'Invalid orderId format');
  }

  // --- Start: Authorization & State Validation ---
  
  // 1. Fetch order with driver information
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      customer_id,
      status,
      driver_id,
      drivers (
        id,
        avg_rating,
        total_deliveries
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new ApiError(404, 'Order not found');
  }

  // 2. Authorization: Verify customer owns the order
  if (order.customer_id !== customerId) {
    throw new ApiError(403, 'Access denied. You can only rate your own orders.');
  }

  // 3. State Validation: Check order is delivered
  if (order.status !== 'delivered') {
    throw new ApiError(400, 'You can only rate orders that have been delivered.');
  }

  // 4. Check if driver is assigned
  if (!order.driver_id) {
    throw new ApiError(400, 'No driver assigned to this order.');
  }

  // 5. Prevent Duplicate Ratings: Check if order already rated
  const { data: existingRating, error: ratingCheckError } = await supabase
    .from('ratings')
    .select('id')
    .eq('order_id', orderId)
    .single();

  if (ratingCheckError && ratingCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
    throw new ApiError(500, 'Failed to check existing ratings');
  }

  if (existingRating) {
    throw new ApiError(400, 'This order has already been rated.');
  }

  // --- End: Authorization & State Validation ---

  // --- Start: Transactional Integrity (Atomic Operations) ---

  try {
    // 1. Insert new rating into ratings table
    const ratingData = {
      id: uuidv4(),
      order_id: orderId,
      driver_id: order.driver_id,
      customer_id: customerId,
      rating: rating,
      review: review || null,
      created_at: new Date().toISOString()
    };

    const { error: ratingInsertError } = await supabase
      .from('ratings')
      .insert(ratingData);

    if (ratingInsertError) {
      throw new ApiError(500, 'Failed to record rating');
    }

    // 2. Update driver's average rating and total deliveries
    const currentDriver = order.drivers;
    const currentAvgRating = currentDriver.avg_rating || 0;
    const currentTotalDeliveries = currentDriver.total_deliveries || 0;
    
    // Calculate new average rating
    const newTotalDeliveries = currentTotalDeliveries + 1;
    const newAvgRating = ((currentAvgRating * currentTotalDeliveries) + rating) / newTotalDeliveries;

    const { error: driverUpdateError } = await supabase
      .from('drivers')
      .update({
        avg_rating: Math.round(newAvgRating * 100) / 100, // Round to 2 decimal places
        total_deliveries: newTotalDeliveries,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.driver_id);

    if (driverUpdateError) {
      // Note: In a production environment, you might want to implement a rollback mechanism
      // or use database transactions to ensure atomicity
      console.error('Failed to update driver rating after rating insert:', driverUpdateError);
      throw new ApiError(500, 'Rating recorded but failed to update driver statistics. Please contact support.');
    }

    // --- End: Transactional Integrity ---

    // Return success response
    return res.status(201).json(
      new ApiResponse(201, {
        orderId,
        driverId: order.driver_id,
        rating,
        review: review || null,
        newDriverAvgRating: Math.round(newAvgRating * 100) / 100,
        newDriverTotalDeliveries: newTotalDeliveries
      }, 'Rating submitted successfully')
    );

  } catch (error) {
    // Re-throw ApiError instances, wrap others
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'An unexpected error occurred while processing the rating');
  }
});

/**
 * @description Allows customers to cancel their orders if in appropriate status.
 * @route PUT /api/orders/:orderId/cancel
 * @access Private (Customer)
 */
const cancelOrder = asyncHandler(async (req, res) => {
  // Get authenticated customer ID from protect middleware
  const customerId = req.user.id;
  
  // Extract orderId from URL parameters
  const { orderId } = req.params;

  // Validate orderId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    throw new ApiError(400, 'Invalid orderId format');
  }

  // Fetch order from database
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, customer_id, status')
    .eq('id', orderId)
    .single();

  // Handle fetch errors
  if (fetchError || !order) {
    throw new ApiError(404, 'Order not found');
  }

  // Authorization Check: Verify customer owns the order
  if (order.customer_id !== customerId) {
    throw new ApiError(403, 'Access denied. You can only cancel your own orders.');
  }

  // State-Based Cancellation Logic
  const allowedCancellationStatuses = ['pending_payment', 'booked'];
  
  if (!allowedCancellationStatuses.includes(order.status)) {
    throw new ApiError(400, 'Order cannot be cancelled as it is already in progress or completed.');
  }

  // Database Operation: Update order status to cancelled
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  // Handle update errors
  if (updateError) {
    console.error('Database update error:', updateError);
    throw new ApiError(500, 'Failed to cancel order. Please try again.');
  }

  // Return success response
  return res.status(200).json(
    new ApiResponse(200, {
      orderId,
      orderStatus: 'cancelled'
    }, 'Order cancelled successfully.')
  );
});

/**
 * @description Retrieves detailed information about a specific order.
 * @route GET /api/orders/:orderId
 * @access Private (Customer)
 */
const getOrderDetails = asyncHandler(async (req, res) => {
  // Get authenticated customer ID from protect middleware
  const customerId = req.user.id;
  
  // Extract orderId from URL parameters
  const { orderId } = req.params;

  // Validate orderId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    throw new ApiError(400, 'Invalid orderId format');
  }

  // Optimized database query with all related data in single call
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, customer_id, status, estimated_amount, final_amount, 
      requested_at, assigned_at, picked_up_at, delivered_at, cancelled_at, 
      total_weight_kg, total_volume_cm3, special_instructions,
      pickup_location:pickup_location_id (address_line1, city, state, latitude, longitude), 
      destination_location:destination_location_id (address_line1, city, state, latitude, longitude),
      driver:driver_id ( 
        avg_rating,
        user:user_id (name, phone_number, profile_picture_url),
        vehicle:vehicles(make, model, vehicle_type, license_plate)
      )
    `)
    .eq('id', orderId)
    .single();

  // Handle query errors or order not found
  if (error || !order) {
    throw new ApiError(404, 'Order not found');
  }

  // Authorization: Verify customer owns the order
  if (order.customer_id !== customerId) {
    throw new ApiError(403, 'Access denied.');
  }

  // Return success response with detailed order data
  return res.status(200).json(
    new ApiResponse(200, order, 'Order details fetched successfully.')
  );
});

/**
 * @description Retrieves orders for the authenticated driver (assigned orders and available orders).
 * @route GET /api/orders/driver
 * @access Private (Driver)
 */
const getDriverOrders = asyncHandler(async (req, res) => {
  // Get authenticated user ID from protect middleware
  const userId = req.user.id;

  // Fetch driver's profile to get driverId
  const { data: driverProfile, error: driverError } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', userId)
    .single();

  // Handle driver profile fetch errors
  if (driverError || !driverProfile) {
    throw new ApiError(404, 'Driver profile not found.');
  }

  const driverId = driverProfile.id;

  // Construct complex database query with OR conditions
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, status, estimated_amount, requested_at, 
      pickup_location:pickup_location_id (address_line1, city), 
      destination_location:destination_location_id (address_line1, city),
      customer:customer_id (name, profile_picture_url)
    `)
    .or(`and(driver_id.eq.${driverId},status.in.('assigned','picked_up')),and(status.eq.booked,driver_id.is.null)`);

  // Handle database query errors
  if (error) {
    console.error('Database query error:', error);
    throw new ApiError(500, 'Failed to fetch driver orders. Please try again.');
  }

  // Return success response with orders array
  return res.status(200).json(
    new ApiResponse(200, orders || [], 'Driver orders fetched successfully.')
  );
});

/**
 * @description Allows drivers to accept available orders with race condition prevention.
 * @route PUT /api/orders/:orderId/accept
 * @access Private (Driver)
 */
const acceptOrder = asyncHandler(async (req, res) => {
  // Get authenticated user ID from protect middleware
  const userId = req.user.id;
  
  // Extract orderId from URL parameters
  const { orderId } = req.params;

  // Validate orderId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    throw new ApiError(400, 'Invalid orderId format');
  }

  // Validate Driver's Status: Fetch driver profile
  const { data: driverProfile, error: driverError } = await supabase
    .from('drivers')
    .select('id, is_available')
    .eq('user_id', userId)
    .single();

  // Handle driver profile fetch errors
  if (driverError || !driverProfile) {
    throw new ApiError(404, 'Driver profile not found.');
  }

  // Check if driver is available
  if (!driverProfile.is_available) {
    throw new ApiError(403, "You must be 'available' to accept new orders.");
  }

  const driverId = driverProfile.id;

  // Atomic Order Update (CRITICAL): Prevent race conditions
  const { data: updateResult, error: updateError } = await supabase
    .from('orders')
    .update({
      driver_id: driverId,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('status', 'booked')
    .select('id');

  // Handle update errors
  if (updateError) {
    console.error('Database update error:', updateError);
    throw new ApiError(500, 'Failed to accept order. Please try again.');
  }

  // Check if order was successfully updated (race condition check)
  if (!updateResult || updateResult.length === 0) {
    throw new ApiError(409, 'Order is no longer available or has already been accepted.');
  }

  // Update Driver's Own Status: Set as busy
  const { error: driverUpdateError } = await supabase
    .from('drivers')
    .update({
      is_available: false,
      is_delivering: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', driverId);

  // Handle driver status update errors
  if (driverUpdateError) {
    // This creates an inconsistent state - in production, you'd need a reconciliation process
    console.error('CRITICAL: Driver status update failed after order acceptance:', driverUpdateError);
    throw new ApiError(500, 'Order accepted but failed to update driver status. Please contact support.');
  }

  // Return success response
  return res.status(200).json(
    new ApiResponse(200, { orderStatus: 'assigned' }, 'Order accepted successfully.')
  );
});

export { requestNewDelivery, confirmOrderPayment, getCustomerOrders, customerRateDriver, cancelOrder, getDriverOrders, getOrderDetails, acceptOrder };