# Public CV

`content/public-cv.json` is the source for `public/emilio-gappa-cv.pdf`. It contains the publishable professional facts used by the portfolio's CV and can also be indexed by Ask.

The one-page A4 CV is dated 3 November 2026 and targets applied AI and AI product-development internships from January 2027. It distinguishes the current Gonder working-student role from the internship that ended in October 2026. It includes the previously verified approximately 40% reduction in manual reporting effort at ATLAS, while using qualitative outcomes for projects without measured user impact.

Facts were reconciled against the existing verified CV and the public portfolio. Employer work is described at a general product/workflow level. Private contact details, operational customer/fleet counts, customer identities, and confidential work data are excluded. The public contact links are the portfolio, LinkedIn and GitHub. Footnote is described without duplicating a benchmark result, so the PDF does not carry the historical 56% / 92% figures.

To regenerate, install ReportLab in a local Python environment and run:

```sh
python3 scripts/build-public-cv.py
```

The builder embeds Arial on macOS or DejaVu Sans on Linux. Use `--font-dir` for another folder containing one of those font pairs, and `--output` for a review copy.

The released PDF was rendered with Poppler and visually inspected. It has one page, selectable text and six HTTPS link annotations; both used Arial fonts are embedded. Its body text is 10 pt. The PDF is committed as a static asset, so production deployment does not require Python, fonts or PDF-generation dependencies.
