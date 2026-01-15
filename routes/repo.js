const express = require('express');
const router = express.Router();
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const repoMapping = require('../utils/repoMapping');

const REPOS_DIR = path.join(__dirname, '../temp/repos');

if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

const isValidRepoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  // Must be a valid Git URL: http://, https://, git@, or git://
  const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/;
  return gitUrlPattern.test(url.trim());
};

router.post('/clone', async (req, res) => {
  try {
    const { repoUrl, branch } = req.body;
    const accessToken = process.env.GITHUB_ACCESS_TOKEN;
    const branchName = branch || 'main';

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    if (!isValidRepoUrl(repoUrl)) {
      return res.status(400).json({ error: 'Please enter a valid Git repository URL (e.g., https://github.com/username/repo)' });
    }

    // Check if repository is already cloned
    let repoId = repoMapping.getRepoId(repoUrl, branchName);
    
    if (repoId && repoMapping.repoExists(repoId, REPOS_DIR)) {
      // Repository already exists, return existing data
      const repoPath = path.join(REPOS_DIR, repoId);
      const files = getAllFiles(repoPath);
      
      console.log(`Reusing existing repository: ${repoUrl} (${branchName}) -> ${repoId}`);
      
      return res.json({
        repoId,
        repoPath,
        files: files.map(f => ({
          path: path.relative(repoPath, f),
          size: fs.statSync(f).size
        })),
        cached: true
      });
    }

    // Repository doesn't exist, clone it
    repoId = uuidv4();
    const repoPath = path.join(REPOS_DIR, repoId);
    const git = simpleGit();

    const authRepoUrl = accessToken 
      ? repoUrl.replace('https://', `https://oauth2:${accessToken}@`)
      : repoUrl;

    const cloneOptions = branch ? ['--branch', branch, '--single-branch'] : [];
    
    console.log(`Cloning new repository: ${repoUrl} (${branchName}) -> ${repoId}`);
    await git.clone(authRepoUrl, repoPath, cloneOptions);

    // Store the mapping
    repoMapping.setRepoId(repoUrl, branchName, repoId);

    const files = getAllFiles(repoPath);

    res.json({
      repoId,
      repoPath,
      files: files.map(f => ({
        path: path.relative(repoPath, f),
        size: fs.statSync(f).size
      })),
      cached: false
    });
  } catch (error) {
    console.error('Clone error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync/:repoId', async (req, res) => {
  try {
    const { repoId } = req.params;
    const { repoUrl, branch } = req.body;
    const accessToken = process.env.GITHUB_ACCESS_TOKEN;
    const repoPath = path.join(REPOS_DIR, repoId);

    if (!fs.existsSync(repoPath)) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required for sync' });
    }

    const git = simpleGit(repoPath);
    const authRepoUrl = accessToken 
      ? repoUrl.replace('https://', `https://oauth2:${accessToken}@`)
      : repoUrl;

    await git.fetch('origin', branch || 'main');
    await git.reset(`origin/${branch || 'main'}`, ['hard']);

    const files = getAllFiles(repoPath);

    res.json({
      repoId,
      repoPath,
      files: files.map(f => ({
        path: path.relative(repoPath, f),
        size: fs.statSync(f).size
      }))
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/files/:repoId', (req, res) => {
  try {
    const { repoId } = req.params;
    const repoPath = path.join(REPOS_DIR, repoId);

    if (!fs.existsSync(repoPath)) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    const files = getAllFiles(repoPath).map(f => ({
      path: path.relative(repoPath, f),
      size: fs.statSync(f).size
    }));

    res.json({ files });
  } catch (error) {
    console.error('Files error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/file/:repoId/{*path}', (req, res) => {
  try {
    const { repoId, path: filePath } = req.params;
    const repoPath = path.join(REPOS_DIR, repoId);
    const fullPath = path.join(repoPath, filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({ content });
  } catch (error) {
    console.error('Read error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:repoId', (req, res) => {
  try {
    const { repoId } = req.params;
    const repoPath = path.join(REPOS_DIR, repoId);

    // Remove from mappings
    const mappings = repoMapping.getAllMappings();
    for (const [key, mappedRepoId] of Object.entries(mappings)) {
      if (mappedRepoId === repoId) {
        const [repoUrl, branch] = key.split(':');
        repoMapping.removeMapping(repoUrl, branch);
        break;
      }
    }

    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (file === '.git') return;

    const filePath = path.join(dirPath, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

module.exports = router;
