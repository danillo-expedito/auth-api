import express from "express";

const app: express.Application = express();

app.get('/', (_req, res) => {
  res.json({ "message": "Auth API is runnig!"})
});

export default app;