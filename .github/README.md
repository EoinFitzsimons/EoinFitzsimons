# GitHub Actions Setup

This repository now includes a GitHub Actions workflow to generate the contribution snake animation.

## What the workflow does:
- Runs automatically every 12 hours
- Generates both light and dark theme snake animations
- Saves them to the `output` branch

## To activate:
1. Commit and push these changes to your GitHub repository
2. Go to your repository on GitHub
3. Click on "Actions" tab
4. You should see the "Generate Snake Game" workflow
5. Click "Run workflow" to trigger it manually the first time

## Files added:
- `.github/workflows/snake.yml` - The GitHub Actions workflow

The snake animation will be available at:
- Light theme: `https://raw.githubusercontent.com/EoinFitzsimons/EoinFitzsimons/output/github-contribution-grid-snake.svg`
- Dark theme: `https://raw.githubusercontent.com/EoinFitzsimons/EoinFitzsimons/output/github-contribution-grid-snake-dark.svg`

Once the workflow runs successfully, the snake animation in your README will start working!