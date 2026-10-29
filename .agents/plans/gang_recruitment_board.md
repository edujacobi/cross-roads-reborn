# Plan: Gang Recruitment Board (Exclusive to Web Interface)

## Overview & Ponytail Review
- **Recruitment Type Setting**: Added directly to the existing `Gangs` table via an integer field (`recruitmentType`), avoiding redundant tables.
- **Join Requests**: Relational design using a single `GangJoinRequests` table (`gangId`, `userId`, `message`, `status`, `createdAt`, `updatedAt`).
- **Single Active Request Rule**: A user can only have at most 1 `PENDING` request across the game at any time.
- **Permissions**: Gang leaders and any members with `canInvite: true` in their `GangRole` can view and accept/reject requests.
- **WebPush Notifications**: Push notifications sent to leaders/recruiters upon new application, and to applicants upon resolution.
- **Frontend Reuse**: Existing Nuxt UI patterns (Nuxt table, modal components, PrimeVue / Tailwind styling).

---

## Tasks & Progress Tracker

- [x] **Task 1: Database Schema & Migrations**
  - [x] Add `recruitmentType` to `Gangs` model and DB migration.
  - [x] Create `GangJoinRequests` database model and DB migration (`migrateGangRecruitment`).
  - [x] Add enums/types (`GangRecruitmentType`, `GangJoinRequestStatus`) to `src/core/types/GangRecruitment.ts`.
- [x] **Task 2: Repositories & Business Models**
  - [x] Create `GangJoinRequestsRepository` with queries for pending requests, user history, active request, and mutations.
  - [x] Update `Gang` model with recruitment settings (`SetRecruitmentType`), open join (`JoinOpenGang`), applying (`ApplyToGang`), cancelling (`CancelJoinRequest`), and resolving (`ResolveJoinRequest`).
  - [x] Integrate `WebPush.Send` notifications into `ApplyToGang` and `ResolveJoinRequest`.
- [x] **Task 3: GraphQL API & Types**
  - [x] Update GraphQL schema (`schema.ts`) with queries and mutations.
  - [x] Implement resolvers in `src/api/graphql/resolvers/gangs.ts`.
  - [x] Update client GraphQL operations in `web-interface/graphql/operations.graphql` and `generated.ts`.
- [x] **Task 4: Web Interface (Nuxt 3 Frontend)**
  - [x] Update gang management (`web-interface/pages/gangs/[id].vue`) to allow leaders to set recruitment mode and recruiters to manage join applications.
  - [x] Build gang recruitment board (`web-interface/pages/gangs/index.vue`) matching prototype layout with search, filter dropdown, and action buttons.
  - [x] Implement Modals (Solicitar modal with message, Confirmar entrada modal, Retirar modal, Histórico de solicitações modal).
- [x] **Task 5: Verification & Testing**
  - [x] Verified git status, formatting, Biome checks, and CRLF line endings.
