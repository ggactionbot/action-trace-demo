# ggaction action trace demo

A standalone, no-build browser demo for
[ggaction](https://github.com/ggaction/ggaction). Explore four advanced chart
stories, choose between two immutable program branches in each story, inspect
every action on the selected path, and compare the resulting Canvas output and
visible code. The URL follows the selected scenario, branch, and action so any
of the 79 states can be linked directly.

[![ggaction evaluator with two regression branches and fourteen immutable actions][preview]][live-demo]

[preview]: ./social-preview.png
[live-demo]: https://ggactionbot.github.io/action-trace-demo/

The live URL is
[https://ggactionbot.github.io/action-trace-demo/](https://ggactionbot.github.io/action-trace-demo/).
The page links directly to the
[published npm package](https://www.npmjs.com/package/ggaction), project
documentation, canonical repository, and demo source. Its machine-readable
metadata identifies the evaluator as a free developer Web application and
ggaction as MIT-licensed JavaScript source.

## What it demonstrates

- 406 source car rows fork into 14-action linear and LOESS regression paths.
- The same car data forks into 11-action scatter facets or 9-action histogram
  facets.
- The same 682 Gapminder rows, marks, encodings, and guides compare 95% and
  80% confidence-interval revisions.
- 36 Nightingale records fork into a full polar area chart or a focused
  disease view.

Every branch is built from immutable program values. Primitive actions that
are valid but not yet drawable—such as a point mark before both axes exist—are
still selectable; the Canvas explicitly holds the last drawable preview until
the path reaches a renderable state. The generated program for the selected
branch stays visible in a tall, syntax-highlighted code pane and can be copied
directly for further exploration. A progress slider, the action strip, and the
keyboard arrow keys all move through the same sequential revision history.

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
Visitors can copy the visible fragment, copy a complete runnable HTML document,
download that document directly, or download the currently visible Canvas as a
PNG. A PNG export names the scenario, branch, and actual rendered action; when
an intermediate action is not yet drawable, the status message identifies the
held preview that was exported. The browser snapshot is distinct from the Node
`ggaction/png` renderer and makes no cross-browser byte-identity guarantee.
The runnable artifact includes the pinned package import, exact data
preparation, accessible Canvas, and rendering setup for the selected branch.
After a runnable or PNG export succeeds, the evaluator reveals one quiet
contextual link to the upstream ggaction repository. It does not open a popup,
ask for a star, show a count, or repeat the prompt.

The dedicated browser verifier walks all 79 intermediate/final action states
across eight branches, checks keyboard behavior, exact rows and operations,
branch-distinct Canvas output, 390 px layout, local data and exact-version CDN
responses, progress-slider synchronization, syntax highlighting, direct state
permalinks, all eight copied and downloaded runnable documents against their
exact selected Canvas bytes—including direct `file:` opens—eight final PNG
downloads, one held-preview PNG, object-URL cleanup, automated accessibility,
and zero console/page/request failures:

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
