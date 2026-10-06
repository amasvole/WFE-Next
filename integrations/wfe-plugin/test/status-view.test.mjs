import test from "node:test";
import assert from "node:assert/strict";
import {
  buildStatusView,
  formatStatusText,
  operatorOrigin,
  unavailableStatus,
} from "../src/status-view.mjs";

const state = {
  operator: {
    pid: 42,
    root: "C:/must-not-leak",
    loadedCode: "abc123",
    startedAt: "2026-10-06T10:00:00.000Z",
  },
  active: ["active"],
  opened: { done: { url: "http://127.0.0.1:6000", pid: 77, port: 6000 } },
  projects: {
    done: {
      id: "done",
      name: "Done",
      runs: [{ id: "r0", status: "DONE", secret: "raw-run-must-not-leak" }],
    },
    blocked: { id: "blocked", name: "Blocked", runs: [] },
    ready: { id: "ready", name: "Ready", runs: [] },
    active: { id: "active", name: "Active", runs: [] },
  },
  projectStatus: {
    active: {
      metadata: { lifecycle: "ACTIVE", purpose: "USER_PROJECT", protection: "NORMAL" },
      state: "RUNNING",
      execution: "Local WFE operator execution · provider owner unavailable",
      goal: "Build the thing",
      currentRun: "r-active",
      currentStep: "BUILDING · RUNNING",
      runs: 1,
      acceptedRuns: 0,
      lastActivity: "2026-10-06T13:00:00.000Z",
    },
    ready: {
      metadata: { lifecycle: "ACTIVE", purpose: "USER_PROJECT", protection: "NORMAL" },
      state: "READY",
      execution: "NO ACTIVE RUN",
      goal: "Next goal",
      planReady: true,
      runs: 0,
      acceptedRuns: 0,
      lastActivity: "2026-10-06T12:00:00.000Z",
    },
    blocked: {
      metadata: { lifecycle: "INACTIVE", purpose: "LEGACY_UNKNOWN", protection: "WARN_BEFORE_MUTATION" },
      state: "BLOCKED",
      execution: "Interrupted / no live execution evidence",
      currentRun: "r-blocked",
      currentStep: "VERIFYING · FAILED",
      runs: 1,
      acceptedRuns: 0,
      lastActivity: "2026-10-06T11:00:00.000Z",
      interrupted: true,
    },
    done: {
      metadata: { lifecycle: "INACTIVE", purpose: "ACCEPTANCE_FIXTURE", protection: "WARN_BEFORE_MUTATION" },
      state: "DONE",
      execution: "NO ACTIVE RUN",
      acceptedResult: "r0",
      runs: 1,
      acceptedRuns: 1,
      lastActivity: "2026-10-06T09:00:00.000Z",
    },
  },
};

test("status view is bounded and orders actionable work first", () => {
  const view = buildStatusView(state, "2026-10-06T13:30:00.000Z");
  assert.deepEqual(view.projects.map((project) => project.id), ["active", "ready", "blocked", "done"]);
  assert.deepEqual(view.counts, { projects: 4, active: 1, ready: 1, blocked: 1, opened: 1 });
  assert.equal(view.operator.pid, 42);
  assert.equal(view.operator.loadedCode, "abc123");
  assert.equal("root" in view.operator, false);
  assert.equal(JSON.stringify(view).includes("raw-run-must-not-leak"), false);
});

test("text summary consolidates active, ready and blocked state", () => {
  const text = formatStatusText(buildStatusView(state));
  assert.match(text, /ACTIVE WORK/);
  assert.match(text, /Ready \[ready\] — READY/);
  assert.match(text, /Blocked \[blocked\] — BLOCKED/);
});

test("operator origin is loopback-only", () => {
  assert.equal(operatorOrigin(), "http://127.0.0.1:4317");
  assert.equal(operatorOrigin("http://localhost:4317"), "http://localhost:4317");
  assert.throws(() => operatorOrigin("https://example.com"), /loopback/);
  assert.throws(() => operatorOrigin("http://192.168.1.20:4317"), /loopback/);
});

test("unavailable status is explicit and does not pretend an empty healthy WFE", () => {
  const view = unavailableStatus("2026-10-06T13:30:00.000Z");
  assert.equal(view.available, false);
  assert.equal(view.error.code, "WFE_OPERATOR_UNAVAILABLE");
  assert.match(formatStatusText(view), /UNAVAILABLE/);
});

test("invalid operator state fails closed", () => {
  assert.throws(() => buildStatusView({}), /invalid WFE operator state/);
});
