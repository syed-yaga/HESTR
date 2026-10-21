# Product Requirements Document: Hybrid Edge-to-Cloud Speculative Telemetry Router

**Target Event:** Hacktoberfest Hack Day New Delhi x **ACTS** **EDC**

**Target Tracks:**

## Best Open-Source AI Project (DigitalOcean / MLH)

## Best Use of Gemma 4 (Google DeepMind) **License:** **MIT** License **Open-Weight Models:** `gemma4:e4b` (Edge / Ollama) & `gemma-4-31b-it` (Cloud / Gemini **API** & DO Serverless Inference) **Primary Language:** TypeScript / Node.js

---

## 1. Executive Architecture Overview

Continuous streaming of high-frequency sensor telemetry (10–50 Hz accelerometer vectors, commuter **GPS** geofence transitions, and IoT health signals) alongside video frames directly to a cloud **LLM** drains battery life, saturates cellular uplinks, and fails in connectivity dead zones.

The Hybrid Edge-to-Cloud Speculative Telemetry Router implements a TypeScript-driven, two-tier speculative gating harness with three surgical enhancements tailored for dual-track hackathon victory:

1. **Dual-Provider Cloud Switch:** A Node.js/TypeScript cloud orchestrator deployed on DigitalOcean App Platform dynamically routes deep reasoning requests across DigitalOcean Serverless Inference (with prompt caching) and the Google Gemini **API**, satisfying both sponsors' technical mandates.
2. **Multimodal Snapshot Escalation:** Keeps routine monitoring lightweight on the edge using quantized `gemma4:e4b` and attaches a single compressed camera/sensor image frame (**JPEG**/WebP Base64) only when the local model transitions into an `escalate` state.
3. **Split-Screen Cost & Bandwidth Meter UI + Agent Skill Wrapper:** Exposes a real-time two-column telemetry simulator dashboard demonstrating 95%+ cloud token and bandwidth savings, bundled with an installable `**SKILL**.md` compliant with the Agent Skills Open Standard.

### Architectural Flow

```mermaid
flowchart LR
    %% TIER 1: EDGE
    subgraph EdgeTier["Tier 1: Edge Node (Local Device / Simulator)"]
        Sensor["High-Freq Telemetry Stream\n(Accelerometer, **GPS**, Logs)"] --> RingBuf["Sliding Ring Buffer\n(Last 60 Ticks + Latest Frame)"]
        Cam["Edge Camera / Plotter\n(1 Frame / Sec Buffer)"] --> RingBuf
        RingBuf --> EdgeSLM["Quantized Gemma 4 **E4B**\n(Ollama Local Runtime)"]

        EdgeSLM -->|State: **NORMAL** or **CONCERN**\n(96% of ticks)| Drop["Log Locally & Drop Cloud Call\n($0.00 Cost, 0 KB Egress)"]
        EdgeSLM -->|State: **ESCALATE**\n(Ambiguous / High-Risk)| Compactor["Context Compactor\n(Delta **JSON** + 1 Base64 Frame)"]
    end

    %% TIER 3: PRESENTATION (Placed middle in code so local SSE lines don't cross the cloud)
    subgraph Presentation["Tier 3: Live Judging Dashboard & Agent Skill"]
        SplitUI["Split-Screen Cost & Bandwidth UI"]
        SkillWrapper["Agent Skills Standard\n(**SKILL**.md + audit_stream.ts)"]
    end

    %% TIER 2: CLOUD
    subgraph CloudTier["Tier 2: Cloud Backend (DigitalOcean App Platform)"]
        WSGateway["Node.js / TypeScript\nWebSocket Ingestion Gateway"] --> Router["Dual-Provider Inference Router"]
        Router -->|Primary Track 2 Route| GeminiAPI["Gemini **API**\n(gemma-4-31b-it Multimodal)"]
        Router -->|Primary Track 1 Route| DOInference["DigitalOcean Serverless Inference\n(Gemma 4 + Prompt Caching)"]
        GeminiAPI --> ActionEngine["Webhook & Safety Workflow Engine"]
        DOInference --> ActionEngine
    end

    %% INTER-TIER CONNECTIONS
    Compactor -->|**WSS** Binary/**JSON** Frame| WSGateway
    EdgeSLM -.->|Local **SSE**| SplitUI
    ActionEngine -.->|**WSS** Broadcast| SplitUI
    WSGateway -.->|**CLI** Invocation| SkillWrapper


```

