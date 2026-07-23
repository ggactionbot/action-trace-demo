import { chart } from "https://cdn.jsdelivr.net/npm/ggaction@0.0.6/src/index.js";

const examples = Object.freeze([
  Object.freeze({
    id: "scatter",
    tab: "Scatter",
    title: "Horsepower and fuel economy",
    description: "Compare two measures and keep origin visible through color and shape.",
    canvasName: "Horsepower versus fuel economy scatterplot by origin",
    rows: Object.freeze([
      Object.freeze({ horsepower: 52, mpg: 44, origin: "Japan" }),
      Object.freeze({ horsepower: 65, mpg: 36, origin: "Europe" }),
      Object.freeze({ horsepower: 70, mpg: 38, origin: "Japan" }),
      Object.freeze({ horsepower: 88, mpg: 27, origin: "USA" }),
      Object.freeze({ horsepower: 95, mpg: 31, origin: "Europe" }),
      Object.freeze({ horsepower: 110, mpg: 24, origin: "Europe" }),
      Object.freeze({ horsepower: 150, mpg: 18, origin: "USA" }),
      Object.freeze({ horsepower: 180, mpg: 15, origin: "USA" })
    ]),
    steps: Object.freeze([
      Object.freeze({
        id: "canvas",
        op: "createCanvas",
        label: "Create canvas",
        apply: program => program.createCanvas({
          width: 560,
          height: 340,
          margin: { top: 62, right: 112, bottom: 58, left: 66 },
          background: "#ffffff"
        })
      }),
      Object.freeze({
        id: "data",
        op: "createData",
        label: "Add eight rows",
        apply: (program, definition) => program.createData({
          id: "cars",
          values: definition.rows
        })
      }),
      Object.freeze({
        id: "plot",
        op: "createScatterPlot",
        label: "Map position and origin",
        apply: program => program.createScatterPlot({
          id: "cars-points",
          x: "horsepower",
          y: "mpg",
          color: "origin",
          shape: "origin",
          guides: {
            axes: {
              x: { title: { text: "Horsepower" } },
              y: { title: { text: "Miles per gallon" } }
            },
            legend: { channels: ["color", "shape"], title: "Origin" }
          }
        })
      }),
      Object.freeze({
        id: "title",
        op: "createTitle",
        label: "Add title",
        apply: program => program.createTitle({
          text: "Power and fuel economy",
          subtitle: "Eight illustrative vehicles"
        })
      })
    ]),
    source: `const program = chart()
  .createCanvas({ width: 560, height: 340 })
  .createData({ id: "cars", values: rows })
  .createScatterPlot({
    x: "horsepower",
    y: "mpg",
    color: "origin",
    shape: "origin"
  })
  .createTitle({ text: "Power and fuel economy" });

render(program, context);`
  }),
  Object.freeze({
    id: "bar",
    tab: "Bar",
    title: "Signups by quarter",
    description: "Turn a small table into a direct categorical comparison.",
    canvasName: "Quarterly product signups bar chart",
    rows: Object.freeze([
      Object.freeze({ quarter: "Q1", signups: 82 }),
      Object.freeze({ quarter: "Q2", signups: 116 }),
      Object.freeze({ quarter: "Q3", signups: 143 }),
      Object.freeze({ quarter: "Q4", signups: 128 })
    ]),
    steps: Object.freeze([
      Object.freeze({
        id: "canvas",
        op: "createCanvas",
        label: "Create canvas",
        apply: program => program.createCanvas({
          width: 560,
          height: 340,
          margin: { top: 62, right: 30, bottom: 58, left: 66 },
          background: "#ffffff"
        })
      }),
      Object.freeze({
        id: "data",
        op: "createData",
        label: "Add four rows",
        apply: (program, definition) => program.createData({
          id: "signups",
          values: definition.rows
        })
      }),
      Object.freeze({
        id: "plot",
        op: "createBarPlot",
        label: "Map quarter and signups",
        apply: program => program.createBarPlot({
          id: "signup-bars",
          x: { field: "quarter", fieldType: "ordinal" },
          y: { field: "signups", scale: { nice: true, zero: true } },
          width: { band: 0.66 },
          guides: {
            axes: {
              x: { title: { text: "Quarter" } },
              y: { title: { text: "Signups" } }
            }
          }
        })
      }),
      Object.freeze({
        id: "title",
        op: "createTitle",
        label: "Add title",
        apply: program => program.createTitle({
          text: "Quarterly product signups",
          subtitle: "One illustrative year"
        })
      })
    ]),
    source: `const program = chart()
  .createCanvas({ width: 560, height: 340 })
  .createData({ id: "signups", values: rows })
  .createBarPlot({
    x: { field: "quarter", fieldType: "ordinal" },
    y: { field: "signups", scale: { zero: true } },
    width: { band: 0.66 }
  })
  .createTitle({ text: "Quarterly product signups" });

render(program, context);`
  }),
  Object.freeze({
    id: "line",
    tab: "Line",
    title: "Weekly active users",
    description: "Reveal a sequence as a trend without hiding the authored steps.",
    canvasName: "Weekly active users line chart",
    rows: Object.freeze([
      Object.freeze({ week: 1, active: 120 }),
      Object.freeze({ week: 2, active: 138 }),
      Object.freeze({ week: 3, active: 132 }),
      Object.freeze({ week: 4, active: 158 }),
      Object.freeze({ week: 5, active: 176 }),
      Object.freeze({ week: 6, active: 194 })
    ]),
    steps: Object.freeze([
      Object.freeze({
        id: "canvas",
        op: "createCanvas",
        label: "Create canvas",
        apply: program => program.createCanvas({
          width: 560,
          height: 340,
          margin: { top: 62, right: 30, bottom: 58, left: 66 },
          background: "#ffffff"
        })
      }),
      Object.freeze({
        id: "data",
        op: "createData",
        label: "Add six rows",
        apply: (program, definition) => program.createData({
          id: "weekly-active",
          values: definition.rows
        })
      }),
      Object.freeze({
        id: "plot",
        op: "createLinePlot",
        label: "Map week and active users",
        apply: program => program.createLinePlot({
          id: "active-line",
          x: { field: "week", scale: { nice: true } },
          y: { field: "active", scale: { nice: true, zero: false } },
          line: { stroke: "#3157a4", strokeWidth: 3 },
          guides: {
            axes: {
              x: { title: { text: "Week" } },
              y: { title: { text: "Active users" } }
            }
          }
        })
      }),
      Object.freeze({
        id: "title",
        op: "createTitle",
        label: "Add title",
        apply: program => program.createTitle({
          text: "Weekly active users",
          subtitle: "Six illustrative weeks"
        })
      })
    ]),
    source: `const program = chart()
  .createCanvas({ width: 560, height: 340 })
  .createData({ id: "weeklyActive", values: rows })
  .createLinePlot({
    x: { field: "week", scale: { nice: true } },
    y: { field: "active", scale: { zero: false } },
    line: { stroke: "#3157a4", strokeWidth: 3 }
  })
  .createTitle({ text: "Weekly active users" });

render(program, context);`
  })
]);

function buildExample(definition) {
  const stages = [];
  let program = chart();
  for (const step of definition.steps) {
    const previous = program;
    program = step.apply(previous, definition);
    if (program === previous || !Object.isFrozen(program)) {
      throw new Error(`${definition.id}:${step.id} must return a new frozen program.`);
    }
    stages.push(Object.freeze({ ...step, program }));
  }
  return Object.freeze({ ...definition, stages: Object.freeze(stages) });
}

export function createDemoExamples() {
  return Object.freeze(examples.map(buildExample));
}
