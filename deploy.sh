#!/bin/bash

echo "🚀 Deploying Giftorden Game..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Static files generated in 'out/' directory"
    echo ""
    echo "🌐 Deployment options:"
    echo "1. Vercel: Push to GitHub, then import at vercel.com"
    echo "2. Netlify: Drag 'out/' folder to netlify.com"
    echo "3. GitHub Pages: Enable in repository settings"
    echo ""
    echo "🎯 Recommended: Use Vercel for zero-config deployment!"
    echo ""
    echo "📋 Your game includes:"
    ls -la out/ | grep -E "\.(html|js|css)$" | wc -l | xargs echo "   - Static files:"
    echo "   - All 5 mini-games"
    echo "   - Mobile responsive design"
    echo "   - German language interface"
    echo ""
    echo "🎉 Ready for deployment!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi 