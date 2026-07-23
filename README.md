# ggaction action trace demo

A standalone, no-build browser demo for
[ggaction](https://github.com/ggaction/ggaction). Explore four advanced chart
stories, choose between two immutable program branches in each story, inspect
every action on the selected path, and compare the resulting Canvas output and
visible code. The URL follows the selected scenario, branch, and action so any
of the 78 states can be linked directly.

[![ggaction evaluator with two regression branches and fourteen immutable actions][preview]][live-demo]

[preview]: ./social-preview.png
[live-demo]: https://ggactionbot.github.io/action-trace-demo/

The live URL is
[https://ggactionbot.github.io/action-trace-demo/](https://ggactionbot.github.io/action-trace-demo/).

## What it demonstrates

- 406 source car rows fork into 14-action linear and LOESS regression paths.
- The same car data forks into 11-action scatter facets or 9-action histogram
  facets.
- 682 Gapminder rows fork into a confidence-interval view or a labeled
  six-country heatmap.
- 36 Nightingale records fork into a full polar area chart or a focused
  disease view.

Every branch is built from immutable program values. Primitive actions that
are valid but not yet drawable—such as a point mark before both axes exist—are
still selectable; the Canvas explicitly holds the last drawable preview until
the path reaches a renderable state. The generated program for the selected
branch stays visible and can be copied directly for further exploration.

## Run locally

Serve this directory with any static file server, then open `index.html`.
For example:

```bash
python3 -m http.server 4173
```

The demo has no install or build step. It imports the exact public
`ggaction@0.0.6` source entry from jsDelivr and performs all rendering in the
browser. The package is experimental and its API may change before 1.0.

The three data files are byte-identical copies of the corresponding files in
the MIT-licensed
[`ggaction@v0.0.6` source tree](https://github.com/ggaction/ggaction/tree/v0.0.6/data).
Keeping them local makes the evaluator deterministic and avoids an additional
runtime dependency. The visible program is generated from the same selected
action path that produces the rendered program.

The dedicated browser verifier walks all 78 intermediate/final action states
across eight branches, checks keyboard behavior, exact rows and operations,
branch-distinct Canvas output, 390 px layout, local data and exact-version CDN
responses, direct state permalinks, automated accessibility, and zero
console/page/request failures:

```bash
node ../mission/tools/verify-advanced-action-trace-demo.mjs \
  http://127.0.0.1:4173/ \
  --mode live
```

## Scope

This repository is intentionally limited to the hosted demonstration. Product
source, documentation, issues, and contributions belong in the
[main ggaction repository](https://github.com/ggaction/ggaction).

Prepared by an autonomous AI agent working for the ggaction project in response
to maintainer feedback on
[ggaction/ggaction#5](https://github.com/ggaction/ggaction/pull/5).
