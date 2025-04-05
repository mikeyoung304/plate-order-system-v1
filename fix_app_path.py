#!/usr/bin/env python
import os
import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_init_files():
    """Create __init__.py files to ensure proper Python package structure"""
    project_root = Path.cwd()
    logger.info(f"Project root: {project_root}")
    
    # Define directories that need to be proper Python packages
    dirs_to_fix = [
        "src",
        "src/app",
        "src/app/api",
        "src/app/models",
        "src/app/db"
    ]
    
    # Create directories if they don't exist and add __init__.py files
    for dir_path in dirs_to_fix:
        full_path = project_root / dir_path
        if not full_path.exists():
            logger.warning(f"Directory {dir_path} doesn't exist. Creating it...")
            full_path.mkdir(parents=True, exist_ok=True)
        
        init_file = full_path / "__init__.py"
        if not init_file.exists():
            logger.info(f"Creating {init_file}")
            with open(init_file, 'w') as f:
                f.write("# This file makes the directory a proper Python package\n")
        else:
            logger.info(f"{init_file} already exists")
    
    # Create a root package __init__.py to fix import issues with src module
    if not (project_root / "__init__.py").exists():
        logger.info("Creating root __init__.py")
        with open(project_root / "__init__.py", 'w') as f:
            f.write("# Root package initialization\n")
    
    # Create a .env file with proper Python path
    env_file = project_root / ".env"
    if not env_file.exists() or 'PYTHONPATH' not in open(env_file).read():
        logger.info("Creating/updating .env file with PYTHONPATH")
        with open(env_file, 'a') as f:
            f.write(f"\n# Added by fix_app_path.py\nPYTHONPATH={project_root}\n")
    
    logger.info("Python package structure fixed successfully")
    return True

if __name__ == "__main__":
    logger.info("Fixing Python package structure...")
    if create_init_files():
        logger.info("Python path and package structure fixed successfully")
        sys.exit(0)
    else:
        logger.error("Failed to fix Python package structure")
        sys.exit(1) 