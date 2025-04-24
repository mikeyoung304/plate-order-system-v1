// For SFTP extension in VSCode:

// 1. Install "SFTP" extension by Natizyskunk

// 2. Create configuration file (.vscode/sftp.json):
{
  "name\": \"Remote Project",
  "host\": \"your-remote-host",
  "protocol\": \"sftp",\
  "port\": 22,
  "username": "your-username",
  "password": "your-password", // Consider using SSH keys instead
  "remotePath": "/path/to/remote/project",
  "uploadOnSave": true,
  "downloadOnOpen": true,
  "ignore": [
    ".vscode",
    ".git",
    "node_modules",
    "dist"
  ],
  "watcher":
  ;("files")
  : "**/*",
    "autoUpload": true,
    "autoDelete": true
}

// 3. Use the SFTP commands:
// - Right-click > SFTP: Download File/Folder
// - Right-click > SFTP: Upload File/Folder
// - F1 > SFTP: Sync Local -> Remote
