# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Players seeking a social multiplayer economy/RPG experience through Discord or the web interface, which is open to all players. Administrators, moderators, and helpers use the web interface for game operations and player support.

## Product Purpose

Cross Roads Reborn lets players build their in-game lives through an economy, combat, jobs, items, gangs, and other shared game activities. Success means making the game accessible to all players through the web interface while keeping Discord gameplay supported during the transition.

## Positioning

Players from different Discord servers compete in one shared game, creating competition beyond any single server. The web interface offers a richer way to play that shared game.

## Operating Context

Players interact through Discord slash commands and the browser-based web interface, which is open to all players. The web interface uses Discord OAuth2 sign-in and supports player gameplay and role-based administration. Helpers and Moderators can access `/admin` pages; Helpers are read-only, while Moderators can read and write. The bot and API server remain required for the web interface's data-backed features.

## Capabilities and Constraints

- Gameplay includes economy, jobs, combat, inventory, classes, gangs, casino games, investments, shops, rankings, and timed activities such as scavenging and robberies.
- Discord and web are supported interfaces during the transition. Deprecating Discord commands remains unfinished; no retirement date is established.
- Game rules and state belong in shared backend services rather than either interface.
- Discord user-facing text supports English, Portuguese, and Spanish. Web user-facing text is Brazilian Portuguese.
- The backend uses Node.js, Discord.js, GraphQL, Sequelize, and SQLite. The web interface uses Nuxt and Vue.
- Web access uses Discord OAuth2. Developer and Moderator roles can read and write in `/admin`; Helpers have read-only access.

## Brand Commitments

The product name is Cross Roads Reborn. The existing web interface includes the Cross Roads logo at `web-interface/public/images/brand/CrossRoadsLogo.png`. No additional voice or identity constraints have been confirmed.

## Evidence on Hand

The repository contains a feature and command inventory in `README.md`, a web route and feature inventory in `web-interface/README.md`, and the existing logo asset. No testimonials, customer endorsements, or performance benchmarks are established; do not invent them.

## Product Principles

- Make competition meaningful across servers, not only within one server.
- Keep game rules and state shared across Discord and web.
- Preserve Discord support while web gameplay continues to mature.
- Treat product claims as unproven unless supported by real project evidence.

## Accessibility & Inclusion

The web interface respects the operating system's reduced-motion preference. No formal accessibility conformance target is established.
