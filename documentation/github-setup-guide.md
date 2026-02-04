# GitHub Setup Guide - Complete Terminal Walkthrough

This guide will help you set up Git and GitHub from scratch using only the terminal.

---

## Step 1: Check if Git is Installed

First, let's see if Git is already installed on your system:

```bash
git --version
```

**If you see a version number** (like `git version 2.x.x`), Git is installed. Skip to Step 2.

**If you get "command not found"**, install Git:

```bash
# On Ubuntu/Debian Linux:
sudo apt update
sudo apt install git

# On Mac (if you have Homebrew):
brew install git
```

---

## Step 2: Configure Git (One-Time Setup)

Tell Git who you are. This info appears in your commits:

```bash
# Replace with YOUR name (the name you want to show in commits)
git config --global user.name "Your Name"

# Replace with YOUR email (use the same email as your GitHub account)
git config --global user.email "your.email@example.com"
```

Verify your settings:

```bash
git config --global --list
```

You should see your name and email listed.

---

## Step 3: Set Up GitHub Authentication

GitHub no longer accepts passwords for terminal operations. You need to authenticate. The easiest way is using **GitHub CLI**.

### Install GitHub CLI

```bash
# On Ubuntu/Debian Linux:
sudo apt update
sudo apt install gh

# If 'gh' isn't available, add the official repository first:
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### Login to GitHub

```bash
gh auth login
```

When prompted:
1. **What account?** → Select `GitHub.com`
2. **Preferred protocol?** → Select `HTTPS`
3. **Authenticate Git?** → Select `Yes`
4. **How to authenticate?** → Select `Login with a web browser`
5. You'll get a one-time code. Press Enter, then paste it in your browser
6. Authorize the app in your browser

Verify you're logged in:

```bash
gh auth status
```

---

## Step 4: Initialize Your Local Repository

Navigate to your project folder and initialize Git:

```bash
# Go to your project directory
cd /home/jcsiq98/Documents/mattock

# Initialize a new Git repository
git init
```

You should see: `Initialized empty Git repository in /home/jcsiq98/Documents/mattock/.git/`

---

## Step 5: Create a .gitignore File

This tells Git which files to ignore (like dependencies, build files, etc.):

```bash
# Create .gitignore file
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.vite/

# Environment files
.env
.env.local
.env.*.local

# IDE files
.idea/
.vscode/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/

# Database files (for backend)
*.sqlite
*.db

# Temporary files
tmp/
temp/
EOF
```

---

## Step 6: Create Your First Commit

A commit is like a "save point" in your project history.

```bash
# See what files Git detects
git status

# Add ALL files to staging (preparing them for commit)
git add .

# Check what's staged
git status

# Create your first commit with a message
git commit -m "Initial commit: Project documentation and setup"
```

---

## Step 7: Create Repository on GitHub

Now let's create a repository on GitHub directly from the terminal:

```bash
# Create a PUBLIC repository named 'mattock'
gh repo create mattock --public --source=. --remote=origin --push

# OR create a PRIVATE repository if you prefer:
# gh repo create mattock --private --source=. --remote=origin --push
```

**What this command does:**
- `gh repo create mattock` - Creates a repo named "mattock" on your GitHub
- `--public` - Makes it visible to everyone (or `--private` for only you)
- `--source=.` - Uses current directory as the source
- `--remote=origin` - Names the remote connection "origin"
- `--push` - Pushes your code immediately

---

## Step 8: Verify Everything Worked

```bash
# Check your remotes (connections to GitHub)
git remote -v

# You should see something like:
# origin  https://github.com/YOUR-USERNAME/mattock.git (fetch)
# origin  https://github.com/YOUR-USERNAME/mattock.git (push)

# View your commit history
git log --oneline
```

Visit your GitHub profile in a browser - you should see the new repository!

---

## Daily Workflow: Tracking Progress

### After completing work (like finishing a milestone):

```bash
# 1. See what changed
git status

# 2. Add all changes
git add .

# 3. Commit with a descriptive message
git commit -m "Complete Milestone 0: Project foundation setup"

# 4. Push to GitHub
git push
```

### Recommended commit messages for milestones:

```bash
git commit -m "Milestone 0: Project foundation and tooling setup"
git commit -m "Milestone 1: Implement IndexedDB storage layer"
git commit -m "Milestone 2: Add navigation and state management"
# etc.
```

---

## Useful Git Commands Reference

| Command | What it does |
|---------|--------------|
| `git status` | Shows changed/staged files |
| `git add .` | Stages all changes |
| `git add filename` | Stages specific file |
| `git commit -m "message"` | Saves staged changes with a message |
| `git push` | Uploads commits to GitHub |
| `git pull` | Downloads latest from GitHub |
| `git log --oneline` | Shows commit history (compact) |
| `git diff` | Shows what changed (before staging) |
| `git diff --staged` | Shows what's staged for commit |

---

## Creating Milestone Tags (Optional but Recommended)

Tags mark specific points in history. Great for milestones!

```bash
# After completing Milestone 0:
git tag -a v0.1.0 -m "Milestone 0: Project foundation complete"
git push origin v0.1.0

# After completing Milestone 1:
git tag -a v0.2.0 -m "Milestone 1: Storage layer complete"
git push origin v0.2.0

# List all tags
git tag
```

---

## Troubleshooting

### "Permission denied" error
Run `gh auth login` again and make sure to select "Yes" when asked to authenticate Git.

### "Repository already exists" error
The repo name is taken. Either:
- Use a different name: `gh repo create mattock-inspection --public --source=. --remote=origin --push`
- Or delete the existing one on GitHub first

### "Nothing to commit"
All your changes are already saved. This is fine!

### Need to undo last commit (before pushing)
```bash
git reset --soft HEAD~1
```

---

## Summary Checklist

- [ ] Git is installed (`git --version`)
- [ ] Git configured with name/email
- [ ] GitHub CLI installed (`gh --version`)
- [ ] Logged into GitHub (`gh auth login`)
- [ ] Repository initialized (`git init`)
- [ ] .gitignore created
- [ ] First commit made
- [ ] Repository created on GitHub
- [ ] Code pushed to GitHub

---

*You're all set! 🎉*

