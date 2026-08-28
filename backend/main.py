"""
Full FastAPI app for the live AI copilot template.

Gemini 3.1 Flash Live handles the conversation: it hears the user (mic audio in),
reasons over the context (system instruction from the active demo script), and
speaks back in native audio. Which dashboard panel to show is decided client-side
(App.jsx matches the live transcript against the script) — no tool-calling here.
The audio-output + function-calling combo on this preview model tends to make it
narrate the call as words instead of invoking it ("call:show_panel{...}" leaking
into speech), so panel selection deliberately stays out of the model's hands.

Multiple standalone demo scripts live side by side (frontend/src/demo*.json).
The browser picks one via ?demo=<key> on both the page and the /ws connection;
each gets its own systemInstruction + voice. Default is "oncology".

  Browser -> /ws?demo=<key> : raw PCM16 @16kHz binary frames (mic)
  /ws -> Browser             : binary = PCM16 @24kHz audio to play
                                text   = {"type": "user_text"|"ai_text", "delta": ...}
                                         {"type": "interrupt"} | {"type": "turn_done"}

Serves the built frontend (frontend/dist) at / so it's a single FastAPI app.
"""
import asyncio
import json
import os

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types

MODEL = os.environ.get("LIVE_MODEL", "gemini-3.1-flash-live-preview")
HERE = os.path.dirname(__file__)
DIST = os.path.join(HERE, "..", "frontend", "dist")
SRC = os.path.join(HERE, "..", "frontend", "src")

DEMO_FILES = {"oncology": "demo.json", "radiology": "demo.radiology.json"}
DEMOS = {}
for _key, _fname in DEMO_FILES.items():
    with open(os.path.join(SRC, _fname), encoding="utf-8") as f:
        DEMOS[_key] = json.load(f)

client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"],
    http_options={"api_version": "v1beta"},
)


def live_config_for(demo):
    return types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        system_instruction=types.Content(parts=[types.Part(text=demo["systemInstruction"])]),
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=demo.get("voice", "Charon"))
            )
        ),
    )


app = FastAPI()


@app.websocket("/ws")
async def ws(browser: WebSocket):
    await browser.accept()
    demo = DEMOS.get(browser.query_params.get("demo"), DEMOS["oncology"])
    try:
        async with client.aio.live.connect(model=MODEL, config=live_config_for(demo)) as session:

            async def mic_to_gemini():
                while True:
                    chunk = await browser.receive_bytes()
                    await session.send_realtime_input(
                        audio=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000")
                    )

            async def gemini_to_browser():
                # receive() completes at each turn end — re-enter it to keep the
                # conversation going across turns, otherwise VAD only works once.
                while True:
                    async for response in session.receive():
                        if response.data:  # native audio out
                            await browser.send_bytes(response.data)

                        sc = response.server_content
                        if sc:
                            if sc.input_transcription and sc.input_transcription.text:
                                await browser.send_text(json.dumps(
                                    {"type": "user_text", "delta": sc.input_transcription.text}))
                            if sc.output_transcription and sc.output_transcription.text:
                                await browser.send_text(json.dumps(
                                    {"type": "ai_text", "delta": sc.output_transcription.text}))
                            if sc.interrupted:
                                await browser.send_text(json.dumps({"type": "interrupt"}))
                            if sc.turn_complete:
                                await browser.send_text(json.dumps({"type": "turn_done"}))

            await asyncio.gather(mic_to_gemini(), gemini_to_browser())

    except WebSocketDisconnect:
        pass
    except Exception as e:  # noqa: BLE001 — surface, don't crash the socket
        try:
            await browser.send_text(json.dumps({"type": "error", "text": str(e)}))
        except Exception:
            pass


# Serve the built frontend last so /ws wins. Run `npm run build` in frontend/ first.
if os.path.isdir(DIST):
    app.mount("/", StaticFiles(directory=DIST, html=True), name="app")
