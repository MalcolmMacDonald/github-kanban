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
export declare const KanbanContext: import("react").Context<KanbanContextValue | null>;
export declare function useKanban(): KanbanContextValue;
export {};
//# sourceMappingURL=context.d.ts.map