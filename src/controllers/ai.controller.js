import axios from 'axios';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const aiClient = axios.create({
  baseURL: process.env.AI_ENGINE_URL || 'http://localhost:8001',
  timeout: 10000,
});

const fetchFromAI = async (endpoint, params = {}) => {
  try {
    const response = await aiClient.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from AI service (${endpoint}):`, error.message);
    throw new ApiError(500, `AI Service Error: ${error.message}`);
  }
};

export const getHealth = asyncHandler(async (req, res) => {
  const data = await fetchFromAI('/health');
  return res.status(200).json(new ApiResponse(200, data, "Health check successful"));
});

export const getRoute = asyncHandler(async (req, res) => {
  const data = await fetchFromAI('/route', req.query);
  return res.status(200).json(new ApiResponse(200, data, "Route fetched successfully"));
});

export const getDistance = asyncHandler(async (req, res) => {
  const data = await fetchFromAI('/distance', req.query);
  return res.status(200).json(new ApiResponse(200, data, "Distance fetched successfully"));
});

export const getEta = asyncHandler(async (req, res) => {
  const data = await fetchFromAI('/eta', req.query);
  return res.status(200).json(new ApiResponse(200, data, "ETA fetched successfully"));
});

export const getTrafficAwareRoute = asyncHandler(async (req, res) => {
  const data = await fetchFromAI('/route/traffic-aware', req.query);
  return res.status(200).json(new ApiResponse(200, data, "Traffic aware route fetched successfully"));
});

export const predictDuration = asyncHandler(async (req, res) => {
  const data = await fetchFromAI('/predict/duration', req.query);
  return res.status(200).json(new ApiResponse(200, data, "Duration prediction fetched successfully"));
});

export const predictPrice = asyncHandler(async (req, res) => {
  const data = await fetchFromAI('/predict/price', req.query);
  return res.status(200).json(new ApiResponse(200, data, "Price prediction fetched successfully"));
});

export const forecastDemand = asyncHandler(async (req, res) => {
  const data = await fetchFromAI('/forecast/demand', req.query);
  return res.status(200).json(new ApiResponse(200, data, "Demand forecast fetched successfully"));
});

export const getHotspots = asyncHandler(async (req, res) => {
  const data = await fetchFromAI('/hotspots', req.query);
  return res.status(200).json(new ApiResponse(200, data, "Hotspots fetched successfully"));
});
