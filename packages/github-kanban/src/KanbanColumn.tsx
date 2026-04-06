import type { Issue, ColumnDefinition } from './types.js';
import { useKanban } from './context.js';
import { IssueCard } from './IssueCard.js';

export function KanbanColumn({ col, issues }: { col: ColumnDefinition; issues: Issue[] }) {
    const { theme } = useKanban();

    return (
        <div
            style={{
                flex: '1 1 280px',
                minWidth: 240,
                maxWidth: 400,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: `2px solid ${col.color}`,
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 600, color: col.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {col.title}
                </span>
                <span
                    style={{
                        background: col.color + '33',
                        color: col.color,
                        borderRadius: 10,
                        fontSize: 11,
                        padding: '1px 7px',
                        fontWeight: 600,
                    }}
                >
                    {issues.length}
                </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {issues.length === 0 ? (
                    <p style={{ color: theme.borderMuted, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                        No issues
                    </p>
                ) : (
                    issues.map(issue => (
                        <IssueCard
                            key={issue.number}
                            issue={issue}
                            columnId={col.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
