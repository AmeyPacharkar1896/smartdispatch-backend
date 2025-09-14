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
import orderRouter from './routes/order.route.js'; // 1. IMPORT the order router
import userRouter from './routes/user.route.js';   // (Prepared for our next step)
// --- END: Import Routers ---


// --- START: Route Declarations ---
app.get('/api/v1/test', testController);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/orders', orderRouter); // 2. USE the order router
app.use('/api/v1/users', userRouter);   // (Prepared for our next step)
// app.use('/api/admin',); // We will handle this later
// --- END: Route Declarations ---


app.use(errorHandler);

export { app };