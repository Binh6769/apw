# Mock Data Review Report

## Summary
The usage of `mockData.ts` was reviewed to ensure it serves as a fallback rather than a primary data source in production.

## Findings

### Files Importing mockData
- `src/api/unsplash.ts`: The central data fetching service.
- `src/data/mockData.ts`: The source definition.

### Usage Pattern
**Status: Fallback / Error Recovery (Correct)**

The system follows a prioritized data fetching strategy in `fetchPhotos`:
1.  **Primary**: Supabase (`fetchPinsFromSupabase`)
    - If Supabase returns sufficient data (>= 20 items), it is used immediately.
2.  **Secondary**: External APIs (Jikan, Waifu, Unsplash, Pexels, Pixabay)
    - Used if Supabase has insufficient data.
3.  **Fallback**: `mockData`
    - Used only if:
        - Supabase and all external APIs fail/return empty.
        - An exception occurs (try-catch block).
        - Specific IDs starting with `mock-` are requested.

### Code Evidence
```typescript
// src/api/unsplash.ts
export const fetchPhotos = async (...) => {
  // 1. Try Supabase
  const supabasePins = await fetchPinsFromSupabase(...);
  if (supabasePins.length >= 20) return supabasePins;

  // 2. Try External APIs
  // ...

  // 3. Fallback
  if (combined.length === 0) {
     return getFallbackPhotos(page); // Uses mockData
  }
}
```

## Recommendations
1.  **Keep `mockData.ts`**: It provides essential resilience. If external APIs rate-limit or fail, the UI remains functional.
2.  **Production Check**: Ensure Supabase is populated with initial data so production users see real content, not fallbacks.
3.  **Monitoring**: Consider adding a log/alert when fallback data is triggered in production to identify API failures.

## Risk Assessment
- **Risk Level**: Low
- **Impact**: Positive (prevents white screens/crashes).
