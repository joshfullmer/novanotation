#!/usr/bin/env bash

# Run verification tasks in serial, report results, and replay failed output

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Create temp directory for results and logs
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

TASKS=(format lint check test build)

echo -e "${YELLOW}Running verification tasks...${NC}\n"

# Run each task, stream output live, and capture to log file
for task in "${TASKS[@]}"; do
    echo -e "${YELLOW}→ Running $task...${NC}"
    pnpm "$task" 2>&1 | tee "$TEMP_DIR/$task.log"
    echo "${PIPESTATUS[0]}" > "$TEMP_DIR/$task.result"
    echo ""
done

# ── Summary ──────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}VERIFICATION REPORT${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

failed=()
for task in "${TASKS[@]}"; do
    result=$(cat "$TEMP_DIR/$task.result" 2>/dev/null || echo "1")
    if [ "$result" -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} $task"
    else
        echo -e "  ${RED}✗${NC} $task"
        failed+=("$task")
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#failed[@]} -eq 0 ]; then
    echo -e "\n${GREEN}All tasks passed!${NC}"
    exit 0
fi

# ── Replay failed output ─────────────────────────────────
for task in "${failed[@]}"; do
    echo ""
    echo -e "${RED}── $task ──────────────────────────────────────${NC}"
    tail -30 "$TEMP_DIR/$task.log"
    echo -e "${DIM}(last 30 lines — full log: $TEMP_DIR/$task.log)${NC}"
done

echo ""
echo -e "${RED}Failed: ${failed[*]}${NC}"
exit 1
