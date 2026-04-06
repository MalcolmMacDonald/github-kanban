import { createContext, useContext } from 'react';
import type { Theme, ColumnDefinition } from './types.js';

type KanbanContextValue = {
    repo: string;
    token: string;
    apiBaseUrl: string;
    hiddenLabels: Set<string>;
    defaultLabels: string[];
    branchIssuePattern: RegExp;
    tokenCommentPattern: RegExp;
    theme: Theme;
    columns: ColumnDefinition[];
    inProgressNumbers: Set<number>;
    onRefresh: () => void;
};

export const KanbanContext = createContext<KanbanContextValue | null>(null);

export function useKanban(): KanbanContextValue {
    const ctx = useContext(KanbanContext);
    if (!ctx) throw new Error('useKanban must be used within GithubKanban');
    return ctx;
}
