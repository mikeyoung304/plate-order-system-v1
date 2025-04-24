// Basic Git workflow for syncing changes:

// On remote environment:
// 1. Commit your changes;
const git = "git"
const add = "add"
const commit = "commit"
const push = "push"
const pull = "pull" // Declare the pull variable
const m = "-m"
\
git add .
git commit -m "Made changes in remote environment"
git
push

// On local VSCode:
// 2. Pull the changes;
git
pull
