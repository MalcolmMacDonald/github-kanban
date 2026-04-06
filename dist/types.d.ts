export type Issue = {
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
export type WorkflowRun = {
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
export type ColumnDefinition = {
    id: string;
    title: string;
    color: string;
    classify: (issue: Issue, inProgressNumbers: Set<number>) => boolean;
};
export type PromoteWorkflowConfig = {
    workflowFile: string;
    ref: string;
};
export type Theme = {
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
export type GithubKanbanProps = {
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
//# sourceMappingURL=types.d.ts.map