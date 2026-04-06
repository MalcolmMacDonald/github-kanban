import * as react_jsx_runtime from 'react/jsx-runtime';

type Issue = {
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    labels: {
        name: string;
        color: string;
    }[];
    html_url: string;
    created_at: string;
    user: {
        login: string;
    } | null;
};
type WorkflowRun = {
    id: number;
    name: string;
    head_branch: string;
    status: string;
    conclusion: string | null;
    html_url: string;
    created_at: string;
    updated_at: string;
    workflow_id: number;
};
type ColumnDefinition = {
    id: string;
    title: string;
    color: string;
    classify: (issue: Issue, inProgressNumbers: Set<number>) => boolean;
};
type PromoteWorkflowConfig = {
    workflowFile: string;
    ref: string;
};
type Theme = {
    bgPage: string;
    bgCard: string;
    bgInput: string;
    borderCard: string;
    borderMuted: string;
    textMuted: string;
    textSubtle: string;
    text: string;
    blue: string;
    green: string;
    red: string;
    yellow: string;
    peach: string;
    mauve: string;
};
type GithubKanbanProps = {
    repo: string;
    token?: string;
    apiBaseUrl?: string;
    columns?: ColumnDefinition[];
    hiddenLabels?: string[];
    defaultLabels?: string[];
    branchIssuePattern?: RegExp;
    tokenCommentPattern?: RegExp;
    showWorkflowRuns?: boolean;
    showCreateForm?: boolean;
    showTokenInput?: boolean;
    pollIntervalMs?: number;
    theme?: Partial<Theme>;
    onBack?: () => void;
    promoteWorkflow?: PromoteWorkflowConfig;
};

declare function GithubKanban({ repo, token: tokenProp, apiBaseUrl, columns, hiddenLabels, defaultLabels, branchIssuePattern, tokenCommentPattern, showWorkflowRuns, showCreateForm, showTokenInput, pollIntervalMs, theme: themeProp, onBack, promoteWorkflow, }: GithubKanbanProps): react_jsx_runtime.JSX.Element;

declare const catppuccinMocha: Theme;

declare function KanbanColumn({ col, issues }: {
    col: ColumnDefinition;
    issues: Issue[];
}): react_jsx_runtime.JSX.Element;

declare function IssueCard({ issue, columnId }: {
    issue: Issue;
    columnId: string;
}): react_jsx_runtime.JSX.Element;

declare function CreateIssueForm({ onCreated }: {
    onCreated: () => void;
}): react_jsx_runtime.JSX.Element;

declare function WorkflowRunsPanel({ runs, loading }: {
    runs: WorkflowRun[];
    loading?: boolean;
}): react_jsx_runtime.JSX.Element | null;

export { type ColumnDefinition, CreateIssueForm, GithubKanban, type GithubKanbanProps, type Issue, IssueCard, KanbanColumn, type PromoteWorkflowConfig, type Theme, type WorkflowRun, WorkflowRunsPanel, catppuccinMocha };
