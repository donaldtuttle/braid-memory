# Find the Right Memory — protocol v1

Status: DEVELOP. Synthetic retrieval experiment; no canonical weight.

## Question and evidence boundary

Does using order across two histories improve source-record retrieval beyond
content and timing alone? This is a new, separately implemented retrieval task.
It does not run HME's FFT memory engine or change the existing glyph simulation.
The D-Π-01 eight-file baseline is not present in this repository; this is not a
canon audit. No canonical operator or typed bridge is asserted. The tested
objects are ordinary records and record IDs, not Ψ or ψᴽ.

The established competing explanation is ordinary sequence alignment using a
useful temporal prior. This experiment cannot establish unique braid topology,
quantum effects, consciousness, physical QOFT, or real-world memory benefit.

## Generation and separation

Each independent history contains 16 + D observations in history A and eight
updates in history B. Observations have a location, object, and signal. Eight
observations are sampled without replacement to produce updates after a positive
delay. Updates independently lose some of their three content clues. Distractors
share vocabulary and may repeat content. Record IDs are randomized independently
of causal origin. No parent ID, latent index, or hidden full content is passed to
retrievers. The answer key is a separate object used only after prediction.

The generator assumes one source per update, unique sources within a history,
and generally preserved event order. A delay-jitter challenge can violate order.
These favorable synthetic assumptions are part of the task, not discoveries.
All methods receive the identical public records and nominal delay.

## Three fixed methods

1. **Ordinary search:** maximum-weight one-to-one assignment using every eligible
   observation's content and timing. This is a global assignment baseline, not a
   deliberately weak first-match or greedy search. It makes no order assumption.
2. **Braid-assisted:** maximum-weight monotone alignment of A and B. Links cannot
   run backward through the displayed histories. Skipped observations and
   unanswered updates are allowed. Its extra assumption is preserved order.
3. **Scrambled connections:** the identical alignment code, with a seeded random
   permutation of A's structural positions. Record contents, timestamps, IDs,
   eligibility, pair scores, and answer keys do not change. This preserves the
   number of nodes and the path structure, while changing which record occupies
   each node. Chance-preserved positions are allowed and recorded.

The retriever interface is `PublicHistory -> Prediction`; scoring is
`(Prediction, AnswerKey) -> correctness`. A connection is a selected inferred
record pairing. It is never supplied from the answer key. The shuffled control
changes structural order only; B remains chronological. The constraint can lead
to abstention, which is an error in accuracy and separately counted.

## Frozen scoring and budgets

For a public update q and observation a:

```
content = number of matching visible clues / max(1, visible clue count)
timing  = exp(-abs((q.time - a.time) - nominalDelay) / 12)
score   = 4 * content + 0.75 * timing
```

Future observations are ineligible. An unanswered update has score zero. Each
method scores every pair exactly once: eight times (16 + D) pair evaluations.
That is the identical search/information budget. Candidate IDs resolve remaining
ties deterministically through the input ordering. Ranking algorithms have
different costs: assignment relaxations versus alignment cells, separately
reported, bounded by a common ceiling `M * M * (N + M)`. These work units are not
equivalent CPU instructions. Wall-clock retrieval time is also reported and is
not used as evidence of accuracy. Timing excludes generation and scoring but
includes sorting, pair scoring, control permutation, and ranking. No cached
free graph, oracle link, or arm-dependent accuracy adjustment is used.

## Prespecified scenarios and endpoints

All four conditions use the same independently seeded base histories:

- **Selected settings**: chosen missing-clue rate, distractors, and delay jitter.
- **Fewer clues**: missing-clue rate increased by 0.30, capped at 1.
- **Longer delays**: actual update delays increased by 18 time units; the nominal
  delay available to every retriever remains 12.
- **Changing delays**: jitter increased by 18 time units, capped at 48; actual
  delays stay positive. Updates may arrive out of source order.

Primary endpoint: exact-source top-1 accuracy in Selected settings. Secondary:
accuracy in the three challenge conditions, unanswered counts, pair comparisons,
ranking work, and retrieval time. All cases are retained; no favorable-seed filter,
retry-until-win, adaptive stopping, or hidden tuning. A run has the selected fixed
number of independent histories per condition, eight queries each.

Paired differences are computed per independent history (not as eight independent
queries), then summarized with deterministic 2,000-resample percentile bootstrap
95% intervals. These intervals are exploratory with a small synthetic sample;
challenge intervals are descriptive without multiplicity correction.

Display **Exploratory benefit** only when BOTH primary comparisons (braid minus
ordinary and braid minus scrambled) are at least +5 percentage points and their
95% lower endpoints exceed zero. Otherwise display **No clear benefit**. A braid
loss is displayed as a negative difference; no forced success result exists.
Degenerate control permutations are reported, and if all structural positions
are unchanged, use **Mechanism not tested**. Results still remain exploratory.

This document fixes v1 behavior before its first development run. It is not an
external preregistration. Development seeds and manual reruns are not confirmatory
holdouts. For a confirmation study, freeze the code commit and config first,
register a sample size and untouched seed list externally, then execute once.
Fresh random seeds in the UI are new synthetic cases, not proof of independence
from every previous study. UI controls and protocol changes require new review.

## Integrity and falsifiers

Reject interpretation if the answer key reaches retrieval, records differ by
method, future sources are selectable, a budget is exceeded, predictions are
not reproducible, or scoring does not compare actual selected IDs. Software tests
check these boundaries and small exact assignments against exhaustive solutions.

The practical hypothesis is unsupported here if braid fails to beat ordinary
search and the scrambled control at the fixed threshold. Losing accuracy under
changing delays exposes dependence on the order assumption. A gain on these
histories supports only this alignment method on this generator. Real histories,
a stronger domain-specific baseline, external replication, and separately tested
HME integration would be required for broader conclusions.

## Review and reproduction

Open **Experiment → Run comparison**. Inspect each condition and replay every
method's actual choice. Download JSON for the protocol, full public histories,
separate answer keys, predictions, seed list, costs, metrics, and environment.
CSV has one row per prediction. Reusing the seed and settings reproduces records,
choices, and accuracy; timestamps and wall-clock timings naturally differ.

Run `npm test` and `npm run build` for software checks. Tests do not assert that
the experiment must win. See `MEMORY_EXPERIMENT_VERIFICATION.md` for the completed
development verification and any browser-testing limits.
