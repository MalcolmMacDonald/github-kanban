import type { WorkflowRun } from './types.js';
export declare function makeHeaders(token?: string): Record<string, string>;
export declare function fetchActiveWorkflowRuns(apiBaseUrl: string, repo: string, headers: Record<string, string>, branchIssuePattern: RegExp): Promise<{
    runs: WorkflowRun[];
    inProgressNumbers: Set<number>;
}>;
//# sourceMappingURL=api.d.ts.map