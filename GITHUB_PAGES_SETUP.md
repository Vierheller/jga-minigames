# 🚀 GitHub Pages Deployment Setup

## 📋 Prerequisites
- GitHub repository for your project
- Code pushed to the `main` branch

## 🔧 Step-by-Step Setup

### 1. Enable GitHub Pages in Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under **Source**, select **GitHub Actions**
5. Click **Save**

### 2. Push Your Code

The GitHub Actions workflow is already configured! Just push your code:

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add GitHub Pages deployment"

# Push to main branch
git push origin main
```

### 3. Monitor Deployment

1. Go to the **Actions** tab in your repository
2. You'll see the "Deploy to GitHub Pages" workflow running
3. Wait for it to complete (usually 2-3 minutes)
4. Once complete, your game will be live!

## 🌐 Your Game URL

Your game will be available at:
```
https://[your-username].github.io/minigames
```

For example: `https://johndoe.github.io/minigames`

## 🔄 Automatic Deployments

Every time you push to the `main` branch:
- ✅ GitHub Actions automatically builds your game
- ✅ Deploys the latest version to GitHub Pages
- ✅ Your game is updated within minutes

## 🛠️ What the Workflow Does

1. **Checkout code** from your repository
2. **Setup Node.js** environment
3. **Install dependencies** (`npm ci`)
4. **Build the game** (`npm run build`)
5. **Deploy to GitHub Pages** automatically

## 🎯 Configuration Details

The setup includes:
- ✅ **Static export** configuration for GitHub Pages
- ✅ **Correct base path** handling (`/minigames`)
- ✅ **Asset prefix** for proper resource loading
- ✅ **Automatic deployments** on every push
- ✅ **Build optimization** for production

## 🔍 Troubleshooting

### If deployment fails:
1. Check the **Actions** tab for error messages
2. Ensure your repository is public (or you have GitHub Pro for private repos)
3. Verify GitHub Pages is enabled in repository settings

### If the game doesn't load:
1. Check browser console for errors
2. Verify the URL is correct: `https://[username].github.io/minigames`
3. Wait a few minutes for DNS propagation

### If assets don't load:
- The configuration handles this automatically with `basePath` and `assetPrefix`

## 🎉 Success!

Once deployed, your bachelor party game will be:
- ✅ **Live on the internet** at your GitHub Pages URL
- ✅ **Automatically updated** when you push changes
- ✅ **Mobile responsive** and ready to play
- ✅ **Completely free** to host

## 🔗 Next Steps

1. **Share the URL** with the bachelor party group
2. **Test all games** on different devices
3. **Make updates** by simply pushing to the main branch
4. **Optional**: Set up a custom domain if desired

Your Giftorden game is now ready for the bachelor party! 🎮🎉 