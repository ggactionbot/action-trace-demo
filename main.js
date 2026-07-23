import {
  render
} from "https://cdn.jsdelivr.net/npm/ggaction@0.0.6/src/index.js";

import { createDemoScenarios } from "./program.js";

const dataSources = Object.freeze({
  cars: "./data/cars.json",
  gapminder: "./data/gapminder.json",
  nightingale: "./data/nightingale_rose.json"
});

async function loadData() {
  const entries = await Promise.all(
    Object.entries(dataSources).map(async ([key, url]) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${url} returned HTTP ${response.status}.`);
      }
      return [key, await response.json()];
    })
  );
  return Object.freeze(Object.fromEntries(entries));
}

const canvas = document.querySelector("#chart");
const context = canvas.getContext("2d");
const scenarioTabs = document.querySelector("#scenario-tabs");
const branchChoices = document.querySelector("#branch-choices");
const trace = document.querySelector("#trace-list");
const traceSlider = document.querySelector("#trace-slider");
const traceOutput = document.querySelector("#trace-output");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const copyProgramButton = document.querySelector("#copy-program");
const copyRunnableButton = document.querySelector("#copy-runnable");
const downloadRunnableButton = document.querySelector("#download-runnable");
const sourceCode = document.querySelector("#source-code");
const status = document.querySelector("#status");
const projectFollowup = document.querySelector("#project-followup");

let scenarios;
let scenarioIndex = 0;
let branchIndex = 0;
let stepIndex = 0;

function resourceCount(program, key) {
  return program.semanticSpec[key]?.length ?? 0;
}

function currentSelection() {
  const scenario = scenarios[scenarioIndex];
  const branch = scenario.branches[branchIndex].build();
  return { scenario, branch };
}

function revealProjectFollowup() {
  projectFollowup.hidden = false;
}

const sourceKeywords = new Set([
  "await", "const", "false", "import", "from", "new", "null", "throw", "true"
]);
const sourceTokenPattern =
  /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:await|const|false|import|from|new|null|throw|true)\b|\b\d+(?:\.\d+)?\b|(?<=\.)[A-Za-z_$][\w$]*(?=\s*\())/g;

function highlightSource(source) {
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  for (const match of source.matchAll(sourceTokenPattern)) {
    fragment.append(document.createTextNode(source.slice(cursor, match.index)));
    const token = match[0];
    const span = document.createElement("span");
    span.className = token.startsWith("//")
      ? "code-comment"
      : sourceKeywords.has(token)
        ? "code-keyword"
        : /^["'`]/.test(token)
          ? "code-string"
          : /^\d/.test(token)
            ? "code-number"
            : "code-method";
    span.textContent = token;
    fragment.append(span);
    cursor = match.index + token.length;
  }
  fragment.append(document.createTextNode(source.slice(cursor)));
  sourceCode.replaceChildren(fragment);
}

function restorePermalink() {
  let parts;
  try {
    parts = location.hash.slice(1).split("/").map(decodeURIComponent);
  } catch {
    return false;
  }
  const nextScenarioIndex = scenarios.findIndex(item => item.id === parts[0]);
  if (nextScenarioIndex < 0) return false;

  scenarioIndex = nextScenarioIndex;
  const scenario = scenarios[scenarioIndex];
  const nextBranchIndex = scenario.branches.findIndex(
    item => item.id === parts[1]
  );
  branchIndex = Math.max(0, nextBranchIndex);
  const branch = scenario.branches[branchIndex].build();
  const nextStepIndex = branch.stages.findIndex(item => item.id === parts[2]);
  stepIndex = nextStepIndex < 0 ? branch.stages.length - 1 : nextStepIndex;
  return true;
}

function syncPermalink(scenario, branch, stage) {
  const hash = `#${[scenario.id, branch.id, stage.id]
    .map(encodeURIComponent)
    .join("/")}`;
  if (location.hash !== hash) history.replaceState(null, "", hash);
}

function publishState(scenario, branch, stage, renderedStep) {
  const program = stage.program;
  window.__ggactionDemo = Object.freeze({
    scenario: scenario.id,
    scenarioIndex,
    scenarios: scenarios.length,
    branch: branch.id,
    branchIndex,
    branches: scenario.branches.length,
    branchLabels: Object.freeze(scenario.branches.map(item => item.label)),
    step: stepIndex,
    renderedStep,
    previewDeferred: renderedStep !== stepIndex,
    stepId: stage.id,
    steps: branch.stages.length,
    commonSteps: scenario.commonSteps,
    operations: branch.operations,
    rows: branch.rows,
    runnableBytes: new TextEncoder().encode(branch.runnableSource).byteLength,
    sourceRows: scenario.sourceRows,
    datasets: resourceCount(program, "datasets"),
    layers: resourceCount(program, "layers"),
    graphics: Object.keys(program.graphicSpec.objects).length
  });
}

