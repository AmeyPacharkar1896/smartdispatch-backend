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

import { testController } from './controllers/test.controller.js';

//Routes
app.use('/api/v1/test', testController);
// app.use('/api/users',);
// app.use('/api/orders',);
// app.use('/api/admin',);

app.use(errorHandler);

export { app };