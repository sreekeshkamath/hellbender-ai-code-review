import './load-env';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import { validateEnvironment } from './config/environment';
import repositoryRoutes from './routes/repository.routes';
import reviewRoutes from './routes/review.routes';
import savedReposRoutes from './routes/savedRepos.routes';
import pullRequestRoutes from './routes/pullRequest.routes';

validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/repo', repositoryRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/saved-repos', savedReposRoutes);
app.use('/api/pull-requests', pullRequestRoutes);

app.use('/temp', express.static(path.join(__dirname, '../temp')));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
