# npm Installation Guide

To proceed with the build_css task, we need to install Node.js and npm (Node Package Manager). This guide provides instructions for installing Node.js and npm on macOS.

## Installing Node.js and npm on macOS

### Option 1: Using Homebrew (Recommended)

[Homebrew](https://brew.sh/) is a package manager for macOS that makes it easy to install software. If you don't have Homebrew installed, you can install it with:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Once Homebrew is installed, you can install Node.js (which includes npm) with:

```bash
brew install node
```

### Option 2: Using the Official Installer

1. Visit the [Node.js download page](https://nodejs.org/en/download/)
2. Download the macOS Installer (.pkg)
3. Run the installer and follow the installation wizard

### Option 3: Using Node Version Manager (nvm)

If you need to work with multiple versions of Node.js, you might want to use nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

After installing nvm, restart your terminal and install Node.js:

```bash
nvm install node  # Installs the latest version
```

## Verifying the Installation

After installation, verify that Node.js and npm are installed correctly:

```bash
node --version
npm --version
```

Both commands should display version numbers if the installation was successful.

## Next Steps

Once Node.js and npm are installed, you can run the build_css.sh script to build the CSS files:

```bash
./modules/module1_foundation/build_css.sh
```

This will install the required npm packages (tailwindcss, postcss, autoprefixer, cssnano) and build the CSS files for the application.

## Why npm is Important for This Project

Using npm and Node.js for this project follows best practices for modern web development because:

1. **Tailwind CSS**: Tailwind CSS is built on Node.js and requires npm for installation and building
2. **PostCSS**: PostCSS is a tool for transforming CSS with JavaScript plugins, which requires npm
3. **Build Process**: Modern CSS build processes (minification, purging, etc.) rely on npm packages
4. **Consistency**: Using npm ensures consistent builds across different environments
5. **Dependency Management**: npm makes it easy to manage and update dependencies

By installing npm and following the build process in the script, we ensure that the CSS is built according to best practices, with proper optimization for production.