// src/GithubKanban.tsx
import { useState as useState3, useEffect as useEffect2, useMemo } from "react";

// src/theme.ts
var catppuccinMocha = {
  bgPage: "#11111b",
  bgCard: "#1e1e2e",
  bgInput: "#181825",
  borderCard: "#313244",
  borderMuted: "#45475a",
  textMuted: "#6c7086",
  textSubtle: "#a6adc8",
  text: "#cdd6f4",
  blue: "#89b4fa",
  green: "#a6e3a1",
  red: "#f38ba8",
  yellow: "#f9e2af",
  peach: "#fab387",
  mauve: "#cba6f7"
};

// src/api.ts
function makeHeaders(token) {
  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
async function fetchActiveWorkflowRuns(apiBaseUrl, repo, headers, branchIssuePattern) {
  try {
    const [inProgressRes, queuedRes] = await Promise.all([
      fetch(`${apiBaseUrl}/repos/${repo}/actions/runs?status=in_progress&per_page=30`, { headers }),
      fetch(`${apiBaseUrl}/repos/${repo}/actions/runs?status=queued&per_page=10`, { headers })
    ]);
    const inProgressData = inProgressRes.ok ? await inProgressRes.json() : { workflow_runs: [] };
    const queuedData = queuedRes.ok ? await queuedRes.json() : { workflow_runs: [] };
    const allRuns = [
      ...inProgressData.workflow_runs ?? [],
      ...queuedData.workflow_runs ?? []
    ];
    const issueNumbers = /* @__PURE__ */ new Set();
    for (const run of allRuns) {
      const branch = run.head_branch ?? "";
      const match = branch.match(branchIssuePattern);
      if (match) issueNumbers.add(parseInt(match[1]));
    }
    return { runs: allRuns, inProgressNumbers: issueNumbers };
  } catch {
    return { runs: [], inProgressNumbers: /* @__PURE__ */ new Set() };
  }
}

// src/context.ts
import { createContext, useContext } from "react";
var KanbanContext = createContext(null);
function useKanban() {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error("useKanban must be used within GithubKanban");
  return ctx;
}

// src/IssueCard.tsx
import { useState, useEffect } from "react";

// src/utils.ts
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1e3);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
function btnStyle(color) {
  return {
    background: "transparent",
    border: `1px solid ${color}`,
    color,
    borderRadius: 4,
    padding: "3px 10px",
    fontSize: 11,
    cursor: "pointer"
  };
}
function inputStyle(theme) {
  return {
    background: theme.bgInput,
    border: `1px solid ${theme.borderCard}`,
    borderRadius: 6,
    color: theme.text,
    padding: "6px 10px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box"
  };
}

