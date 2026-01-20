-- =============================================================================
-- Initial Database Schema Migration
-- Creates all tables for persistent storage and review sessions
-- =============================================================================

-- DOWN
-- DROP TABLE IF EXISTS review_comments CASCADE;
-- DROP TABLE IF EXISTS review_files CASCADE;
-- DROP TABLE IF EXISTS review_sessions CASCADE;
-- DROP TABLE IF EXISTS persistent_repositories CASCADE;

-- UP

-- -----------------------------------------------------------------------------
-- Persistent Repositories Table
-- Stores metadata about cloned repositories for persistent storage
-- -----------------------------------------------------------------------------
CREATE TABLE persistent_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    default_branch VARCHAR(255) NOT NULL DEFAULT 'main',
    storage_path VARCHAR(1024) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Index for faster lookups by URL
CREATE INDEX idx_persistent_repositories_url
    ON persistent_repositories(url);

-- Index for listing active repositories
CREATE INDEX idx_persistent_repositories_active
    ON persistent_repositories(is_active, created_at DESC);

-- -----------------------------------------------------------------------------
-- Review Sessions Table
-- Stores branch comparison review sessions
-- -----------------------------------------------------------------------------
CREATE TABLE review_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES persistent_repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    source_branch VARCHAR(255) NOT NULL,
    target_branch VARCHAR(255) NOT NULL,
    model_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    overall_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'))
);

-- Index for listing sessions by repository
CREATE INDEX idx_review_sessions_repository
    ON review_sessions(repository_id, created_at DESC);

-- Index for listing sessions by status
CREATE INDEX idx_review_sessions_status
    ON review_sessions(status, created_at DESC);

-- Index for filtering by branches
CREATE INDEX idx_review_sessions_branches
    ON review_sessions(source_branch, target_branch);

-- -----------------------------------------------------------------------------
-- Review Files Table
-- Stores analyzed files within a review session
-- -----------------------------------------------------------------------------
CREATE TABLE review_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_session_id UUID NOT NULL REFERENCES review_sessions(id) ON DELETE CASCADE,
    file_path VARCHAR(1024) NOT NULL,
    score INTEGER,
    summary TEXT,
    diff_hunks JSONB DEFAULT '[]'::jsonb NOT NULL,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for listing files by session
CREATE INDEX idx_review_files_session
    ON review_files(review_session_id, file_path);

-- Index for ordering by score
CREATE INDEX idx_review_files_score
    ON review_files(review_session_id, score ASC);

-- Index for searching by file path
CREATE INDEX idx_review_files_path
    ON review_files(file_path);

-- GIN index for JSONB diff_hunks queries
CREATE INDEX idx_review_files_diff_hunks
    ON review_files USING GIN (diff_hunks);

-- -----------------------------------------------------------------------------
-- Review Comments Table
-- Stores inline AI comments on specific lines of code
-- -----------------------------------------------------------------------------
CREATE TABLE review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_file_id UUID NOT NULL REFERENCES review_files(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    comment_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    code_snippet TEXT,
    suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    CONSTRAINT valid_comment_type CHECK (comment_type IN ('issue', 'suggestion', 'praise', 'question', 'todo'))
);

-- Index for listing comments by file
CREATE INDEX idx_review_comments_file
    ON review_comments(review_file_id, line_number);

-- Index for filtering by severity
CREATE INDEX idx_review_comments_severity
    ON review_comments(severity, created_at DESC);

-- Index for finding comments on specific lines
CREATE INDEX idx_review_comments_line
    ON review_comments(line_number);

-- Composite index for file and line
CREATE INDEX idx_review_comments_file_line
    ON review_comments(review_file_id, line_number);

-- -----------------------------------------------------------------------------
-- Migration Log Table (managed by migrate.ts)
-- Tracks which migrations have been applied
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS migrations_log (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    checksum VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_migrations_log_filename
    ON migrations_log(filename);
