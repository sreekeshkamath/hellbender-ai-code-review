const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const REPOS_FILE = path.join(DATA_DIR, 'repos.json.enc');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32!';
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) return null;
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function loadRepos() {
  try {
    if (!fs.existsSync(REPOS_FILE)) {
      return [];
    }
    const encrypted = fs.readFileSync(REPOS_FILE, 'utf8');
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error loading repos:', error);
    return [];
  }
}

function saveRepos(repos) {
  try {
    const encrypted = encrypt(JSON.stringify(repos));
    fs.writeFileSync(REPOS_FILE, encrypted);
  } catch (error) {
    console.error('Error saving repos:', error);
  }
}

const repoStore = {
  getAll() {
    return loadRepos();
  },

  add(repo) {
    const repos = loadRepos();
    const newRepo = {
      id: uuidv4(),
      name: repo.name || repo.url.split('/').pop().replace('.git', ''),
      url: repo.url,
      branch: repo.branch || 'main',
      repoId: repo.repoId || null,
      cloned: repo.cloned || false,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
    repos.push(newRepo);
    saveRepos(repos);
    return newRepo;
  },

  delete(id) {
    const repos = loadRepos();
    const filtered = repos.filter(r => r.id !== id);
    saveRepos(filtered);
  },

  update(id, updates) {
    const repos = loadRepos();
    const index = repos.findIndex(r => r.id === id);
    if (index !== -1) {
      repos[index] = { ...repos[index], ...updates, updatedAt: new Date().toISOString() };
      saveRepos(repos);
      return repos[index];
    }
    return null;
  },

  touch(id) {
    const repos = loadRepos();
    const index = repos.findIndex(r => r.id === id);
    if (index !== -1) {
      repos[index].lastUsed = new Date().toISOString();
      saveRepos(repos);
    }
  }
};

module.exports = repoStore;