// src/IssueCard.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function IssueCard({ issue, columnId }) {
  const { repo, token, apiBaseUrl, hiddenLabels, tokenCommentPattern, theme, onRefresh } = useKanban();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claudeTokens, setClaudeTokens] = useState(null);
  useEffect(() => {
    if (columnId !== "done") return;
    const headers = { Accept: "application/vnd.github+json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}/comments`, { headers }).then((r) => r.ok ? r.json() : []).then((comments) => {
      for (const c of comments) {
        const match = c.body?.match(tokenCommentPattern);
        if (match) {
          setClaudeTokens(parseInt(match[1].replace(/,/g, "")));
          return;
        }
      }
    }).catch(() => {
    });
  }, [issue.number, columnId, token, apiBaseUrl, repo, tokenCommentPattern]);
  async function moveToInProgress() {
    setLoading(true);
    await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}/labels`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ labels: ["in progress"] })
    });
    setLoading(false);
    onRefresh();
  }
  async function moveToBacklog() {
    setLoading(true);
    await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}/labels/in%20progress`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setLoading(false);
    onRefresh();
  }
  async function closeIssue() {
    setLoading(true);
    await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "closed" })
    });
    setLoading(false);
    onRefresh();
  }
  async function reopenIssue() {
    setLoading(true);
    await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: "open" })
    });
    setLoading(false);
    onRefresh();
  }
  async function revertIssue() {
    setLoading(true);
    await fetch(`${apiBaseUrl}/repos/${repo}/issues/${issue.number}/labels`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ labels: ["reverted"] })
    });
    setLoading(false);
    onRefresh();
  }
  const visibleLabels = issue.labels.filter((l) => !hiddenLabels.has(l.name.toLowerCase()));
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        background: theme.bgCard,
        border: `1px solid ${theme.borderCard}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        cursor: "pointer",
        opacity: loading ? 0.5 : 1
      },
      onClick: () => setExpanded((e) => !e),
      children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: 8 }, children: [
          /* @__PURE__ */ jsxs("span", { style: { color: theme.textMuted, fontSize: 11, flexShrink: 0, marginTop: 1 }, children: [
            "#",
            issue.number
          ] }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: theme.text, flex: 1, lineHeight: 1.4 }, children: issue.title })
        ] }),
        (visibleLabels.length > 0 || columnId === "done" && claudeTokens !== null) && /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6, alignItems: "center" }, children: [
          visibleLabels.map((l) => /* @__PURE__ */ jsx(
            "span",
            {
              style: {
                background: `#${l.color}33`,
                border: `1px solid #${l.color}88`,
                color: `#${l.color}`,
                borderRadius: 4,
                fontSize: 10,
                padding: "1px 6px"
              },
              children: l.name
            },
            l.name
          )),
          columnId === "done" && claudeTokens !== null && /* @__PURE__ */ jsxs(
            "span",
            {
              style: {
                background: `${theme.mauve}33`,
                border: `1px solid ${theme.mauve}88`,
                color: theme.mauve,
                borderRadius: 4,
                fontSize: 10,
                padding: "1px 6px"
              },
              children: [
                claudeTokens.toLocaleString(),
                " tokens"
              ]
            }
          )
        ] }),
        expanded && /* @__PURE__ */ jsxs(
          "div",
          {
            style: { marginTop: 8 },
            onClick: (e) => e.stopPropagation(),
            children: [
              issue.body && /* @__PURE__ */ jsx("p", { style: { color: theme.textSubtle, fontSize: 12, margin: "0 0 8px", lineHeight: 1.5 }, children: issue.body }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [
                columnId === "backlog" && token && /* @__PURE__ */ jsx(
                  "button",
                  {
                    style: btnStyle(theme.blue),
                    onClick: moveToInProgress,
                    disabled: loading,
                    children: "\u2192 In Progress"
                  }
                ),
                columnId === "in_progress" && token && /* @__PURE__ */ jsx(
                  "button",
                  {
                    style: btnStyle(theme.textSubtle),
                    onClick: moveToBacklog,
                    disabled: loading,
                    children: "\u2190 Backlog"
                  }
                ),
                columnId !== "done" && columnId !== "reverted" && token && /* @__PURE__ */ jsx(
                  "button",
                  {
                    style: btnStyle(theme.green),
                    onClick: closeIssue,
                    disabled: loading,
                    children: "Close \u2713"
                  }
                ),
                columnId === "done" && token && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      style: btnStyle(theme.red),
                      onClick: reopenIssue,
                      disabled: loading,
                      children: "Reopen"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      style: btnStyle(theme.peach),
                      onClick: revertIssue,
                      disabled: loading,
                      children: "Revert PR"
                    }
                  )
                ] }),
                columnId === "reverted" && token && /* @__PURE__ */ jsx(
                  "button",
                  {
                    style: btnStyle(theme.red),
                    onClick: reopenIssue,
                    disabled: loading,
                    children: "Reopen"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: issue.html_url,
                    target: "_blank",
                    rel: "noreferrer",
                    style: { ...btnStyle(theme.mauve), textDecoration: "none" },
                    children: "GitHub \u2197"
                  }
                )
              ] })
            ]
          }
        )
      ]
    }
  );
}

