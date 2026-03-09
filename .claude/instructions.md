# Project Instructions for GNS3 Web UI

## Git Commit Guidelines

**IMPORTANT**: When creating git commits, **NEVER** add `Co-Authored-By` information.

### Correct Commit Format:
```bash
git commit -m "type: description"
```

### Incorrect (DO NOT USE):
```bash
git commit -m "$(cat <<'EOF'
type: description

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>  # NEVER ADD THIS
EOF
)"
```

All commits should be attributed to the project owner only (YueGuobin <yueguobin@outlook.com>).

## Project Context

- **Framework**: Angular 14.x + TypeScript
- **Main Features**: Network topology design, simulation, AI chat assistant
- **Branch**: feat/ai-profile-management

## Code Style

- Use English for comments and documentation
- Follow Angular best practices
- Use OnPush change detection strategy for performance
- Implement proper subscription cleanup with takeUntil pattern
