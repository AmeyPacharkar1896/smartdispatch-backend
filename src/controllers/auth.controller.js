import { supabase } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateAccessAndRefreshTokens } from '../utils/generateTokens.js';


const signupController = asyncHandler(async (req, res) => {
  const { name, email, phone_number, password, role, auth_type, profile_picture_url } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists"); // 409 Conflict
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  const newUser = {
    id,
    name,
    email,
    password_hash,
    ...(phone_number && { phone_number }),
    ...(role && { role }),
    ...(auth_type && { auth_type }),
    ...(profile_picture_url && { profile_picture_url }),
  };

  const { data: createdUser, error } = await supabase
    .from("users")
    .insert(newUser)
    .select()
    .single();

  if (error) {
    throw new ApiError(500, "Error while creating user", error.message);
  }

  const deviceIdentifier = req.headers['user-agent'] || 'Unknown Device';
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdUser.id, createdUser.role, deviceIdentifier);

  const userToReturn = { ...createdUser };
  delete userToReturn.password_hash;

  const responseData = {
    user: userToReturn,
    accessToken,
    refreshToken
  };

  return res.status(201).json(
    new ApiResponse(201, responseData, "User registered and logged in successfully")
  );
});


const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user || error) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const deviceIdentifier = req.headers['user-agent'] || 'Unknown Device';
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id, user.role, deviceIdentifier);

  const loggedInUser = { ...user };
  delete loggedInUser.password_hash;

  const responseData = {
    user: loggedInUser,
    accessToken,
    refreshToken
  };

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, responseData, "User logged in successfully")
    );
});

const logoutController = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const incomingRefreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  if (!incomingRefreshToken) {
    throw new ApiError(400, "No refresh token provided");
  }

  const { data: userTokens, error: findError } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('user_id', userId);

  if (findError || !userTokens || userTokens.length === 0) {
    return res.status(200).json(new ApiResponse(200, {}, "Logout successful. No active session found on server."));
  }

  let tokenToDeleteId = null;
  for (const tokenRecord of userTokens) {
    const isTokenMatch = await bcrypt.compare(incomingRefreshToken, tokenRecord.token);
    if (isTokenMatch) {
      tokenToDeleteId = tokenRecord.id;
      break;
    }
  }

  if (tokenToDeleteId) {
    await supabase
      .from('refresh_tokens')
      .delete()
      .eq('id', tokenToDeleteId);
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "User logged out successfully")
  );
});

const refreshAccessTokenController = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userId = decodedToken.sub;

    const { data: userTokens, error: findError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('user_id', userId);

    if (findError || !userTokens || userTokens.length === 0) {
      throw new ApiError(401, "Invalid refresh token. No active sessions found.");
    }

    let validTokenRecord = null;
    for (const tokenRecord of userTokens) {
      const isTokenMatch = await bcrypt.compare(incomingRefreshToken, tokenRecord.token);
      if (isTokenMatch) {
        validTokenRecord = tokenRecord;
        break;
      }
    }

    if (!validTokenRecord) {
      throw new ApiError(401, "Invalid refresh token or session has been logged out.");
    }
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role') // Only select what's needed
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new ApiError(401, "Invalid refresh token. User not found.");
    }

    const newAccessToken = jwt.sign(
      {
        sub: user.id,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
    );

    const responseData = {
      accessToken: newAccessToken,
    };

    res.cookie("accessToken", newAccessToken, cookieOptions);

    return res
      .status(200)
      .json(new ApiResponse(200, responseData, "Access token refreshed successfully"));

  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token", error.message);
  }
});

export { signupController, loginController, logoutController, refreshAccessTokenController };
