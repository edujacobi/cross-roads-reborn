---
sessionId: session-261005-185250-ygcc
---

# Analysis

## Current CSS State

After analyzing all 49 Vue components in the admin directory:

### What's Already Good
- **BaseCard.vue**, **Sidebar.vue**, **UserProfileHeader.vue**, **items.vue**, **users/[id].vue** — already use BEM with nested SCSS (`&__element`, `&--modifier`)
- **BaseButton.vue** — uses dynamic classes (`variant-*`, `size-*`) — acceptable for reusable components
- Consistent use of SCSS variables and mixins

### Issues Found

#### Unused Classes (safe to delete)
- **dashboard.vue**: `.spin-icon`, `.section-title`, `@keyframes spin`
- **rankings.vue**: `.state-message`, `.error-message`
- **events.vue**: `.state-message`, `.error-message`
- **users/index.vue**: `.loading-state`, `.empty-state`, `.money-cell`, `.coins-cell`, `.text-muted`, `.text-right`

#### Flat Classes (should be BEM)
- **rankings.vue**: 8 flat classes not nested under `.rankings-page`
- **events.vue**: 5 flat classes not nested under `.events-page`
- **users/index.vue**: `.search-bar` not nested under `.users-page`
- **BaseTable.vue**: `.base-table-header`, `.sort-header` outside `.base-table`
- **TopHeader.vue**: `.role-hint.dev`/`.mod` should be `.role-hint--dev`/`--mod`

# Proposed Changes

### Stage 1: Remove Unused Classes
- `pages/admin/dashboard.vue`: Delete `.spin-icon`, `.section-title`, `@keyframes spin`
- `pages/rankings.vue`: Delete `.state-message`, `.error-message`
- `pages/admin/events.vue`: Delete `.state-message`, `.error-message`
- `pages/users/index.vue`: Delete `.loading-state`, `.empty-state`, `.money-cell`, `.coins-cell`, `.text-muted`, `.text-right`

### Stage 2: BEM for rankings.vue
Convert 8 flat classes to BEM under `.rankings-page`:
`.rank-cell`, `.player-content`, `.player-avatar`, `.gang-avatar`, `.player-name`, `.current-user-label`, `.gang-name-label`, `.value-cell`

### Stage 3: BEM for events.vue
Convert 5 flat classes to BEM under `.events-page`:
`.id-cell`, `.actions-cell`, `.event-form`, `.input-label`, `.event-select`

### Stage 4: BEM for users/index.vue
Nest `.search-bar` and `.search-icon` under `.users-page`

### Stage 5: BEM for BaseTable.vue and TopHeader.vue
- **BaseTable.vue**: Nest `.base-table-header`, `.sort-header` (with children) under `.base-table`
- **TopHeader.vue**: `.role-hint.dev` → `.role-hint--dev`, `.role-hint.mod` → `.role-hint--mod`

# Delivery Steps

### ✓ Step 1: Remove unused CSS classes
Remove CSS rules defined but never referenced in templates across 4 files.
- `pages/admin/dashboard.vue`: Delete `.spin-icon`, `.section-title`, and `@keyframes spin`.
- `pages/rankings.vue`: Delete `.state-message` and `.error-message`.
- `pages/admin/events.vue`: Delete `.state-message` and `.error-message`.
- `pages/users/index.vue`: Delete `.loading-state`, `.empty-state`, `.money-cell`, `.coins-cell`, `.text-muted`, `.text-right` inside `.users-table`.

### ✓ Step 2: Apply BEM to rankings.vue
Convert 8 flat classes to BEM elements nested under `.rankings-page`.
- Rename in template and SCSS: `.rank-cell`, `.player-content`, `.player-avatar`, `.gang-avatar`, `.player-name`, `.current-user-label`, `.gang-name-label`, `.value-cell`.
- Update template class bindings to match new BEM names.

### ✓ Step 3: Apply BEM to events.vue
Convert 5 flat classes to BEM elements nested under `.events-page`.
- Rename in template and SCSS: `.id-cell`, `.actions-cell`, `.event-form`, `.input-label`, `.event-select`.
- Update template class bindings to match new BEM names.

### ✓ Step 4: Apply BEM to users/index.vue
Nest `.search-bar` and `.search-icon` as BEM elements under `.users-page`.
- Rename `.search-bar` → `.users-page__search-bar` and nest `.search-icon` inside it.
- Update template class bindings.

### ✓ Step 5: Apply BEM to BaseTable.vue and TopHeader.vue
Fix remaining CSS naming inconsistencies.
- `BaseTable.vue`: Nest `.base-table-header` and `.sort-header` (with children) as BEM elements under `.base-table`.
- `TopHeader.vue`: Rename `.role-hint.dev` → `.role-hint--dev` and `.role-hint.mod` → `.role-hint--mod` in template and SCSS.