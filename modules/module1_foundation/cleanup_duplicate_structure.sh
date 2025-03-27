#!/bin/bash

# Task: Cleanup Duplicate Structure
# This script removes the duplicate directory structure

echo "Starting task: Cleanup Duplicate Structure"
echo "=========================================="

# Check if duplicate directory exists
if [ -d "plate-order-system" ]; then
    echo "Duplicate directory 'plate-order-system' found"
    
    # Create backup before removing
    echo "Creating backup of duplicate directory..."
    backup_dir="backups/plate-order-system-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "backups"
    cp -r "plate-order-system" "$backup_dir"
    echo "Backup created at $backup_dir"
    
    # Remove duplicate directory
    echo "Removing duplicate directory..."
    rm -rf "plate-order-system"
    echo "Duplicate directory removed successfully"
else
    echo "No duplicate directory 'plate-order-system' found, skipping cleanup"
fi

# Check for any other duplicate structures
echo "Checking for other potential duplicate structures..."
# Add any additional cleanup logic here

echo "Task completed: Cleanup Duplicate Structure"
exit 0