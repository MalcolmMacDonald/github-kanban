import { useState, useEffect, useMemo } from 'react';
import type { GithubKanbanProps, Issue, WorkflowRun, ColumnDefinition } from './types.js';
import { catppuccinMocha } from './theme.js';
import { fetchActiveWorkflowRuns, makeHeaders } from './api.js';
import { KanbanContext } from './context.js';
import { KanbanColumn } from './KanbanColumn.js';
import { CreateIssueForm } from './CreateIssueForm.js';
import { WorkflowRunsPanel } from './WorkflowRunsPanel.js';
import { btnStyle, inputStyle } from './utils.js';

const DEFAULT_COLUMNS: ColumnDefinition[] = [
    {
        id: 'backlog',
        title: 'Backlog',
        color: '#89b4fa',
        classify: (issue, inProgressNumbers) =>
            issue.state === 'open' &&
            !inProgressNumbers.has(issue.number) &&
            !issue.labels.some(l => l.name.toLowerCase() === 'in progress'),
    },
    {
        id: 'in_progress',
        title: 'In Progress',
        color: '#f9e2af',
        classify: (issue, inProgressNumbers) =>
            issue.state === 'open' &&
            (inProgressNumbers.has(issue.number) || issue.labels.some(l => l.name.toLowerCase() === 'in progress')),
    },
    {
        id: 'done',
        title: 'Done',
        color: '#a6e3a1',
        classify: (issue) =>
            issue.state === 'closed' &&
            !issue.labels.some(l => l.name.toLowerCase() === 'reverted'),
    },
    {
        id: 'reverted',
        title: 'Reverted',
        color: '#fab387',
        classify: (issue) =>
            issue.state === 'closed' &&
            issue.labels.some(l => l.name.toLowerCase() === 'reverted'),
    },
];

type IssueWithPR = Issue & { pull_request?: unknown };

