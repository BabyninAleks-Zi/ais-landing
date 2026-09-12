# AIS local update 2026-09-13

Completed locally. Git add/commit/push, branch changes, deployment and visibility changes were not performed.

DECISION: The owner asked to use the new funding inputs and remove all service comments and references to reconciliation from the landing page.
Funding shown: RUB 47m total = 20m equity + 27m loan. Uses: approximately 10m for two SIUI units, 10m Ectane, 27m startup and working capital.
Previous profit/revenue/liquidity projections are not rendered. The financial model and business documents are being updated in a separate task and were not modified here.
The updated model can later replace the private scenario data. The forecast template is enabled only after its data and review state have been updated. No source PDF is linked by default.

Validation: 41 Node tests pass in a clean source-only copy; both editions build without documents; public builds without investor JSON. 13 automated Chromium checks pass covering widths 320, 390, 768 and 1440, no external requests, mobile menu and focus, HTTP resources, disclosure, print and JavaScript-disabled behavior. Key print pages and desktop/mobile layouts visually inspected. Safari/Firefox and remote CI were not run. Existing optional Python browser test was syntax-checked; equivalent browser checks ran with the bundled Node Playwright runtime.

Original source versions and prior generated builds are in backup/. Internal audit files are ignored by Git. Approved monogram is unchanged.
