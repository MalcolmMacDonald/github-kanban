import { useState, useEffect } from 'react';
import type { Issue } from './types.js';
import { useKanban } from './context.js';
import { btnStyle } from './utils.js';

export function IssueCard({ issue, columnId }: { issue: Issue; columnId: string }) {
    const { repo, token, apiBaseUrl, hiddenLabels, tokenCommentPattern, theme, onRefresh } = useKanban();
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [claudeTokens, setClaudeTokens] = useState<number | null>(null);

    useEffect(() => {
        if (columnId !== 'done') return;
        const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}/comments`, { headers })
            .then(r => r.ok ? r.json() : [])
            .then((comments: { body?: string }[]) => {
                for (const c of comments) {
                    const match = c.body?.match(tokenCommentPattern);
                    if (match) {
                        setClaudeTokens(parseInt(match[1].replace(/,/g, '')));
                        return;
                    }
                }
            })
            .catch(() => {});
    }, [issue.number, columnId, token, apiBaseUrl, repo, tokenCommentPattern]);

    async function moveToInProgress() {
        setLoading(true);
        await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}/labels`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ labels: ['in progress'] }),
        });
        setLoading(false);
        onRefresh();
    }

    async function moveToBacklog() {
        setLoading(true);
        await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}/labels/in%20progress`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        setLoading(false);
        onRefresh();
    }

    async function closeIssue() {
        setLoading(true);
        await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'closed' }),
        });
        setLoading(false);
        onRefresh();
    }

    async function reopenIssue() {
        setLoading(true);
        await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'open' }),
        });
        setLoading(false);
        onRefresh();
    }

    async function revertIssue() {
        setLoading(true);
        await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}/labels`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ labels: ['reverted'] }),
        });
        setLoading(false);
        onRefresh();
    }

    const visibleLabels = issue.labels.filter(l => !hiddenLabels.has(l.name.toLowerCase()));

    return (
        <div
            style={{
                background: theme.bgCard,
                border: `1px solid ${theme.borderCard}`,
                borderRadius: 8,
                padding: '10px 12px',
                marginBottom: 8,
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
            }}
            onClick={() => setExpanded(e => !e)}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: theme.textMuted, fontSize: 11, flexShrink: 0, marginTop: 1 }}>
                    #{issue.number}
                </span>
                <span style={{ fontSize: 13, color: theme.text, flex: 1, lineHeight: 1.4 }}>
                    {issue.title}
                </span>
            </div>
            {(visibleLabels.length > 0 || (columnId === 'done' && claudeTokens !== null)) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, alignItems: 'center' }}>
                    {visibleLabels.map(l => (
                        <span
                            key={l.name}
                            style={{
                                background: `#${l.color}33`,
                                border: `1px solid #${l.color}88`,
                                color: `#${l.color}`,
                                borderRadius: 4,
                                fontSize: 10,
                                padding: '1px 6px',
                            }}
                        >
                            {l.name}
                        </span>
                    ))}
                    {columnId === 'done' && claudeTokens !== null && (
                        <span
                            style={{
                                background: `${theme.mauve}33`,
                                border: `1px solid ${theme.mauve}88`,
                                color: theme.mauve,
                                borderRadius: 4,
                                fontSize: 10,
                                padding: '1px 6px',
                            }}
                        >
                            {claudeTokens.toLocaleString()} tokens
                        </span>
                    )}
                </div>
            )}
            {expanded && (
                <div
                    style={{ marginTop: 8 }}
                    onClick={e => e.stopPropagation()}
                >
                    {issue.body && (
                        <p style={{ color: theme.textSubtle, fontSize: 12, margin: '0 0 8px', lineHeight: 1.5 }}>
                            {issue.body}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {columnId === 'backlog' && token && (
                            <button
                                style={btnStyle(theme.blue)}
                                onClick={moveToInProgress}
                                disabled={loading}
                            >
                                → In Progress
                            </button>
                        )}
                        {columnId === 'in_progress' && token && (
                            <button
                                style={btnStyle(theme.textSubtle)}
                                onClick={moveToBacklog}
                                disabled={loading}
                            >
                                ← Backlog
                            </button>
                        )}
                        {columnId !== 'done' && columnId !== 'reverted' && token && (
                            <button
                                style={btnStyle(theme.green)}
                                onClick={closeIssue}
                                disabled={loading}
                            >
                                Close ✓
                            </button>
                        )}
                        {columnId === 'done' && token && (
                            <>
                                <button
                                    style={btnStyle(theme.red)}
                                    onClick={reopenIssue}
                                    disabled={loading}
                                >
                                    Reopen
                                </button>
                                <button
                                    style={btnStyle(theme.peach)}
                                    onClick={revertIssue}
                                    disabled={loading}
                                >
                                    Revert PR
                                </button>
                            </>
                        )}
                        {columnId === 'reverted' && token && (
                            <button
                                style={btnStyle(theme.red)}
                                onClick={reopenIssue}
                                disabled={loading}
                            >
                                Reopen
                            </button>
                        )}
                        <a
                            href={issue.html_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ ...btnStyle(theme.mauve), textDecoration: 'none' }}
                        >
                            GitHub ↗
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
