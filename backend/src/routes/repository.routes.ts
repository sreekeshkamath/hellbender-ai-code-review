import { Router } from 'express';
import { RepositoryController } from '../controllers/RepositoryController';

const router = Router();

router.post('/clone', RepositoryController.clone);
router.post('/sync/:repoId', RepositoryController.sync);
router.get('/files/:repoId', RepositoryController.getFiles);
router.get('/changed-files/:repoId', RepositoryController.getChangedFiles);
// router.get('/file/:repoId/(.*)', RepositoryController.getFile); // TODO: fix route
router.delete('/:repoId', RepositoryController.delete);

export default router;