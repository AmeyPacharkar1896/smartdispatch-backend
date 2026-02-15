import { Router } from 'express';
import {
  getHealth,
  getRoute,
  getDistance,
  getEta,
  getTrafficAwareRoute,
  predictDuration,
  predictPrice,
  forecastDemand,
  getHotspots
} from '../controllers/ai.controller.js';

const router = Router();

router.route('/health').get(getHealth);
router.route('/route').get(getRoute);
router.route('/distance').get(getDistance);
router.route('/eta').get(getEta);
router.route('/route/traffic-aware').get(getTrafficAwareRoute);
router.route('/predict/duration').get(predictDuration);
router.route('/predict/price').get(predictPrice);
router.route('/forecast/demand').get(forecastDemand);
router.route('/hotspots').get(getHotspots);

export default router;
