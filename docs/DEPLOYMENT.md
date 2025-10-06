# 🚀 Deployment Strategy Documentation

This document describes the complete deployment strategy for Opinion Front UI, including Release → Staging → Production workflows and External Scheduler integration.

## 📋 Overview

We use a **release-driven deployment** approach:

1. **Release Creation** → Automatic staging deployment
2. **Manual/Scheduled Production** → Based on specific release
3. **External Scheduler** → Enterprise integration for automated deployments

## 🔄 Deployment Workflows

### 1. 🟡 **Staging Deployment** (Automatic)

**Trigger:** When you create a release
**File:** `.github/workflows/staging-deploy.yml`

```bash
# Create a release (triggers staging deployment automatically)
gh release create v1.2.3 --title "New Authentication System" --notes "Added OAuth integration"

# ✅ Automatically deploys v1.2.3 to staging environment
```

**What happens:**
1. Downloads release assets (or builds from source if no assets)
2. Validates build output
3. Deploys to staging environment
4. Runs health checks
5. Updates staging version tracking

### 2. 🟢 **Production Deployment** (Manual/Scheduled)

**Trigger:** Manual via GitHub UI or External Scheduler
**File:** `.github/workflows/production-deploy.yml`

#### Manual Deployment via GitHub UI:

1. Go to GitHub Actions → "Production Deployment"
2. Click "Run workflow" 
3. Fill in:
   - **Release tag**: `v1.2.3`
   - **Deployment notes**: "Weekly release"
   - **Scheduled time**: "Friday 6PM"

#### External Scheduler (Programmatic):

```bash
# Set your GitHub token
export GITHUB_TOKEN="your_github_token_here"

# Schedule production deployment
node scripts/external-scheduler.js \
  --release v1.2.3 \
  --environment production \
  --type scheduled \
  --notes "Weekly production release"

# Emergency deployment
node scripts/external-scheduler.js \
  --release v1.2.4 \
  --environment production \
  --type emergency \
  --notes "Critical security fix"
```

### 3. 📦 **Release Creation**

**File:** `.github/workflows/release.yml`

```bash
# Option 1: Create release via GitHub UI
# Go to Releases → "Create a new release"

# Option 2: Create release via CLI
gh release create v1.2.3 \
  --title "Version 1.2.3" \
  --notes "Bug fixes and performance improvements" \
  --generate-notes
```

## 🕒 **External Scheduler Integration**

### Cron Job Integration

```bash
# /etc/crontab or user crontab
# Deploy every Friday at 6 PM
0 18 * * 5 cd /path/to/repo && node scripts/external-scheduler.js --release $(cat LATEST_RELEASE) --environment production --type scheduled
```

### Jenkins Integration

```groovy
pipeline {
    agent any
    
    parameters {
        string(name: 'RELEASE_TAG', defaultValue: 'v1.0.0', description: 'Release to deploy')
        choice(name: 'ENVIRONMENT', choices: ['staging', 'production'], description: 'Target environment')
        choice(name: 'DEPLOYMENT_TYPE', choices: ['scheduled', 'hotfix', 'emergency'], description: 'Deployment type')
        string(name: 'NOTES', defaultValue: '', description: 'Deployment notes')
    }
    
    stages {
        stage('Trigger Deployment') {
            steps {
                sh """
                    export GITHUB_TOKEN=${env.GITHUB_TOKEN}
                    node scripts/external-scheduler.js \
                        --release ${params.RELEASE_TAG} \
                        --environment ${params.ENVIRONMENT} \
                        --type ${params.DEPLOYMENT_TYPE} \
                        --notes "${params.NOTES}" \
                        --scheduled_by "Jenkins Pipeline"
                """
            }
        }
    }
}
```

### AWS EventBridge / CloudWatch Integration

```python
import boto3
import subprocess
import os

def lambda_handler(event, context):
    """
    AWS Lambda function triggered by EventBridge/CloudWatch Events
    """
    release_tag = event.get('release_tag', 'v1.0.0')
    environment = event.get('environment', 'production')
    deployment_type = event.get('deployment_type', 'scheduled')
    
    # Set GitHub token from AWS Secrets Manager or environment
    github_token = os.environ.get('GITHUB_TOKEN')
    
    cmd = [
        'node', 'scripts/external-scheduler.js',
        '--release', release_tag,
        '--environment', environment,
        '--type', deployment_type,
        '--notes', f'AWS scheduled deployment of {release_tag}',
        '--scheduled_by', 'AWS Lambda'
    ]
    
    result = subprocess.run(cmd, 
                          env={**os.environ, 'GITHUB_TOKEN': github_token},
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        return {
            'statusCode': 200,
            'body': f'Deployment triggered successfully: {release_tag}'
        }
    else:
        return {
            'statusCode': 500,
            'body': f'Deployment failed: {result.stderr}'
        }
```

