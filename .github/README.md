# 🚀 GitHub Actions Workflows

This directory contains automated CI/CD workflows for the Opinion Front UI project.

## 📋 Available Workflows

### 1. 🔄 CI Pipeline (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests, Manual dispatch

**Jobs:**
- **🔍 Code Quality**: ESLint, TypeScript compilation, security audit
- **🧪 Tests**: Runs tests across Node.js 16, 18, 20 with coverage reporting
- **🏗️ Build**: Creates production build with bundle size analysis
- **🚀 Preview Deploy**: Deploys PR previews (placeholder for actual deployment)
- **🚀 Production Deploy**: Deploys to production on main branch pushes
- **📢 Notifications**: Pipeline status reporting

**Features:**
- ✅ Multi-version Node.js testing
- ✅ Code coverage with Codecov integration
- ✅ Bundle size tracking
- ✅ Automated deployment pipeline
- ✅ Rich step summaries

### 2. 🏷️ Release Pipeline (`release.yml`)
**Triggers:** Version tags (`v*.*.*`), Manual dispatch with version bump

**Jobs:**
- **🚀 Create Release**: Automated release creation with changelog generation

**Features:**
- ✅ Semantic version bumping (patch/minor/major)
- ✅ Automatic changelog generation from git commits
- ✅ Release asset creation (tar.gz, zip)
- ✅ GitHub release creation
- ✅ Manual release triggering

**Usage:**
```bash
# Create a release manually via GitHub UI
# Go to Actions → Release Pipeline → Run workflow
# Select: patch, minor, or major

# Or create a release via git tag
git tag v1.2.3
git push origin v1.2.3
```

### 3. 🔍 CodeQL Security Analysis (`codeql.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests, Weekly schedule

**Jobs:**
- **🔍 CodeQL Analysis**: JavaScript/TypeScript security and quality analysis

**Features:**
- ✅ Automated security vulnerability detection
- ✅ Code quality analysis
- ✅ Weekly scheduled scans
- ✅ Integration with GitHub Security tab

### 4. 📦 Dependabot (`dependabot.yml`)
**Triggers:** Weekly schedule (Mondays 9:00 AM)

**Features:**
- ✅ Automated dependency updates for npm packages
- ✅ GitHub Actions updates
- ✅ Weekly update schedule
- ✅ Automatic PR creation with proper labeling
- ✅ Auto-assignment and review requests

## 🔧 Configuration

### Environment Variables
```yaml
NODE_VERSION: '18'          # Primary Node.js version
CACHE_NAME: 'node-modules-v1'  # Cache key for dependencies
```

### Required Secrets
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- Add deployment-specific secrets as needed (e.g., `DEPLOY_KEY`, `SERVER_HOST`)

### Required Permissions
The workflows require the following permissions:
- `contents: write` - For creating releases and pushing tags
- `pull-requests: write` - For PR comments and updates
- `security-events: write` - For CodeQL security analysis

## 🎯 Usage Examples

### Running CI Pipeline
```bash
# Triggered automatically on:
git push origin main        # Runs full CI + production deploy
git push origin develop     # Runs CI only
# Pull requests to main/develop also trigger CI
```

### Creating a Release
```bash
# Option 1: Manual workflow dispatch
# Go to GitHub → Actions → Release Pipeline → Run workflow

# Option 2: Git tag
git tag v1.2.3
git push origin v1.2.3
```

### Monitoring Workflows
- **Status**: Check the Actions tab in your GitHub repository
- **Badges**: Add workflow status badges to your README
- **Notifications**: Configure repository settings for workflow notifications

## 📊 Workflow Status Badges

Add these to your main README.md:

```markdown
[![CI Pipeline](https://github.com/your-username/opinion-front-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/opinion-front-ui/actions/workflows/ci.yml)
[![CodeQL](https://github.com/your-username/opinion-front-ui/actions/workflows/codeql.yml/badge.svg)](https://github.com/your-username/opinion-front-ui/actions/workflows/codeql.yml)
```

## 🔄 Customization

### Deployment Configuration
Update the deployment steps in `ci.yml`:

```yaml
# Replace placeholder deployment with actual deployment commands
- name: 🌍 Deploy to Production
  run: |
    # Add your deployment commands here
    # Example: rsync, docker push, kubectl apply, etc.
```

### Test Configuration
Modify test matrix in `ci.yml`:

```yaml
strategy:
  matrix:
    node-version: ['16', '18', '20']  # Adjust Node.js versions as needed
```

### Release Configuration
Customize release behavior in `release.yml`:

```yaml
# Modify commit message patterns for changelog generation
# Add custom release notes templates
# Configure additional release assets
```

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**: Check Node.js version compatibility
2. **Test Failures**: Verify test environment setup
3. **Permission Errors**: Ensure workflow permissions are correctly set
4. **Deployment Issues**: Check deployment credentials and target configuration

### Debug Steps
1. Check workflow logs in the Actions tab
2. Verify environment variables and secrets
3. Test commands locally before pushing
4. Review step summaries for detailed information

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)