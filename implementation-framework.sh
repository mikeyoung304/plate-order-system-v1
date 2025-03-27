#!/bin/bash

# Plate Order System Implementation Framework
# This script provides a resilient framework for implementing the system in small, manageable chunks

# Configuration
LOG_DIR="./logs"
CHECKPOINT_DIR="./checkpoints"
MODULES_DIR="./modules"
CONFIG_FILE="./implementation-config.json"
CURRENT_MODULE=""
CURRENT_TASK=""
MAX_RETRIES=3

# Ensure required directories exist
mkdir -p "$LOG_DIR"
mkdir -p "$CHECKPOINT_DIR"
mkdir -p "$MODULES_DIR"

# Initialize logging
LOG_FILE="$LOG_DIR/implementation-$(date +%Y%m%d-%H%M%S).log"
touch "$LOG_FILE"

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Create initial config if it doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
    log "INFO" "Creating initial configuration file"
    cat > "$CONFIG_FILE" << EOF
{
    "last_completed_module": "",
    "last_completed_task": "",
    "modules_status": {
        "module1_foundation": {
            "status": "pending",
            "tasks_completed": []
        },
        "module2_server_view": {
            "status": "pending",
            "tasks_completed": []
        },
        "module3_kitchen_view": {
            "status": "pending",
            "tasks_completed": []
        },
        "module4_admin_dashboard": {
            "status": "pending",
            "tasks_completed": []
        },
        "module5_backend_api": {
            "status": "pending",
            "tasks_completed": []
        },
        "module6_security": {
            "status": "pending",
            "tasks_completed": []
        },
        "module7_cicd": {
            "status": "pending",
            "tasks_completed": []
        },
        "module8_testing": {
            "status": "pending",
            "tasks_completed": []
        }
    }
}
EOF
fi

# Function to create a checkpoint
create_checkpoint() {
    local module="$1"
    local task="$2"
    local checkpoint_file="$CHECKPOINT_DIR/${module}_${task}_$(date +%Y%m%d-%H%M%S).checkpoint"
    
    log "INFO" "Creating checkpoint for $module - $task"
    
    # Update config file
    local temp_config=$(mktemp)
    jq --arg module "$module" --arg task "$task" \
       '.last_completed_module = $module | .last_completed_task = $task | .modules_status[$module].tasks_completed += [$task]' \
       "$CONFIG_FILE" > "$temp_config" && mv "$temp_config" "$CONFIG_FILE"
    
    # Create checkpoint file with timestamp
    echo "Checkpoint created at $(date)" > "$checkpoint_file"
    echo "Module: $module" >> "$checkpoint_file"
    echo "Task: $task" >> "$checkpoint_file"
    
    log "INFO" "Checkpoint created: $checkpoint_file"
}

# Function to mark a module as complete
mark_module_complete() {
    local module="$1"
    
    log "INFO" "Marking module $module as complete"
    
    # Update config file
    local temp_config=$(mktemp)
    jq --arg module "$module" '.modules_status[$module].status = "completed"' \
       "$CONFIG_FILE" > "$temp_config" && mv "$temp_config" "$CONFIG_FILE"
    
    log "SUCCESS" "Module $module completed successfully"
}

# Function to run a task with error handling and retries
run_task() {
    local module="$1"
    local task="$2"
    local task_script="$MODULES_DIR/${module}/${task}.sh"
    local retry_count=0
    
    CURRENT_MODULE="$module"
    CURRENT_TASK="$task"
    
    log "INFO" "Starting task: $module - $task"
    
    # Check if task script exists
    if [ ! -f "$task_script" ]; then
        log "ERROR" "Task script not found: $task_script"
        return 1
    fi
    
    # Make script executable
    chmod +x "$task_script"
    
    # Run the task with retries
    while [ $retry_count -lt $MAX_RETRIES ]; do
        log "INFO" "Executing task (attempt $((retry_count+1))): $task"
        
        # Execute the task script
        if bash "$task_script" >> "$LOG_FILE" 2>&1; then
            log "SUCCESS" "Task completed successfully: $module - $task"
            create_checkpoint "$module" "$task"
            return 0
        else
            retry_count=$((retry_count+1))
            log "WARNING" "Task failed (attempt $retry_count): $module - $task"
            
            if [ $retry_count -lt $MAX_RETRIES ]; then
                log "INFO" "Retrying in 5 seconds..."
                sleep 5
            else
                log "ERROR" "Task failed after $MAX_RETRIES attempts: $module - $task"
                return 1
            fi
        fi
    done
    
    return 1
}

