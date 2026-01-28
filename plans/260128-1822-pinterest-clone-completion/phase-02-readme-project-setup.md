# Phase 02: README & Project Setup

## Context
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: Phase 01
- **Priority**: HIGH
- **Effort**: 1h
- **Status**: ⏳ Pending

## Overview
Tạo README.md chuyên nghiệp mô tả dự án Pinterest Clone, thay thế template Vite mặc định.

## Key Insights
- README hiện tại chỉ là Vite template, không mô tả project
- Cần README hấp dẫn cho portfolio showcase
- Phải include screenshots, features list, tech stack

## README Structure
```markdown
# Pinterest Clone (APW)

## 🎯 Overview
Brief description of the Pinterest-like web application

## ✨ Features
- User authentication (Supabase Auth)
- Masonry grid image feed
- Pin creation and saving
- Photo albums & collections
- User profiles with avatars
- Image history tracking
- Comments system

## 🛠️ Tech Stack
- Frontend: React 19, TypeScript, Vite
- Styling: TailwindCSS
- Backend: Supabase (Auth, Database, Storage)
- State: React Query, Context API

## 🚀 Getting Started
### Prerequisites
### Installation
### Environment Variables

## 📁 Project Structure
## 📸 Screenshots
## 📝 License
```

## Implementation Steps

### Step 1: Create new README.md
- Replace Vite template with project description
- Add feature list with emojis
- Include tech stack badges

### Step 2: Add screenshots section
- Capture key UI screens (Home, Profile, CreatePin)
- Store in `public/screenshots/` or use external hosting

### Step 3: Document setup process
- Prerequisites (Node.js, npm)
- Clone & install instructions
- Supabase environment setup
- Development commands

### Step 4: Update package.json
- Verify project name is descriptive
- Add description field
- Add repository/homepage if applicable

## Todo List
- [ ] Write new README.md content
- [ ] Add feature list with descriptions
- [ ] Document tech stack
- [ ] Write getting started guide
- [ ] Add project structure overview
- [ ] Capture and add screenshots (optional)
- [ ] Update package.json metadata

## Related Files
- README.md (replace)
- package.json (update metadata)
- docs/deployment-guide.md (reference)

## Success Criteria
- [ ] README clearly describes Pinterest Clone project
- [ ] Features and tech stack documented
- [ ] Setup instructions are complete and accurate
- [ ] Professional appearance for portfolio

## Security Considerations
- Do NOT include actual API keys in README
- Use .env.example for environment template
- Reference Supabase setup without exposing credentials
