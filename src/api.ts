import type { WorkflowRun } from './types.js';

export function makeHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
}

export async function fetchActiveWorkflowRuns(
    apiBaseUrl: string,
    repo: string,
    headers: Record<string, string>,
    branchIssuePattern: RegExp,
): Promise<{ runs: WorkflowRun[]; inProgressNumbers: Set<number> }> {
    try {
        const [inProgressRes, queuedRes] = await Promise.all([
            fetch(`${apiBaseUrl}/repos/${repo}/actions/runs?status=in_progress&per_page=30`, { headers }),
            fetch(`${apiBaseUrl}/repos/${repo}/actions/runs?status=queued&per_page=10`, { headers }),
        ]);
        const inProgressData = inProgressRes.ok ? await inProgressRes.json() : { workflow_runs: [] };
        const queuedData = queuedRes.ok ? await queuedRes.json() : { workflow_runs: [] };
        const allRuns: WorkflowRun[] = [
            ...(inProgressData.workflow_runs ?? []),
            ...(queuedData.workflow_runs ?? []),
        ];
        const issueNumbers = new Set<number>();
        for (const run of allRuns) {
            const branch: string = run.head_branch ?? '';
            const match = branch.match(branchIssuePattern);
            if (match) issueNumbers.add(parseInt(match[1]));
        }
        return { runs: allRuns, inProgressNumbers: issueNumbers };
    } catch {
        return { runs: [], inProgressNumbers: new Set() };
    }
}
