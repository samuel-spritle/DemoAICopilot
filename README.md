# DemoAICopilot

Live voice clinical copilot. You ask questions out loud; **Gemini 3.1 Flash Live**
handles everything — hears you, reasons over the patient context, and **speaks back in
its own native voice**. The right-hand dashboard reacts live: the browser matches the
running transcript against the active script's content and lights up the relevant panel
— no tool-calling, purely client-side.

One **FastAPI** app serves both the UI and the Gemini Live WebSocket on port 8000.

- **Everything**: Gemini 3.1 Flash Live (`gemini-3.1-flash-live-preview`) — STT, reasoning, native audio out
- **UI**: React + Vite (built and served by FastAPI)

Requires **Chrome or Edge** (getUserMedia + Web Audio).

## Run

```bash
cp backend/.env.example backend/.env     # add your GEMINI_API_KEY
./run.sh                                 # builds UI, installs deps, serves on :8000
```

Open **http://localhost:8000**, tap the orb, and talk. Tap again to end.

Two standalone demo scripts ship side by side — oncology (default) and radiology.
Switch with the `demo` query param: **http://localhost:8000/?demo=radiology**

## How it works

```
Browser mic ──PCM16 16kHz──▶ FastAPI /ws?demo=<key> ──▶ Gemini 3.1 Flash Live
Browser  ◀──native audio 24kHz + transcripts──────────────────┘
```

- Barge-in supported: talk over the agent and playback stops (Live sends `interrupted`).
- Panel selection is client-side: [frontend/src/App.jsx](frontend/src/App.jsx) builds a
  keyword index from each panel's own content and matches it against the live transcript
  as you speak — no hardcoded keyword lists, no model tool calls.

## Change the demo — one file per script

Each demo lives entirely in its own JSON file — [frontend/src/demo.json](frontend/src/demo.json)
(oncology) and [frontend/src/demo.radiology.json](frontend/src/demo.radiology.json) (radiology):

- `systemInstruction` — the agent's persona **and** all the facts it may state. This is
  the "guide": rewrite it for any domain and the agent answers freely, grounded in it.
- `voice` — a Gemini prebuilt voice name (e.g. `Charon`, `Puck`, `Aoede`).
- `dashboard` — a library of panels the agent's answers can surface, grouped by `section`.
  Each panel is a list of data-driven blocks (defined in [frontend/src/widgets.jsx](frontend/src/widgets.jsx)):
  `table` `timeline` `stats` `chart` `compare` `checklist` `flow` `text` and more.
  Add a `"match": ["synonym", ...]` array to any card to boost specific terms.

To add a new demo: drop a new `demo.<key>.json`, wire it into `DEMO_FILES` in
[backend/main.py](backend/main.py) and the import/switch in
[frontend/src/App.jsx](frontend/src/App.jsx).

Rebuild after editing (`./run.sh` does this) so FastAPI serves the fresh bundle.

## Notes

- The conversation is **not** scripted — the doctor asks anything; answers come from the
  model grounded in `systemInstruction`. No canned flow.
- Override the model with `LIVE_MODEL` in `backend/.env` if needed.
