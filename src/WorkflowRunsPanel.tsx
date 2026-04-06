import type { WorkflowRun } from './types.js';
import { useKanban } from './context.js';
import { timeAgo } from './utils.js';

export function WorkflowRunsPanel({ runs, loading }: { runs: WorkflowRun[]; loading?: boolean }) {
    const { theme, branchIssuePattern } = useKanban();

    if (runs.length === 0 && !loading) return null;

    return (
        <div
            style={{
                background: theme.bgCard,
                border: `1px solid ${theme.borderCard}`,
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: theme.yellow,
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${theme.yellow}`,
                    }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.yellow, letterSpacing: 0.5 }}>
                    LIVE CI STATUS
                </span>
                {loading && (
                    <span style={{ fontSize: 11, color: theme.textMuted, fontStyle: 'italic' }}>
                        refreshing…
                    </span>
                )}
                <span
                    style={{
                        background: `${theme.yellow}33`,
                        color: theme.yellow,
                        borderRadius: 10,
                        fontSize: 11,
                        padding: '1px 7px',
                        fontWeight: 600,
                    }}
                >
                    {runs.length}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {runs.map(run => {
                    const isQueued = run.status === 'queued';
                    const statusColor = isQueued ? theme.blue : theme.yellow;
                    const issueMatch = run.head_branch?.match(branchIssuePattern);
                    return (
                        <a
                            key={run.id}
                            href={run.html_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                background: theme.bgInput,
                                border: `1px solid ${statusColor}44`,
                                borderRadius: 6,
                                padding: '6px 10px',
                                textDecoration: 'none',
                                color: 'inherit',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: statusColor,
                                    background: `${statusColor}22`,
                                    border: `1px solid ${statusColor}66`,
                                    borderRadius: 4,
                                    padding: '1px 6px',
                                    flexShrink: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                }}
                            >
                                {isQueued ? 'queued' : 'running'}
                            </span>
                            <span style={{ fontSize: 12, color: theme.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {run.name}
                            </span>
                            <span style={{ fontSize: 11, color: theme.textMuted, flexShrink: 0 }}>
                                {run.head_branch}
                            </span>
                            {issueMatch && (
                                <span
                                    style={{
                                        fontSize: 10,
                                        color: theme.mauve,
                                        background: `${theme.mauve}22`,
                                        border: `1px solid ${theme.mauve}66`,
                                        borderRadius: 4,
                                        padding: '1px 6px',
                                        flexShrink: 0,
                                    }}
                                >
                                    #{issueMatch[1]}
                                </span>
                            )}
                            <span style={{ fontSize: 11, color: theme.borderMuted, flexShrink: 0 }}>
                                {timeAgo(run.created_at)}
                            </span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
