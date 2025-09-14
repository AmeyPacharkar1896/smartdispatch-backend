import { supabase } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { v4 as uuidv4 } from 'uuid';

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

  // Input validation - check for required fields
  if (!pickupLocation || !destinationLocation || !packageDetails || !requestedVehicleType) {
    throw new ApiError(400, 'Missing required fields: pickupLocation, destinationLocation, packageDetails, and requestedVehicleType are required');
  }

  // Validate pickupLocation
  if (!pickupLocation.addressText || !pickupLocation.latitude || !pickupLocation.longitude) {
    throw new ApiError(400, 'pickupLocation must include addressText, latitude, and longitude');
  }

  // Validate destinationLocation
  if (!destinationLocation.addressText || !destinationLocation.latitude || !destinationLocation.longitude) {
    throw new ApiError(400, 'destinationLocation must include addressText, latitude, and longitude');
  }

  // Validate packageDetails
  if (!packageDetails.weightKg || !packageDetails.volumeCm3 || !packageDetails.type) {
    throw new ApiError(400, 'packageDetails must include weightKg, volumeCm3, and type');
  }

  // Validate latitude and longitude ranges
  const isValidLatitude = (lat) => lat >= -90 && lat <= 90;
  const isValidLongitude = (lng) => lng >= -180 && lng <= 180;

  if (!isValidLatitude(pickupLocation.latitude) || !isValidLongitude(pickupLocation.longitude)) {
    throw new ApiError(400, 'Invalid pickupLocation coordinates');
  }

  if (!isValidLatitude(destinationLocation.latitude) || !isValidLongitude(destinationLocation.longitude)) {
    throw new ApiError(400, 'Invalid destinationLocation coordinates');
  }

  // Validate package weight and volume are positive numbers
  if (typeof packageDetails.weightKg !== 'number' || packageDetails.weightKg <= 0) {
    throw new ApiError(400, 'packageDetails.weightKg must be a positive number');
  }

  if (typeof packageDetails.volumeCm3 !== 'number' || packageDetails.volumeCm3 <= 0) {
    throw new ApiError(400, 'packageDetails.volumeCm3 must be a positive number');
  }

  // Validate requestedVehicleType against allowed list
  const allowedVehicleTypes = ['bike', 'car', 'van'];
  if (!allowedVehicleTypes.includes(requestedVehicleType)) {
    throw new ApiError(400, `requestedVehicleType must be one of: ${allowedVehicleTypes.join(', ')}`);
  }

  // Placeholder for estimated price calculation
  // TODO: Replace with AI service integration
  const basePrice = parseFloat(process.env.BASE_DELIVERY_PRICE || '50.00');
  const weightMultiplier = 10; // Price per kg
  const estimatedAmount = basePrice + (packageDetails.weightKg * weightMultiplier);

  // Generate unique order ID
  const orderId = uuidv4();

  // Construct order object for database insertion
  const orderData = {
    orderId,
    customerId,
    pickupLocation: {
      addressText: pickupLocation.addressText,
      latitude: pickupLocation.latitude,
      longitude: pickupLocation.longitude
    },
    destinationLocation: {
      addressText: destinationLocation.addressText,
      latitude: destinationLocation.latitude,
      longitude: destinationLocation.longitude
    },
    packageDetails: {
      weightKg: packageDetails.weightKg,
      volumeCm3: packageDetails.volumeCm3,
      type: packageDetails.type
    },
    requestedVehicleType,
    specialInstructions: specialInstructions || null,
    estimatedAmount,
    status: 'pending_payment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Insert order into database
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select();

  // Handle database insertion errors
  if (error) {
    console.error('Database insertion error:', error);
    throw new ApiError(500, 'Failed to create order. Please try again.');
  }

  // Return success response
  return res.status(201).json(
    new ApiResponse(201, {
      orderId,
      estimatedAmount,
      status: 'pending_payment'
    }, 'Order created successfully')
  );
});

const confirmOrderPayment = asyncHandler(async (req, res) => {
  // Get authenticated customer ID from protect middleware
  const customerId = req.user.id;

  // Extract orderId from URL parameters
  const { orderId } = req.params;

  // Extract payment details from request body
  const { paymentMethod, paymentToken } = req.body;

  // Input validation - check for required fields
  if (!paymentMethod || !paymentToken) {
    throw new ApiError(400, 'Missing required fields: paymentMethod and paymentToken are required');
  }

  // Validate orderId format (basic UUID validation)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(orderId)) {
    throw new ApiError(400, 'Invalid orderId format');
  }

  // Validate paymentMethod against allowed values
  const allowedPaymentMethods = ['card', 'upi', 'cash'];
  if (!allowedPaymentMethods.includes(paymentMethod)) {
    throw new ApiError(400, `paymentMethod must be one of: ${allowedPaymentMethods.join(', ')}`);
  }

  // Fetch order from database
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('orderId, customerId, status')
    .eq('orderId', orderId)
    .single();

  // Handle fetch errors
  if (fetchError || !order) {
    throw new ApiError(404, 'Order not found or an error occurred.');
  }

  // Check if the order belongs to the authenticated customer
  if (order.customerId !== customerId) {
    throw new ApiError(403, 'Access denied. You can only confirm payment for your own orders.');
  }

  // Check if order is in pending payment status
  if (order.status !== 'pending_payment') {
    throw new ApiError(400, 'Order is not in pending payment status.');
  }

  // Simulate payment gateway (placeholder)
  // TODO: Replace with actual payment gateway integration
  let paymentSuccessful = false;
  
  if (paymentMethod === 'cash') {
    // For cash payments, we can immediately mark as successful
    paymentSuccessful = true;
  } else {
    // For card/upi payments, simulate payment processing
    // In a real application, this would involve calling the payment gateway API
    // with the paymentToken and handling the response
    paymentSuccessful = true; // Placeholder: always successful for now
  }

  if (!paymentSuccessful) {
    throw new ApiError(400, 'Payment failed. Please try again.');
  }

  // Update order status to "booked"
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'booked',
      updatedAt: new Date().toISOString()
    })
    .eq('orderId', orderId);

  // Handle update errors
  if (updateError) {
    console.error('Database update error:', updateError);
    throw new ApiError(500, 'Failed to update order status. Please try again.');
  }

  // Return success response
  return res.status(200).json(
    new ApiResponse(200, {
      orderId,
      orderStatus: 'booked'
    }, 'Payment successful.')
  );
});

export { requestNewDelivery, confirmOrderPayment };
