#!/usr/bin/env python
"""
Project Structure Fixer - Properly resolves Python module structure issues

This script:
1. Correctly establishes the Python module structure
2. Modifies imports in Python files to use the correct path
3. Sets up a proper package structure without symlinks or hacks
"""

import os
import sys
import re
from pathlib import Path
import shutil

# Get the project root directory
project_root = Path.cwd()
src_app_dir = project_root / "src" / "app"
root_app_dir = project_root / "app"

# Check if we need to run this fix
if not src_app_dir.exists():
    print("src/app directory not found. Nothing to fix.")
    sys.exit(0)

print("=== Project Structure Fix ===")
print(f"Project root: {project_root}")

# Step 1: Create __init__.py files to establish proper package structure
def create_init_files():
    """
    Create __init__.py files in all necessary directories to establish 
    proper Python package structure.
    """
    print("\n1. Creating Python package structure...")
    
    # Initialize all directories under src
    for dir_path in [project_root / "src"] + list((project_root / "src").glob("**/*/")) + [project_root]:
        if dir_path.is_dir() and dir_path.name != "__pycache__" and not dir_path.name.startswith("."):
            init_file = dir_path / "__init__.py"
            if not init_file.exists():
                with init_file.open("w") as f:
                    f.write("# Python package\n")
                print(f"  Created {init_file.relative_to(project_root)}")

    print("  Package structure complete")
    return True

# Step 2: Standardize on either src/app or app (we'll use src/app)
def standardize_directory_structure():
    """
    Standardize the directory structure by making src/app the primary code location.
    If app/ exists at the root level, ensure it's properly linked or merged with src/app.
    """
    print("\n2. Standardizing directory structure...")
    
    # If root app directory exists, merge its contents with src/app
    if root_app_dir.exists() and src_app_dir.exists():
        for item in root_app_dir.glob('**/*'):
            if item.is_file():
                # Calculate relative path from app/ and recreate in src/app/
                rel_path = item.relative_to(root_app_dir)
                target_path = src_app_dir / rel_path
                
                # Create parent directories if they don't exist
                target_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Only copy if the file doesn't exist or is different
                if not target_path.exists() or item.stat().st_mtime > target_path.stat().st_mtime:
                    shutil.copy2(item, target_path)
                    print(f"  Copied {rel_path} to src/app/{rel_path}")
        
        # Rename the original app directory to app.bak to avoid confusion
        print("  Renaming app/ to app.bak/")
        try:
            if (project_root / "app.bak").exists():
                shutil.rmtree(project_root / "app.bak")
            root_app_dir.rename(project_root / "app.bak")
        except Exception as e:
            print(f"  Warning: Could not rename app directory: {e}")
            print("  You might need to manually delete or rename it later.")
    
    print("  Directory structure standardized")
    return True

# Step 3: Fix imports in all Python files
def fix_imports():
    """
    Update imports in all Python files to use the correct module path.
    """
    print("\n3. Fixing imports in Python files...")
    
    # Patterns to look for and replace
    patterns = [
        (r"from app\.", "from src.app."),  # Fix imports from app -> src.app
        (r"import app\.", "import src.app.")   # Fix direct imports
    ]
    
    # Find all Python files but skip venv
    skip_dirs = {"venv", "__pycache__", "node_modules", ".git"}
    modified_files = 0
    
    # Process Python files
    for py_file in project_root.glob("**/*.py"):
        # Skip files in venv and other specific directories
        if any(skip_dir in py_file.parts for skip_dir in skip_dirs):
            continue
            
        # Skip unmodifiable files
        if not os.access(py_file, os.W_OK):
            print(f"  Warning: Cannot modify {py_file.relative_to(project_root)} (no write permission)")
            continue
            
        # Read and potentially modify file
        with py_file.open("r", encoding="utf-8") as f:
            content = f.read()
            
        # Check for our patterns
        original_content = content
        for pattern, replacement in patterns:
            content = re.sub(pattern, replacement, content)
            
        # If changes were made, write back the file
        if content != original_content:
            with py_file.open("w", encoding="utf-8") as f:
                f.write(content)
            print(f"  Updated imports in {py_file.relative_to(project_root)}")
            modified_files += 1
    
    print(f"  Modified {modified_files} files")
    return True

# Step 4: Update main.py to handle new imports
def update_main_file():
    """
    Update the main.py file to use the correct import structure.
    """
    print("\n4. Updating main application file...")
    
    main_py = project_root / "main.py"
    if main_py.exists():
        with main_py.open("r", encoding="utf-8") as f:
            content = f.read()
            
        # Update imports in main.py
        content = re.sub(r"from app\.", "from src.app.", content)
        content = re.sub(r"import app\.", "import src.app.", content)
        
        with main_py.open("w", encoding="utf-8") as f:
            f.write(content)
        print("  Updated main.py with correct imports")
    else:
        print("  Warning: main.py not found in project root")
    
    return True

# Create PYTHONPATH setup file
def create_env_setup():
    """
    Create environment setup files to ensure PYTHONPATH is properly set
    """
    print("\n5. Creating environment setup files...")
    
    # Create .env file with PYTHONPATH
    env_file = project_root / ".env"
    env_content = f"""# Environment configuration
PYTHONPATH={project_root}
DATABASE_URL=sqlite:///./restaurant.db
# Node memory setting for building frontend
NODE_OPTIONS=--max-old-space-size=8192
# App settings
PORT=10000
"""
    
    with env_file.open("w") as f:
        f.write(env_content)
    print("  Created .env with PYTHONPATH and other settings")
    
    # Create a shell script to set up environment
    setup_sh = project_root / "setup_env.sh"
    setup_content = f"""#!/bin/bash
# Environment setup script for Plate Order System
export PYTHONPATH="{project_root}"
export DATABASE_URL="sqlite:///./restaurant.db"
export NODE_OPTIONS="--max-old-space-size=8192"
export PORT="10000"

echo "Environment variables set:"
echo "  PYTHONPATH=$PYTHONPATH"
echo "  DATABASE_URL=$DATABASE_URL"
echo "  NODE_OPTIONS=$NODE_OPTIONS"
echo "  PORT=$PORT"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "Virtual environment activated"
fi

# Execute command if provided
if [ $# -gt 0 ]; then
    exec "$@"
fi
"""
    
    with setup_sh.open("w") as f:
        f.write(setup_content)
    os.chmod(setup_sh, 0o755)  # Make executable
    print("  Created setup_env.sh script")
    
    return True

# Run the fix functions
if __name__ == "__main__":
    try:
        create_init_files()
        # standardize_directory_structure() # Comment out conflicting step
        fix_imports()
        update_main_file()
        create_env_setup()
        
        print("\n=== Project structure fix completed successfully ===")
        print("To run your application with the correct environment:")
        print("  source setup_env.sh && python main.py")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1) 