// src/KanbanColumn.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function KanbanColumn({ col, issues }) {
  const { theme } = useKanban();
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      style: {
        flex: "1 1 280px",
        minWidth: 240,
        maxWidth: 400,
        display: "flex",
        flexDirection: "column"
      },
      children: [
        /* @__PURE__ */ jsxs2(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: `2px solid ${col.color}`
            },
            children: [
              /* @__PURE__ */ jsx2("span", { style: { fontSize: 13, fontWeight: 600, color: col.color, textTransform: "uppercase", letterSpacing: 1 }, children: col.title }),
              /* @__PURE__ */ jsx2(
                "span",
                {
                  style: {
                    background: col.color + "33",
                    color: col.color,
                    borderRadius: 10,
                    fontSize: 11,
                    padding: "1px 7px",
                    fontWeight: 600
                  },
                  children: issues.length
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsx2("div", { style: { flex: 1, overflowY: "auto" }, children: issues.length === 0 ? /* @__PURE__ */ jsx2("p", { style: { color: theme.borderMuted, fontSize: 12, textAlign: "center", marginTop: 20 }, children: "No issues" }) : issues.map((issue) => /* @__PURE__ */ jsx2(
          IssueCard,
          {
            issue,
            columnId: col.id
          },
          issue.number
        )) })
      ]
    }
  );
}

