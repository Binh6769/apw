# Phase 03: Code Quality Polish

## Context
- **Parent Plan**: [plan.md](./plan.md)
- **Depends On**: Phase 01, 02
- **Priority**: MEDIUM
- **Effort**: 2h
- **Status**: ⏳ Pending

## Overview
Review và polish codebase để đạt chuẩn portfolio-ready, đảm bảo code quality và features hoạt động.

## Key Insights
- Codebase có architecture tốt (services, hooks, contexts)
- `mockData.ts` cần verify không ảnh hưởng production
- Testing coverage thấp (chỉ có Header.test.tsx)
- TypeScript types cần review completeness

## Areas to Review

### 1. Mock Data Dependency
```
src/data/mockData.ts
```
- Verify if used as fallback or primary data source
- Ensure Supabase integration is complete
- Remove or clearly mark as dev-only

### 2. Type Safety
```
src/types/index.ts
src/types/imageMetadata.ts
```
- Ensure all Supabase tables have type definitions
- Check for `any` type usage
- Verify API response types

### 3. Error Handling
```
src/components/ErrorBoundary.tsx
src/contexts/ToastContext.tsx
```
- Verify error boundaries cover critical paths
- Check toast notifications for user feedback
- Ensure graceful degradation

### 4. Service Layer
```
src/services/*.ts
```
- Review Supabase queries for efficiency
- Check RLS policy compatibility
- Verify error handling in services

## Implementation Steps

### Step 1: Audit mockData.ts usage
```bash
grep -r "mockData" src/
```
- Identify all imports of mockData
- Determine if critical for app function
- Plan removal or isolation

### Step 2: Type completeness check
- Review src/types/index.ts coverage
- Add missing types for Supabase tables
- Remove any `any` types where possible

### Step 3: Error handling review
- Trace user flows for error states
- Ensure loading states exist
- Verify toast notifications work

### Step 4: Build verification
```bash
npm run build
npm run lint
```
- Fix any TypeScript errors
- Address linting warnings
- Ensure clean build

## Todo List
- [ ] Audit mockData.ts usage across codebase
- [ ] Review and complete TypeScript types
- [ ] Check error handling in services
- [ ] Verify all features work with real data
- [ ] Run build and fix any errors
- [ ] Run lint and fix warnings
- [ ] Test critical user flows manually

## Code Files to Review
- `src/data/mockData.ts` - Mock data usage
- `src/types/index.ts` - Type definitions
- `src/services/supabase.ts` - Supabase client
- `src/services/pinsService.ts` - Pin CRUD
- `src/contexts/AuthContext.tsx` - Auth flow
- `src/components/ErrorBoundary.tsx` - Error handling

## Success Criteria
- [ ] No critical `mockData` dependency in production flows
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no errors
- [ ] All features work with Supabase backend
- [ ] Error states handled gracefully

## Risk Assessment
- **Risk**: Removing mockData breaks features
- **Mitigation**: Test each feature after changes
- **Risk**: Hidden TypeScript errors
- **Mitigation**: Run strict type checking
