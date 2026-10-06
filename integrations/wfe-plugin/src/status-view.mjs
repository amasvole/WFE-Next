const STATE_ORDER = new Map([
  ["RUNNING", 0],
  ["READY", 1],
  ["BLOCKED", 2],
  ["DONE", 3],
  ["NO ACTIVE WORK", 4],
]);

const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function operatorOrigin(value = "http://127.0.0.1:4317") {
  const url = new URL(value);
  if (url.protocol !== "http:" || !loopbackHosts.has(url.hostname)) {
    throw new Error("WFE_OPERATOR_ORIGIN must be an HTTP loopback origin");
  }
  return url.origin;
}

function projectName(project) {
  return project?.name || project?.id || "Unnamed project";
}

function projectView(project, projection = {}) {
  return {
    id: project.id,
    name: projectName(project),
    lifecycle: projection.metadata?.lifecycle ?? "INACTIVE",
    purpose: projection.metadata?.purpose ?? "LEGACY_UNKNOWN",
    protection: projection.metadata?.protection ?? "WARN_BEFORE_MUTATION",
    state: projection.state ?? "NO ACTIVE WORK",
    execution: projection.execution ?? "NO ACTIVE RUN",
    currentGoal: projection.goal ?? null,
    planReady: projection.planReady === true,
    currentRun: projection.currentRun ?? null,
    currentStep: projection.currentStep ?? "None",
    startedAt: projection.startedAt ?? null,
    acceptedResult: projection.acceptedResult ?? null,
    lastActivity: projection.lastActivity ?? null,
    runs: Number.isInteger(projection.runs) ? projection.runs : (project.runs?.length ?? 0),
    acceptedRuns: Number.isInteger(projection.acceptedRuns)
      ? projection.acceptedRuns
      : (project.runs ?? []).filter((run) => run.status === "DONE").length,
    interrupted: projection.interrupted === true,
  };
}

function activityTime(value) {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildStatusView(state, observedAt = new Date().toISOString()) {
  if (!state || typeof state !== "object" || !state.projects || typeof state.projects !== "object") {
    throw new Error("invalid WFE operator state");
  }

  const projections = state.projectStatus ?? {};
  const projects = Object.values(state.projects)
    .filter((project) => project && typeof project.id === "string")
    .map((project) => projectView(project, projections[project.id]))
    .sort((a, b) =>
      (STATE_ORDER.get(a.state) ?? 99) - (STATE_ORDER.get(b.state) ?? 99)
      || activityTime(b.lastActivity) - activityTime(a.lastActivity)
      || a.name.localeCompare(b.name)
      || a.id.localeCompare(b.id)
    );

  const active = projects.filter((project) => project.state === "RUNNING");
  const ready = projects.filter((project) => project.state === "READY");
  const blocked = projects.filter((project) => project.state === "BLOCKED");

  return {
    schemaVersion: "wfe.status.v0",
    available: true,
    observedAt,
    operator: {
      pid: Number.isInteger(state.operator?.pid) ? state.operator.pid : null,
      startedAt: state.operator?.startedAt ?? null,
      loadedCode: state.operator?.loadedCode ?? null,
    },
    counts: {
      projects: projects.length,
      active: active.length,
      ready: ready.length,
      blocked: blocked.length,
      opened: state.opened && typeof state.opened === "object"
        ? Object.keys(state.opened).length
        : 0,
    },
    active,
    ready,
    blocked,
    projects,
  };
}

function projectLine(project) {
  const run = project.currentRun ? ` · run ${project.currentRun}` : "";
  const step = project.currentStep && project.currentStep !== "None"
    ? ` · ${project.currentStep}`
    : "";
  return `- ${project.name} [${project.id}] — ${project.state}${run}${step}`;
}

export function formatStatusText(view) {
  if (!view.available) {
    return [
      "WFE operator: UNAVAILABLE",
      "The read-only MCP adapter could not read the loopback WFE operator.",
      "No mutation was attempted.",
    ].join("\n");
  }

  const lines = [
    "WFE operator: AVAILABLE",
    `Projects: ${view.counts.projects} · active ${view.counts.active} · ready ${view.counts.ready} · blocked ${view.counts.blocked} · opened ${view.counts.opened}`,
  ];

  if (view.active.length) {
    lines.push("", "ACTIVE WORK", ...view.active.map(projectLine));
  }
  if (view.ready.length) {
    lines.push("", "READY", ...view.ready.map(projectLine));
  }
  if (view.blocked.length) {
    lines.push("", "BLOCKED", ...view.blocked.slice(0, 8).map(projectLine));
    if (view.blocked.length > 8) lines.push(`- … ${view.blocked.length - 8} more blocked projects`);
  }
  if (!view.active.length && !view.ready.length && !view.blocked.length) {
    lines.push("", "No active, ready, or blocked work.");
  }

  return lines.join("\n");
}

export function unavailableStatus(observedAt = new Date().toISOString()) {
  return {
    schemaVersion: "wfe.status.v0",
    available: false,
    observedAt,
    operator: null,
    counts: { projects: 0, active: 0, ready: 0, blocked: 0, opened: 0 },
    active: [],
    ready: [],
    blocked: [],
    projects: [],
    error: {
      code: "WFE_OPERATOR_UNAVAILABLE",
      message: "Loopback WFE operator did not return canonical state.",
    },
  };
}
