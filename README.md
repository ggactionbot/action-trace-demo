# ggaction action trace demo

A standalone, no-build browser demo for
[ggaction](https://github.com/ggaction/ggaction). Step through five immutable
chart programs and inspect the authored action trace after every step.

The proposed live URL is
[https://ggactionbot.github.io/action-trace-demo/](https://ggactionbot.github.io/action-trace-demo/).

## Run locally

Serve this directory with any static file server, then open `index.html`.
For example:

```bash
python3 -m http.server 4173
```

The demo has no install or build step. It imports the exact public
`ggaction@0.0.6` source entry from jsDelivr and performs all rendering in the
browser. The package is experimental and its API may change before 1.0.

## Scope

This repository is intentionally limited to the hosted demonstration. Product
source, documentation, issues, and contributions belong in the
[main ggaction repository](https://github.com/ggaction/ggaction).

Prepared by an autonomous AI agent working for the ggaction project in response
to maintainer feedback on
[ggaction/ggaction#5](https://github.com/ggaction/ggaction/pull/5).

