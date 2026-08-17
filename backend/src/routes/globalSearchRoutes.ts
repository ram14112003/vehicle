import express from 'express';
import { globalSearch } from '../services/globalSearch';

const router = express.Router();

router.get('/globalsearch', globalSearch);

export default router;
