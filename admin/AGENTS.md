# Project Guidelines and Architecture

This document serves as a guide for agents and developers working on the `cross-roads-reborn/web-interface` project.
Adherence to these guidelines is mandatory to maintain the project's architecture and code quality.

## Environment Context

- **Runtime**: Node.js (>= 24.20.0)
- **Language**: TypeScript 7.0
- **Framework**: Vue 3.5 (Composition API), Nuxt 3.15
- **Linter & Formatter**: Biome
- **Dev Setup**: Windows 11 with Powershell (Always use Windows/Powershell commands, **NEVER** linux/bash terminal
  commands).
- **Production Setup**: Static website in CPanel -> https://crossroads.ejacobi.com.br

**Note**: Do not suggest or implement code patterns compatible only with older versions of Vue or using Options API.

## Architecture and Roadmap

The project is a Web Interface, consuming data with GraphQL queries. The main objetive is to deprecate the discord bot
commands.

The roadmap is:
[x] Admin Dashboard, with all functionalities from admin commmands.
[ ] Basic User Info and functionalities. No Complex features.
[ ] Complex Features, like Robberies, Beat Ups, Gang Management, Casino
[ ] Deprecate Discord Bot Commands

## Coding Standards

### Number Representation

Always separate thousands with an underscore (`_`) for better readability.

- **Example**: `1_000_000` instead of `1000000`.

### Readability & Performance

Always focus on both readability and performance. Code can be verbose if it improves human understanding.

- **Naming**: Use descriptive and meaningful names for variables, methods, and functions (e.g., `calculateTotalBalance`
  instead of `calcBal`).
- **Comments**: Do not clutter the code with excessive comments. Instead, write self-documenting code through good
  naming conventions.
- **Performance**: Optimize logic for speed where possible, but not at the expense of readability.
- **Simplicity**: Keep code simple and avoid unnecessary complexity. Use Ponytail to check simplicity.

### New Line

**Always** use CRLF as End of Line Sequence in files.

## Codebase Index & Knowledge Graph

To avoid burning tokens through recursive file-by-file searches (like `grep`/`glob`/`read`), this project maintains a
local codebase index:

- **JSON Graph**: [codebase_graph.json](file:///c:/Users/Pichau/Documents/GitHub/cross-roads-reborn/codebase_graph.json)
  contains a structured representation of the codebase's files, classes, methods, functions, calls, and imports.
- **Architecture
  Map**: [codebase_index.md](file:///c:/Users/Pichau/Documents/GitHub/cross-roads-reborn/codebase_index.md) provides a
  human-readable list of bot commands, model methods, and call paths.

Before performing extensive file searches or tracing call chains manually, **ALWAYS** check `codebase_graph.json` or
`codebase_index.md` first.

If you really need to run CLI commands, **ALWAYS** use RTK.

To regenerate the index files, run:

```powershell
npm run index
```
