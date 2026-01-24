# Kanban Card Data Persistence Fix

## Issue Summary
Activity cards in the Kanban board were not properly storing or displaying information beyond the name and business category. Fields like owner, start date, end date, and capability were not being persisted to the database or shown on the card display.

## Root Cause
The kanban_cards database table schema did not include all the fields required by the frontend application. The original schema only had generic fields (title, description, category, status, etc.), but was missing specific activity card fields like:
- `capability` (e.g., "Stakeholder Engagement", "Product Planning")
- `owner` (assigned team member)
- `start_date` (activity start date)
- `target_date` (due date)
- `lane` (Kanban lane: Planned, In Progress, Completed, Paused)
- `comments` (detailed comments/notes)

## Solution Implemented

### 1. Database Schema Update (`0004_fix_kanban_schema.sql`)
Added missing columns to the `kanban_cards` table:
```sql
ALTER TABLE kanban_cards ADD COLUMN capability TEXT;
ALTER TABLE kanban_cards ADD COLUMN owner TEXT;
ALTER TABLE kanban_cards ADD COLUMN start_date TEXT;
ALTER TABLE kanban_cards ADD COLUMN target_date TEXT;
ALTER TABLE kanban_cards ADD COLUMN lane TEXT;
ALTER TABLE kanban_cards ADD COLUMN comments TEXT;
```

Created indexes for better query performance:
```sql
CREATE INDEX idx_kanban_owner ON kanban_cards(owner);
CREATE INDEX idx_kanban_lane ON kanban_cards(lane);
CREATE INDEX idx_kanban_capability ON kanban_cards(capability);
```

### 2. API Update (`src/db-api.ts`)
Updated both POST and PUT endpoints to handle all kanban card fields:

**POST /api/kanban** - Now includes all fields when creating cards:
- capability, owner, start_date, target_date, lane, comments

**PUT /api/kanban/:cardId** - Now updates all fields when editing cards

### 3. Frontend Data Mapping (`public/static/app.js`)

**loadKanbanData()** - Fixed field mapping from database to frontend:
```javascript
{
    id: card.card_id,
    name: card.title,
    capability: card.capability || '',  // Fixed: was card.description
    owner: card.owner || card.assigned_to || '',  // Fixed: now uses owner field
    category: card.category || '',
    startDate: card.start_date || '',  // Fixed: now uses start_date
    targetDate: card.target_date || card.due_date || '',  // Fixed: uses target_date
    status: card.priority?.toLowerCase() || 'green',
    lane: card.lane || card.status || 'Planned',  // Fixed: uses lane field
    comments: card.comments || card.description || '',  // Fixed: uses comments
    tags: card.tags ? JSON.parse(card.tags) : []
}
```

**saveKanbanData()** - Fixed field mapping from frontend to database:
```javascript
{
    id: card.id,
    title: card.name,
    description: card.comments || '',
    category: card.category,
    priority: card.status,
    status: card.lane,
    assignedTo: card.owner,
    dueDate: card.targetDate,
    tags: card.tags || [],
    capability: card.capability,  // Added
    owner: card.owner,  // Added
    startDate: card.startDate,  // Added
    targetDate: card.targetDate,  // Added
    lane: card.lane,  // Added
    comments: card.comments  // Added
}
```

## Testing Checklist
- [x] Create new activity card with all fields filled
- [x] Verify all fields are saved to database
- [x] Reload page and confirm data persists
- [x] Edit existing card and update fields
- [x] Verify changes are saved
- [x] Check that card displays show owner, category, and due date
- [x] Drag and drop cards between lanes
- [x] Verify lane changes are persisted

## Files Changed
1. `migrations/0004_fix_kanban_schema.sql` - New migration file
2. `src/db-api.ts` - Updated kanban API endpoints
3. `public/static/app.js` - Fixed data mapping functions

## Deployment Notes
For production deployment, you must:
1. Apply the migration to the production database:
   ```bash
   npx wrangler d1 migrations apply drumtree-tracker-db --remote
   ```
2. Deploy the updated code:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name business-tracker-v1
   ```

## Verification
After deployment, test by:
1. Creating a new activity card with all fields
2. Refreshing the browser
3. Confirming all data is visible on the card
4. Editing the card and verifying changes persist

---
**Fix Date**: January 24, 2026
**Version**: 1.1
**Status**: ✅ Resolved
