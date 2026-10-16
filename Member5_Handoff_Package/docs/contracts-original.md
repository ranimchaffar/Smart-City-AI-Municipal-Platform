# Shared API contracts — Municipal Ticket v1

**Owner:** Member 1. **Status:** proposed for team approval. Changes to field names or allowed values require agreement from Members 2–5.

## A. Data flow

Citizen web app -> `POST /webhook/municipal-ticket` -> Intake -> Vision -> deterministic department rules -> Knowledge/RAG -> ticket storage (to be added by Member 5) -> dashboard.

**First prototype restriction:** `media_ref` is a string, not uploaded image bytes. `mock://...` values are demo fixture IDs. Real photos must be uploaded to a controlled storage service first; Member 3 validates/anonymizes them and returns a safe reference. The current workflow does not do this. `demo_mode` is set **inside** the workflow; incoming `demo_mode` values are ignored.

## B. Citizen app -> n8n

`POST /webhook/municipal-ticket` — `Content-Type: application/json`

```json
{
  "report_id": "RPT-001",
  "description": "A deep pothole is dangerous for drivers on the road.",
  "media_ref": "mock://pothole",
  "location": {
    "address": "Demo Avenue (fictional)",
    "latitude": null,
    "longitude": null
  }
}
```

| Field | Type | Required | Rule |
|---|---|---|---|
| `report_id` | string | yes | 3–64 letters, digits, hyphens or underscores; caller-generated, no PII |
| `description` | string | yes | 5–3000 chars, trimmed |
| `media_ref` | string | yes | Demo: `mock://{fixture}`; future storage: `uploads/{safe-path}`. Never arbitrary URLs. |
| `location` | object or null | no | `address` string ≤300 chars; `latitude` -90..90 or null; `longitude` -180..180 or null |

For this prototype, supported demo fixture values: `mock://pothole`, `mock://streetlight`, `mock://waste`, `mock://water_leak`, `mock://unrelated`, `mock://blurry`. These **are not real images**. A real image reference receives REVIEW until genuine Intake validation is connected.

### n8n -> citizen app, PASS example

```json
{
  "report_id": "RPT-001",
  "decision": "PASS",
  "ticket": {
    "ticket_id": "DEMO-TKT-RPT-001",
    "report_id": "RPT-001",
    "status": "TICKET_CREATED",
    "category": "ROAD_DAMAGE",
    "severity": "HIGH",
    "priority": "HIGH",
    "department": "ROADS_DEPARTMENT",
    "location": {"address":"Demo Avenue (fictional)","latitude":null,"longitude":null},
    "anonymized_media_ref": null,
    "procedure": "DEMO ONLY: send the report to ROADS_DEPARTMENT for human assessment. This is not an official municipal procedure.",
    "sources": [
      {
        "document_title": "DEMO PLACEHOLDER - NOT MUNICIPAL POLICY",
        "source_url": null,
        "chunk_id": "mock-road_damage-01",
        "search_score": null,
        "is_official": false,
        "is_mock": true
      }
    ],
    "deadline": null,
    "persisted": false,
    "storage_status": "MOCK_ONLY",
    "is_mock": true
  },
  "review_reasons": [],
  "errors": [],
  "demo_mode": true,
  "agents_are_mock": true,
  "notice": "Demo only: fixture-based agents; no real image inference, RAG verification or database persistence.",
  "versions": {"orchestrator":"member1-v1","intake":"mock-intake-v1","vision":"mock-vision-v1","knowledge":"mock-knowledge-v1"},
  "trace": [],
  "http_status": 200
}
```

Note: the actual response `trace` will contain workflow stage decisions. `status: TICKET_CREATED` is only a **simulated status** when `persisted:false`. Do not show a real ticket-tracking confirmation to users until Member 5 confirms the database save.

### REVIEW

HTTP 202, `decision:"REVIEW"`, `ticket:null`, nonempty `review_reasons`, e.g. `IMAGE_TEXT_MISMATCH_OR_UNCLEAR`. A human checks the case; nothing is assigned automatically.

### REJECT

HTTP 422, `decision:"REJECT"`, `ticket:null`, nonempty `errors`, e.g. `MISSING_MEDIA_REF`. Ask the citizen to correct the input.

All three branches include `report_id`, `versions`, a safe event `trace`, and `demo_mode`. Never return an invented official deadline.

## C. Intake Agent (Member 3) — expected contract

`POST /intake` request:

```json
{"report_id":"RPT-001","description":"Road damage near a crossing","media_ref":"uploads/report001.jpg","location":null}
```

Expected response after **real image validation**:

```json
{
  "report_id":"RPT-001",
  "input_type":"IMAGE_TEXT",
  "cleaned_description":"Road damage near a crossing",
  "language":"en",
  "media_ref":"uploads/report001.jpg",
  "anonymized_media_ref":"safe/report001.jpg",
  "media_validation":"VERIFIED",
  "privacy_status":"ANONYMIZED",
  "image_anonymized":true,
  "location":null,
  "validity":"VALID",
  "errors":[],
  "agent_version":"intake-v1"
}
```