## 🔧 **Setup Instructions**

### 1. GitHub Token Setup

Create a GitHub Personal Access Token with these permissions:
- `repo` (Full repository access)
- `actions` (Workflow access)

```bash
# Set token in your environment
export GITHUB_TOKEN="ghp_your_token_here"

# Or in your CI/CD system
echo "GITHUB_TOKEN=ghp_your_token_here" >> ~/.env
```

### 2. Environment Setup

Create GitHub environments:

1. Go to Settings → Environments
2. Create `staging` environment (no protection rules)
3. Create `production` environment with:
   - Required reviewers (optional)
   - Deployment protection rules
   - Environment secrets if needed

### 3. Customize Deployment Scripts

Update the deployment commands in the workflow files:

**For Staging (`staging-deploy.yml` line 83-90):**
```yaml
- name: 🚀 Deploy to Staging
  run: |
    # Replace with your actual staging deployment
    rsync -avz --delete dist/ staging-server:/var/www/staging/
    # or
    aws s3 sync dist/ s3://staging-bucket/ --delete
    # or
    kubectl set image deployment/frontend app=opinion-front-ui:${{ steps.release.outputs.tag }}
```

**For Production (`production-deploy.yml` line 164-187):**
```yaml
- name: 🚀 Deploy to Production
  run: |
    # Replace with your actual production deployment
    rsync -avz --delete dist/ production-server:/var/www/production/
    # or
    aws s3 sync dist/ s3://production-bucket/ --delete
    # or
    kubectl set image deployment/frontend app=opinion-front-ui:${{ needs.validate-release.outputs.release_tag }}
```

## 📊 **Usage Examples**

### Complete Deployment Flow

```bash
# 1. Developer completes feature
git checkout main
git pull origin main

# 2. Create release (this automatically deploys to staging)
gh release create v1.3.0 \
  --title "User Profile Updates" \
  --notes "Enhanced user profile with avatar upload" \
  --generate-notes

# ✅ v1.3.0 is now live on staging

# 3. QA team tests on staging
curl https://staging.your-domain.com

# 4. Schedule production deployment for Friday 6 PM
node scripts/external-scheduler.js \
  --release v1.3.0 \
  --environment production \
  --type scheduled \
  --notes "Weekly release - user profile enhancements" \
  --scheduled_by "DevOps Team"

# ✅ Production deployment will be triggered
```

### Emergency Hotfix Flow

```bash
# 1. Create hotfix release
gh release create v1.3.1 \
  --title "Security Hotfix" \
  --notes "Fixed critical XSS vulnerability"

# 2. Deploy immediately to production
node scripts/external-scheduler.js \
  --release v1.3.1 \
  --environment production \
  --type emergency \
  --notes "Critical security fix - immediate deployment required"

# ✅ Emergency deployment triggered
```

### Rollback Flow

```bash
# Deploy previous known-good version
node scripts/external-scheduler.js \
  --release v1.2.9 \
  --environment production \
  --type rollback \
  --notes "Rolling back due to issues with v1.3.0" \
  --force true
```

## 🔍 **Monitoring and Troubleshooting**

### Deployment Status

```bash
# Check deployment status
gh run list --workflow="Production Deployment" --limit 5

# Watch specific deployment
gh run watch

# View deployment logs
gh run view <run_id>
```

### Environment Health Checks

```bash
# Check what's currently deployed
curl -s https://staging.your-domain.com/version.json
curl -s https://your-domain.com/version.json

# Compare versions
node scripts/external-scheduler.js --check-versions
```

### Common Issues

1. **Release not found**: Ensure release exists and has assets
2. **Permission denied**: Check GitHub token permissions
3. **Deployment failed**: Check workflow logs for specific errors
4. **Health checks failed**: Verify deployment and application status

## 🎯 **Benefits of This Approach**

- ✅ **Release-driven**: Clear versioning and tracking
- ✅ **Staging validation**: Every release tested before production
- ✅ **Scheduled deployments**: Business-friendly timing
- ✅ **External integration**: Works with existing CI/CD systems
- ✅ **Emergency handling**: Fast path for critical fixes
- ✅ **Audit trail**: Complete deployment history
- ✅ **Rollback ready**: Easy rollback to previous versions

This deployment strategy gives you enterprise-grade control while maintaining developer productivity! 🚀