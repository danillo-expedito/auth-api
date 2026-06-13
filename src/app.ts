import express from 'express';
import authRoutes from './routes/auth.routes';

const app: express.Application = express();

app.use(express.json());
app.use('/auth', authRoutes);

app.get('/', (_req, res) => {
    res.json({ message: 'Auth API is runnig!' });
});

export default app;
