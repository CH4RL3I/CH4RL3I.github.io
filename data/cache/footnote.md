# footnote: cited SEC-filings answers with a dated development evaluation

Portfolio summary of the published [31 October 2026 evaluation](https://github.com/CH4RL3I/footnote/blob/152acdd200898a39196d7711dc8f8cc3b4bdbe81/docs/evaluation-2026-10-31/README.md), pinned to commit `152acdd200898a39196d7711dc8f8cc3b4bdbe81`. Footnote answers numeric questions over SEC 10-K filings with source citations and reports where the answer pipeline fails.

## Current development evaluation, 31 October 2026

On 31 October 2026, the hybrid source-extraction/model-fallback pipeline answered 38 of 64 retrieved-context questions correctly: 59% rounded (59.375% exactly). With supplied evidence, it answered 63 of 64 correctly: 98% rounded (98.4375% exactly). These are reused development questions on ten cached real SEC filings from five companies. They are not held-out results or pure-model accuracy. The source-grounded pipeline and context-selection policy changed during development; the figures do not isolate an improvement in the underlying model. The dated report retains every question, answer, source quote and failure.

## Method

The 31 October 2026 run uses `source-grounded-usd-v11` and the unchanged `signed-usd-v2` scorer. Questions and expected numeric values come from SEC XBRL facts. Company-filtered retrieval and adjacent filing context feed a finite source extractor that checks supported annual USD amounts, periods, scales and signs. A model fallback is explicitly unverified when extraction does not produce a supported answer. Each model prompt contains at most six chunks. The pipeline reads question and source context at runtime; benchmark answers and labels are used only by evaluation.

## What the result means

The 31 October 2026 development measurement compares retrieved context with supplied evidence for the whole hybrid pipeline. It is not a controlled pure-model experiment. Company selection, source neighbours and supported numeric extraction all affect the result, alongside model fallback. The retrieved-versus-supplied gap makes context quality an important engineering concern; it does not prove that the model itself is error-free. Historical magnitude-scored figures in older reports are preserved for reproducibility and should not be presented as the current evaluation.

## Remaining error

One full-cohort supplied-evidence answer remains numerically wrong in the 31 October 2026 development evaluation. For Coca-Cola FY2025 equity, the unverified model fallback emitted `$32,169 [KO-FY2025#0268]` instead of USD 32,169,000,000. The supplied context lacked the governing scale caption. The source extractor declined to certify that answer; the pipeline still returned a model-fallback unit error. The published 63/64 supplied-evidence score includes this failure.

## Scope and limitations

The 31 October 2026 figures measure one final run on a reused 64-question development set, not a held-out or human-audited benchmark. The questions are numeric and span five companies; they do not establish narrative-answer quality or exhaustive financial-statement coverage. Source citations identify supplied context groups rather than proving citation precision or minimality. The finite extractor supports specific source layouts and can abstain or fall back on others. Recorded fixes cover year, unit, sign, company and table-scope failures, but passing these development controls does not establish general correctness.

## Reproduction and evidence

The [dated methods report](https://github.com/CH4RL3I/footnote/blob/152acdd200898a39196d7711dc8f8cc3b4bdbe81/docs/evaluation-2026-10-31/README.md) records corpus provenance, scorer and model versions, source quotes, exact run commands, and all answers. The 31 October 2026 run reuses cached questions, expected values and indexes. Separate output directories preserve historical measurements. Software validation for that published source snapshot passed 1,986 offline tests, with 3 deselected; test counts are engineering evidence, not financial accuracy evidence.
