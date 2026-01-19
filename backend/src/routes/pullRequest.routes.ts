import { Router } from 'express';
import { PullRequestController } from '../controllers/PullRequestController';

const router = Router();

router.get('/', PullRequestController.getAll);
router.get('/:id', PullRequestController.getById);
router.post('/', PullRequestController.create);
router.patch('/:id/status', PullRequestController.updateStatus);
router.delete('/:id', PullRequestController.delete);
router.get('/:id/comments', PullRequestController.getComments);
router.post('/:id/comments', PullRequestController.addComment);
router.post('/:id/ai-review', PullRequestController.requestAIReview);
router.get('/diff', PullRequestController.getDiff);
router.get('/commits', PullRequestController.getCommits);

export default router;
