import { Router } from 'express';
import { createConfiguration, getConfiguration } from '../services/configurationService';

const router = Router();

// Create or update configuration
router.post('/createConfiguration', createConfiguration);

// Get configuration
router.get('/getConfiguration', getConfiguration);

export default router;
