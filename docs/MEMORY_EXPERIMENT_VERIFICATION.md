# Memory experiment — development verification

Verified 2026-09-17 against the working tree based on
`4cbe1eaf0a3c32a73ea6725a2434827f170022db`. This is a software verification and an
exploratory development run, not a confirmatory scientific study.

## Changes

- Added separate Simulation / Experiment navigation and an `#experiment` link.
- Added public-history generation, a separate answer key, ordinary global
  assignment, ordered alignment, and shuffled structural connections.
- Added fixed paired comparisons, four conditions, per-history bootstrap
  intervals, cost reporting, replay, and complete JSON / prediction CSV exports.
- Added the versioned protocol before the first development execution.
- Added test-only jsdom and tsx dependencies; CI runs these tests and stamps the
  deployed implementation SHA into downloadable results.
- Preserved existing engine formulas and glyph definitions. The only change
  inside the existing simulation UI is to let focused buttons, links, and selects
  handle their own keyboard events (including the new navigation tabs).

## Executed checks

Environment: Node.js v24.19.0, npm 11.9.0; locked dependencies.

| Check | Result |
|---|---|
| `npm test` | 20 engine/protocol tests plus 1 DOM interaction test pass |
| Existing simulation tests | All seven pass |
| Search algorithms | 60 small randomized matrices checked against exhaustive independent optima for unrestricted and ordered matching |
| Data isolation | Immutable public inputs; throwing answer-key getter; changing evaluator keys leaves predictions unchanged |
| Validity | Unique matches, future-source exclusion, equal pair budgets, bounded ranking work, deterministic predictions, boundary controls, honest loss fixture |
| DOM interaction flow | Run all conditions, step/replay controls, reveal answer, change history/condition, rerun with new settings, preserve prior result provenance, both downloads |
| Export inspection | Full four-condition JSON; default CSV has 3,840 prediction rows plus header |
| `npm run build` | TypeScript and Vite production build pass |
| Mounted `/braid-memory/` HTTP check | HTML and referenced JS/CSS return 200 with the correct content types, using dist mounted at the repository subpath |
| `git diff --check` | Pass |

The browser tool rejected local preview URLs with `ERR_BLOCKED_BY_CLIENT`.
Actual rendered browser interaction, screenshots, mobile layout, and real
browser download handling remain unverified. DOM tests exercise React events
and Blob/anchor download wiring; they do not establish visual correctness.
Vite's existing large-chunk warning remains non-blocking.

A generic Vite preview server mounted at `/` does not emulate a Pages subdirectory:
requesting its `/braid-memory/assets/...` fallback returns HTML, not the asset.
The subpath verification above uses an actual static mount at `/braid-memory/`.
No extra production routing or Vite base-path change was needed.

## First development result — fixed default settings

Seed 20260917; 40 independent histories per condition; eight updates per history;
45% clue removal; 16 extra observations; delay jitter ±4. All 320 queries in each
condition were retained. Values below are exact-source accuracy.

| Condition | Ordinary search | Braid-assisted | Scrambled |
|---|---:|---:|---:|
| Selected settings | 84.375% | 80.000% | 35.3125% |
| Fewer clues | 63.750% | 62.1875% | 30.3125% |
| Longer delays | 40.625% | 56.875% | 25.000% |
| Changing delays | 51.5625% | 42.500% | 28.125% |

Primary braid minus ordinary: **−4.375 percentage points**; paired-history
bootstrap 95% interval **[−7.5, −1.5625]** points. Primary braid minus scrambled:
**+44.6875 points**, interval **[38.125, 51.25]**. The predeclared primary verdict
is **No clear benefit**. Beating scrambled connections alone is insufficient.

All methods used 10,240 pair evaluations per condition. At selected settings,
ordinary search used 13,111 ranking relaxations; both alignment arms used 10,240
alignment cells. These are distinct work units, not equivalent CPU operations.

The longer-delay challenge illustrates a possible use for the order constraint
when the nominal timing model is wrong. The primary and changing-delay losses
show its cost when order is imperfect. These are generator-specific observations;
none establishes an HME memory improvement or QOFT-specific mechanism. No
parameters were changed to turn the primary loss into a win.