export function GithubKanban({
    repo,
    token: tokenProp = '',
    apiBaseUrl = 'https://api.github.com',
    columns = DEFAULT_COLUMNS,
    hiddenLabels = ['in progress', 'claude'],
    defaultLabels = ['Claude'],
    branchIssuePattern = /issue[- _](\d+)/i,
    tokenCommentPattern = /(\d[\d,]*)\s*tokens?/i,
    showWorkflowRuns = true,
    showCreateForm = true,
    showTokenInput = true,
    pollIntervalMs = 30000,
    theme: themeProp,
    onBack,
    promoteWorkflow,
}: GithubKanbanProps) {
    const theme = useMemo(() => ({ ...catppuccinMocha, ...themeProp }), [themeProp]);
    const hiddenLabelsSet = useMemo(() => new Set(hiddenLabels.map(l => l.toLowerCase())), [hiddenLabels]);

    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [token, setToken] = useState(tokenProp);
    const [tokenInput, setTokenInput] = useState(tokenProp);
    const [inProgressNumbers, setInProgressNumbers] = useState<Set<number>>(new Set());
    const [activeRuns, setActiveRuns] = useState<WorkflowRun[]>([]);
    const [ciLoading, setCiLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [promoteStatus, setPromoteStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        setToken(tokenProp);
        setTokenInput(tokenProp);
    }, [tokenProp]);

    async function promoteToProd() {
        if (!promoteWorkflow) return;
        setPromoting(true);
        setPromoteStatus('idle');
        try {
            const res = await fetch(
                `${apiBaseUrl}/repos/${repo}/actions/workflows/${promoteWorkflow.workflowFile}/dispatches`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        Accept: 'application/vnd.github+json',
                    },
                    body: JSON.stringify({ ref: promoteWorkflow.ref }),
                }
            );
            setPromoteStatus(res.ok || res.status === 204 ? 'success' : 'error');
        } catch {
            setPromoteStatus('error');
        }
        setPromoting(false);
    }

    async function fetchIssues() {
        setLoading(true);
        setCiLoading(true);
        setError('');
        try {
            const headers = makeHeaders(token);
            const [openRes, closedRes, workflowData] = await Promise.all([
                fetch(`${apiBaseUrl}/repos/${repo}/issues?state=open&per_page=100`, { headers }),
                fetch(`${apiBaseUrl}/repos/${repo}/issues?state=closed&per_page=50`, { headers }),
                fetchActiveWorkflowRuns(apiBaseUrl, repo, headers, branchIssuePattern),
            ]);
            if (!openRes.ok) throw new Error(`GitHub API error: ${openRes.status}`);
            const open: IssueWithPR[] = await openRes.json();
            const closed: IssueWithPR[] = closedRes.ok ? await closedRes.json() : [];
            setInProgressNumbers(workflowData.inProgressNumbers);
            setActiveRuns(workflowData.runs);
            setIssues([...open, ...closed].filter(i => !i.pull_request) as Issue[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load issues');
        }
        setLoading(false);
        setCiLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchIssues(); }, [token]);

    useEffect(() => {
        if (!pollIntervalMs) return;
        const interval = setInterval(async () => {
            const headers = makeHeaders(token);
            const workflowData = await fetchActiveWorkflowRuns(apiBaseUrl, repo, headers, branchIssuePattern);
            setActiveRuns(workflowData.runs);
            setInProgressNumbers(workflowData.inProgressNumbers);
        }, pollIntervalMs);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, pollIntervalMs]);

    const columnIssues = useMemo(() => {
        const map = new Map<string, Issue[]>();
        for (const col of columns) map.set(col.id, []);
        for (const issue of issues) {
            for (const col of columns) {
                if (col.classify(issue, inProgressNumbers)) {
                    map.get(col.id)!.push(issue);
                    break;
                }
            }
        }
        return map;
    }, [issues, columns, inProgressNumbers]);

    const iStyle = inputStyle(theme);

    return (
        <KanbanContext.Provider value={{
            repo,
            token,
            apiBaseUrl,
            hiddenLabels: hiddenLabelsSet,
            defaultLabels,
            branchIssuePattern,
            tokenCommentPattern,
            theme,
            columns,
            inProgressNumbers,
            onRefresh: fetchIssues,
        }}>
            <div
                style={{
                    minHeight: '100%',
                    background: theme.bgPage,
                    padding: '16px 24px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    color: theme.text,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{
                                background: 'transparent',
                                border: `1px solid ${theme.borderMuted}`,
                                color: theme.textSubtle,
                                borderRadius: 6,
                                padding: '4px 12px',
                                fontSize: 13,
                                cursor: 'pointer',
                            }}
                        >
                            ← Back
                        </button>
                    )}
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }}>
                            Issue Tracker
                        </h2>
                        <p style={{ margin: 0, fontSize: 11, color: theme.textMuted }}>
                            {repo}
                        </p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                            onClick={fetchIssues}
                            disabled={loading}
                            style={{
                                background: 'transparent',
                                border: `1px solid ${theme.borderMuted}`,
                                color: theme.textSubtle,
                                borderRadius: 6,
                                padding: '4px 12px',
                                fontSize: 12,
                                cursor: 'pointer',
                            }}
                        >
                            {loading ? '...' : '↻ Refresh'}
                        </button>
                        {token && promoteWorkflow && (
                            <button
                                onClick={promoteToProd}
                                disabled={promoting}
                                style={{
                                    background: promoteStatus === 'success' ? `${theme.green}33` : promoteStatus === 'error' ? `${theme.red}33` : 'transparent',
                                    border: `1px solid ${promoteStatus === 'success' ? theme.green : promoteStatus === 'error' ? theme.red : theme.green}`,
                                    color: promoteStatus === 'success' ? theme.green : promoteStatus === 'error' ? theme.red : theme.green,
                                    borderRadius: 6,
                                    padding: '4px 12px',
                                    fontSize: 12,
                                    cursor: promoting ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                }}
                            >
                                {promoting ? 'Promoting...' : promoteStatus === 'success' ? '✓ Promoted!' : promoteStatus === 'error' ? '✗ Failed' : '⬆ Promote to Prod'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Token config */}
                {showTokenInput && (
                    <div
                        style={{
                            background: theme.bgCard,
                            border: `1px solid ${theme.borderCard}`,
                            borderRadius: 8,
                            padding: '10px 14px',
                            marginBottom: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexWrap: 'wrap',
                        }}
                    >
                        <span style={{ fontSize: 12, color: theme.textSubtle, flexShrink: 0 }}>
                            GitHub Token:
                        </span>
                        <input
                            type="password"
                            placeholder="ghp_... (required for write actions)"
                            value={tokenInput}
                            onChange={e => setTokenInput(e.target.value)}
                            style={{ ...iStyle, flex: '1 1 200px', maxWidth: 300 }}
                        />
                        <button
                            onClick={() => setToken(tokenInput)}
                            style={btnStyle(theme.blue)}
                        >
                            Apply
                        </button>
                        <span style={{ fontSize: 11, color: theme.textMuted }}>
                            {token ? '● Connected' : '○ Read-only (no token)'}
                        </span>
                    </div>
                )}

                {/* Create issue */}
                {showCreateForm && token && <CreateIssueForm onCreated={fetchIssues} />}

                {/* Error */}
                {error && (
                    <div
                        style={{
                            background: `${theme.red}33`,
                            border: `1px solid ${theme.red}`,
                            borderRadius: 6,
                            padding: '8px 12px',
                            color: theme.red,
                            fontSize: 12,
                            marginBottom: 16,
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Live CI Status */}
                {showWorkflowRuns && <WorkflowRunsPanel runs={activeRuns} loading={ciLoading} />}

                {/* Board */}
                <div
                    style={{
                        display: 'flex',
                        gap: 20,
                        flex: 1,
                        overflowX: 'auto',
                        alignItems: 'flex-start',
                    }}
                >
                    {columns.map(col => (
                        <KanbanColumn
                            key={col.id}
                            col={col}
                            issues={columnIssues.get(col.id) ?? []}
                        />
                    ))}
                </div>
            </div>
        </KanbanContext.Provider>
    );
}
