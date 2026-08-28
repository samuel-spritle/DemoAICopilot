import { useRef, useReducer, useState, useEffect } from 'react'
import { TopNav, LeftWelcome, WorkspaceEmpty, Dashboard, ThinkingLog } from './widgets.jsx'
import Blob from './Blob.jsx'
import oncologyDemo from './demo.json'
import radiologyDemo from './demo.radiology.json'
import { createLiveSession } from './live.js'

// Pick which standalone script drives the app: ?demo=radiology, default oncology.
const DEMO_KEY = new URLSearchParams(location.search).get('demo') === 'radiology' ? 'radiology' : 'oncology'
const demo = DEMO_KEY === 'radiology' ? radiologyDemo : oncologyDemo

// Dynamic panel matching — the vocabulary is DERIVED from each panel's own content
// in demo.json (titles weigh most, body text least; rarer words score higher). Change
// the template tomorrow and matching adapts automatically — no keyword lists to edit.
// Optional: add a "match": ["synonym", ...] array to any card in demo.json to boost terms.
const STOP = new Set('the a an and or of to for me my your you i we show tell give bring let us it on in at is are was has have had do does did over last next what how when who whom this that these those with about please good morning hi hey ok okay now here there review status details view more can could would should also them then than'.split(' '))
const words = (s) => String(s).toLowerCase().match(/[a-z]{3,}/g) || []
const KEY_W = { match: 4, name: 3, title: 3, eyebrow: 3, badge: 3, caption: 2, tag: 2, dept: 2, test: 2 }

function buildIndex(cards) {
  const bySec = {}
  for (const c of cards) (bySec[c.section] ||= []).push(c)
  const maps = {}
  for (const [sec, cs] of Object.entries(bySec)) {
    const map = new Map()
    const add = (str, w) => words(str).forEach((t) => { if (!STOP.has(t)) map.set(t, Math.max(map.get(t) || 0, w)) })
    const walk = (node, w) => {
      if (node == null) return
      if (typeof node === 'string') add(node, w)
      else if (Array.isArray(node)) node.forEach((n) => walk(n, w))
      else if (typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, KEY_W[k] ?? w)
    }
    add(sec, 3)
    walk(cs, 1)
    maps[sec] = map
  }
  return maps
}
const INDEX = buildIndex([...demo.dashboard, { section: demo.banner.section, blocks: [demo.banner] }])
// Plain prefix matching misses irregular inflections (notify/notified — y becomes i;
// compare/comparison — silent e drops before -ison). Stripping known suffixes plus
// those two spelling rules catches them without hardcoding word families, so it
// benefits every future script, not just this one.
const SUFFIXES = ['ations', 'ation', 'ison', 'ing', 'ize', 'ed', 'es', 's']
function root(w) {
  for (const suf of SUFFIXES) {
    const rem = w.length - suf.length
    if (rem >= 4 && w.endsWith(suf)) { w = w.slice(0, rem); break }
  }
  if (w.length >= 4 && w.endsWith('i')) w = w.slice(0, -1) + 'y'   // notifi -> notify
  if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1)           // compare -> compar
  return w
}
const fuzzy = (a, b) => a === b
  || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)))
  || (a.length >= 5 && b.length >= 5 && root(a) === root(b))
