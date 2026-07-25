# Publish ResumeForge with GitHub Pages

The project includes `.github/workflows/deploy.yml`. Every push to `main` runs all tests, builds the app, and publishes `dist` to GitHub Pages.

## One-time setup

1. Install Git and the GitHub CLI from their official installers.
2. Open a terminal in the `source` folder from the ResumeForge package.
3. Authenticate:

```bash
gh auth login
```

4. Create and publish the repository:

```bash
git init
git add .
git commit -m "Publish tested ResumeForge v10"
git branch -M main
gh repo create ResumeForge --public --source=. --remote=origin --push
```

5. In the GitHub repository, open **Settings > Pages** and set **Source** to **GitHub Actions**.
6. Open the **Actions** tab and wait for **Deploy ResumeForge to GitHub Pages** to complete. The deployment will show the public URL.

## Security

Never commit AI API keys. ResumeForge keeps entered keys only in the current browser tab. For a public multi-user site, use an authenticated server-side proxy with rate limits and secret storage instead of asking users to expose a shared provider key in frontend code.

The current Codex machine could not publish automatically because GitHub CLI is not installed and this folder has no Git remote. The application and deployment workflow are otherwise ready.
