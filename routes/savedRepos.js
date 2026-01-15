const express = require('express');
const router = express.Router();
const repoStore = require('../utils/repoStore');

router.get('/', (req, res) => {
  try {
    const repos = repoStore.getAll();
    res.json({ repos: repos.sort((a, b) => {
      if (a.lastUsed && b.lastUsed) {
        return new Date(b.lastUsed) - new Date(a.lastUsed);
      }
      if (a.lastUsed) return -1;
      if (b.lastUsed) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })});
  } catch (error) {
    console.error('Error getting repos:', error);
    res.status(500).json({ error: error.message });
  }
});

const isValidRepoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  // Must be a valid Git URL: http://, https://, git@, or git://
  const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
  return gitUrlPattern.test(url.trim());
};

router.post('/', (req, res) => {
  try {
    const { url, branch, name, repoId, cloned } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    if (!isValidRepoUrl(url)) {
      return res.status(400).json({ error: 'Please enter a valid Git repository URL (e.g., https://github.com/username/repo)' });
    }

    const repos = repoStore.getAll();
    const existing = repos.find(r => r.url.toLowerCase() === url.toLowerCase() && r.branch === (branch || 'main'));
    
    if (existing) {
      // Update the existing repo with new repoId and cloned status if provided
      if (repoId || cloned !== undefined) {
        const updates = {};
        if (repoId) updates.repoId = repoId;
        if (cloned !== undefined) updates.cloned = cloned;
        repoStore.update(existing.id, updates);
      }
      repoStore.touch(existing.id);
      const updated = repoStore.getAll().find(r => r.id === existing.id);
      return res.json({ repo: updated, message: 'Repository already saved' });
    }

    const repo = repoStore.add({ url, branch, name, repoId, cloned });
    res.json({ repo, message: 'Repository saved successfully' });
  } catch (error) {
    console.error('Error saving repo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    repoStore.delete(id);
    res.json({ success: true, message: 'Repository removed' });
  } catch (error) {
    console.error('Error deleting repo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/touch', (req, res) => {
  try {
    const { id } = req.params;
    repoStore.touch(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating repo:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
