import { supabase } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export const testController = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("users").select();
  console.log(data, error)
  const message = "fetched succesfully";
  if (data) {
    return res.status(200)
      .json(
        new ApiResponse(
          200,
          data,
          message,
          "OK"
        )
      )
  }
})