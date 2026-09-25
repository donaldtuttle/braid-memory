# Braid Memory

## New: Find the Right Memory

**Can connecting two histories help find the right earlier memory?** The new
Experiment tab compares ordinary search, braid-assisted search, and scrambled
connections using the same generated records and a separate answer key.

**[Read the experiment guide](docs/MEMORY_EXPERIMENT.md)** ·
**[See the first results and verification](docs/MEMORY_EXPERIMENT_VERIFICATION.md)** ·
**[Browse the experiment code](src/components/experiment/Experiment.tsx)**

Adjust missing clues, distractions, and delays; replay the choices; reveal the
correct answers; and download the results as JSON or CSV.

**Try it:** follow the [local setup](#run), then select
**Experiment → Run comparison** inside the app. For a shareable browser link,
follow the [GitHub Pages setup](#publish-the-simulation-on-github-pages).
The Experiment tab is part of this repository’s app; the original Grok-hosted
simulation does not receive these GitHub updates.

The existing **Simulation** tab remains available alongside the experiment.

---

Side quest of [HME](https://github.com/donaldtuttle/HME). ReflectiveStack × GeminiPath as a **lab instrument**, not a store.

In the Simulation tab: the field remembers the shape. The ledger remembers the name. This repo remembers neither. It pairs two operation traces with a time offset (`Γ_Gemini`) and asks whether that braid extra-damps divergence, or whether emotion hysteresis does all the work.

It does **not** write the HME field or the ledger. Labels here are a closed hypothesis about HME 3 tick roles. The live engine stores an open `operation` string, default `write`. Payloads and hashes stay in HME.

## What this is / is not

| This | Not this |
| --- | --- |
| Seeded simulation of two agent traces | A quantum computer |
| Ablation of hysteresis vs identity recovery | Calibrated HME `confidence` |
| Ranked operation crossings | `retrieve_memory` |
| Hypothesis about operator mix under affect | A measurement from the engine |

If dampening tracks hysteresis, the braid is not doing the work. If identity density recovers after re-entangle, GeminiPath extra-damps. Random traces are the control.

## Operations (HME 3)

HME 3.0 dropped the closed QOFT glyph set. Live records store an open `operation` string. The default encode is `operation="write"`. Archived glyphs (`Σ◯`, `Θλ`, `Λψ`, `Ψmeta`, `Π↺`) remain only in [archive/v2.2](https://github.com/donaldtuttle/HME/tree/main/archive/v2.2).

This braid still uses a closed five-face vocabulary so identity vs hysteresis can be ablated. It is a hypothesis about tick roles, not the `hme-v3` schema.

| Label | HME 3 face | Archived glyph |
| --- | --- | --- |
| `write` | `encode_memory` default operation | `Σ◯` |
| `retrieve` | `retrieve_memory` (not stored on the write) | `Θλ` |
| `event` | `FieldRuntime` field event | `Λψ` |
| `measure` | pre-event `write_salience` | `Ψmeta` |
| `lineage` | `LineageGraph` | `Π↺` |

The 2025 notebook used a decorative alphabet (`Ξμ`, `Σ⊖`, `Ωµ`). This instrument no longer pretends those, or the v2.2 glyphs, are what the live engine writes.

## Formulas

```
Ψintent(t)      = 0.5·t + emotion_weight(t) + 2·coherence(t)
braid_word(t)   = (Ξ_A[t], Ξ_B[t + Δt])          ← Γ_Gemini
braid_coherence = 1 if operations match else 0.5
ΔΨ_braid        = |Ψ_A − Ψ_B| − γ · braid_coherence
```

Ablation (the part that makes it an instrument):

- **Hysteresis** = drop in raw `|Ψ_A − Ψ_B|` after re-entangle (emotion weight walking home).
- **Identity share** = `γ · (coherence_post − coherence_div) / mean_raw_div`. Extra dampening from match-rate recovery, *not* from subtracting γ (that always inflates the ratio).
- **16-seed sweep** from the current seed.

Operator mix under fear (Ξ_B during divergence) is a **hypothesis**: shift toward `retrieve` + `event`, off `write`. Recovery writes and locks lineage. Falsify it with the Random control.

## Find the Right Memory experiment

Open **Experiment → Run comparison**. Three methods try to recover the actual
source of each update: ordinary content/timing search, ordered braid-assisted
alignment, and scrambled connections. Each uses the same records and pair-score
budget; a separate answer key determines correctness.

- Control missing clues, distractions, delay variation, seed, and sample size.
- Compare accuracy at your selected settings and three harder conditions.
- Replay any history, step through its updates, and reveal the correct source.
- Download full JSON results or a per-prediction CSV.

Ordinary search is a global one-to-one assignment baseline. The braid adds an
order constraint and can lose when updates arrive out of order. This is ordinary
sequence alignment on synthetic records, not HME field retrieval or validation
of QOFT. Results are exploratory; no method is programmed to win.

Read the [fixed v1 protocol](docs/MEMORY_EXPERIMENT.md) and
[verification record](docs/MEMORY_EXPERIMENT_VERIFICATION.md). Link directly to the
experiment with `#experiment` on the deployed site.

## Run

This is the standalone React/Vite version of the
[Grok simulation](https://hme-operator-braid-memory.grok.me/).
It runs entirely in the browser; no Grok account, API key, or backend is required.
Use Node.js 24.15 or newer within the 24.x line (see `.nvmrc`).

```bash
npm ci            # install the versions recorded in package-lock.json
npm test          # engine/protocol tests and DOM interaction checks
npm run dev       # lab instrument
```

Open the local URL printed by Vite. For the production build:

```bash
npm run build     # typecheck and generate dist/
npm run preview   # serve the production build locally
```

Seed is deterministic. Space plays, arrows step.

## Publish the simulation on GitHub Pages

The **Simulation** workflow tests and builds every push to `main` and every
pull request. Once Pages is configured, successful `main` builds also deploy.
Before that, deployment is skipped and the build remains available as an artifact.

One-time setup in this repository:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Simulation → Run workflow**, choose `main`, and run it.
4. Open the site link in the successful **deploy** job or in **Settings → Pages**.

Relative asset paths allow the same `dist/` output to run at a repository subpath
such as `/braid-memory/` or at a domain root. Serve `dist/` over HTTP; opening
`index.html` directly with `file://` is not supported.

See [the port verification record](docs/GROK_PORT.md) for the source boundary and
the checks used to compare this build with the Grok app.

## Claims not to make

- Identity share is not a probability.
- Operation-address ranking is not holographic retrieval, and it is not `retrieve_memory`.
- A high match rate on random traces is sampling noise, not topology.
- This is not a drop-in index for QMesh. The useful seam, if any, is GeminiPath as a *lineage probe* that then hands hits to `retrieve_memory`.

## License

Proprietary source-available, same family as HME. See [LICENSE](LICENSE). Copyright (c) 2026 Donald Tuttle.
