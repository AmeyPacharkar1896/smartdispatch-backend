import jwt from 'jsonwebtoken';
import { supabase } from '../config/db.js';
import { ApiError } from './ApiError.js';
import bcrypt from 'bcryptjs';

export const generateAccessAndRefreshTokens = async (userId, userRole, deviceIdentifier = null) => {
  try {
    const accessToken = jwt.sign(
      {
        sub: userId,
        role: userRole,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
      {
        sub: userId,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    const refreshTokenExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days 

    const { error: dbError } = await supabase
      .from('refresh_tokens')
      .insert({
        user_id: userId,
        token: hashedRefreshToken,
        expires_at: refreshTokenExpiryDate.toISOString(),
        device_identifier: deviceIdentifier,
      });

    if (dbError) {
      throw new ApiError(500, "Could not save refresh token to database", dbError.message);
    }
    
    return { accessToken, refreshToken };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Something went wrong while generating tokens", error.message);
  }
};