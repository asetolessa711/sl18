# SL18 Render Stack - Deployment Guide

**Phase 8: Scaling & Deployment**

This guide covers deploying the SL18 Render Stack to production environments using Docker and Kubernetes.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker Compose)](#quick-start-docker-compose)
3. [Production Deployment (Kubernetes)](#production-deployment-kubernetes)
4. [Configuration](#configuration)
5. [Monitoring Setup](#monitoring-setup)
6. [Scaling](#scaling)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software Requirements

- **Docker** 20.10+ with Docker Compose v2
- **Kubernetes** 1.25+ (for production)
- **kubectl** configured for your cluster
- **Helm** 3.x (optional, for monitoring stack)
- **Node.js** 20+ (for local development)

### Infrastructure Requirements

- **Control Panel**: 2 vCPU, 512MB RAM per replica
- **Render Worker**: 4 vCPU, 4GB RAM per replica (ffmpeg-intensive)
- **Publishing Manager**: 2 vCPU, 512MB RAM per replica
- **Storage**: 200GB+ for renders, 10GB for logs

---

## Quick Start (Docker Compose)

### 1. Clone and Configure

```bash
cd sl18
cp .env.example .env
# Edit .env with your API keys
```

### 2. Build and Start

```bash
cd deploy/docker
docker compose up -d
```

### 3. Verify Deployment

```bash
# Check container health
docker compose ps

# View logs
docker compose logs -f control-panel

# Access the dashboard
open http://localhost:5178
```

### 4. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| Control Panel | http://localhost:5178 | Main dashboard |
| Render Worker | http://localhost:3001 | Render API |
| Publishing Manager | http://localhost:3002 | Publishing API |
| Prometheus | http://localhost:9090 | Metrics |
| Grafana | http://localhost:3000 | Dashboards |

---

## Production Deployment (Kubernetes)

### 1. Create Namespace

```bash
kubectl apply -f deploy/kubernetes/namespace.yaml
```

### 2. Create Secrets

```bash
# Create secrets from .env file
kubectl create secret generic sl18-secrets \
  --from-literal=airtable-api-key="$AIRTABLE_API_KEY" \
  --from-literal=airtable-base-id="$AIRTABLE_BASE_ID" \
  --from-literal=youtube-api-key="$YOUTUBE_API_KEY" \
  --from-literal=facebook-access-token="$FACEBOOK_ACCESS_TOKEN" \
  --from-literal=facebook-page-id="$FACEBOOK_PAGE_ID" \
  --from-literal=instagram-access-token="$INSTAGRAM_ACCESS_TOKEN" \
  --from-literal=instagram-user-id="$INSTAGRAM_USER_ID" \
  -n sl18
```

### 3. Create ConfigMap

```bash
kubectl apply -f deploy/kubernetes/configmap-secrets.yaml
```

### 4. Create Storage

```bash
kubectl apply -f deploy/kubernetes/storage.yaml
```

### 5. Deploy Services

```bash
kubectl apply -f deploy/kubernetes/control-panel.yaml
kubectl apply -f deploy/kubernetes/render-worker.yaml
kubectl apply -f deploy/kubernetes/publishing-manager.yaml
```

### 6. Configure Ingress

```bash
kubectl apply -f deploy/kubernetes/ingress.yaml
```

### 7. Verify Deployment

```bash
# Check pod status
kubectl get pods -n sl18

# Check services
kubectl get svc -n sl18

# View logs
kubectl logs -f deployment/control-panel -n sl18
```

---

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SL18_PANEL_PORT` | No | Control panel port | `5178` |
| `RENDER_WORKER_PORT` | No | Render worker port | `3001` |
| `PUBLISH_WORKER_PORT` | No | Publishing port | `3002` |
| `NODE_ENV` | No | Environment | `development` |
| `AIRTABLE_API_KEY` | Yes | Airtable API key | - |
| `AIRTABLE_BASE_ID` | Yes | Airtable base ID | - |
| `YOUTUBE_API_KEY` | Yes | YouTube Data API key | - |
| `FACEBOOK_ACCESS_TOKEN` | Yes | Meta Graph API token | - |
| `FACEBOOK_PAGE_ID` | Yes | Facebook Page ID | - |
| `INSTAGRAM_ACCESS_TOKEN` | Yes | Instagram API token | - |
| `INSTAGRAM_USER_ID` | Yes | Instagram User ID | - |
| `STORAGE_PROVIDER` | No | Storage adapter | `local` |
| `MAX_CONCURRENT_RENDERS` | No | Max parallel renders | `4` |
| `FFMPEG_PATH` | No | Path to ffmpeg binary | `/usr/bin/ffmpeg` |

### Storage Configuration

#### Local Storage (Development)
```env
STORAGE_PROVIDER=local
STORAGE_PATH=/app/storage
```

#### Azure Blob Storage
```env
STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=sl18-renders
```

#### AWS S3
```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=sl18-renders
```

---

## Monitoring Setup

### Prometheus + Grafana Stack

1. **Deploy Prometheus**:
```bash
kubectl apply -f deploy/monitoring/prometheus.yml
```

2. **Access Grafana**:
- URL: http://localhost:3000
- Default credentials: admin / sl18admin

3. **Import Dashboards**:
The SL18 Overview dashboard is auto-provisioned at startup.

### Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `sl18_render_queue_depth` | Jobs waiting to render | >50 warning, >100 critical |
| `sl18_render_active_jobs` | Currently rendering | - |
| `sl18_render_avg_time_seconds` | Average render duration | >300s warning |
| `sl18_publish_queue_depth` | Jobs waiting to publish | >20 warning |
| `sl18_qc_pending_review` | Episodes needing review | >25 warning |
| `sl18_memory_usage_percent` | Memory utilization | >85% warning |

### Alert Configuration

Alerts are defined in `deploy/monitoring/alerts/sl18-alerts.yml`. Customize thresholds as needed.

---

## Scaling

### Horizontal Pod Autoscaler

The render-worker deployment includes an HPA that scales based on CPU/memory:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Manual Scaling

```bash
# Scale render workers
kubectl scale deployment render-worker --replicas=5 -n sl18

# Via System API
curl -X POST http://localhost:5178/api/system/scale \
  -H "Content-Type: application/json" \
  -d '{"action": "scale-up", "nodeRole": "render", "targetCount": 5}'
```

### Scaling Recommendations

The system provides automatic scaling recommendations:

```bash
curl "http://localhost:5178/api/system/scale/recommendation?queueDepth=100&activeJobs=4"
```

---

## Security Considerations

### 1. Secrets Management

- Never commit secrets to version control
- Use Kubernetes Secrets or external secret managers (Vault, AWS Secrets Manager)
- Rotate API tokens regularly (90-day warning built-in)

### 2. Network Security

- Enable TLS/SSL in production
- Use NetworkPolicy to restrict pod-to-pod communication
- Place API behind rate limiting (nginx config included)

### 3. Container Security

- Containers run as non-root user (uid 1001)
- Read-only root filesystem where possible
- No privilege escalation

### 4. Rate Limiting

Nginx is configured with rate limits:
- API endpoints: 50 req/s per IP
- Publishing endpoints: 10 req/s per IP
- Connection limit: 50 concurrent per IP

---

## Troubleshooting

### Common Issues

#### 1. Render Jobs Stuck in Queue

```bash
# Check render worker logs
kubectl logs -f deployment/render-worker -n sl18

# Verify ffmpeg is available
kubectl exec -it deployment/render-worker -n sl18 -- ffmpeg -version

# Check queue status
curl http://localhost:5178/api/render/queue
```

#### 2. Publishing Failures

```bash
# Check publishing logs
kubectl logs -f deployment/publishing-manager -n sl18

# Verify API credentials
curl http://localhost:5178/api/credentials/status

# Check recent errors
curl "http://localhost:5178/api/system/logs?level=error&source=publish&limit=20"
```

#### 3. High Memory Usage

```bash
# Check resource usage
kubectl top pods -n sl18

# Review health checks
curl http://localhost:5178/api/system/health

# Scale up if needed
kubectl scale deployment render-worker --replicas=4 -n sl18
```

#### 4. Storage Issues

```bash
# Check storage status
curl http://localhost:5178/api/storage/status

# Verify PVC binding
kubectl get pvc -n sl18

# Check disk usage
kubectl exec -it deployment/control-panel -n sl18 -- df -h /app/storage
```

### Log Analysis

```bash
# Query system logs
curl "http://localhost:5178/api/system/logs?level=error&limit=50"

# Get log summary
curl http://localhost:5178/api/system/logs/summary

# Filter by job
curl "http://localhost:5178/api/system/logs?jobId=job-123"
```

### Health Checks

```bash
# Full health report
curl http://localhost:5178/api/system/health

# Deployment info
curl http://localhost:5178/api/system/deployment

# Node registry
curl http://localhost:5178/api/system/nodes
```

---

## CI/CD Integration

### GitHub Actions

A sample workflow for building and deploying:

```yaml
name: Deploy SL18

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker images
        run: |
          docker build -f deploy/docker/Dockerfile.control-panel -t sl18/control-panel .
          docker build -f deploy/docker/Dockerfile.render-worker -t sl18/render-worker .
          docker build -f deploy/docker/Dockerfile.publishing-manager -t sl18/publishing-manager .
      
      - name: Push to registry
        run: |
          docker push sl18/control-panel
          docker push sl18/render-worker
          docker push sl18/publishing-manager
      
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f deploy/kubernetes/ -n sl18
          kubectl rollout status deployment/control-panel -n sl18
```

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review logs via `/api/system/logs`
- Open an issue in the repository
