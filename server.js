require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const reviewRoutes = require('./routes/review');
const repoRoutes = require('./routes/repo');
const savedReposRoutes = require('./routes/savedRepos');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/review', reviewRoutes);
app.use('/api/repo', repoRoutes);
app.use('/api/saved-repos', savedReposRoutes);

app.use('/temp', express.static(path.join(__dirname, 'temp')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