// src/CreateIssueForm.tsx
import { useState as useState2 } from "react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function CreateIssueForm({ onCreated }) {
  const { repo, token, apiBaseUrl, defaultLabels, theme } = useKanban();
  const [open, setOpen] = useState2(false);
  const [title, setTitle] = useState2("");
  const [body, setBody] = useState2("");
  const [loading, setLoading] = useState2(false);
  const [error, setError] = useState2("");
  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch(`${apiBaseUrl}/repos/${repo}/issues`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body: body.trim() || void 0, labels: defaultLabels })
    });
    setLoading(false);
    if (res.ok) {
      setTitle("");
      setBody("");
      setOpen(false);
      onCreated();
    } else {
      const data = await res.json();
      setError(data.message ?? "Failed to create issue");
    }
  }
  const iStyle = inputStyle(theme);
  if (!open) {
    return /* @__PURE__ */ jsx3(
      "button",
      {
        style: {
          background: theme.borderCard,
          border: `1px dashed ${theme.borderMuted}`,
          color: theme.textSubtle,
          borderRadius: 8,
          padding: "8px 16px",
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 6
        },
        onClick: () => setOpen(true),
        children: "+ New Issue"
      }
    );
  }
  return /* @__PURE__ */ jsxs3(
    "form",
    {
      onSubmit: handleSubmit,
      style: {
        background: theme.bgCard,
        border: `1px solid ${theme.blue}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8
      },
      children: [
        /* @__PURE__ */ jsx3("span", { style: { color: theme.blue, fontWeight: 600, fontSize: 13 }, children: "New Issue" }),
        /* @__PURE__ */ jsx3(
          "input",
          {
            type: "text",
            placeholder: "Title",
            value: title,
            onChange: (e) => setTitle(e.target.value),
            style: iStyle,
            autoFocus: true
          }
        ),
        /* @__PURE__ */ jsx3(
          "textarea",
          {
            placeholder: "Description (optional)",
            value: body,
            onChange: (e) => setBody(e.target.value),
            rows: 3,
            style: { ...iStyle, resize: "vertical" }
          }
        ),
        error && /* @__PURE__ */ jsx3("span", { style: { color: theme.red, fontSize: 11 }, children: error }),
        /* @__PURE__ */ jsxs3("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ jsx3(
            "button",
            {
              type: "submit",
              disabled: loading || !title.trim(),
              style: btnStyle(theme.green),
              children: loading ? "Creating..." : "Create"
            }
          ),
          /* @__PURE__ */ jsx3(
            "button",
            {
              type: "button",
              onClick: () => setOpen(false),
              style: btnStyle(theme.red),
              children: "Cancel"
            }
          )
        ] })
      ]
    }
  );
}

// src/WorkflowRunsPanel.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function WorkflowRunsPanel({ runs, loading }) {
  const { theme, branchIssuePattern } = useKanban();
  if (runs.length === 0 && !loading) return null;
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      style: {
        background: theme.bgCard,
        border: `1px solid ${theme.borderCard}`,
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 16
      },
      children: [
        /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }, children: [
          /* @__PURE__ */ jsx4(
            "span",
            {
              style: {
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: theme.yellow,
                flexShrink: 0,
                boxShadow: `0 0 6px ${theme.yellow}`
              }
            }
          ),
          /* @__PURE__ */ jsx4("span", { style: { fontSize: 12, fontWeight: 600, color: theme.yellow, letterSpacing: 0.5 }, children: "LIVE CI STATUS" }),
          loading && /* @__PURE__ */ jsx4("span", { style: { fontSize: 11, color: theme.textMuted, fontStyle: "italic" }, children: "refreshing\u2026" }),
          /* @__PURE__ */ jsx4(
            "span",
            {
              style: {
                background: `${theme.yellow}33`,
                color: theme.yellow,
                borderRadius: 10,
                fontSize: 11,
                padding: "1px 7px",
                fontWeight: 600
              },
              children: runs.length
            }
          )
        ] }),
        /* @__PURE__ */ jsx4("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: runs.map((run) => {
          const isQueued = run.status === "queued";
          const statusColor = isQueued ? theme.blue : theme.yellow;
          const issueMatch = run.head_branch?.match(branchIssuePattern);
          return /* @__PURE__ */ jsxs4(
            "a",
            {
              href: run.html_url,
              target: "_blank",
              rel: "noreferrer",
              style: {
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: theme.bgInput,
                border: `1px solid ${statusColor}44`,
                borderRadius: 6,
                padding: "6px 10px",
                textDecoration: "none",
                color: "inherit"
              },
              children: [
                /* @__PURE__ */ jsx4(
                  "span",
                  {
                    style: {
                      fontSize: 10,
                      fontWeight: 700,
                      color: statusColor,
                      background: `${statusColor}22`,
                      border: `1px solid ${statusColor}66`,
                      borderRadius: 4,
                      padding: "1px 6px",
                      flexShrink: 0,
                      textTransform: "uppercase",
                      letterSpacing: 0.5
                    },
                    children: isQueued ? "queued" : "running"
                  }
                ),
                /* @__PURE__ */ jsx4("span", { style: { fontSize: 12, color: theme.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: run.name }),
                /* @__PURE__ */ jsx4("span", { style: { fontSize: 11, color: theme.textMuted, flexShrink: 0 }, children: run.head_branch }),
                issueMatch && /* @__PURE__ */ jsxs4(
                  "span",
                  {
                    style: {
                      fontSize: 10,
                      color: theme.mauve,
                      background: `${theme.mauve}22`,
                      border: `1px solid ${theme.mauve}66`,
                      borderRadius: 4,
                      padding: "1px 6px",
                      flexShrink: 0
                    },
                    children: [
                      "#",
                      issueMatch[1]
                    ]
                  }
                ),
                /* @__PURE__ */ jsx4("span", { style: { fontSize: 11, color: theme.borderMuted, flexShrink: 0 }, children: timeAgo(run.created_at) })
              ]
            },
            run.id
          );
        }) })
      ]
    }
  );
}

// src/GithubKanban.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var DEFAULT_COLUMNS = [
  {
    id: "backlog",
    title: "Backlog",
    color: "#89b4fa",
    classify: (issue, inProgressNumbers) => issue.state === "open" && !inProgressNumbers.has(issue.number) && !issue.labels.some((l) => l.name.toLowerCase() === "in progress")
  },
  {
    id: "in_progress",
    title: "In Progress",
    color: "#f9e2af",
    classify: (issue, inProgressNumbers) => issue.state === "open" && (inProgressNumbers.has(issue.number) || issue.labels.some((l) => l.name.toLowerCase() === "in progress"))
  },
  {
    id: "done",
    title: "Done",
    color: "#a6e3a1",
    classify: (issue) => issue.state === "closed" && !issue.labels.some((l) => l.name.toLowerCase() === "reverted")
  },
  {
    id: "reverted",
    title: "Reverted",
    color: "#fab387",
    classify: (issue) => issue.state === "closed" && issue.labels.some((l) => l.name.toLowerCase() === "reverted")
  }
];
function GithubKanban({
  repo,
  token: tokenProp = "",
  apiBaseUrl = "https://api.github.com",
  columns = DEFAULT_COLUMNS,
  hiddenLabels = ["in progress", "claude"],
  defaultLabels = ["Claude"],
  branchIssuePattern = /issue[- _](\d+)/i,
  tokenCommentPattern = /(\d[\d,]*)\s*tokens?/i,
  showWorkflowRuns = true,
  showCreateForm = true,
  showTokenInput = true,
  pollIntervalMs = 3e4,
  theme: themeProp,
  onBack,
  promoteWorkflow
}) {
  const theme = useMemo(() => ({ ...catppuccinMocha, ...themeProp }), [themeProp]);
  const hiddenLabelsSet = useMemo(() => new Set(hiddenLabels.map((l) => l.toLowerCase())), [hiddenLabels]);
  const [issues, setIssues] = useState3([]);
  const [loading, setLoading] = useState3(true);
  const [error, setError] = useState3("");
  const [token, setToken] = useState3(tokenProp);
  const [tokenInput, setTokenInput] = useState3(tokenProp);
  const [inProgressNumbers, setInProgressNumbers] = useState3(/* @__PURE__ */ new Set());
  const [activeRuns, setActiveRuns] = useState3([]);
  const [ciLoading, setCiLoading] = useState3(false);
  const [promoting, setPromoting] = useState3(false);
  const [promoteStatus, setPromoteStatus] = useState3("idle");
  useEffect2(() => {
    setToken(tokenProp);
    setTokenInput(tokenProp);
  }, [tokenProp]);
  async function promoteToProd() {
    if (!promoteWorkflow) return;
    setPromoting(true);
    setPromoteStatus("idle");
    try {
      const res = await fetch(
        `${apiBaseUrl}/repos/${repo}/actions/workflows/${promoteWorkflow.workflowFile}/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github+json"
          },
          body: JSON.stringify({ ref: promoteWorkflow.ref })
        }
      );
      setPromoteStatus(res.ok || res.status === 204 ? "success" : "error");
    } catch {
      setPromoteStatus("error");
    }
    setPromoting(false);
  }
  async function fetchIssues() {
    setLoading(true);
    setCiLoading(true);
    setError("");
    try {
      const headers = makeHeaders(token);
      const [openRes, closedRes, workflowData] = await Promise.all([
        fetch(`${apiBaseUrl}/repos/${repo}/issues?state=open&per_page=100`, { headers }),
        fetch(`${apiBaseUrl}/repos/${repo}/issues?state=closed&per_page=50`, { headers }),
        fetchActiveWorkflowRuns(apiBaseUrl, repo, headers, branchIssuePattern)
      ]);
      if (!openRes.ok) throw new Error(`GitHub API error: ${openRes.status}`);
      const open = await openRes.json();
      const closed = closedRes.ok ? await closedRes.json() : [];
      setInProgressNumbers(workflowData.inProgressNumbers);
      setActiveRuns(workflowData.runs);
      setIssues([...open, ...closed].filter((i) => !i.pull_request));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load issues");
    }
    setLoading(false);
    setCiLoading(false);
  }
  useEffect2(() => {
    fetchIssues();
  }, [token]);
  useEffect2(() => {
    if (!pollIntervalMs) return;
    const interval = setInterval(async () => {
      const headers = makeHeaders(token);
      const workflowData = await fetchActiveWorkflowRuns(apiBaseUrl, repo, headers, branchIssuePattern);
      setActiveRuns(workflowData.runs);
      setInProgressNumbers(workflowData.inProgressNumbers);
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [token, pollIntervalMs]);
  const columnIssues = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const col of columns) map.set(col.id, []);
    for (const issue of issues) {
      for (const col of columns) {
        if (col.classify(issue, inProgressNumbers)) {
          map.get(col.id).push(issue);
          break;
        }
      }
    }
    return map;
  }, [issues, columns, inProgressNumbers]);
  const iStyle = inputStyle(theme);
  return /* @__PURE__ */ jsx5(KanbanContext.Provider, { value: {
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
    onRefresh: fetchIssues
  }, children: /* @__PURE__ */ jsxs5(
    "div",
    {
      style: {
        minHeight: "100%",
        background: theme.bgPage,
        padding: "16px 24px 24px",
        display: "flex",
        flexDirection: "column",
        color: theme.text,
        fontFamily: "inherit",
        boxSizing: "border-box"
      },
      children: [
        /* @__PURE__ */ jsxs5("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }, children: [
          onBack && /* @__PURE__ */ jsx5(
            "button",
            {
              onClick: onBack,
              style: {
                background: "transparent",
                border: `1px solid ${theme.borderMuted}`,
                color: theme.textSubtle,
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 13,
                cursor: "pointer"
              },
              children: "\u2190 Back"
            }
          ),
          /* @__PURE__ */ jsxs5("div", { children: [
            /* @__PURE__ */ jsx5("h2", { style: { margin: 0, fontSize: 18, fontWeight: 700, color: theme.text }, children: "Issue Tracker" }),
            /* @__PURE__ */ jsx5("p", { style: { margin: 0, fontSize: 11, color: theme.textMuted }, children: repo })
          ] }),
          /* @__PURE__ */ jsxs5("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ jsx5(
              "button",
              {
                onClick: fetchIssues,
                disabled: loading,
                style: {
                  background: "transparent",
                  border: `1px solid ${theme.borderMuted}`,
                  color: theme.textSubtle,
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 12,
                  cursor: "pointer"
                },
                children: loading ? "..." : "\u21BB Refresh"
              }
            ),
            token && promoteWorkflow && /* @__PURE__ */ jsx5(
              "button",
              {
                onClick: promoteToProd,
                disabled: promoting,
                style: {
                  background: promoteStatus === "success" ? `${theme.green}33` : promoteStatus === "error" ? `${theme.red}33` : "transparent",
                  border: `1px solid ${promoteStatus === "success" ? theme.green : promoteStatus === "error" ? theme.red : theme.green}`,
                  color: promoteStatus === "success" ? theme.green : promoteStatus === "error" ? theme.red : theme.green,
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 12,
                  cursor: promoting ? "not-allowed" : "pointer",
                  fontWeight: 600
                },
                children: promoting ? "Promoting..." : promoteStatus === "success" ? "\u2713 Promoted!" : promoteStatus === "error" ? "\u2717 Failed" : "\u2B06 Promote to Prod"
              }
            )
          ] })
        ] }),
        showTokenInput && /* @__PURE__ */ jsxs5(
          "div",
          {
            style: {
              background: theme.bgCard,
              border: `1px solid ${theme.borderCard}`,
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap"
            },
            children: [
              /* @__PURE__ */ jsx5("span", { style: { fontSize: 12, color: theme.textSubtle, flexShrink: 0 }, children: "GitHub Token:" }),
              /* @__PURE__ */ jsx5(
                "input",
                {
                  type: "password",
                  placeholder: "ghp_... (required for write actions)",
                  value: tokenInput,
                  onChange: (e) => setTokenInput(e.target.value),
                  style: { ...iStyle, flex: "1 1 200px", maxWidth: 300 }
                }
              ),
              /* @__PURE__ */ jsx5(
                "button",
                {
                  onClick: () => setToken(tokenInput),
                  style: btnStyle(theme.blue),
                  children: "Apply"
                }
              ),
              /* @__PURE__ */ jsx5("span", { style: { fontSize: 11, color: theme.textMuted }, children: token ? "\u25CF Connected" : "\u25CB Read-only (no token)" })
            ]
          }
        ),
        showCreateForm && token && /* @__PURE__ */ jsx5(CreateIssueForm, { onCreated: fetchIssues }),
        error && /* @__PURE__ */ jsx5(
          "div",
          {
            style: {
              background: `${theme.red}33`,
              border: `1px solid ${theme.red}`,
              borderRadius: 6,
              padding: "8px 12px",
              color: theme.red,
              fontSize: 12,
              marginBottom: 16
            },
            children: error
          }
        ),
        showWorkflowRuns && /* @__PURE__ */ jsx5(WorkflowRunsPanel, { runs: activeRuns, loading: ciLoading }),
        /* @__PURE__ */ jsx5(
          "div",
          {
            style: {
              display: "flex",
              gap: 20,
              flex: 1,
              overflowX: "auto",
              alignItems: "flex-start"
            },
            children: columns.map((col) => /* @__PURE__ */ jsx5(
              KanbanColumn,
              {
                col,
                issues: columnIssues.get(col.id) ?? []
              },
              col.id
            ))
          }
        )
      ]
    }
  ) });
}
export {
  CreateIssueForm,
  GithubKanban,
  IssueCard,
  KanbanColumn,
  WorkflowRunsPanel,
  catppuccinMocha
};
