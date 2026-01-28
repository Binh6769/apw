# Phase 01: Documentation Consolidation

## Context
- **Parent Plan**: [plan.md](./plan.md)
- **Priority**: HIGH
- **Effort**: 2h
- **Status**: ⏳ Pending

## Overview
Tổ chức lại ~60+ markdown files từ root directory vào cấu trúc `docs/` có tổ chức.

## Key Insights
- 4 clusters chính: Avatar (~15), Image Sync (~15), Auth (~5), Misc
- Nhiều file trùng lặp (indexes, quick refs, summaries)
- Cần giữ lại thông tin hữu ích, loại bỏ redundancy

## Target Structure
```
docs/
├── project-overview-pdr.md    # Project description
├── system-architecture.md     # Tech stack & architecture
├── codebase-summary.md        # Code structure
├── code-standards.md          # Coding conventions
├── deployment-guide.md        # Supabase setup & deploy
├── development-roadmap.md     # Future improvements
├── features/
│   ├── avatar-system.md       # Consolidated from AVATAR_* files
│   ├── image-sync.md          # Consolidated from IMAGE_SYNC_* files
│   ├── authentication.md      # From AUTHENTICATION_* files
│   ├── photo-upload.md        # From PHOTO_UPLOAD_* files
│   └── comments.md            # From COMMENT_* files
└── database/
    ├── schema.md              # Consolidated SQL schemas
    └── rls-policies.md        # Security policies
```

## Implementation Steps

### Step 1: Create docs/ structure
```bash
mkdir -p docs/features docs/database
```

### Step 2: Consolidate by category
1. **Avatar System**: Merge AVATAR_*.md → `docs/features/avatar-system.md`
2. **Image Sync**: Merge IMAGE_SYNC_*.md → `docs/features/image-sync.md`
3. **Auth**: Merge AUTHENTICATION_*.md, SUPABASE_*.md → `docs/features/authentication.md`
4. **Photo Upload**: Merge PHOTO_UPLOAD_*.md → `docs/features/photo-upload.md`
5. **Database**: Merge *.sql files info → `docs/database/schema.md`

### Step 3: Create core docs
- Extract architecture info → `docs/system-architecture.md`
- Extract setup info → `docs/deployment-guide.md`
- Create codebase summary → `docs/codebase-summary.md`

### Step 4: Archive/Delete old files
- Move historical files (BUG_*, TEST_*) to `docs/archive/` or delete
- Delete redundant files after content merged

## Todo List
- [ ] Create docs/ directory structure
- [ ] Consolidate Avatar documentation
- [ ] Consolidate Image Sync documentation
- [ ] Consolidate Auth documentation
- [ ] Consolidate Photo Upload documentation
- [ ] Create system-architecture.md
- [ ] Create deployment-guide.md
- [ ] Create codebase-summary.md
- [ ] Archive/delete old markdown files from root

## Files to Process
### Keep & Consolidate
- AVATAR_ARCHITECTURE_DIAGRAM.md, AVATAR_IMPLEMENTATION_COMPLETE.md
- IMAGE_SYNC_ARCHITECTURE.md, IMAGE_SYNC_START_HERE.md
- AUTHENTICATION_README.md, SUPABASE_SETUP.md
- PHOTO_UPLOAD_IMPLEMENTATION.md

### Delete After Merge
- All *_QUICK_REFERENCE.md, *_INDEX.md, *_SUMMARY.md duplicates
- BUG_*.md, TEST_*.md (historical only)
- DOCUMENTATION_INDEX.md (replaced by docs/ structure)

## Success Criteria
- [ ] docs/ folder exists with organized structure
- [ ] Root directory has no scattered .md files (except README.md)
- [ ] All valuable documentation preserved
- [ ] Clear navigation between docs

## Risk Assessment
- **Risk**: Losing valuable information during merge
- **Mitigation**: Git history preserves all changes; review before delete
