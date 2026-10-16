# Member 1 — Municipal Ticket System Architecture (three-agent demo)

## Project purpose and ownership

Member 1 builds the n8n orchestrator, not the three AI agents. The orchestrator accepts the citizen report, calls Intake, Vision, and Knowledge services in order, applies deterministic safety decisions, chooses the department by fixed rules, and produces a ticket-ready JSON response. This version is a **demo only**: images, classification, sources, and ticket saving are simulated. It does not ingest real photos or search a real municipal document corpus.

## Why a sequential chain instead of a master AI agent?

**Chosen approach: sequential n8n workflow + deterministic policy gates.** We know the required order: intake validation and privacy -> image understanding -> routing -> document retrieval -> ticket. Each stage has fixed JSON input/output fields, can be tested separately, and may stop the process for human REVIEW or REJECT invalid input. This makes outcomes reproducible, explainable and easier to debug.

**Rejected for the prototype: central autonomous/master LLM.** A master agent could decide which tool to call or in what order, but the task has no need for dynamic tool planning; allowing model-driven control could skip privacy checks or trusted-source requirements, and makes executions harder to trace and test. The team still has three cooperating *specialist* agents, but n8n remains the controller.

## Components

1. **Citizen Webhook:** receives one JSON report: `report_id`, `description`, `media_ref`, optional `location`. Demo uses fixture strings such as `mock://pothole` (not actual images).
2. **Input Check / IF branch:** rejects missing/invalid fields with `REJECT`, HTTP 422, and a specific reason code.
3. **HTTP Intake + Gate 1 / IF:** POST `/intake`. Gate 1 checks validity, media/privacy status, agent failure, ID matching. Invalid external agent response or unverified real photo is `REVIEW`, HTTP 202.
4. **HTTP Vision + Gate 2 / IF:** POST `/vision`. Gate 2 checks report ID, known category and severity, image/text agreement, supporting evidence, confidence/uncertainty and fixture consistency. Unclear or mismatched reports are `REVIEW`.
5. **Department Rules:** fixed mapping, never a model decision: `ROAD_DAMAGE -> ROADS_DEPARTMENT`; `STREET_LIGHTING -> PUBLIC_LIGHTING_DEPARTMENT`; `WASTE -> SANITATION_DEPARTMENT`; `WATER_LEAK -> WATER_SERVICES_DEPARTMENT`. Unknown/NONE is reviewed. These are **internal demo labels**, not verified names of municipality departments.
6. **HTTP Knowledge + Gate 3 / IF:** POST `/knowledge` with `report_id`, category, department, and description. Validate ID/category/department, nonempty procedure, source metadata and demo-mode restrictions. The current Knowledge service does **not** query Qdrant or contain official sources. No official deadline is invented.
7. **Mock Ticket Creation:** formats the fields of a proposed ticket. `ticket.persisted=false`, `ticket.storage_status=MOCK_ONLY`. There is no database write.
8. **Audit Summary + Respond to Citizen:** creates sanitized event metadata (`report_id`, stage, outcome, reason codes, versions, timestamp) and returns `PASS` HTTP 200, `REVIEW` HTTP 202, or `REJECT` HTTP 422.

## n8n tools and design decisions

- **Webhook + Respond to Webhook:** explicit request/response and predictable HTTP status codes.
- **HTTP Request:** separate container-hosted Intake, Vision and Knowledge services; request JSON is defined in the nodes so agents can be swapped without changing the rest of the pipeline.
- **Code:** validates JSON, restores context after HTTP responses, applies deterministic rules, and constructs safe output.
- **IF (branching):** continues only after PASS, and otherwise goes directly to Audit Summary without calling later agents.
- **Postgres:** **not yet configured**. Member 5 will provide ticket persistence; Member 1 will integrate the database-backed endpoint and add durable audit events. The current metadata-only `Audit Summary` is not permanent logging.
- **Export:** `n8n/municipal-ticket-phase5.json` is directly importable through n8n's menu; the same file is additionally provided at `n8n/municipal-ticket.json` to match the assignment naming.

## Reliable and safe data flow

- **Schema consistency:** `docs/contracts.md` defines field names, types, allowed categories, decision outcomes and sample JSON. It is a proposed contract requiring teammates' confirmation.
- **Failure handling:** HTTP requests have timeouts and up to 3 attempts; `On Error -> Continue` feeds the downstream gate; a malformed response, nonmatching ID, missing evidence/source or unavailable service must never advance as PASS.
- **Retries:** safe for stateless agent HTTP calls, not for ticket creation without a unique idempotency key; a future `POST /tickets` should deduplicate using `report_id` and database uniqueness.
- **Privacy:** full description, raw images, credentials and location must not be stored in independent audit logs; the current audit object includes minimal metadata. n8n may still store execution inputs, so only fictional data should be used until retention/security controls are configured.
- **Unknown values:** use `null` or REVIEW, never invent municipality, official procedures, image evidence or deadlines. Source provenance must be independently verified for real RAG; trusting a model-supplied `is_official` flag is insufficient.
- **Secrets:** don't commit API keys or credentials in workflow JSON; configure them through n8n credentials / protected environment variables.

## Demo test evidence and limitations

From the Member 1 testing conversation, Phase 4 was verified to return PASS for the pothole fixture and REVIEW for a Vision outage. The original workflow also returned REVIEW for mismatch and REJECT for a missing image, while Phase 3 HTTP Intake failure cases passed. Phase 5 Knowledge integration has local logic checks in `tests/check_phase5.mjs` and HTTP stub tests in `tests/test_knowledge_stub.mjs` but **must still be tested in the user's running n8n**.

The demo is not a production system. Remaining integrations: Member 3 real image upload/validation/anonymization, Member 4 real multimodal inference, Member 2 real retrieval from approved municipal sources, Member 5 durable ticket/audit persistence and review dashboard. Authentication, rate limits, data retention and safer media storage are required before accepting citizen reports.

## Official technical references

- n8n Webhook: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- n8n HTTP Request: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
- n8n error workflows: https://docs.n8n.io/flow-logic/error-handling/
- n8n exporting/importing: https://docs.n8n.io/workflows/export-import/
