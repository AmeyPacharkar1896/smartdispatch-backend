import { supabase } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';


const signupController = asyncHandler(async (req, res) => {
  const { name, email, phone_number, password, role, auth_type, profile_picture_url } = await req.body;
  const password_hash = bcrypt.hashSync(password, 10);
  const id = uuidv4();

  const user = { id, name, email, phone_number, password_hash, role, auth_type, profile_picture_url };
  const { error } = await supabase.from("users").insert(user);
  console.log(error.message)
  if (error) {
    throw new ApiError(404, "Error While creating User",error.message);
  }

  return res.status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "User Created Succesfully"
      )
    )
})

export {
  signupController
}