#!/usr/bin/env bash

# debug_codex.sh
#
# Automates debugging of Codex CLI crashes by:
# 1. Running codex with debug/verbose logging.
# 2. Capturing CORSMiddleware usage.
# 3. Dumping first 200 lines of backend/main.py.

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOGFILE="codex_debug_${TIMESTAMP}.log"

echo "=== Codex CLI Debug Script ==="
echo "Log file: ${LOGFILE}"

# Check for codex
if ! command -v codex >/dev/null 2>&1; then
  echo "Error: codex command not found. Please install @openai/codex-cli." | tee "${LOGFILE}"
  exit 1
fi

echo "--- Checking Codex CLI version ---" | tee -a "${LOGFILE}"
codex --version 2>&1 | tee -a "${LOGFILE}"

echo "" | tee -a "${LOGFILE}"
echo "--- Running Codex CLI non-interactively in verbose/debug mode ---" | tee -a "${LOGFILE}"
# Enable debug logs and run a single prompt so the session exits automatically
export DEBUG=codex:*
codex --verbose -q "explain this codebase to me" 2>&1 | tee -a "${LOGFILE}"

echo "" | tee -a "${LOGFILE}"
echo "--- Searching for CORSMiddleware usage ---" | tee -a "${LOGFILE}"
grep -R "CORSMiddleware" backend/ 2>&1 | tee -a "${LOGFILE}"

echo "" | tee -a "${LOGFILE}"
echo "--- Printing first 200 lines of backend/main.py ---" | tee -a "${LOGFILE}"
sed -n '1,200p' backend/main.py 2>&1 | tee -a "${LOGFILE}"

echo "" | tee -a "${LOGFILE}"
echo "Debug run complete. Log saved to ${LOGFILE}"
echo "Please share the contents of ${LOGFILE} for further assistance."