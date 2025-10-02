import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(express.static('public'));

// --- START: Import Routers ---
import { testController } from './controllers/test.controller.js';
import authRouter from './routes/auth.route.js';
import orderRouter from './routes/order.route.js';
import userRouter from './routes/user.route.js';
import driverRouter from './routes/driver.route.js';
import adminRouter from './routes/admin.routes.js';
// --- END: Import Routers ---


// --- START: Route Declarations ---
app.get('/api/v1/test', testController);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/drivers', driverRouter);
app.use('/api/v1/admin', adminRouter);
// --- END: Route Declarations ---


app.use(errorHandler);

export { app };