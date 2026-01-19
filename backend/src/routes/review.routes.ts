import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController';

const router = Router();

router.get('/models', ReviewController.getModels);
router.post('/analyze', ReviewController.analyze);

export default router;