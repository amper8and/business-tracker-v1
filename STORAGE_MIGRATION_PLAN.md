# Complete Storage Migration Plan - localStorage → Cloudflare D1

## Overview
Replace ALL localStorage calls with DBService API calls to ensure 100% server-side persistence.

## Modules to Update

### 1. USERS MODULE ✅
**Current localStorage calls:**
- Line 215: `localStorage.getItem('users')` → `DBService.getAllUsers()`
- Line 292: `localStorage.setItem('users', ...)` → `DBService.createUser()` / `DBService.updateUser()`

**Functions to update:**
- `loadUsers()` - Load from D1
- `saveUsers()` - Save to D1 (create/update/delete)

### 2. MASTERY MODULE ✅
**Current localStorage calls:**
- Line 405: `localStorage.getItem('masteryData')` → `DBService.getAllMastery()`
- Line 419: `localStorage.setItem('masteryData', ...)` → DB API

**Functions to update:**
- `loadMasteryData()` - Load from D1
- `saveMasteryData()` - Save to D1

### 3. COURSES LIBRARY MODULE ✅
**Current localStorage calls:**
- Line 425: `localStorage.getItem('coursesLibrary')` → `DBService.getAllCourses()`
- Line 477: `localStorage.setItem('coursesLibrary', ...)` → DB API

**Functions to update:**
- `loadCoursesLibrary()` - Load from D1
- `saveCoursesLibrary()` - Save to D1

### 4. KANBAN MODULE ✅
**Current localStorage calls:**
- Line 484: `localStorage.getItem('kanbanCards')` → `DBService.getAllKanban()`
- Line 485: `localStorage.getItem('kanbanVersion')` → Remove (not needed)
- Line 492: `localStorage.setItem('kanbanVersion', ...)` → Remove
- Line 504: `localStorage.setItem('kanbanVersion', ...)` → Remove
- Line 568: `localStorage.setItem('kanbanCards', ...)` → DB API

**Functions to update:**
- `loadKanbanCards()` - Load from D1
- `saveKanbanCards()` - Save to D1

### 5. PERFORMANCE MODULE ✅ (Already Done)
- Already using D1 database via DBService
- Lines 3150-3195 are just version flags (can be removed)

## Implementation Strategy

### Phase 1: Make ALL functions async
- Convert all load/save functions to async
- Add async/await to all callers

### Phase 2: Replace localStorage with DBService
- One module at a time
- Test each module after update

### Phase 3: Remove localStorage completely
- Search for remaining `localStorage.` calls
- Remove version flags and legacy code
- Clean up

## Testing Checklist

For EACH module:
1. ✅ Add item → Save to D1
2. ✅ Refresh page (clear localStorage) → Data persists
3. ✅ Update item → Changes saved to D1
4. ✅ Delete item → Removed from D1
5. ✅ Multi-user test → Changes visible across devices

## Critical Success Criteria
- Zero localStorage calls in production code
- All CRUD operations hit D1 database
- Data persists after localStorage clear
- Multi-user data synchronization works
