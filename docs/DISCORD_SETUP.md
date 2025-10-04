# 🎮 Discord Notifications Setup

This guide shows how to set up Discord notifications for successful CI pipeline runs.

## 📋 Overview

The CI pipeline sends **success-only** notifications to Discord when:
- ✅ All quality checks, tests, and build pass
- 🚀 PR preview deployments are successful  
- 🌍 Production deployments complete successfully

**Failures are handled via email**, so Discord only celebrates successes! 🎉

## 🔧 Setup Steps

### 1. Create Discord Webhook

1. **Open your Discord server** where you want notifications
2. **Go to Server Settings** → **Integrations** → **Webhooks**
3. **Click "New Webhook"**
4. **Configure the webhook:**
   - **Name**: `Opinion Front UI CI` (or your preferred name)
   - **Channel**: Choose your development/notifications channel
   - **Avatar**: Optional - upload a CI/build icon
5. **Copy the webhook URL** (starts with `https://discord.com/api/webhooks/...`)

### 2. Add Webhook to GitHub Secrets

1. **Go to your GitHub repository**
2. **Navigate to Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add secret:**
   - **Name**: `DISCORD_WEBHOOK`
   - **Secret**: Paste the webhook URL from step 1
5. **Click "Add secret"**

### 3. Test the Setup

Create a test PR or push to main to trigger the CI pipeline. When successful, you should see a Discord message like:

```
✅ Success with Preview - CI Pipeline

Repository: inqwise-opinion/opinion-front-ui
Branch: feature/test-branch  
Event: pull_request
Commit: a1b2c3d

🔍 Quality Check: ✅ Passed
🧪 Tests: ✅ Passed  
🏗️ Build: ✅ Passed
🚀 Preview: ✅ Available (https://inqwise-opinion.github.io/opinion-front-ui/pr-123)

Triggered by your-username
```

## 📨 Notification Types

### 🚀 **PR with Preview** 
When a PR passes all checks and gets a preview deployment:
- Shows all job statuses
- Includes clickable preview URL
- Links to the GitHub commit

### 🌍 **Main Branch Deploy**
When main branch passes and deploys to production:
- Shows deployment success
- Confirms production release
- Links to workflow run

### ✅ **Regular Success**
When CI passes without deployment:
- Confirms all checks passed
- Shows job results
- Ready for next steps

## 🔧 Troubleshooting

### ❌ No Discord notifications
1. **Check webhook URL** - Make sure `DISCORD_WEBHOOK` secret is set correctly
2. **Verify channel permissions** - Bot needs permission to send messages
3. **Check workflow logs** - Look for Discord notification step failures
4. **Test webhook** - Use Discord's webhook test feature

### ❌ Webhook not working
1. **Regenerate webhook** - Create a new webhook in Discord
2. **Update secret** - Replace `DISCORD_WEBHOOK` with new URL
3. **Check expiration** - Webhooks can sometimes expire

### ❌ Wrong notifications
- **Getting failures**: Check your email setup - failures should go there
- **Missing previews**: Verify GitHub Pages is enabled in repo settings
- **Wrong channel**: Update webhook channel in Discord settings

## 🎨 Customization

To customize the Discord notifications, edit `.github/workflows/ci.yml`:

- **Change embed colors**: Modify the `color` field (green: 3066993)
- **Update message format**: Edit the embed `description` and `fields`  
- **Add more info**: Include additional workflow context
- **Change emojis**: Update field names and values

## 📚 Resources

- [Discord Webhooks Guide](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)  
- [GitHub Actions Discord Action](https://github.com/Ilshidur/action-discord)