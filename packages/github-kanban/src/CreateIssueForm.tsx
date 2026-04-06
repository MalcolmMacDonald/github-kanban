import { useState } from 'react';
import type { FormEvent } from 'react';
import { useKanban } from './context.js';
import { btnStyle, inputStyle } from './utils.js';

export function CreateIssueForm({ onCreated }: { onCreated: () => void }) {
    const { repo, token, apiBaseUrl, defaultLabels, theme } = useKanban();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        setError('');
        const res = await fetch(`${apiBaseUrl}/repos/${repo}/issues`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title.trim(), body: body.trim() || undefined, labels: defaultLabels }),
        });
        setLoading(false);
        if (res.ok) {
            setTitle('');
            setBody('');
            setOpen(false);
            onCreated();
        } else {
            const data = await res.json() as { message?: string };
            setError(data.message ?? 'Failed to create issue');
        }
    }

    const iStyle = inputStyle(theme);

    if (!open) {
        return (
            <button
                style={{
                    background: theme.borderCard,
                    border: `1px dashed ${theme.borderMuted}`,
                    color: theme.textSubtle,
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 13,
                    cursor: 'pointer',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
                onClick={() => setOpen(true)}
            >
                + New Issue
            </button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                background: theme.bgCard,
                border: `1px solid ${theme.blue}`,
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}
        >
            <span style={{ color: theme.blue, fontWeight: 600, fontSize: 13 }}>New Issue</span>
            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={iStyle}
                autoFocus
            />
            <textarea
                placeholder="Description (optional)"
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={3}
                style={{ ...iStyle, resize: 'vertical' }}
            />
            {error && <span style={{ color: theme.red, fontSize: 11 }}>{error}</span>}
            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    type="submit"
                    disabled={loading || !title.trim()}
                    style={btnStyle(theme.green)}
                >
                    {loading ? 'Creating...' : 'Create'}
                </button>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={btnStyle(theme.red)}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