The response above illustrates the agreed *target format*, not a working Member 3 implementation. This codebase's mock Intake intentionally returns `MOCK_FIXTURE` and `image_anonymized:false`. Real Gate 1 must explicitly require `VERIFIED` and appropriate privacy checks.

## D. Vision Agent (Member 4) — expected contract

`POST /vision` input: `report_id`, validated/anonymized `media_ref`, `cleaned_description`, optional `location`.

```json
{
  "report_id":"RPT-001","category":"ROAD_DAMAGE","severity":"HIGH",
  "description":"Pothole visible in a roadway","evidence":["Hole visible in the road surface"],
  "text_image_consistent":true,"confidence":0.91,
  "uncertainty":false,"prompt_version":"v3","agent_version":"vision-v1"
}
```

Confidence (if returned) is not a correctness guarantee. Unknown labels, `NONE`, insufficient evidence, or mismatch trigger REVIEW. If image-text consistency is unknown, set `null`, not `true`.

## E. Department rules (Member 1, not an AI decision)

| Incident category | Internal department enum |
|---|---|
| `ROAD_DAMAGE` | `ROADS_DEPARTMENT` |
| `STREET_LIGHTING` | `PUBLIC_LIGHTING_DEPARTMENT` |
| `WASTE` | `SANITATION_DEPARTMENT` |
| `WATER_LEAK` | `WATER_SERVICES_DEPARTMENT` |
| `NONE` or unknown | REVIEW; do not route |

These are **internal demo labels**, not verified department names for a particular municipality. Once Member 2 chooses the municipality, map them to actual municipal departments using verified information.

## F. Knowledge / RAG Agent (Member 2) — expected contract

`POST /knowledge` request:

```json
{"report_id":"RPT-001","category":"ROAD_DAMAGE","department":"ROADS_DEPARTMENT","description":"Large pothole on roadway","municipality":null}
```

Response when sources have been verified:

```json
{
  "report_id":"RPT-001","category":"ROAD_DAMAGE","department":"ROADS_DEPARTMENT",
  "procedure":"Procedure text grounded in the retrieved document",
  "sources":[{"document_title":"Verified municipal source title","source_url":"https://example.gov/verified-document","chunk_id":"road-01","search_score":0.83,"is_official":true,"is_mock":false}],
  "deadline":null,"agent_version":"knowledge-v1"
}
```

The URL above is a **shape example only**, not a verified source. Deadline stays `null` unless explicitly documented. Gate 3 for real use must verify source provenance against a trusted, municipality-specific source registry; do not trust an agent-supplied `is_official:true` flag by itself. If unsupported: REVIEW.

## G. Ticket storage (Member 5) — target contract

`POST /tickets` accepts the validated report, routing and RAG source metadata. Return database-generated `ticket_id`, saved `status`, and `persisted:true` **only after successful commit**. Store anonymized media references, not raw file contents. For failed saves, return an error and do not send a success confirmation. Member 1 will add that HTTP Request / Postgres node when ready.

Suggested status values: `RECEIVED`, `VALIDATING`, `ANALYZING`, `REVIEW_REQUIRED`, `TICKET_CREATED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`.

## H. Shared allowed values

- Categories: `ROAD_DAMAGE`, `STREET_LIGHTING`, `WASTE`, `WATER_LEAK`, `NONE`.
- Severity: `LOW`, `MEDIUM`, `HIGH`; never invent for unknown input.
- Decisions: `PASS`, `REVIEW`, `REJECT`.
- Ticket priority in this demo: `LOW`, `NORMAL`, `HIGH` (derived deterministically from severity; confirm with Member 5).
- Fields without evidence: `null`. No invented location, official procedure, document score or deadline.

## I. Policy gates and errors

| Gate | PASS only when | REVIEW when | REJECT when |
|---|---|---|---|
| Input Check | Required fields valid | — | Report ID, description or media reference missing/invalid |
| Gate 1 Intake | Demo fixture is recognized as mock | Real image not validated yet / failed privacy proof | If real Intake declares truly unusable format (to implement) |
| Gate 2 Vision | Known category and severity, text matches image evidence | Category `NONE`, low clarity, missing fields or image-text mismatch | Not used for uncertainty; preserve for human review |
| Gate 3 Knowledge | Demo source in demo-only mode; **verified municipal source in real mode** | Empty/weak/unverified source or missing procedure | Not used for research uncertainty |

On future network timeouts or malformed agent outputs, convert to REVIEW with a reason code, not a silent PASS. Real HTTP retries should be limited (for example 2) and only used when safe; **ticket persistence must be idempotent by `report_id`** to avoid duplicates.
