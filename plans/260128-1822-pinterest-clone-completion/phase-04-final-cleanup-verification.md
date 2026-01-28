# Phase 04: Final Cleanup & Verification

## Context
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: Phase 01, 02, 03
- **Priority**: MEDIUM
- **Effort**: 1h
- **Status**: ⏳ Pending

## Overview
Final cleanup, verification, và đảm bảo project sẵn sàng cho portfolio showcase.

## Implementation Steps

### Step 1: Root Directory Cleanup
Verify root chỉ còn các files cần thiết:
```
apw/
├── .git/
├── .gitignore
├── docs/                 # Organized documentation
├── plans/                # Development plans
├── public/               # Static assets
├── src/                  # Source code
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── README.md             # New professional README
├── tailwind.config.js
├── tsconfig.*.json
└── vite.config.ts
```

### Step 2: Delete remaining scattered files
Files to remove from root:
- All AVATAR_*.md, IMAGE_*.md, PHOTO_*.md
- All BUG_*.md, TEST_*.md, FIX_*.md
- All *_SETUP.sql (content in docs/database/)
- GEMINI.md, mcp.json (if not needed)
- DOCUMENTATION_INDEX.md, VISUAL_GUIDE.md

### Step 3: Verify docs/ completeness
```
docs/
├── project-overview-pdr.md
├── system-architecture.md
├── codebase-summary.md
├── code-standards.md
├── deployment-guide.md
├── development-roadmap.md
├── features/
│   ├── avatar-system.md
│   ├── image-sync.md
│   ├── authentication.md
│   ├── photo-upload.md
│   └── comments.md
└── database/
    ├── schema.md
    └── rls-policies.md
```

### Step 4: Final build & test
```bash
npm run lint
npm run build
npm run dev  # Manual verification
```

### Step 5: Git commit
- Stage all changes
- Create meaningful commit message
- Push to repository

## Todo List
- [ ] Delete all scattered markdown from root
- [ ] Delete SQL files from root (after docs consolidation)
- [ ] Verify docs/ structure complete
- [ ] Run final lint check
- [ ] Run final build
- [ ] Manual test key features
- [ ] Create summary commit
- [ ] Update .gitignore if needed

## Verification Checklist

### Root Directory
- [ ] No .md files except README.md
- [ ] No .sql files
- [ ] Only essential config files

### Documentation
- [ ] docs/ folder exists and organized
- [ ] All features documented
- [ ] README.md is professional

### Codebase
- [ ] Builds without errors
- [ ] Lints without errors
- [ ] Features work correctly

### Portfolio Ready
- [ ] Clean repository structure
- [ ] Professional README
- [ ] Working demo-able application

## Success Criteria
- [ ] Root directory clean and organized
- [ ] All documentation in docs/
- [ ] Build passes
- [ ] App runs correctly
- [ ] Ready for portfolio showcase

## Final Commit Message Template
```
feat: complete project reorganization for portfolio

- Consolidate 60+ markdown files into docs/ structure
- Create professional README with features & setup guide
- Polish codebase for production quality
- Clean root directory

Closes #pinterest-clone-completion
```
