# Docker Setup Documentation

This document provides instructions for running the Hellbender AI Code Reviewer application using Docker Compose.

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose V2 (included with Docker Desktop)
- At least 4GB of available RAM
- At least 2GB of available disk space

## Quick Start

### 1. Environment Setup

First, copy the example environment file and configure it:

```bash
# Copy the environment template
cp .env.example .env

# Edit the environment file with your settings
nano .env
```

Required environment variables:
- `OPENROUTER_API_KEY` - Your API key from [OpenRouter](https://openrouter.ai/)
- `ENCRYPTION_KEY` - A secure random key (32+ characters) for encrypting saved repositories

Optional variables:
- `POSTGRES_PASSWORD` - Password for PostgreSQL (change for production)
- `GITHUB_ACCESS_TOKEN` - For accessing private repositories

### 2. Start the Application

#### Development Mode

Run the following command to start all services in development mode:

```bash
docker compose up --build
```

This will start:
- PostgreSQL database (port 5432)
- Backend API server (port 3001)
- Frontend development server (port 5173)

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

#### Production Mode

For production deployment, use the production build:

```bash
docker compose -f docker-compose.yml up --build -d
```

This will start:
- PostgreSQL database
- Backend API server (production build)
- Frontend Nginx server (port 80)

Access the application at http://localhost

### 3. Stop the Application

```bash
# Stop all services
docker compose down

# Stop and remove volumes (deletes all data including databases)
docker compose down -v
```

## Common Commands

### View Logs

```bash
# View all logs
docker compose logs

# View logs for a specific service
docker compose logs backend
docker compose logs frontend
docker compose logs postgres

# Follow logs in real-time
docker compose logs -f
```

### Rebuild After Code Changes

```bash
# Rebuild and restart all services
docker compose up --build

# Rebuild a specific service
docker compose build backend
docker compose build frontend
```

### Access the Database

```bash
# Connect to PostgreSQL
docker exec -it hellbender-postgres psql -U hellbender -d hellbender

# Run a SQL command
docker exec -it hellbender-postgres psql -U hellbender -d hellbender -c "\dt"
```

### Manage Data

```bash
# Backup the database
docker exec -t hellbender-postgres pg_dump -U hellbender hellbender > backup.sql

# Restore the database
docker exec -i hellbender-postgres psql -U hellbender hellbender < backup.sql
```

### Reset Everything

```bash
# Stop all services and remove all data
docker compose down -v

# Remove all images
docker rmi ai-code-reviewer-backend ai-code-reviewer-frontend

# Start fresh
docker compose up --build
```

## Troubleshooting

### Containers Won't Start

1. Check if ports are already in use:
   ```bash
   lsof -i :5432 -i :3001 -i :5173 -i :80
   ```

2. Check container logs for errors:
   ```bash
   docker compose logs
   ```

3. Verify environment variables are set:
   ```bash
   docker compose config
   ```

### Database Connection Issues

1. Ensure PostgreSQL container is healthy:
   ```bash
   docker compose ps
   ```

2. Wait for PostgreSQL to fully start:
   ```bash
   docker compose logs postgres | grep "database system is ready"
   ```

3. Check database connection:
   ```bash
   docker exec -it hellbender-postgres pg_isready -U hellbender
   ```

### Frontend Not Loading

1. Check if frontend container is running:
   ```bash
   docker compose ps frontend
   ```

2. Check frontend logs:
   ```bash
   docker compose logs frontend
   ```

3. Verify Vite is running on the correct port:
   ```bash
   docker exec -it hellbender-frontend netstat -tlnp
   ```

### Backend API Not Responding

1. Check backend health:
   ```bash
   curl http://localhost:3001/health
   ```

2. Check backend logs:
   ```bash
   docker compose logs backend
   ```

3. Verify environment variables:
   ```bash
   docker exec -it hellbender-backend env | grep -E "(DATABASE|PORT|NODE_ENV)"
   ```

### Permission Issues with Volumes

If you encounter permission errors with mounted volumes:

```bash
# Fix permissions on mounted directories
sudo chown -R $(id -u):$(id -g) backend/src frontend/src
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | hellbender | PostgreSQL username |
| `POSTGRES_PASSWORD` | password | PostgreSQL password |
| `POSTGRES_DB` | hellbender | PostgreSQL database name |
| `DATABASE_URL` | postgresql://hellbender:password@postgres:5432/hellbender | Full database connection URL |
| `PERSISTENT_REPOS_PATH` | /data/repos | Path for persistent repository storage |
| `NODE_ENV` | development | Environment mode (development/production) |
| `PORT` | 3001 | Backend server port |
| `OPENROUTER_API_KEY` | - | OpenRouter API key (required) |
| `GITHUB_ACCESS_TOKEN` | - | GitHub access token (optional, for private repos) |
| `ENCRYPTION_KEY` | - | Encryption key for saved repos (required) |
| `SITE_URL` | http://localhost:5173 | Site URL for OpenRouter referrer |

## Production Considerations

1. **Change Default Passwords**: Update `POSTGRES_PASSWORD` and `ENCRYPTION_KEY` in `.env`

2. **Use Secure API Keys**: Never commit `.env` to version control

3. **Enable HTTPS**: Configure Nginx with SSL certificates

4. **Database Backup**: Set up regular database backups

5. **Resource Limits**: Consider adding resource limits to docker-compose.yml:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

6. **Logging**: Configure log rotation for production

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │       │
│  │  (Vite/Nginx)│  │   (Node.js)  │  │   (Postgres) │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └────────────────┼─────────────────┘                │
│                          │                                  │
│                    ┌─────┴─────┐                           │
│                    │  Network  │                           │
│                    │  Bridge   │                           │
│                    └───────────┘                           │
└─────────────────────────────────────────────────────────────┘
         │                    │
    ┌────┴────┐          ┌────┴────┐
    │  Ports  │          │ Volumes │
    │  80/5173│          │ pg_data │
    └─────────┘          │ repos   │
                         └─────────┘
```

## Support

If you encounter issues:
1. Check the logs: `docker compose logs`
2. Verify your `.env` configuration
3. Ensure all required ports are available
4. Check the main project [README.md](../README.md)