# Function to run a module
run_module() {
    local module="$1"
    local module_dir="$MODULES_DIR/$module"
    local tasks_file="$module_dir/tasks.txt"
    
    log "INFO" "Starting module: $module"
    
    # Check if module directory exists
    if [ ! -d "$module_dir" ]; then
        log "ERROR" "Module directory not found: $module_dir"
        return 1
    fi
    
    # Check if tasks file exists
    if [ ! -f "$tasks_file" ]; then
        log "ERROR" "Tasks file not found: $tasks_file"
        return 1
    fi
    
    # Get completed tasks for this module
    local completed_tasks=$(jq -r --arg module "$module" '.modules_status[$module].tasks_completed[]' "$CONFIG_FILE")
    
    # Run each task in the module
    while IFS= read -r task || [[ -n "$task" ]]; do
        # Skip comments and empty lines
        [[ "$task" =~ ^#.*$ || -z "$task" ]] && continue
        
        # Check if task has already been completed
        if echo "$completed_tasks" | grep -q "^$task$"; then
            log "INFO" "Skipping completed task: $module - $task"
            continue
        fi
        
        # Run the task
        if ! run_task "$module" "$task"; then
            log "ERROR" "Module execution failed at task: $module - $task"
            return 1
        fi
    done < "$tasks_file"
    
    # Mark module as complete
    mark_module_complete "$module"
    
    return 0
}

# Function to resume implementation from last checkpoint
resume_implementation() {
    log "INFO" "Resuming implementation from last checkpoint"
    
    # Get the modules in order
    local modules=(
        "module1_foundation"
        "module2_server_view"
        "module3_kitchen_view"
        "module4_admin_dashboard"
        "module5_backend_api"
        "module6_security"
        "module7_cicd"
        "module8_testing"
    )
    
    # Get last completed module
    local last_module=$(jq -r '.last_completed_module' "$CONFIG_FILE")
    local start_index=0
    
    # Find the index of the last completed module
    if [ -n "$last_module" ] && [ "$last_module" != "null" ]; then
        for i in "${!modules[@]}"; do
            if [ "${modules[$i]}" = "$last_module" ]; then
                start_index=$((i+1))
                break
            fi
        done
    fi
    
    # Run modules from the next one after last completed
    for ((i=start_index; i<${#modules[@]}; i++)); do
        local module="${modules[$i]}"
        local status=$(jq -r --arg module "$module" '.modules_status[$module].status' "$CONFIG_FILE")
        
        # Skip completed modules
        if [ "$status" = "completed" ]; then
            log "INFO" "Skipping completed module: $module"
            continue
        fi
        
        # Run the module
        if ! run_module "$module"; then
            log "ERROR" "Implementation failed at module: $module"
            return 1
        fi
    done
    
    log "SUCCESS" "Implementation completed successfully"
    return 0
}

# Function to show implementation status
show_status() {
    log "INFO" "Current implementation status:"
    
    # Get the modules in order
    local modules=(
        "module1_foundation"
        "module2_server_view"
        "module3_kitchen_view"
        "module4_admin_dashboard"
        "module5_backend_api"
        "module6_security"
        "module7_cicd"
        "module8_testing"
    )
    
    # Show status for each module
    for module in "${modules[@]}"; do
        local status=$(jq -r --arg module "$module" '.modules_status[$module].status' "$CONFIG_FILE")
        local completed_tasks=$(jq -r --arg module "$module" '.modules_status[$module].tasks_completed | length' "$CONFIG_FILE")
        local total_tasks=0
        
        # Count total tasks
        if [ -f "$MODULES_DIR/$module/tasks.txt" ]; then
            total_tasks=$(grep -v '^#' "$MODULES_DIR/$module/tasks.txt" | grep -v '^$' | wc -l)
        fi
        
        # Format module name for display
        local display_name=$(echo "$module" | sed 's/_/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')
        
        echo "- $display_name: $status ($completed_tasks/$total_tasks tasks completed)"
    done
}

# Function to clean up resources
cleanup() {
    log "INFO" "Cleaning up resources"
    
    # Perform any necessary cleanup here
    
    log "INFO" "Cleanup completed"
}

# Handle script interruption
trap cleanup EXIT

# Main function
main() {
    local command="$1"
    
    case "$command" in
        start)
            log "INFO" "Starting fresh implementation"
            # Reset config
            cat > "$CONFIG_FILE" << EOF
{
    "last_completed_module": "",
    "last_completed_task": "",
    "modules_status": {
        "module1_foundation": {
            "status": "pending",
            "tasks_completed": []
        },
        "module2_server_view": {
            "status": "pending",
            "tasks_completed": []
        },
        "module3_kitchen_view": {
            "status": "pending",
            "tasks_completed": []
        },
        "module4_admin_dashboard": {
            "status": "pending",
            "tasks_completed": []
        },
        "module5_backend_api": {
            "status": "pending",
            "tasks_completed": []
        },
        "module6_security": {
            "status": "pending",
            "tasks_completed": []
        },
        "module7_cicd": {
            "status": "pending",
            "tasks_completed": []
        },
        "module8_testing": {
            "status": "pending",
            "tasks_completed": []
        }
    }
}
EOF
            resume_implementation
            ;;
        resume)
            resume_implementation
            ;;
        status)
            show_status
            ;;
        run_module)
            local module="$2"
            if [ -z "$module" ]; then
                log "ERROR" "Module name is required"
                exit 1
            fi
            run_module "$module"
            ;;
        run_task)
            local module="$2"
            local task="$3"
            if [ -z "$module" ] || [ -z "$task" ]; then
                log "ERROR" "Module and task names are required"
                exit 1
            fi
            run_task "$module" "$task"
            ;;
        *)
            echo "Usage: $0 {start|resume|status|run_module <module>|run_task <module> <task>}"
            exit 1
            ;;
    esac
}

# Run the script
main "$@"