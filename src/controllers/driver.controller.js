import { supabase } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @description Creates a driver profile for the authenticated user.
 * @route POST /api/drivers/me/profile
 * @access Private (Driver)
 */
const createMyDriverProfile = asyncHandler(async (req, res) => {
  // Get authenticated user ID from protect middleware
  const userId = req.user.id;

  // Extract driver license number from request body
  const { driver_license_number } = req.body;

  // Validate driver license number
  if (!driver_license_number || typeof driver_license_number !== 'string' || driver_license_number.trim().length === 0) {
    throw new ApiError(400, 'Driver license number is required and must be a non-empty string.');
  }

  const trimmedLicenseNumber = driver_license_number.trim();

  // Prevent Duplicates: Check if profile already exists for this user
  const { data: existingProfile, error: profileCheckError } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileCheckError && profileCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
    throw new ApiError(500, 'Failed to check existing driver profile');
  }

  if (existingProfile) {
    throw new ApiError(409, 'Driver profile already exists for this user.');
  }

  // Check if driver license number is already in use
  const { data: existingLicense, error: licenseCheckError } = await supabase
    .from('drivers')
    .select('id')
    .eq('driver_license_number', trimmedLicenseNumber)
    .single();

  if (licenseCheckError && licenseCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
    throw new ApiError(500, 'Failed to check license number availability');
  }

  if (existingLicense) {
    throw new ApiError(409, 'Driver license number is already in use by another driver.');
  }

  // Construct new driver profile object
  const newDriverProfile = {
    id: uuidv4(),
    user_id: userId,
    driver_license_number: trimmedLicenseNumber,
    is_available: false,
    is_verified: false,
    avg_rating: 0,
    total_deliveries: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Insert new driver profile into database
  const { data: createdProfile, error: insertError } = await supabase
    .from('drivers')
    .insert(newDriverProfile)
    .select()
    .single();

  // Handle database insertion errors
  if (insertError) {
    console.error('Database insertion error:', insertError);
    throw new ApiError(500, 'Failed to create driver profile. Please try again.');
  }

  // Return success response
  return res.status(201).json(
    new ApiResponse(201, createdProfile, 'Driver profile created successfully. Awaiting verification.')
  );
});

/**
 * @description Updates the driver's availability status.
 * @route PUT /api/drivers/me/status
 * @access Private (Driver)
 */
const updateMyAvailability = asyncHandler(async (req, res) => {
  // Get authenticated user ID from protect middleware
  const userId = req.user.id;

  // Extract availability status from request body
  const { isAvailable } = req.body;

  // Validate isAvailable is a boolean
  if (typeof isAvailable !== 'boolean') {
    throw new ApiError(400, "The 'isAvailable' field is required and must be a boolean.");
  }

  // Fetch driver profile
  const { data: driverProfile, error: fetchError } = await supabase
    .from('drivers')
    .select('id, is_delivering')
    .eq('user_id', userId)
    .single();

  // Handle fetch errors
  if (fetchError || !driverProfile) {
    throw new ApiError(404, 'Driver profile not found. Please create one first.');
  }

  // Business Logic Check: Cannot go offline while delivering
  if (driverProfile.is_delivering && !isAvailable) {
    throw new ApiError(400, 'Cannot go offline while a delivery is in progress.');
  }

  // Update driver availability status
  const { error: updateError } = await supabase
    .from('drivers')
    .update({
      is_available: isAvailable,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Handle update errors
  if (updateError) {
    console.error('Database update error:', updateError);
    throw new ApiError(500, 'Failed to update driver status. Please try again.');
  }

  // Return success response
  return res.status(200).json(
    new ApiResponse(200, { isAvailable }, 'Driver status updated successfully.')
  );
});

export { createMyDriverProfile, updateMyAvailability };