function selectScenario(index, { focus = false } = {}) {
  scenarioIndex = (index + scenarios.length) % scenarios.length;
  branchIndex = 0;
  stepIndex = scenarios[scenarioIndex].branches[0].actionCount - 1;
  update();
  if (focus) {
    scenarioTabs.querySelectorAll('[role="tab"]')[scenarioIndex].focus();
  }
}

function selectBranch(index, { focus = false } = {}) {
  const branches = scenarios[scenarioIndex].branches;
  branchIndex = (index + branches.length) % branches.length;
  stepIndex = branches[branchIndex].actionCount - 1;
  update();
  if (focus) {
    branchChoices.querySelectorAll('[role="radio"]')[branchIndex].focus();
  }
}

function updateScenarioTabs() {
  scenarioTabs.replaceChildren(...scenarios.map((scenario, index) => {
    const selected = index === scenarioIndex;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scenario-tab";
    button.id = `scenario-${scenario.id}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(selected));
    button.setAttribute("aria-controls", "scenario-panel");
    button.tabIndex = selected ? 0 : -1;
    button.innerHTML =
      `<span>${scenario.tab}</span><small>${scenario.branches.length} paths</small>`;
    button.addEventListener("click", () => selectScenario(index));
    button.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") selectScenario(0, { focus: true });
      else if (event.key === "End") {
        selectScenario(scenarios.length - 1, { focus: true });
      } else {
        selectScenario(index + (event.key === "ArrowRight" ? 1 : -1), {
          focus: true
        });
      }
    });
    return button;
  }));
}

function updateBranchChoices(scenario) {
  branchChoices.setAttribute(
    "aria-label",
    `Choose a branch for ${scenario.tab}`
  );
  branchChoices.replaceChildren(...scenario.branches.map((branch, index) => {
    const selected = index === branchIndex;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "branch-choice";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(selected));
    button.tabIndex = selected ? 0 : -1;
    button.innerHTML = [
      `<span>${branch.label}</span>`,
      `<small>${branch.description}</small>`,
      `<em>${branch.rows} rows · ${branch.actionCount} actions</em>`
    ].join("");
    button.addEventListener("click", () => selectBranch(index));
    button.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
        event.key
      )) return;
      event.preventDefault();
      selectBranch(
        index + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1),
        { focus: true }
      );
    });
    return button;
  }));
}

function updateTrace(scenario, branch) {
  trace.replaceChildren(...branch.stages.map((stage, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "trace-step";
    if (index < scenario.commonSteps) button.classList.add("is-common");
    if (index < stepIndex) button.classList.add("is-complete");
    if (index === stepIndex) {
      button.classList.add("is-current");
      button.setAttribute("aria-current", "step");
    }
    button.setAttribute(
      "aria-label",
      `Action ${index + 1} of ${branch.stages.length}: ${stage.op} — ${stage.label}`
    );
    button.innerHTML = [
      `<span>${index + 1}</span>`,
      `<code>${stage.op}</code>`
    ].join("");
    button.addEventListener("click", () => {
      stepIndex = index;
      update();
    });
    item.append(button);
    return item;
  }));
  traceSlider.max = String(branch.stages.length);
  traceSlider.value = String(stepIndex + 1);
  traceSlider.setAttribute(
    "aria-label",
    `Chart authoring progress, action ${stepIndex + 1} of ${branch.stages.length}`
  );
  traceOutput.textContent =
    `${stepIndex + 1} / ${branch.stages.length} · ${branch.stages[stepIndex].label}`;
  requestAnimationFrame(() => {
    trace.querySelector('[aria-current="step"]')?.scrollIntoView({
      block: "nearest",
      inline: "center"
    });
  });
}

function update() {
  const { scenario, branch } = currentSelection();
  const stage = branch.stages[stepIndex];
  const renderedStep = stage.preview === "defer"
    ? branch.stages.slice(0, stepIndex).findLastIndex(item =>
        item.preview !== "defer"
      )
    : stepIndex;
  const previewStage = branch.stages[Math.max(0, renderedStep)];

  canvas.setAttribute("aria-label", branch.canvasName);
  canvas.textContent = `${branch.canvasName}.`;
  render(previewStage.program, context);

  updateScenarioTabs();
  updateBranchChoices(scenario);
  updateTrace(scenario, branch);

  document.querySelector("#scenario-panel").setAttribute(
    "aria-labelledby",
    `scenario-${scenario.id} scenario-title`
  );
  document.querySelector("#scenario-eyebrow").textContent = scenario.eyebrow;
  document.querySelector("#scenario-title").textContent = scenario.title;
  document.querySelector("#scenario-description").textContent =
    scenario.description;
  document.querySelector("#branch-summary").textContent =
    `${branch.label} · ${branch.rows} rows · ${branch.stages.length} actions`;
  highlightSource(branch.source);
  copyProgramButton.textContent = "Copy program";
  copyRunnableButton.textContent = "Copy runnable HTML";
  downloadRunnableButton.textContent = "Download runnable HTML";
  document.querySelector("#step-summary").textContent =
    `Action ${stepIndex + 1} of ${branch.stages.length}: ${stage.label}` +
    (renderedStep === stepIndex
      ? ""
      : ` · preview holds at action ${renderedStep + 1}`);
  document.querySelector("#program-meta").textContent =
    `${scenario.commonSteps} shared · ${branch.stages.length - scenario.commonSteps} branch`;
  document.querySelector("#fork-label").textContent =
    `Fork after ${scenario.commonSteps} shared ${scenario.commonSteps === 1
      ? "action"
      : "actions"}`;

  previousButton.disabled = stepIndex === 0;
  nextButton.disabled = stepIndex === branch.stages.length - 1;
  nextButton.textContent = nextButton.disabled ? "Complete" : "Next action";
  status.textContent =
    `${scenario.tab}, ${branch.label}, ${stage.label}, action ` +
    `${stepIndex + 1} of ${branch.stages.length}`;
  syncPermalink(scenario, branch, stage);
  publishState(scenario, branch, stage, renderedStep);
}

previousButton.addEventListener("click", () => {
  if (stepIndex > 0) {
    stepIndex -= 1;
    update();
  }
});

traceSlider.addEventListener("input", () => {
  stepIndex = Number(traceSlider.value) - 1;
  update();
});

nextButton.addEventListener("click", () => {
  const { branch } = currentSelection();
  if (stepIndex < branch.stages.length - 1) {
    stepIndex += 1;
    update();
  }
});

document.addEventListener("keydown", event => {
  const target = event.target instanceof Element ? event.target : null;
  if (
    !["ArrowLeft", "ArrowRight"].includes(event.key) ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    target?.closest(
      'input, textarea, select, [contenteditable="true"], [role="tab"], [role="radio"]'
    )
  ) return;
  const { branch } = currentSelection();
  const delta = event.key === "ArrowRight" ? 1 : -1;
  const nextIndex = Math.max(
    0,
    Math.min(branch.stages.length - 1, stepIndex + delta)
  );
  if (nextIndex === stepIndex) return;
  event.preventDefault();
  stepIndex = nextIndex;
  update();
});

copyProgramButton.addEventListener("click", async () => {
  const source = sourceCode.textContent;
  try {
    await navigator.clipboard.writeText(source);
    copyProgramButton.textContent = "Copied";
    status.textContent = "Selected ggaction program copied to the clipboard.";
  } catch {
    copyProgramButton.textContent = "Copy failed";
    status.textContent =
      "Clipboard access failed. Select the visible program code to copy it.";
  }
});

copyRunnableButton.addEventListener("click", async () => {
  const { branch } = currentSelection();
  try {
    await navigator.clipboard.writeText(branch.runnableSource);
    copyRunnableButton.textContent = "Runnable HTML copied";
    status.textContent =
      "Runnable HTML for the selected ggaction branch copied to the clipboard.";
    revealProjectFollowup();
  } catch {
    copyRunnableButton.textContent = "Copy failed";
    status.textContent =
      "Clipboard access failed. Copy the visible program and add the setup shown in the repository source.";
  }
});

downloadRunnableButton.addEventListener("click", () => {
  const { scenario, branch } = currentSelection();
  const blob = new Blob([branch.runnableSource], {
    type: "text/html;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ggaction-${scenario.id}-${branch.id}.html`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  downloadRunnableButton.textContent = "Runnable HTML downloaded";
  status.textContent =
    "Runnable HTML for the selected ggaction branch downloaded.";
  revealProjectFollowup();
});

window.addEventListener("hashchange", () => {
  if (scenarios && restorePermalink()) update();
});

try {
  const data = await loadData();
  scenarios = createDemoScenarios(data);
  if (!restorePermalink()) {
    stepIndex = scenarios[0].branches[0].actionCount - 1;
  }
  update();
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
} catch (error) {
  document.querySelector("#loading").textContent =
    "The evaluator could not load. Refresh to try again.";
  status.textContent = `Evaluator error: ${error.message}`;
  throw error;
}
