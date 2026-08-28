// Live session with the backend: streams mic audio up, plays Gemini's native audio
// back, and forwards transcript / render / interrupt events.
//   h.onUserText(delta) h.onAiText(delta)
//   h.onInterrupt() h.onTurnDone() h.onSpeaking(bool) h.onError(msg)
//
// hold()/release(): while held, incoming audio + ai_text + turn_done are buffered
// instead of dispatched — used to keep the model's voice from playing over the
// "thinking" animation. user_text is never held (it's what drives the animation).
export function createLiveSession(h, { demoKey } = {}) {
  let ws, upCtx, node, stream
  let playCtx, playHead = 0
  const sources = new Set()
  let held = true
  let queue = []   // buffered {kind:'audio', data} | {kind:'msg', m}, in arrival order

  function playPcm(int16) {
    const f32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 0x8000
    const buf = playCtx.createBuffer(1, f32.length, 24000)
    buf.getChannelData(0).set(f32)
    const src = playCtx.createBufferSource()
    src.buffer = buf
    src.connect(playCtx.destination)
    const t = Math.max(playCtx.currentTime, playHead)
    src.start(t)
    playHead = t + buf.duration
    sources.add(src)
    h.onSpeaking?.(true)
    src.onended = () => {
      sources.delete(src)
      if (!sources.size) h.onSpeaking?.(false)
    }
  }

  function flushPlayback() {
    sources.forEach((s) => { try { s.stop() } catch {} })
    sources.clear()
    playHead = 0
    h.onSpeaking?.(false)
  }

  function dispatch(m) {
    if (m.type === 'ai_text') h.onAiText?.(m.delta)
    else if (m.type === 'interrupt') { flushPlayback(); h.onInterrupt?.() }
    else if (m.type === 'turn_done') h.onTurnDone?.()
    else if (m.type === 'error') h.onError?.(m.text)
  }

  function hold() { held = true }
  function release() {
    held = false
    const q = queue; queue = []
    for (const item of q) item.kind === 'audio' ? playPcm(item.data) : dispatch(item.m)
  }

  async function start() {
    playCtx = new AudioContext({ sampleRate: 24000 })

    ws = new WebSocket(`ws://${location.host}/ws${demoKey ? `?demo=${demoKey}` : ''}`)
    ws.binaryType = 'arraybuffer'
    ws.onmessage = (e) => {
      if (typeof e.data !== 'string') {
        const chunk = new Int16Array(e.data)
        held ? queue.push({ kind: 'audio', data: chunk }) : playPcm(chunk)
        return
      }
      const m = JSON.parse(e.data)
      if (m.type === 'user_text') { h.onUserText?.(m.delta); return }   // drives the animation — never held
      held ? queue.push({ kind: 'msg', m }) : dispatch(m)
    }

    // echoCancellation so the mic doesn't pick up the agent's own voice and reply to it.
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    upCtx = new AudioContext({ sampleRate: 16000 })
    const srcNode = upCtx.createMediaStreamSource(stream)
    // ponytail: ScriptProcessor is deprecated but zero-setup and fine for a demo.
    node = upCtx.createScriptProcessor(4096, 1, 1)
    node.onaudioprocess = (ev) => {
      if (ws.readyState !== 1) return
      const f32 = ev.inputBuffer.getChannelData(0)
      const pcm = new Int16Array(f32.length)
      for (let i = 0; i < f32.length; i++) {
        const s = Math.max(-1, Math.min(1, f32[i]))
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      ws.send(pcm.buffer)
    }
    srcNode.connect(node)
    node.connect(upCtx.destination)
  }

  function stop() {
    flushPlayback()
    queue = []
    node?.disconnect()
    upCtx?.close()
    playCtx?.close()
    stream?.getTracks().forEach((t) => t.stop())
    ws?.close()
  }

  return { start, stop, hold, release }
}
