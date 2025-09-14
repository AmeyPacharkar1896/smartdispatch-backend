import { supabase } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * @description Updates the current user's profile information.
 * @route PATCH /api/users/me
 * @access Private (Authenticated User)
 */
const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  // Get authenticated user ID from protect middleware
  const userId = req.user.id;

  // Extract allowed fields from request body
  const { name, phone_number, profile_picture_url } = req.body;

  // Check if request body is empty
  if (!name && !phone_number && !profile_picture_url) {
    throw new ApiError(400, 'No update data provided.');
  }

  // Initialize empty updateData object for secure updates
  const updateData = {};

  // Conditionally build updateData object with validation
  if (name !== undefined) {
    // Validate name is a non-empty string
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new ApiError(400, 'Name must be a non-empty string.');
    }
    updateData.name = name.trim();
  }

  if (phone_number !== undefined) {
    // Validate phone number format (basic validation for international format)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (typeof phone_number !== 'string' || !phoneRegex.test(phone_number.replace(/\s/g, ''))) {
      throw new ApiError(400, 'Phone number must be a valid international format.');
    }
    updateData.phone_number = phone_number.trim();
  }

  if (profile_picture_url !== undefined) {
    // Validate URL format
    try {
      new URL(profile_picture_url);
      updateData.profile_picture_url = profile_picture_url.trim();
    } catch (error) {
      throw new ApiError(400, 'Profile picture URL must be a valid URL format.');
    }
  }

  // Add updated timestamp
  updateData.updated_at = new Date().toISOString();

  // Update user profile in database
  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, name, email, phone_number, role, profile_picture_url, updated_at')
    .single();

  // Handle database operation errors
  if (error) {
    console.error('Database update error:', error);
    throw new ApiError(500, 'Failed to update profile. Please try again.');
  }

  if (!updatedUser) {
    throw new ApiError(404, 'User not found.');
  }

  // Return success response with updated user profile
  return res.status(200).json(
    new ApiResponse(200, updatedUser, 'Profile updated successfully.')
  );
});

export { updateCurrentUserProfile };
