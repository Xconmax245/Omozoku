# OmoZoku — Redis Key Convention

All keys follow the pattern: `omozoku:{domain}:{id}:{variant}`

| Endpoint       | TTL     | Example key                        |
|----------------|---------|------------------------------------|
| Homepage       | 30 min  | `omozoku:home:v1`                  |
| Seasonal       | 6h      | `omozoku:seasonal:2026:summer`     |
| Search         | 15 min  | `omozoku:search:{queryHash}`       |
| Anime Detail   | 24h     | `omozoku:anime:12345`              |
| Characters     | 24h     | `omozoku:anime:12345:characters`   |
| Relations      | 7d      | `omozoku:anime:12345:relations`    |
| Episode List   | 12h     | `omozoku:anime:12345:episodes`     |
| Watch Sources  | 5 min   | `omozoku:watch:12345:ep3`          |
| Facts          | forever | `omozoku:facts:12345`              |
| Top Anime      | 6h      | `omozoku:top:v1`                   |

## Rules

1. Never use bare IDs without the `omozoku:` prefix — prevents key collisions.
2. Search keys hash the full query string (including genre filters, page) to avoid cache explosion.
3. Stream source TTLs are kept at 5–15 min — expiring signed URLs break playback.
4. `facts` keys have no TTL (or ~1 year) — they are written once and never invalidated.
5. Bump the variant suffix (e.g. `:v1` → `:v2`) to manually invalidate a category without flushing all keys.
