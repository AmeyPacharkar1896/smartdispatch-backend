import { supabase } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export const testController = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("users").select();

  if (error) {
    throw new ApiError(404, "Users not found")
  };


  if (data.length === 0) {
    console.log("Test Controller - working fine")
    return res.status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "No users"
        )
      )
  }

  if (data) {
    console.log("Test Controller - working fine")
    return res.status(200)
      .json(
        new ApiResponse(
          200,
          data,
          "Fetched Succesfully",
          "OK"
        )
      )
  }
})