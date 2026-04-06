# @malcolmmacdonald/github-kanban

A GitHub-backed Kanban board React component. Fetches issues from a GitHub repo and displays them in configurable columns with CI status, issue creation, and optional deploy workflows.

## Installation

```bash
bun add @malcolmmacdonald/github-kanban
```

React 18 or 19 is required as a peer dependency.

## Usage

```tsx
import { GithubKanban } from '@malcolmmacdonald/github-kanban';

<GithubKanban
  repo="owner/repo"
  token={import.meta.env.VITE_GITHUB_TOKEN}
  onBack={() => history.back()}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `repo` | `string` | required | Repository in `"owner/repo"` format |
| `token` | `string?` | `undefined` | GitHub PAT. Omit for read-only mode |
| `apiBaseUrl` | `string?` | `'https://api.github.com'` | Override for GitHub Enterprise |
| `columns` | `ColumnDefinition[]?` | Backlog / In Progress / Done / Reverted | Column definitions evaluated in order (first match wins) |
| `hiddenLabels` | `string[]?` | `['in progress', 'claude']` | Labels hidden from issue cards |
| `defaultLabels` | `string[]?` | `['Claude']` | Labels auto-applied when creating issues |
| `branchIssuePattern` | `RegExp?` | `/issue[- _](\d+)/i` | Pattern to link branch names to issue numbers |
| `tokenCommentPattern` | `RegExp?` | `/(\d[\d,]*)\s*tokens?/i` | Pattern to extract token counts from comments |
| `showWorkflowRuns` | `boolean?` | `true` | Show CI status panel |
| `showCreateForm` | `boolean?` | `true` | Show new issue form (requires token) |
| `showTokenInput` | `boolean?` | `true` | Show runtime token input |
| `pollIntervalMs` | `number?` | `30000` | Workflow run polling interval. `0` disables polling |
| `theme` | `Partial<Theme>?` | Catppuccin Mocha | Color overrides |
| `onBack` | `() => void?` | `undefined` | Renders a back button when provided |
| `promoteWorkflow` | `PromoteWorkflowConfig?` | `undefined` | Renders a "Promote to Prod" button that triggers a workflow dispatch |

## Custom columns

```tsx
import { GithubKanban, type ColumnDefinition } from '@malcolmmacdonald/github-kanban';

const columns: ColumnDefinition[] = [
  {
    id: 'open',
    title: 'Open',
    color: '#89b4fa',
    classify: (issue) => issue.state === 'open',
  },
  {
    id: 'closed',
    title: 'Closed',
    color: '#a6e3a1',
    classify: (issue) => issue.state === 'closed',
  },
];

<GithubKanban repo="owner/repo" columns={columns} />
```

## Theming

The default theme is Catppuccin Mocha. Pass any subset of `Theme` keys to override:

```tsx
import { catppuccinMocha } from '@malcolmmacdonald/github-kanban';

<GithubKanban
  repo="owner/repo"
  theme={{ bgPage: '#0d1117', bgCard: '#161b22', text: '#e6edf3' }}
/>
```

## Promote workflow

To add a deploy button that triggers a GitHub Actions workflow dispatch:

```tsx
<GithubKanban
  repo="owner/repo"
  token={token}
  promoteWorkflow={{ workflowFile: 'deploy.yml', ref: 'main' }}
/>
```

## Exports

- `GithubKanban` — main component
- `catppuccinMocha` — default theme object
- `KanbanColumn`, `IssueCard`, `CreateIssueForm`, `WorkflowRunsPanel` — sub-components for advanced composition
- Types: `GithubKanbanProps`, `ColumnDefinition`, `Theme`, `Issue`, `WorkflowRun`, `PromoteWorkflowConfig`

## Building

```bash
bun run build
```

Outputs ESM (`dist/index.js`), CJS (`dist/index.cjs`), and type declarations (`dist/index.d.ts`).
