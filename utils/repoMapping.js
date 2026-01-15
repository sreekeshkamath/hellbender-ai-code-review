const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const MAPPINGS_FILE = path.join(DATA_DIR, 'repo-mappings.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create a unique key from repo URL and branch
function createKey(repoUrl, branch = 'main') {
  const normalizedUrl = repoUrl.toLowerCase().trim().replace(/\.git$/, '');
  return `${normalizedUrl}:${branch}`;
}

// Load mappings from file
function loadMappings() {
  try {
    if (!fs.existsSync(MAPPINGS_FILE)) {
      return {};
    }
    const data = fs.readFileSync(MAPPINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading repo mappings:', error);
    return {};
  }
}

// Save mappings to file
function saveMappings(mappings) {
  try {
    fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
  } catch (error) {
    console.error('Error saving repo mappings:', error);
  }
}

// Get repoId for a given URL and branch
function getRepoId(repoUrl, branch = 'main') {
  const mappings = loadMappings();
  const key = createKey(repoUrl, branch);
  return mappings[key] || null;
}

// Set mapping for URL + branch to repoId
function setRepoId(repoUrl, branch, repoId) {
  const mappings = loadMappings();
  const key = createKey(repoUrl, branch);
  mappings[key] = repoId;
  saveMappings(mappings);
}

// Remove mapping
function removeMapping(repoUrl, branch) {
  const mappings = loadMappings();
  const key = createKey(repoUrl, branch);
  delete mappings[key];
  saveMappings(mappings);
}

// Get all mappings
function getAllMappings() {
  return loadMappings();
}

// Check if repo exists on disk
function repoExists(repoId, reposDir) {
  const repoPath = path.join(reposDir, repoId);
  return fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, '.git'));
}

module.exports = {
  getRepoId,
  setRepoId,
  removeMapping,
  getAllMappings,
  repoExists,
  createKey
};
