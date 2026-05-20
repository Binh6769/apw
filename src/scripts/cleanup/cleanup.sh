#!/bin/bash
# =====================================================
# MASTER CLEANUP SCRIPT
# Cleans all non-user-generated images from the platform
# 
# Usage:
#   ./cleanup.sh dry-run   # Preview what will be deleted
#   ./cleanup.sh execute # Run actual cleanup
# =====================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

echo "========================================"
echo "  AP Web Cleanup Script"
echo "========================================"

# Parse command
COMMAND=${1:-dry-run}

if [ "$COMMAND" = "dry-run" ]; then
    echo ""
    echo "[STEP 1] Dry Run - Database Preview"
    echo "--------------------------------"
    echo "Run this SQL in Supabase SQL Editor:"
    echo ""
    cat src/scripts/cleanup/dry-run.sql
    echo ""
    
elif [ "$COMMAND" = "execute" ]; then
    echo ""
    echo "[STEP 1] Database Cleanup"
    echo "--------------------------------"
    echo "Copy and run this SQL in Supabase SQL Editor:"
    echo ""
    cat src/scripts/cleanup/database-cleanup.sql
    echo ""
    read -p "Press Enter after running the SQL above..."
    echo ""
    
    echo "[STEP 2] Storage Cleanup (DRY RUN)"
    echo "--------------------------------"
    npx tsx src/scripts/cleanup/storage-cleanup.ts dry-run
    echo ""
    read -p "Press Enter to execute storage deletion..."
    echo ""
    
    echo "[STEP 3] Storage Cleanup (EXECUTE)"
    echo "--------------------------------"
    npx tsx src/scripts/cleanup/storage-cleanup.ts execute
    echo ""
    
    echo "========================================"
    echo "  Cleanup Complete!"
    echo "========================================"
    
else
    echo "Usage: ./cleanup.sh [dry-run|execute]"
    exit 1
fi