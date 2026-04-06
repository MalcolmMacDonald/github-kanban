---
name: Extract Kanban Board into @malcolm/github-kanban
description: Plan to extract src/screens/kanban/index.tsx into a reusable npm package at packages/github-kanban/
type: project
---

# Extract Kanban Board into Reusable npm Package

## Context

The GitHub-backed Kanban issue tracker at `src/screens/kanban/index.tsx` (897 lines) is a self-contained React component
with no external UI deps. It's coupled to this repo via hardcoded constants (`REPO`, `API`, env vars). Extracting it
into `packages/github-kanban/` makes it reusable across future projects.

**Why:** Reuse across future websites without copying the implementation.
**How to apply:** When implementing, follow the steps below and keep the host app's behavior identical post-migration.

## Package Structure

```
packages/github-kanban/
  package.json          # @malcolm/github-kanban
  tsconfig.json
  tsup.config.ts        # ESM + CJS dual output
  src/
    index.ts            # barrel export
    types.ts            # all exported types
    theme.ts            # catppuccinMocha default + Theme type
    utils.ts            # timeAgo, btnStyle, inputStyle
    api.ts              # parameterized GitHub fetch wrappers
    context.ts          # internal KanbanContext (not exported)
    GithubKanban.tsx    # main orchestrator
    KanbanColumn.tsx
    IssueCard.tsx
    CreateIssueForm.tsx
    WorkflowRunsPanel.tsx
```

## Public API

### `<GithubKanban />` Props

| Prop                  | Type                     | Default                        | Notes                          |
|-----------------------|--------------------------|--------------------------------|--------------------------------|
| `repo`                | `string` (required)      | --                             | `"owner/repo"` format          |
| `token`               | `string?`                | `undefined`                    | GitHub PAT; omit for read-only |
| `apiBaseUrl`          | `string?`                | `'https://api.github.com'`     | For GHE                        |
| `columns`             | `ColumnDefinition[]?`    | backlog/progress/done/reverted | Evaluated first-match-wins     |
| `hiddenLabels`        | `string[]?`              | `['in progress', 'claude']`    | Labels hidden from cards       |
| `defaultLabels`       | `string[]?`              | `['Claude']`                   | Auto-applied on issue create   |
| `branchIssuePattern`  | `RegExp?`                | `/issue[- _](\d+)/i`           | Branch-to-issue matching       |
| `tokenCommentPattern` | `RegExp?`                | `/(\d[\d,]*)\s*tokens?/i`      | Token count extraction         |
| `showWorkflowRuns`    | `boolean?`               | `true`                         | CI status panel                |
| `showCreateForm`      | `boolean?`               | `true`                         | New issue form                 |
| `showTokenInput`      | `boolean?`               | `true`                         | Runtime token entry            |
| `pollIntervalMs`      | `number?`                | `30000`                        | 0 = disable polling            |
| `theme`               | `Partial<Theme>?`        | Catppuccin Mocha               | Color overrides                |
| `onBack`              | `() => void?`            | `undefined`                    | Omit to hide back button       |
| `promoteWorkflow`     | `PromoteWorkflowConfig?` | `undefined`                    | Opt-in deploy button           |

### Exports

- `GithubKanban` (main component)
- `catppuccinMocha` (default theme object)
- Types: `GithubKanbanProps`, `ColumnDefinition`, `Theme`, `Issue`, `WorkflowRun`, `PromoteWorkflowConfig`
- Sub-components (advanced): `KanbanColumn`, `IssueCard`, `CreateIssueForm`, `WorkflowRunsPanel`

## Key Design Decisions

1. **Internal React context** replaces module-level constants. Sub-components call `useKanban()` for shared config (
   repo, token, theme, etc). Context is not exported.
2. **Column classification** uses `classify(issue, inProgressNumbers) => boolean` evaluated in array order. "Reverted"
   must precede "done" since both match closed issues.
3. **No `import.meta.env`** in the package. Token comes via props; host app reads env vars at the call site.
4. **Inline styles only** — no CSS imports, no style conflicts, no bundler config required by consumers.

## Build Setup

- **tsup**: ESM (`.js`) + CJS (`.cjs`) + `.d.ts`
- **Peer deps**: `react ^18 || ^19`, `react-dom ^18 || ^19`
- **Monorepo**: Add `"workspaces": ["packages/*"]` to root `package.json`

## Migration Steps

1. Create package scaffold (`package.json`, `tsconfig.json`, `tsup.config.ts`)
2. Extract `types.ts` and `theme.ts` (14 Catppuccin Mocha colors)
3. Extract `utils.ts` and `api.ts` (parameterized with apiBaseUrl + repo)
4. Create internal `context.ts` with `KanbanContext` + `useKanban()`
5. Extract sub-components (`IssueCard`, `KanbanColumn`, `CreateIssueForm`, `WorkflowRunsPanel`)
6. Build `GithubKanban.tsx` (state, fetching, polling, context provider, conditional features)
7. Create barrel `index.ts`
8. Set up monorepo workspaces, add workspace dep, `bun install`
9. Verify package builds (`bunx tsup`)
10. Update host app entry to import from `@malcolm/github-kanban`
11. Delete `src/screens/kanban/index.tsx`

## Host App Migration

`src/entries/github-kanban/kanban.tsx` becomes:

```tsx
import { GithubKanban } from '@malcolm/github-kanban';

<GithubKanban
  repo="MalcolmMacDonald/cursed-apple-guesser"
  token={import.meta.env.VITE_GITHUB_TOKEN}
  onBack={() => { window.location.href = import.meta.env.BASE_URL; }}
  promoteWorkflow={{ workflowFile: 'promote-to-prod.yml', ref: 'dev' }}
/>
```

## Verification

1. `cd packages/github-kanban && bunx tsup` — builds without errors
2. `bun run dev` from root — kanban page loads and functions identically
3. `bun run lint` — no lint errors
4. `bun run build` — production build succeeds
5. Verify: create issue, move between columns, expand cards, CI status polling all work

## Critical Files

- `src/screens/kanban/index.tsx` — source of truth (897 lines to split)
- `src/entries/github-kanban/kanban.tsx` — entry point to update
- `package.json` — add workspaces
- `tsconfig.app.json` — reference for TS settings
- `vite.config.ts` — may need alias update
