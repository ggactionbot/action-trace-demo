import { render } from "https://cdn.jsdelivr.net/npm/ggaction@0.0.6/src/index.js";

import { createDemoExamples } from "./program.js";

const examples = createDemoExamples();
const canvas = document.querySelector("#chart");
const context = canvas.getContext("2d");
const tabs = document.querySelector("#example-tabs");
const trace = document.querySelector("#trace-list");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
let exampleIndex = 0;
let stepIndex = examples[0].stages.length - 1;

function resourceCount(program, key) {
  return program.semanticSpec[key]?.length ?? 0;
}

function publishState(example, stage) {
  const program = stage.program;
  window.__ggactionDemo = Object.freeze({
    example: example.id,
    exampleIndex,
    examples: examples.length,
    step: stepIndex,
    stepId: stage.id,
    steps: example.stages.length,
    operations: Object.freeze(example.stages.map(item => item.op)),
    datasets: resourceCount(program, "datasets"),
    layers: resourceCount(program, "layers"),
    graphics: Object.keys(program.graphicSpec.objects).length
  });
}

function selectExample(index, { focus = false } = {}) {
  exampleIndex = (index + examples.length) % examples.length;
  stepIndex = examples[exampleIndex].stages.length - 1;
  update();
  if (focus) tabs.querySelectorAll('[role="tab"]')[exampleIndex].focus();
}

function updateTabs() {
  tabs.replaceChildren(...examples.map((example, index) => {
    const button = document.createElement("button");
    const selected = index === exampleIndex;
    button.type = "button";
    button.className = "example-tab";
    button.id = `tab-${example.id}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(selected));
    button.setAttribute("aria-controls", "example-panel");
    button.tabIndex = selected ? 0 : -1;
    button.textContent = example.tab;
    button.addEventListener("click", () => selectExample(index));
    button.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") selectExample(0, { focus: true });
      else if (event.key === "End") {
        selectExample(examples.length - 1, { focus: true });
      } else {
        selectExample(index + (event.key === "ArrowRight" ? 1 : -1), {
          focus: true
        });
      }
    });
    return button;
  }));
}

function updateTrace(example) {
  trace.replaceChildren(...example.stages.map((stage, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "trace-step";
    if (index < stepIndex) button.classList.add("is-complete");
    if (index === stepIndex) {
      button.classList.add("is-current");
      button.setAttribute("aria-current", "step");
    }
    button.innerHTML = `<span>${index + 1}</span><code>${stage.op}</code><small>${stage.label}</small>`;
    button.addEventListener("click", () => {
      stepIndex = index;
      update();
    });
    item.append(button);
    return item;
  }));
}

function update() {
  const example = examples[exampleIndex];
  const stage = example.stages[stepIndex];
  canvas.setAttribute("aria-label", example.canvasName);
  canvas.textContent = `${example.canvasName}.`;
  render(stage.program, context);

  updateTabs();
  updateTrace(example);
  document.querySelector("#example-panel").setAttribute(
    "aria-labelledby",
    `tab-${example.id} example-title`
  );
  document.querySelector("#example-title").textContent = example.title;
  document.querySelector("#example-description").textContent = example.description;
  document.querySelector("#source-code").textContent = example.source;
  document.querySelector("#step-summary").textContent =
    `Action ${stepIndex + 1} of ${example.stages.length}: ${stage.label}`;
  document.querySelector("#program-meta").textContent =
    `${example.stages.length} authored actions · ${resourceCount(stage.program, "datasets")} dataset · ${resourceCount(stage.program, "layers")} layer`;
  previousButton.disabled = stepIndex === 0;
  nextButton.disabled = stepIndex === example.stages.length - 1;
  nextButton.textContent = nextButton.disabled ? "Complete" : "Next action";
  document.querySelector("#status").textContent =
    `${example.tab} example, ${stage.label}, action ${stepIndex + 1} of ${example.stages.length}`;
  publishState(example, stage);
}

previousButton.addEventListener("click", () => {
  if (stepIndex > 0) {
    stepIndex -= 1;
    update();
  }
});

nextButton.addEventListener("click", () => {
  if (stepIndex < examples[exampleIndex].stages.length - 1) {
    stepIndex += 1;
    update();
  }
});

update();