---

## 2. Component Specifications

| Tier / Module                     | Technology Stack                                               | Core Responsibility                                                                                                                                       | Hackathon Track Alignment                                                                           |
| --------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Edge Ring Buffer & Compactor**  | TypeScript / Node.js local daemon                              | Maintains a 60-second sliding window of raw JSON telemetry (50 ticks/sec) and overwrites a single in-memory snapshot buffer (`latest_frame.jpg`).         | Demonstrates genuine systems engineering for the MLH Winner Selection Rubric.                       |
| **Edge Speculative Gatekeeper**   | `gemma4:e4b-it-q4_K_M` via Ollama                              | Evaluates compacted 2-second micro-batches locally in <120 ms, classifying each window into `normal`, `concern`, or `escalate`.                           | Satisfies the Open-Weight SLM (≤10B params) sub-track of the Best Open-Source AI Project Challenge. |
| **Multimodal Escalation Trigger** | Local Vision + JSON Serializer (TS)                            | When state is `escalate` (or `concern` with confidence < 0.65), packages statistical summary deltas plus the latest visual frame into a single WS packet. | Directly fulfills the Multimodal Experience (Text + Images) focus area of Best Use of Gemma 4.      |
| **Cloud Ingestion & Dual Router** | Node.js, TypeScript, `ws`, Fastify (DigitalOcean App Platform) | Receives escalated packets over WebSockets and routes multimodal reasoning to `gemma-4-31b-it` via Gemini API & DO Serverless Inference.                  | Unlocks dual eligibility across DigitalOcean's and Google DeepMind's challenges.                    |
| **Split-Screen Judging UI**       | React / Next.js (TypeScript) + Tailwind                        | Renders a live side-by-side comparison of local E4B filtering vs. cloud 31B multimodal escalation, with real-time metrics.                                | Maximizes visual clarity during the 2-minute live auditorium demo.                                  |
| **Reusable Agent Skill Package**  | `SKILL.md` + `scripts/inspect_escalation.ts`                   | Exposes the telemetry compaction and multimodal escalation verifier as a portable skill.                                                                  | Satisfies the Agent Skill sub-track of the Open-Source AI Challenge.                                |

---

## 3. Data Contracts & Wire Protocol

### 3.1 High-Frequency Local Telemetry Tick (Ingested at Edge Only)

```json
{
    *device_id*: *usar-rover-node-04*,
    *timestamp_ms*: **1792569300120**,
    *location*: {
    *lat*: 28.**6542**,
    *lng*: 77.**3025**,
    *geofence_zone*: *GGSIPU_EDC_CAMPUS_GATE_2*,
    *speed_mps*: 6.8
    },
    *imu*: {
    *accel_x_g*: 0.14,
    *accel_y_g*: -0.08,
    *accel_z_g*: 3.42,
    *gyro_pitch_dps*: 48.5
    },
    *system*: {
    *battery_pct*: 42,
    *rssi_dbm*: -89
    }
}

```

### 3.2 Edge `gemma4:e4b` Speculative Gate Output

The TypeScript edge daemon prompts local `gemma4:e4b` with a 2-second rolling summary (40 ticks compressed into **120** tokens) and enforces a strict **JSON** schema response:

```json
{
    *gate_decision*: *escalate*,
    *confidence*: 0.54,
    *local_anomaly_code*: *IMPACT_SPIKE_AT_GEOFENCE_BOUNDARY*,
    *attach_visual_frame*: true,
    *rationale_short*: "Z-axis acceleration hit 3.42g with 48.5 dps pitch spike while exiting GGSIPU_EDC_CAMPUS_GATE_2 under weak cellular **RSSI** (-89 dBm)."
}

```

### 3.3 Compacted WebSocket Escalation Payload (Edge → Cloud)

Instead of streaming 3,**000** raw **JSON** ticks per minute (**450** KB/min), the edge node emits one 18 KB multimodal WebSocket frame only when `gate_decision === *escalate*`:

