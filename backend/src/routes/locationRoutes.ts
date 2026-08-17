import express from 'express';
import { addPickupCity, getCountries, getStates,addPickUpArea} from '../services/locationServices';
import { authMiddleware } from '../middleware/authMiddleware';
const router = express.Router();

router.get('/countries',authMiddleware, getCountries);
router.post('/states', authMiddleware, getStates);

router.post('/addPickupCity', authMiddleware, addPickupCity);
// router.get('/listPickupCity', authMiddleware, listPickupCity);

router.post('/addPickUpArea',authMiddleware, addPickUpArea);
// router.get('/listPickUpArea',authMiddleware, listPickUpArea);

//router.post('/cities',authMiddleware, getCities);


export default router;
