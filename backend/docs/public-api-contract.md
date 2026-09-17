# Public API migration contract

This contract was derived from the existing Hono handlers in
`supabase/functions/make-server/routes`. Spring keeps the route suffixes so the
frontend only changes its public API base URL.

| Method and path | Success | Not found | Collection/null behavior |
| --- | --- | --- | --- |
| `GET /notices` | `200` | n/a | `data: []`; `imageUrls: []`; `contentBelow: ""` |
| `GET /notices/{id}` | `200` | `404`, `Notice not found` | same normalization; increments `viewCount` |
| `GET /routes` | `200` | n/a | `data: []`; `stops: []`; `shapePoints: []`; nullable route fields stay `null` |
| `GET /routes/{id}` | `200` | `404`, `Route not found` | same route field rules |
| `GET /routes/{id}/path` | `200` | `404`, `No stops found` | unresolved coordinates stay `null`; path is `[]` when none resolve |
| `GET /buses` | `200` | n/a | `data: []`; absent route/trip/location/timestamp stay `null` |
| `GET /buses/{id}` | `200` | `404`, `Bus not found` | absent route/location stay `null` |
| `GET /buses/locations/latest` | `200` | n/a | `data: []` |

All successful responses use `{ "success": true, "data": ... }`. Errors use
`{ "success": false, "error": "..." }`. Database failures retain the
endpoint-specific Edge messages and return `500`.

Bus responses are deliberately public/redacted. Admin screens call the Edge
Function's managed-bus read until authentication migration is complete.