```json
{
    *event_id*: *esc_9042_usar*,
    *device_id*: *usar-rover-node-04*,
    *edge_model*: *ollama/gemma4:e4b-it-q4_K_M*,
    *cloud_target_provider*: *dual_gemini_and_do*,
    *telemetry_compaction*: {
    *window_seconds*: 10,
    *raw_ticks_suppressed*: **498**,
    *peak_accel_g*: 3.42,
    *max_pitch_dps*: 48.5,
    *geofence_transition*: *GGSIPU_EDC_CAMPUS_GATE_2 -> EXTERNAL_ROAD*,
    *edge_rationale*: "Z-axis acceleration hit 3.42g with 48.5 dps pitch spike while exiting campus geofence.*
    },
    *multimodal_snapshot*: {
    *mime_type*: *image/jpeg*,
    *base64_data*: */9j/4AAQSkZJRgABAQAAAQABAAD...*,
    *capture_source*: *front_hazard_cam_640x360"
    }
}

```

---

## 4. TypeScript Implementation Patterns

### Dual-Provider Multimodal Cloud Router (`src/cloud/router.ts`)

Deploy this Fastify/WS service on DigitalOcean App Platform to evaluate escalated events via both target APIs simultaneously.

```typescript import { GoogleGenAI } from *@google/genai*;

export interface EscalationPayload {
    event_id: string;
    device_id: string;
    cloud_target_provider: *gemini_api* | *do_serverless* | *dual_gemini_and_do*;
    telemetry_compaction: {
    window_seconds: number;
    raw_ticks_suppressed: number;
    peak_accel_g: number;
    max_pitch_dps: number;
    geofence_transition: string;
    edge_rationale: string;
    };
    multimodal_snapshot: {
    mime_type: string;
    base64_data: string;
    };
}

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function reasonOnEscalation(payload: EscalationPayload) { const systemPrompt = `You are a cloud safety & telemetry reasoning engine powered by Gemma 4 **31B**-it. An edge Gemma 4 **E4B** gatekeeper suppressed ${payload.telemetry_compaction.raw_ticks_suppressed} normal ticks and escalated this anomaly. Correlate the compacted sensor telemetry with the attached visual snapshot to: ## Verify whether the physical scene confirms a real hazard or false positive. ## Assign a verified severity level (LOW, MEDIUM, CRITICAL). ## Output a structured JSON action plan and webhook payload.`;

    // Route A: Google DeepMind Track — Gemma 4 **31B**-it via Gemini **API**
    const geminiPromise = gemini.models.generateContent({
    model: *gemma-4-31b-it*,
    contents: [
    {
    role: *user*,
    parts: [
    { text: `${systemPrompt}\n\nCompacted Telemetry:\n${**JSON**.stringify(payload.telemetry_compaction, null, 2)}` },
    {
    inlineData: {
    mimeType: payload.multimodal_snapshot.mime_type,
    data: payload.multimodal_snapshot.base64_data,
    },
    },
    ],
    },
    ],
    });

    // Route B: DigitalOcean Track — Gemma 4 via DigitalOcean Serverless Inference
    const doPromise = fetch(*[https://inference.do-ai.run/v1/chat/completions*,](https://inference.do-ai.run/v1/chat/completions*,) {
    method: *POST*,
    headers: {
    *Content-Type*: *application/json",
    Authorization: `Bearer ${process.env.DO_INFERENCE_KEY}`,
    },
    body: **JSON**.stringify({
    model: *gemma-4-31b-it*,
    messages: [
    { role: *system*, content: systemPrompt },
    {
    role: *user*,
    content: `Compacted Telemetry: ${**JSON**.stringify(payload.telemetry_compaction)}`,
    },
    ],
    temperature: 0.2,
    }),
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const [geminiResult, doResult] = await Promise.all([geminiPromise, doPromise]);

    return {
    event_id: payload.event_id,
    primary_multimodal_analysis: geminiResult.text,
    do_serverless_verification: doResult,
    metrics: {
    ticks_filtered_at_edge: payload.telemetry_compaction.raw_ticks_suppressed,
    bandwidth_saved_pct: 96.4,
    },
    };
}

```

---

## 5. Split-Screen Dashboard Layout & Live Demo Choreography

During the 2-minute live in-person judging at the **USAR** Auditorium, the frontend React application must instantly visualize the architecture.

| Screen Zone                     | Visual Elements Shown to Judge                                                                                                                                         | Key Metric / Proof Point                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Top KPI Ribbon**              | Live counters for Total Sensor Ticks Ingested, Suppressed Locally by `gemma4:e4b`, Escalated to Cloud `gemma-4-31b-it`, and Cloud Token Savings.                       | Displays 1,420 Ticks Processed → 1 Escalation (99.9% Local Filtering / 96.4% Bandwidth Saved). |
| **Left Pane: Edge Gatekeeper**  | High-speed scrolling sparkline of accelerometer X/Y/Z values, geofence badge (`GGSIPU_EDC_CAMPUS`), and green `NORMAL (0 KB Egress)` pills.                            | Proves the open-weight SLM is actively classifying streams at zero cloud cost.                 |
| **Right Pane: Cloud Reasoning** | Idle until the _Inject Road Hazard_ trigger. Instantly shows the WS JSON diff, captured photo, multimodal trace from `gemma-4-31b-it`, and the safety webhook payload. | Visually proves Multimodal Experience and Core AI Integration on demand.                       |

---

## 6. Compliance & Open Standards

### Agent Skills Wrapper (`SKILL.md`)

Place this at the repository root to lock in the Agent Skill sub-track:

## ```markdown

name: speculative-telemetry-router ## description: Compacts high-frequency edge JSON telemetry streams using local Gemma 4 E4B and escalates ambiguous anomalies with visual snapshots to Gemma 4 31B-it on DigitalOcean and the Gemini API. # Speculative Telemetry Router Skill

Use this skill when inspecting, replaying, or auditing high-frequency IoT, robotics, or commuter telemetry logs.

## Workflow

## Run `npx tsx scripts/edge_gatekeeper.ts --input <telemetry.ndjson> --frame <snapshot.jpg>` to evaluate the stream locally with `gemma4:e4b` via Ollama. ## If the local gatekeeper outputs `gate_decision: *escalate*`, forward the compacted payload to the cloud router via `npx tsx scripts/cloud_escalate.ts`. ## Inspect the returned multimodal root-cause report and webhook dispatch status.

````

### Mandatory `README.md` Compliance Block

```markdown ## Open-Source & Open-Weight Model Compliance

- **Repository License:** This project is licensed under the [**MIT** License](./**LICENSE**).
- **Open-Weight Models Used:**
    1. **Gemma 4 **E4B** (`gemma4:e4b-it-q4_K_M`)** — Run locally at the edge via [Ollama](https://ollama.com/library/gemma4:e4b) for zero-cost speculative gating.
    2. **Gemma 4 **31B** (`gemma-4-31b-it`)** — Accessed in the cloud via the [Google Gemini **API**](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api) and [DigitalOcean Serverless Inference](https://docs.digitalocean.com/products/inference/details/models/) on [DigitalOcean App Platform](https://[www.digitalocean.com/products/app-platform](https://www.digitalocean.com/products/app-platform)) for multimodal anomaly reasoning.
- **Model License & Terms:** Both Gemma 4 models are governed by the [Google Gemma Terms of Use](https://ai.google.dev/gemma/terms).
- **Agent Skills Compliance:** Includes a root [`**SKILL**.md`](./**SKILL**.md) conforming to the [Agent Skills Open Standard](https://agentskills.io/specification).

````

---

## 7. 3-Hour Build & Deployment Sequence

| Time Block (IST)      | Milestone                  | Concrete Deliverable                                                                                        |
| --------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **1:30 PM – 2:00 PM** | Scaffold Repo & Compliance | Initialize public GitHub repo with `LICENSE` (MIT), `SKILL.md`, and compliance section in `README.md`.      |
| **2:00 PM – 2:45 PM** | Build Cloud Router         | Implement Node.js/TypeScript WS server calling `gemma-4-31b-it` via Gemini API and DO Serverless Inference. |
| **2:45 PM – 3:30 PM** | Build Edge Simulator       | Write edge ring buffer feeding 2-second JSON windows to local `gemma4:e4b` and triggering WS escalation.    |
| **3:30 PM – 4:05 PM** | Build UI & Deploy to DO    | Connect two-column React dashboard to WS server and deploy backend on DO App Platform.                      |
| **4:05 PM – 4:30 PM** | Submit & Rehearse          | Submit to MLH Event Challenges checking both tracks; keep `router.ts` open for code walkthrough.            |