function matchPanel(text) {
  const toks = [...new Set(words(text).filter((w) => !STOP.has(w)))]
  let best = null, bestScore = 0
  for (const [sec, map] of Object.entries(INDEX)) {
    let score = 0
    for (const tok of toks) { let hit = 0; for (const [term, w] of map) if (fuzzy(tok, term)) hit = Math.max(hit, w); score += hit }
    if (score > bestScore) { bestScore = score; best = sec }
  }
  return bestScore >= 2 ? best : null     // >=2 ignores lone body-word noise; a title hit is 3
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function App() {
  const [active, setActive] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [hot, setHot] = useState(null)       // section currently on screen
  const [working, setWorking] = useState(null)  // section whose thinking sequence is playing
  const [workLines, setWorkLines] = useState([])
  const [workDone, setWorkDone] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const live = useRef({ role: null, text: '' })
  const [, render] = useReducer((x) => x + 1, 0)
  const session = useRef(null)
  const bottom = useRef(null)
  const thinkTimer = useRef(null)
  const giveUpTimer = useRef(null)
  const runId = useRef(0)
  const turnStarted = useRef(false)   // has this user turn already armed the audio hold?
  const revealing = useRef(false)     // is a thinking sequence currently in flight?

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) })

  // Re-armed on every word the user speaks. If the model never answers — stays
  // silent per its own "unclear utterance" instruction, or the turn just stalls —
  // nothing would otherwise clear `thinking`, and the UI hangs forever. This bounds it.
  function armThinking() {
    clearTimeout(thinkTimer.current); setThinking(false)
    thinkTimer.current = setTimeout(() => setThinking(true), 650)
    clearTimeout(giveUpTimer.current)
    giveUpTimer.current = setTimeout(giveUp, 9000)
  }
  function stopThinking() { clearTimeout(thinkTimer.current); clearTimeout(giveUpTimer.current); setThinking(false) }
  function giveUp() {
    stopThinking(); flush()
    setHistory((h) => [...h, { role: 'ai', text: "Sorry, I didn't catch that clearly — could you try again?" }])
    session.current?.release()
    turnStarted.current = false
  }

  // Play the section's scripted "thinking" lines one at a time, THEN release the
  // agent's held voice/text — so it never talks over its own "thinking" animation.
  async function revealSection(sec) {
    if (sec === hot && !working) { session.current?.release(); return }   // same panel — just answer, no replay
    if (sec === working) return   // already mid-animation for this section
    const id = ++runId.current
    revealing.current = true
    setWorking(sec); setWorkLines([]); setWorkDone(false)
    for (const line of demo.thinking?.[sec] || []) {
      await sleep(550)
      if (runId.current !== id) return
      setWorkLines((l) => [...l, line])
    }
    await sleep(500)
    if (runId.current !== id) return
    setWorkDone(true)
    await sleep(450)
    if (runId.current !== id) return
    setHot(sec); setWorking(null)
    revealing.current = false
    session.current?.release()
  }

  function pushDelta(role, d) {
    const cur = live.current
    if (cur.role && cur.role !== role) { setHistory((h) => [...h, cur]); live.current = { role, text: d } }
    else { live.current = { role, text: (cur.role === role ? cur.text : '') + d } }
    render()
  }
  function flush() {
    const cur = live.current
    if (cur.role && cur.text) setHistory((h) => [...h, cur])
    live.current = { role: null, text: '' }
    render()
  }

  function start() {
    if (active) return
    setError('')
    const s = createLiveSession({
      onUserText: (d) => {
        if (!turnStarted.current) { turnStarted.current = true; session.current?.hold() }   // hold the reply until we know what to show
        pushDelta('user', d); armThinking()
        const m = matchPanel(live.current.text)   // from the spoken words, play the thinking sequence
        if (m) revealSection(m)
      },
      onAiText: (d) => { stopThinking(); pushDelta('ai', d) },
      onSpeaking: (v) => { if (v) stopThinking(); setSpeaking(v) },
      onInterrupt: () => stopThinking(),
      onTurnDone: () => {
        stopThinking(); flush(); turnStarted.current = false
        if (!revealing.current) session.current?.release()   // nothing matched — don't hold the reply forever
      },
      onError: (msg) => setError(msg),
    }, { demoKey: DEMO_KEY })
    session.current = s
    s.start().catch((e) => setError(String(e)))
    setActive(true)
  }
  function stop() {
    session.current?.stop(); session.current = null
    flush(); stopThinking(); setActive(false); setSpeaking(false)
    turnStarted.current = false; revealing.current = false
  }
  const toggle = () => (active ? stop() : start())

  const cur = live.current
  const engaged = history.length > 0 || !!cur.role
  const micState = !active ? 'idle' : thinking ? 'thinking' : speaking ? 'speaking' : 'listening'

  return (
    <div className="shell">
      <TopNav product={demo.product} doctor={demo.doctor} nav={demo.nav} />
      <div className="body">
        <aside className="rail">
          <div className="rail__head"><span className="rail__spark">✦</span> {demo.product.title}<i className="rail__more">⋯</i></div>

          <div className="rail__scroll">
            {!engaged && <LeftWelcome welcome={demo.welcome} onPick={start} />}
            {engaged && (
              <div className="chat">
                {history.map((m, i) => <Msg key={i} role={m.role} text={m.text} />)}
                {cur.role && <Msg role={cur.role} text={cur.text} live />}
                {thinking && <div className="think"><span /><span /><span /> Thinking</div>}
                {error && <div className="msg msg--err">{error}</div>}
                <div ref={bottom} />
              </div>
            )}
          </div>

          <div className="composer">
            {active && (
              <div className="composer__orb">
                <Blob state={micState} onTap={toggle} />
                <small>
                  {thinking && 'Thinking…'}
                  {!thinking && speaking && 'Speaking…'}
                  {!thinking && !speaking && 'Listening…'}
                </small>
              </div>
            )}
            <div className="composer__bar" onClick={() => !active && start()}>
              <input placeholder="Tap the mic and speak…" readOnly />
              <button className={`composer__mic ${active ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); toggle() }} aria-label="Talk">
                {active ? '■' : '🎤'}
              </button>
            </div>
          </div>
        </aside>

        <main className="work">
          {working
            ? <ThinkingLog lines={workLines} done={workDone} />
            : hot
              ? <Dashboard key={hot}
                  banner={hot === demo.banner.section ? demo.banner : null}
                  cards={demo.dashboard.filter((c) => c.section === hot)} />
              : <WorkspaceEmpty workspace={demo.welcome.workspace} />}
        </main>
      </div>
    </div>
  )
}

function Msg({ role, text, live }) {
  return (
    <div className={`msg msg--${role} ${live ? 'msg--live' : ''}`}>
      {role === 'ai' && <span className="msg__spark">✦</span>}
      <div className="msg__bubble">{text}</div>
    </div>
  )
}
