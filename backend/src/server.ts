// src/server.ts

import express from 'express';
import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './models';
import config from "./config/config";

dotenv.config();

const PORT = config.server.port || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    //app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
