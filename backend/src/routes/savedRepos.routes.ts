import { Router } from 'express';
import { SavedReposController } from '../controllers/SavedReposController';

const router = Router();

router.get('/', SavedReposController.getAll);
router.post('/', SavedReposController.create);
router.delete('/:id', SavedReposController.delete);
router.put('/:id/touch', SavedReposController.touch);

export default router;