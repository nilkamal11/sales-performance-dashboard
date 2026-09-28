# Sales Intelligence Dashboard

Public commercial-sales dashboard for the supplied Kenya business extracts covering 12 April 2024 through 31 August 2026.

Live site: https://nilkamal11.github.io/sales-performance-dashboard/

## Included

- Yearly and monthly performance with normalized credit notes
- Twelve-month sales forecast with rolling back-test results and empirical ranges
- Customer 60-day reorder probabilities and revenue-at-risk ranking
- Next-best-product suggestions from peer co-purchase patterns
- Product and company research with evidence-level labels and source links
- Customer movement, credit-note-rate, and discount exception queues
- A browser-based sales data assistant that uses the published analytics only

## Important boundaries

- Sales and Invoice vouchers are included. Credit Note and Credit Note Voucher amounts are normalized as negative. Samples and unknown voucher types are excluded.
- The forecast and reorder probabilities are decision-support estimates, not guarantees.
- Recommendations are commercial leads and are not clinical advice.
- Anomaly flags are review signals, not proof of error, misconduct, or fraud.
- Currency is labelled KES from the Kenya business context; the source files do not contain an explicit currency field.
- Customer-level outputs are intentionally public in this repository. The original Excel workbooks are not included.

The site is static HTML, CSS, JavaScript, and precomputed JSON-compatible data. No source data is sent to an external AI service by the on-page assistant.
