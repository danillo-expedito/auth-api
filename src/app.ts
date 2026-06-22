import express from 'express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middlewares/error-handler.middleware';

const app: express.Application = express();

app.use(express.json());

app.get('/', (_req, res) => {
    res.json({ message: 'Auth API is runnig!' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.use(errorHandler);

export default app;
