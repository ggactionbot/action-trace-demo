import {
  chart
} from "https://cdn.jsdelivr.net/npm/ggaction@0.0.6/src/index.js";

const colors = Object.freeze({
  ink: "#172033",
  blue: "#3157a4",
  blueSoft: "#dbe7ff",
  orange: "#d97706",
  red: "#c2414b"
});

const packageEntry =
  "https://cdn.jsdelivr.net/npm/ggaction@0.0.6/src/index.js";
const demoDataRoot =
  "https://raw.githubusercontent.com/ggaction/ggaction/v0.0.6/data/";

const carsRunnablePrelude = `const response = await fetch(
  "${demoDataRoot}cars.json"
);
if (!response.ok) throw new Error(\`cars.json returned HTTP \${response.status}\`);
const sourceRows = await response.json();
const cars = sourceRows.filter(row =>
  Number.isFinite(row.Displacement) &&
  Number.isFinite(row.Acceleration) &&
  Number.isFinite(row.Horsepower) &&
  Number.isFinite(row.Miles_per_Gallon) &&
  Number.isFinite(row.Cylinders) &&
  typeof row.Origin === "string" &&
  row.Origin.length > 0
);`;

const gapminderRunnablePrelude = `const response = await fetch(
  "${demoDataRoot}gapminder.json"
);
if (!response.ok) {
  throw new Error(\`gapminder.json returned HTTP \${response.status}\`);
}
const sourceRows = await response.json();
const gapminder = sourceRows.filter(row =>
  Number.isFinite(row.year) &&
  Number.isFinite(row.life_expect) &&
  typeof row.country === "string" &&
  (typeof row.cluster === "string" || Number.isFinite(row.cluster))
);`;

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function runnableHtmlFor({ canvasName, dataPrelude, source }) {
  const escapedName = escapeHtml(canvasName);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ggaction runnable branch</title>
    <style>
      body { margin: 0; padding: 24px; font: 16px system-ui, sans-serif; }
      canvas { display: block; max-width: 100%; height: auto; }
    </style>
  </head>
  <body>
    <canvas id="chart" aria-label="${escapedName}">${escapedName}.</canvas>
    <script type="module">
import { chart, render } from "${packageEntry}";

${dataPrelude}

const context = document.querySelector("#chart").getContext("2d");

${source}
    </script>
  </body>
</html>
`;
}

function immutableStep({ id, op, label, code, apply, preview = "render" }) {
  return Object.freeze({ id, op, label, code, apply, preview });
}

function sourceFor(path) {
  return [
    "const program = chart()",
    ...path.map((step, index) => {
      const suffix = index === path.length - 1 ? ";" : "";
      return `  .${step.code}${suffix}`;
    }),
    "",
    "render(program, context);"
  ].join("\n");
}

function buildBranch(definition, branch) {
  const path = [...definition.common, ...branch.steps];
  const stages = [];
  let program = chart();

  for (const step of path) {
    const previous = program;
    try {
      program = step.apply(previous, definition);
    } catch (error) {
      throw new Error(
        `${definition.id}:${branch.id}:${step.id} failed: ${error.message}`,
        { cause: error }
      );
    }
    if (program === previous || !Object.isFrozen(program)) {
      throw new Error(
        `${definition.id}:${branch.id}:${step.id} must return a new frozen program.`
      );
    }
    stages.push(Object.freeze({
      id: step.id,
      op: step.op,
      label: step.label,
      preview: step.preview,
      program
    }));
  }

  const source = sourceFor(path);
  return Object.freeze({
    ...branch,
    stages: Object.freeze(stages),
    operations: Object.freeze(path.map(step => step.op)),
    source,
    runnableSource: runnableHtmlFor({
      canvasName: branch.canvasName,
      dataPrelude: branch.runnablePrelude ?? definition.runnablePrelude,
      source
    })
  });
}

function buildScenario(definition) {
  const branches = Object.freeze(
    definition.branches.map(branch => {
      let built;
      return Object.freeze({
        id: branch.id,
        label: branch.label,
        description: branch.description,
        rows: branch.rows,
        canvasName: branch.canvasName,
        actionCount: definition.common.length + branch.steps.length,
        build() {
          built ??= buildBranch(definition, branch);
          return built;
        }
      });
    })
  );
  return Object.freeze({
    id: definition.id,
    tab: definition.tab,
    eyebrow: definition.eyebrow,
    title: definition.title,
    description: definition.description,
    sourceRows: definition.sourceRows,
    commonSteps: definition.common.length,
    branches
  });
}

function completeCars(rows) {
  return rows.filter(row =>
    Number.isFinite(row.Displacement) &&
    Number.isFinite(row.Acceleration) &&
    Number.isFinite(row.Horsepower) &&
    Number.isFinite(row.Miles_per_Gallon) &&
    Number.isFinite(row.Cylinders) &&
    typeof row.Origin === "string" &&
    row.Origin.length > 0
  );
}

function completeGapminder(rows) {
  return rows.filter(row =>
    Number.isFinite(row.year) &&
    Number.isFinite(row.life_expect) &&
    typeof row.country === "string" &&
    (typeof row.cluster === "string" || Number.isFinite(row.cluster))
  );
}

const heatmapCountries = Object.freeze([
  "Afghanistan",
  "Brazil",
  "China",
  "India",
  "Japan",
  "United States"
]);

const heatmapYears = Object.freeze([
  1955, 1960, 1965, 1970, 1975, 1980, 1985, 1990, 1995, 2000, 2005
]);

const heatmapRunnablePrelude = `${gapminderRunnablePrelude}
const selectedRows = gapminder.filter(row =>
  ${JSON.stringify(heatmapCountries)}.includes(row.country) &&
  ${JSON.stringify(heatmapYears)}.includes(row.year)
);`;

function selectHeatmapRows(rows) {
  return rows.filter(row =>
    heatmapCountries.includes(row.country) &&
    heatmapYears.includes(row.year)
  );
}

const monthOrder = Object.freeze([
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March"
]);

const causeOrder = Object.freeze([
  "Zymotic Diseases",
  "Other Causes",
  "Wounds & Injuries"
]);

const polarRunnablePrelude = `const monthOrder = ${JSON.stringify(monthOrder)};
const causeOrder = ${JSON.stringify(causeOrder)};
const response = await fetch(
  "${demoDataRoot}nightingale_rose.json"
);
if (!response.ok) {
  throw new Error(\`nightingale_rose.json returned HTTP \${response.status}\`);
}
const sourceRows = await response.json();
const nightingale = sourceRows.filter(row =>
  monthOrder.includes(row.month) &&
  causeOrder.includes(row.cause) &&
  Number.isFinite(row.value)
);`;

function regressionScenario(cars) {
  const rows = completeCars(cars);
  const common = Object.freeze([
    immutableStep({
      id: "canvas",
      op: "createCanvas",
      label: "Frame a 760 × 500 canvas",
      code: `createCanvas({
    width: 760, height: 500,
    margin: { top: 82, right: 150, bottom: 68, left: 76 },
    background: "#ffffff"
  })`,
      apply: program => program.createCanvas({
        width: 760,
        height: 500,
        margin: { top: 82, right: 150, bottom: 68, left: 76 },
        background: "#ffffff"
      })
    }),
    immutableStep({
      id: "data",
      op: "createData",
      label: `Load ${rows.length} complete car records`,
      code: `createData({ id: "cars", values: cars })`,
      apply: program => program.createData({ id: "cars", values: rows })
    }),
    immutableStep({
      id: "points",
      op: "createPointMark",
      label: "Create the point layer",
      code: `createPointMark({ id: "points" })`,
      apply: program => program.createPointMark({ id: "points" }),
      preview: "defer"
    }),
    immutableStep({
      id: "radius",
      op: "encodeRadius",
      label: "Set a compact point radius",
      code: `encodeRadius({ value: 3.2 })`,
      apply: program => program.encodeRadius({ value: 3.2 }),
      preview: "defer"
    }),
    immutableStep({
      id: "x",
      op: "encodeX",
      label: "Map engine displacement",
      code: `encodeX({
    field: "Displacement",
    scale: { nice: true, zero: false }
  })`,
      apply: program => program.encodeX({
        field: "Displacement",
        scale: { nice: true, zero: false }
      }),
      preview: "defer"
    }),
    immutableStep({
      id: "y",
      op: "encodeY",
      label: "Map acceleration",
      code: `encodeY({
    field: "Acceleration",
    scale: { nice: true, zero: false }
  })`,
      apply: program => program.encodeY({
        field: "Acceleration",
        scale: { nice: true, zero: false }
      })
    }),
    immutableStep({
      id: "color",
      op: "encodeColor",
      label: "Separate regions with color",
      code: `encodeColor({
    field: "Origin",
    scale: { palette: "tableau10" }
  })`,
      apply: program => program.encodeColor({
        field: "Origin",
        scale: { palette: "tableau10" }
      })
    }),
    immutableStep({
      id: "shape",
      op: "encodeShape",
      label: "Repeat region with shape",
      code: `encodeShape({ field: "Origin" })`,
      apply: program => program.encodeShape({ field: "Origin" })
    }),
    immutableStep({
      id: "opacity",
      op: "encodeOpacity",
      label: "Reveal dense overlap",
      code: `encodeOpacity({ value: 0.32 })`,
      apply: program => program.encodeOpacity({ value: 0.32 })
    }),
    immutableStep({
      id: "filter",
      op: "filterMarks",
      label: "Compare Japan and USA",
      code: `filterMarks({
    field: "Origin", op: "oneOf",
    values: ["Japan", "USA"]
  })`,
      apply: program => program.filterMarks({
        field: "Origin",
        op: "oneOf",
        values: ["Japan", "USA"]
      })
    })
  ]);

  function regressionBranch({
    id,
    label,
    description,
    regression,
    title,
    subtitle,
    canvasName
  }) {
    return Object.freeze({
      id,
      label,
      description,
      rows: rows.length,
      canvasName,
      steps: Object.freeze([
        immutableStep({
          id: `${id}-model`,
          op: "createRegression",
          label: label === "Linear model"
            ? "Fit a linear model and 95% band"
            : "Fit a local nonlinear curve",
          code: `createRegression(${JSON.stringify(regression, null, 2)})`,
          apply: program => program.createRegression(regression)
        }),
        immutableStep({
          id: `${id}-line`,
          op: "editRegressionLine",
          label: "Strengthen the fitted line",
          code: `editRegressionLine({
    target: "pointsRegressionLines",
    strokeWidth: 4
  })`,
          apply: program => program.editRegressionLine({
            target: "pointsRegressionLines",
            strokeWidth: 4
          })
        }),
        immutableStep({
          id: `${id}-guides`,
          op: "createGuides",
          label: "Add axes and a region legend",
          code: `createGuides({
    axes: {
      x: { title: { text: "Displacement" } },
      y: { title: { text: "Acceleration" } }
    },
    legend: { title: "Origin" }
  })`,
          apply: program => program.createGuides({
            axes: {
              x: { title: { text: "Displacement" } },
              y: { title: { text: "Acceleration" } }
            },
            legend: { title: "Origin" }
          })
        }),
        immutableStep({
          id: `${id}-title`,
          op: "createTitle",
          label: "Name the selected analysis",
          code: `createTitle({
    text: ${JSON.stringify(title)},
    subtitle: ${JSON.stringify(subtitle)}
  })`,
          apply: program => program.createTitle({
            text: title,
            subtitle
          })
        })
      ])
    });
  }

  return {
    id: "regression",
    tab: "Regression",
    eyebrow: "406 source rows · 14 actions",
    title: "How does engine size relate to acceleration?",
    description:
      "Fork one immutable scatterplot into two statistical explanations.",
    sourceRows: cars.length,
    rows,
    runnablePrelude: carsRunnablePrelude,
    common,
    branches: Object.freeze([
      regressionBranch({
        id: "linear",
        label: "Linear model",
        description: "A straight fit with a 95% confidence band.",
        regression: {
          confidence: 0.95,
          band: { color: colors.blue, opacity: 0.16 },
          line: { strokeWidth: 3 }
        },
        title: "Engine size and acceleration",
        subtitle: "Linear fit with 95% confidence band",
        canvasName:
          "Scatterplot of engine displacement and acceleration with linear regression by origin"
      }),
      regressionBranch({
        id: "loess",
        label: "LOESS curve",
        description: "A flexible local fit for nonlinear structure.",
        regression: {
          method: "loess",
          span: 0.55,
          band: false,
          line: { strokeWidth: 3 }
        },
        title: "Engine size and acceleration",
        subtitle: "LOESS fit across Japan and USA",
        canvasName:
          "Scatterplot of engine displacement and acceleration with LOESS regression by origin"
      })
    ])
  };
}

function facetsScenario(cars) {
  const rows = completeCars(cars);
  const common = Object.freeze([
    immutableStep({
      id: "canvas",
      op: "createCanvas",
      label: "Frame each small multiple",
      code: `createCanvas({
    width: 270, height: 230,
    margin: { top: 34, right: 18, bottom: 50, left: 52 },
    background: "#ffffff"
  })`,
      apply: program => program.createCanvas({
        width: 270,
        height: 230,
        margin: { top: 34, right: 18, bottom: 50, left: 52 },
        background: "#ffffff"
      })
    }),
    immutableStep({
      id: "data",
      op: "createData",
      label: `Load ${rows.length} complete car records`,
      code: `createData({ id: "cars", values: cars })`,
      apply: program => program.createData({ id: "cars", values: rows })
    })
  ]);

  return {
    id: "facets",
    tab: "Small multiples",
    eyebrow: "406 source rows · two chart grammars",
    title: "What changes when the same data is regrouped?",
    description:
      "Branch after data loading into a faceted relationship or distribution.",
    sourceRows: cars.length,
    rows,
    runnablePrelude: carsRunnablePrelude,
    common,
    branches: Object.freeze([
      Object.freeze({
        id: "scatter",
        label: "Relationship",
        description: "Horsepower versus fuel economy, faceted by origin.",
        rows: rows.length,
        canvasName:
          "Small-multiple scatterplots of horsepower and fuel economy by vehicle origin",
        steps: Object.freeze([
          immutableStep({
            id: "scatter-mark",
            op: "createPointMark",
            label: "Create points",
            code: `createPointMark()`,
            apply: program => program.createPointMark(),
            preview: "defer"
          }),
          immutableStep({
            id: "scatter-x",
            op: "encodeX",
            label: "Map horsepower",
            code: `encodeX({
    field: "Horsepower",
    scale: { nice: true, zero: false }
  })`,
            apply: program => program.encodeX({
              field: "Horsepower",
              scale: { nice: true, zero: false }
            }),
            preview: "defer"
          }),
          immutableStep({
            id: "scatter-y",
            op: "encodeY",
            label: "Map fuel economy",
            code: `encodeY({
    field: "Miles_per_Gallon",
    scale: { nice: true, zero: false }
  })`,
            apply: program => program.encodeY({
              field: "Miles_per_Gallon",
              scale: { nice: true, zero: false }
            })
          }),
          immutableStep({
            id: "scatter-radius",
            op: "encodeRadius",
            label: "Keep points compact",
            code: `encodeRadius({ value: 2.7 })`,
            apply: program => program.encodeRadius({ value: 2.7 })
          }),
          immutableStep({
            id: "scatter-color",
            op: "encodeColor",
            label: "Map cylinder count",
            code: `encodeColor({
    field: "Cylinders",
    fieldType: "ordinal",
    scale: { palette: "reds" }
  })`,
            apply: program => program.encodeColor({
              field: "Cylinders",
              fieldType: "ordinal",
              scale: { palette: "reds" }
            })
          }),
          immutableStep({
            id: "scatter-guides",
            op: "createGuides",
            label: "Add shared axes and legend",
            code: `createGuides({
    axes: {
      x: { title: { text: "Horsepower" } },
      y: { title: { text: "Miles per gallon", offset: 39 } }
    },
    legend: false
  })`,
            apply: program => program.createGuides({
              axes: {
                x: { title: { text: "Horsepower" } },
                y: { title: { text: "Miles per gallon", offset: 39 } }
              },
              legend: false
            })
          }),
          immutableStep({
            id: "scatter-facet",
            op: "facet",
            label: "Fork one view per origin",
            code: `facet({
    field: "Origin",
    guides: { legend: "shared" }
  })`,
            apply: program => program.facet({
              field: "Origin",
              guides: { legend: "shared" }
            })
          }),
          immutableStep({
            id: "scatter-title",
            op: "createTitle",
            label: "Name the comparison",
            code: `createTitle({
    text: "Horsepower and fuel economy",
    subtitle: "Faceted by vehicle origin",
    align: "center"
  })`,
            apply: program => program.createTitle({
              text: "Horsepower and fuel economy",
              subtitle: "Faceted by vehicle origin",
              align: "center"
            })
          }),
          immutableStep({
            id: "scatter-headers",
            op: "editFacetHeaders",
            label: "Refine facet headers",
            code: `editFacetHeaders({
    fontSize: 13, fontWeight: 700, offset: 10
  })`,
            apply: program => program.editFacetHeaders({
              fontSize: 13,
              fontWeight: 700,
              offset: 10
            })
          })
        ])
      }),
      Object.freeze({
        id: "histogram",
        label: "Distribution",
        description: "Displacement bins, faceted by origin.",
        rows: rows.length,
        canvasName:
          "Small-multiple histograms of engine displacement by vehicle origin",
        steps: Object.freeze([
          immutableStep({
            id: "histogram-mark",
            op: "createBarMark",
            label: "Create bars",
            code: `createBarMark({ opacity: 0.9 })`,
            apply: program => program.createBarMark({ opacity: 0.9 }),
            preview: "defer"
          }),
          immutableStep({
            id: "histogram-bins",
            op: "encodeHistogram",
            label: "Bin engine displacement",
            code: `encodeHistogram({
    field: "Displacement",
    binBoundaries: [50, 106.25, 162.5, 218.75, 275, 331.25, 387.5, 443.75, 500],
    xScale: { nice: true, zero: false }
  })`,
            apply: program => program.encodeHistogram({
              field: "Displacement",
              binBoundaries: [
                50, 106.25, 162.5, 218.75, 275,
                331.25, 387.5, 443.75, 500
              ],
              xScale: { nice: true, zero: false }
            })
          }),
          immutableStep({
            id: "histogram-color",
            op: "encodeColor",
            label: "Stack cylinder groups",
            code: `encodeColor({
    field: "Cylinders",
    fieldType: "ordinal",
    scale: { palette: "reds" }
  })`,
            apply: program => program.encodeColor({
              field: "Cylinders",
              fieldType: "ordinal",
              scale: { palette: "reds" }
            })
          }),
          immutableStep({
            id: "histogram-guides",
            op: "createGuides",
            label: "Add axes and horizontal grid",
            code: `createGuides({
    axes: {
      x: {
        title: { text: "Displacement" },
        ticksAndLabels: {
          values: [50, 200, 350, 500],
          labels: { format: { decimals: 0 } }
        }
      },
      y: { title: { text: "Count", offset: 39 } }
    },
    legend: false,
    grid: { horizontal: true, vertical: false }
  })`,
            apply: program => program.createGuides({
              axes: {
                x: {
                  title: { text: "Displacement" },
                  ticksAndLabels: {
                    values: [50, 200, 350, 500],
                    labels: { format: { decimals: 0 } }
                  }
                },
                y: { title: { text: "Count", offset: 39 } }
              },
              legend: false,
              grid: { horizontal: true, vertical: false }
            })
          }),
          immutableStep({
            id: "histogram-facet",
            op: "facet",
            label: "Fork one histogram per origin",
            code: `facet({
    field: "Origin", columns: 2,
    gap: 18, padding: 14,
    guides: { legend: "shared" }
  })`,
            apply: program => program.facet({
              field: "Origin",
              columns: 2,
              gap: 18,
              padding: 14,
              guides: { legend: "shared" }
            })
          }),
          immutableStep({
            id: "histogram-title",
            op: "createTitle",
            label: "Name the distribution",
            code: `createTitle({
    text: "Displacement distribution",
    subtitle: "Faceted by vehicle origin",
    align: "center"
  })`,
            apply: program => program.createTitle({
              text: "Displacement distribution",
              subtitle: "Faceted by vehicle origin",
              align: "center"
            })
          }),
          immutableStep({
            id: "histogram-headers",
            op: "editFacetHeaders",
            label: "Refine facet headers",
            code: `editFacetHeaders({
    fontSize: 13, fontWeight: 700, offset: 10
  })`,
            apply: program => program.editFacetHeaders({
              fontSize: 13,
              fontWeight: 700,
              offset: 10
            })
          })
        ])
      })
    ])
  };
}

function worldScenario(gapminder) {
  const rows = completeGapminder(gapminder);
  const heatmapRows = selectHeatmapRows(rows);
  const common = Object.freeze([
    immutableStep({
      id: "canvas",
      op: "createCanvas",
      label: "Frame a 760 × 480 canvas",
      code: `createCanvas({
    width: 760, height: 480,
    margin: { top: 82, right: 145, bottom: 70, left: 88 },
    background: "#ffffff"
  })`,
      apply: program => program.createCanvas({
        width: 760,
        height: 480,
        margin: { top: 82, right: 145, bottom: 70, left: 88 },
        background: "#ffffff"
      })
    })
  ]);

  return {
    id: "world",
    tab: "World health",
    eyebrow: "682 source rows · statistical or tiled",
    title: "How can one dataset answer two questions?",
    description:
      "Fork after the canvas into uncertainty over time or a labeled heatmap.",
    sourceRows: gapminder.length,
    rows,
    common,
    branches: Object.freeze([
      Object.freeze({
        id: "uncertainty",
        label: "Uncertainty",
        description: "Cluster means with 95% confidence intervals.",
        rows: rows.length,
        runnablePrelude: gapminderRunnablePrelude,
        canvasName:
          "Life expectancy by year and world cluster with 95 percent confidence intervals",
        steps: Object.freeze([
          immutableStep({
            id: "uncertainty-data",
            op: "createData",
            label: `Load ${rows.length} country-year records`,
            code: `createData({
    id: "gapminder",
    values: gapminder
  })`,
            apply: program => program.createData({
              id: "gapminder",
              values: rows
            })
          }),
          immutableStep({
            id: "uncertainty-band",
            op: "createErrorBand",
            label: "Derive mean and 95% interval",
            code: `createErrorBand({
    x: { field: "year", fieldType: "temporal" },
    y: { field: "life_expect" },
    groupBy: "cluster",
    curve: "cardinal",
    boundaries: {
      stroke: "#172033",
      strokeWidth: 1.3,
      opacity: 0.72
    }
  })`,
            apply: program => program.createErrorBand({
              x: { field: "year", fieldType: "temporal" },
              y: { field: "life_expect" },
              groupBy: "cluster",
              curve: "cardinal",
              boundaries: {
                stroke: colors.ink,
                strokeWidth: 1.3,
                opacity: 0.72
              }
            })
          }),
          immutableStep({
            id: "uncertainty-color",
            op: "encodeColor",
            label: "Map cluster to color",
            code: `encodeColor({
    target: "errorBand",
    field: "cluster",
    fieldType: "nominal",
    scale: { palette: "tableau10" }
  })`,
            apply: program => program.encodeColor({
              target: "errorBand",
              field: "cluster",
              fieldType: "nominal",
              scale: { palette: "tableau10" }
            })
          }),
          immutableStep({
            id: "uncertainty-edit",
            op: "editErrorBand",
            label: "Make overlapping intervals legible",
            code: `editErrorBand({
    opacity: 0.2,
    curve: "cardinal"
  })`,
            apply: program => program.editErrorBand({
              opacity: 0.2,
              curve: "cardinal"
            })
          }),
          immutableStep({
            id: "uncertainty-guides",
            op: "createGuides",
            label: "Add temporal axes and legend",
            code: `createGuides({
    axes: {
      x: { title: { text: "Year" } },
      y: { title: { text: "Life expectancy" } }
    },
    legend: { title: "Cluster" }
  })`,
            apply: program => program.createGuides({
              axes: {
                x: { title: { text: "Year" } },
                y: { title: { text: "Life expectancy" } }
              },
              legend: { title: "Cluster" }
            })
          }),
          immutableStep({
            id: "uncertainty-title",
            op: "createTitle",
            label: "Name the statistical view",
            code: `createTitle({
    text: "Life expectancy by cluster",
    subtitle: "Mean and 95% confidence interval"
  })`,
            apply: program => program.createTitle({
              text: "Life expectancy by cluster",
              subtitle: "Mean and 95% confidence interval"
            })
          })
        ])
      }),
      Object.freeze({
        id: "heatmap",
        label: "Heatmap",
        description: "Six countries across eleven five-year snapshots.",
        rows: heatmapRows.length,
        runnablePrelude: heatmapRunnablePrelude,
        canvasName:
          "Heatmap of life expectancy for six countries from 1955 through 2005",
        steps: Object.freeze([
          immutableStep({
            id: "heatmap-data",
            op: "createData",
            label: `Select ${heatmapRows.length} country-year records`,
            code: `createData({
    id: "countries",
    values: selectedRows
  })`,
            apply: program => program.createData({
              id: "countries",
              values: heatmapRows
            })
          }),
          immutableStep({
            id: "heatmap-cells",
            op: "createHeatmap",
            label: "Map year, country, and health",
            code: `createHeatmap({
    id: "cells",
    x: { field: "year", fieldType: "ordinal" },
    y: { field: "country", fieldType: "nominal" },
    color: {
      field: "life_expect",
      fieldType: "quantitative",
      scale: { type: "sequential", palette: "viridis" }
    },
    guides: {
      axes: {
        x: { title: { text: "Year" } },
        y: { title: { text: "Country" } }
      },
      legend: { title: "Life expectancy" }
    }
  })`,
            apply: program => program.createHeatmap({
              id: "cells",
              x: { field: "year", fieldType: "ordinal" },
              y: { field: "country", fieldType: "nominal" },
              color: {
                field: "life_expect",
                fieldType: "quantitative",
                scale: { type: "sequential", palette: "viridis" }
              },
              guides: {
                axes: {
                  x: { title: { text: "Year" } },
                  y: { title: { text: "Country" } }
                },
                legend: { title: "Life expectancy" }
              }
            })
          }),
          immutableStep({
            id: "heatmap-labels",
            op: "createTextMark",
            label: "Create cell labels",
            code: `createTextMark({
    fontSize: 10,
    fontWeight: 650,
    align: "center",
    baseline: "middle"
  })`,
            apply: program => program.createTextMark({
              fontSize: 10,
              fontWeight: 650,
              align: "center",
              baseline: "middle"
            })
          }),
          immutableStep({
            id: "heatmap-text",
            op: "encodeText",
            label: "Print rounded life expectancy",
            code: `encodeText({
    field: "life_expect",
    format: ".0f"
  })`,
            apply: program => program.encodeText({
              field: "life_expect",
              format: ".0f"
            })
          }),
          immutableStep({
            id: "heatmap-title",
            op: "createTitle",
            label: "Name the tiled comparison",
            code: `createTitle({
    text: "Life expectancy over time",
    subtitle: "Six countries · 1955–2005",
    align: "center"
  })`,
            apply: program => program.createTitle({
              text: "Life expectancy over time",
              subtitle: "Six countries · 1955–2005",
              align: "center"
            })
          })
        ])
      })
    ])
  };
}

function polarScenario(nightingale) {
  const rows = nightingale.filter(row =>
    monthOrder.includes(row.month) &&
    causeOrder.includes(row.cause) &&
    Number.isFinite(row.value)
  );
  const common = Object.freeze([
    immutableStep({
      id: "canvas",
      op: "createCanvas",
      label: "Frame a 700 × 560 canvas",
      code: `createCanvas({
    width: 700, height: 560,
    margin: { top: 72, right: 170, bottom: 64, left: 64 },
    background: "#ffffff"
  })`,
      apply: program => program.createCanvas({
        width: 700,
        height: 560,
        margin: { top: 72, right: 170, bottom: 64, left: 64 },
        background: "#ffffff"
      })
    }),
    immutableStep({
      id: "data",
      op: "createData",
      label: `Load ${rows.length} month-cause records`,
      code: `createData({
    id: "nightingale",
    values: nightingale
  })`,
      apply: program => program.createData({
        id: "nightingale",
        values: rows
      })
    }),
    immutableStep({
      id: "arcs",
      op: "createArcMark",
      label: "Create polar arcs",
      code: `createArcMark({
    padAngle: 1,
    opacity: 0.9,
    strokeWidth: 0.5
  })`,
      apply: program => program.createArcMark({
        padAngle: 1,
        opacity: 0.9,
        strokeWidth: 0.5
      }),
      preview: "defer"
    }),
    immutableStep({
      id: "theta",
      op: "encodeTheta",
      label: "Place months around the circle",
      code: `encodeTheta({
    field: "month",
    fieldType: "ordinal",
    scale: { domain: monthOrder }
  })`,
      apply: program => program.encodeTheta({
        field: "month",
        fieldType: "ordinal",
        scale: { domain: monthOrder }
      }),
      preview: "defer"
    }),
    immutableStep({
      id: "radius",
      op: "encodeR",
      label: "Map mortality to radius",
      code: `encodeR({
    field: "value",
    scale: { domain: [0, 6.5], zero: true }
  })`,
      apply: program => program.encodeR({
        field: "value",
        scale: { domain: [0, 6.5], zero: true }
      })
    })
  ]);

  function polarBranch({ id, label, description, focus }) {
    const steps = [
      immutableStep({
        id: `${id}-color`,
        op: "encodeColor",
        label: "Overlay causes with color",
        code: `encodeColor({
    field: "cause",
    layout: "overlay",
    scale: {
      domain: causeOrder,
      range: ["#599ad3", "#727272", "#f1595f"]
    }
  })`,
        apply: program => program.encodeColor({
          field: "cause",
          layout: "overlay",
          scale: {
            domain: causeOrder,
            range: ["#599ad3", "#727272", "#f1595f"]
          }
        })
      })
    ];
    if (focus) {
      steps.push(immutableStep({
        id: `${id}-filter`,
        op: "filterMarks",
        label: "Focus on preventable disease",
        code: `filterMarks({
    field: "cause",
    op: "eq",
    value: "Zymotic Diseases"
  })`,
        apply: program => program.filterMarks({
          field: "cause",
          op: "eq",
          value: "Zymotic Diseases"
        })
      }));
    }
    steps.push(
      immutableStep({
        id: `${id}-guides`,
        op: "createGuides",
        label: "Add radial grid and legend",
        code: `createGuides({
    axes: {
      theta: { title: false },
      radius: {
        ticksAndLabels: { values: [2, 4, 6] },
        title: { text: "Mortality rate", position: "inside" }
      }
    },
    grid: { theta: false, radial: { values: [2, 4, 6] } },
    legend: ${focus ? "false" : `{ position: "right", title: "Cause" }`}
  })`,
        apply: program => program.createGuides({
          axes: {
            theta: { title: false },
            radius: {
              ticksAndLabels: { values: [2, 4, 6] },
              title: { text: "Mortality rate", position: "inside" }
            }
          },
          grid: { theta: false, radial: { values: [2, 4, 6] } },
          legend: focus ? false : { position: "right", title: "Cause" }
        })
      }),
      immutableStep({
        id: `${id}-title`,
        op: "createTitle",
        label: "Name the historical view",
        code: `createTitle({
    text: "Nightingale’s mortality diagram",
    subtitle: ${JSON.stringify(
      focus ? "Zymotic disease only" : "Causes of mortality · 1854–1856"
    )}
  })`,
        apply: program => program.createTitle({
          text: "Nightingale’s mortality diagram",
          subtitle: focus
            ? "Zymotic disease only"
            : "Causes of mortality · 1854–1856"
        })
      })
    );
    return Object.freeze({
      id,
      label,
      description,
      rows: rows.length,
      canvasName: focus
        ? "Nightingale polar area chart focused on zymotic disease mortality"
        : "Nightingale polar area chart comparing three causes of mortality",
      steps: Object.freeze(steps)
    });
  }

  return {
    id: "polar",
    tab: "Polar history",
    eyebrow: "36 records · radial grammar",
    title: "How does a historical chart become a branch?",
    description:
      "Preserve the full rose diagram or derive a focused disease view.",
    sourceRows: nightingale.length,
    rows,
    runnablePrelude: polarRunnablePrelude,
    common,
    branches: Object.freeze([
      polarBranch({
        id: "all-causes",
        label: "All causes",
        description: "Overlay all three mortality causes.",
        focus: false
      }),
      polarBranch({
        id: "disease-focus",
        label: "Disease focus",
        description: "Derive a single-cause view from the same base.",
        focus: true
      })
    ])
  };
}

export function createDemoScenarios({ cars, gapminder, nightingale }) {
  if (!Array.isArray(cars) || !Array.isArray(gapminder) ||
      !Array.isArray(nightingale)) {
    throw new TypeError("Demo data sources must be arrays.");
  }
  return Object.freeze([
    regressionScenario(cars),
    facetsScenario(cars),
    worldScenario(gapminder),
    polarScenario(nightingale)
  ].map(buildScenario));
}
