---
name: speculative-telemetry-router
description: Compacts high-frequency edge JSON telemetry streams using local Gemma 4 E4B and escalates ambiguous anomalies with visual snapshots to Gemma 4 31B-it on DigitalOcean and the Gemini API.
version: 1.0.0
license: MIT
metadata:
  target_tracks:
    - "Best Open-Source AI Project (DigitalOcean / MLH)"
    - "Best Use of Gemma 4 (Google DeepMind)"
  edge_model: "gemma4:e4b-it-q4_K_M"
  cloud_model: "gemma-4-31b-it"
---

# Speculative Telemetry Router Skill

Use this skill when inspecting, replaying, or auditing high-frequency IoT, robotics, or commuter telemetry logs.

## Workflow

1. Run `npx tsx scripts/inspect_escalation.ts --input <telemetry.ndjson>` to evaluate the stream locally with `gemma4:e4b` via Ollama.
2. If the local gatekeeper outputs `gate_decision: "escalate"`, forward the compacted payload to the cloud router.
3. Inspect the returned multimodal root-cause report and webhook dispatch status.

## CLI Usage

```bash
# Audit telemetry log file and trigger speculative multimodal evaluation
npx tsx scripts/inspect_escalation.ts --input telemetry.ndjson

# Direct cloud escalation dispatch
npx tsx scripts/cloud_escalate.ts --event esc_9042_usar
```

## System Architecture

- **Tier 1 (Edge Node):** Pipes and Filters pattern. Sliding ring buffer (60s at 50Hz) feeds local SLM `gemma4:e4b`, suppressing nominal ticks ($0.00 cost, 0 KB egress).
- **Tier 2 (Cloud Hexagon):** Fastify WebSocket port triggers domain router executing parallel speculative inference on `gemma-4-31b-it` across Google Gemini API & DigitalOcean Serverless Inference isolated with `Promise.allSettled()`.
- **Tier 3 (Split-Screen UI):** Real-time dual-column dashboard with 60FPS HTML5 Canvas oscilloscope, live cost savings meter, and automated safety webhook dispatch.
