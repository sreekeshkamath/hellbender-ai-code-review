import { Router } from 'express';
import { PullRequestController } from '../controllers/PullRequestController';

const router = Router();

router.get('/', PullRequestController.getAll);
router.get('/:id', PullRequestController.getById);
router.post('/', PullRequestController.create);
router.patch('/:id/status', PullRequestController.updateStatus);
router.get('/:id/comments', PullRequestController.getComments);
router.post('/:id/comments', PullRequestController.addComment);

export default router;
