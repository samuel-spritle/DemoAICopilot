// Generic, domain-agnostic UI kit. All content lives in demo.json — swap it for any
// domain and this code is unchanged. To add a block type, write a component and
// register it in BLOCKS at the bottom.

import logo from './assets/Spritle.png'

/* ---------------- App shell ---------------- */

export function TopNav({ product, doctor, nav }) {
  return (
    <header className="nav">
      <div className="nav__brand">
        <img className="nav__logo" src={logo} alt="Spritle" />
        <div className="nav__product">
          <div className="nav__ptitle">{product.title} <em>{product.tag}</em></div>
          <div className="nav__status"><i /> {product.status}</div>
        </div>
      </div>
      <nav className="nav__tabs">
        {nav.map((t, i) => <button key={i} className={i === 0 ? 'on' : ''}>{t}</button>)}
      </nav>
      <div className="nav__user">
        <span className="nav__avatar">{doctor.avatar}</span>
        <div><b>{doctor.name}</b><small>{doctor.role}</small></div>
      </div>
    </header>
  )
}

export function LeftWelcome({ welcome, onPick }) {
  return (
    <div className="lw">
      <div className="lw__spark">✦</div>
      <h2>{welcome.greeting}</h2>
      <p className="lw__sub">{welcome.sub}</p>
      <p className="lw__hint">{welcome.hint}</p>
      <div className="lw__chips">
        {welcome.suggestions.map((s, i) => (
          <button key={i} className="lw__chip" onClick={() => onPick?.(s.text)}>
            <span>{s.icon}</span>{s.text}<i>›</i>
          </button>
        ))}
      </div>
    </div>
  )
}

export function WorkspaceEmpty({ workspace }) {
  return (
    <div className="wse">
      <div className="wse__art" aria-hidden>◇ ◈ ◇</div>
      <h1>{workspace.title}</h1>
      <p>{workspace.sub}</p>
      <div className="wse__sources">
        {workspace.sources.map((s, i) => <span key={i} className="wse__src">{s}</span>)}
      </div>
    </div>
  )
}

// Sequential diagnostic log shown while the agent "works" on an answer —
// lines arrive one at a time (App.jsx paces them from demo.json's thinking[section]),
// then a Done checkmark right before the real panel replaces this view.
export function ThinkingLog({ lines, done }) {
  return (
    <div className="tlog">
      <div className="tlog__spin" aria-hidden><span /><span /><span /></div>
      <ul className="tlog__lines">
        {lines.map((l, i) => <li key={i} style={{ animationDelay: `${i * 40}ms` }}>{l}</li>)}
        {done && <li className="tlog__done">Done.</li>}
      </ul>
    </div>
  )
}

/* ---------------- Dashboard + cards ---------------- */

// Renders only the cards for the ONE section the question matched — full-size,
// filling the space (a single card goes full width, two split the row, etc via
// CSS grid auto-fit). No dimmed siblings, no leftover empty space.
export function Dashboard({ banner, cards }) {
  const solo = cards.length === 1
  return (
    <div className="dash dash--big">
      {banner && <Banner {...banner} />}
      <div className="dash__grid">
        {cards.map((c, ci) => (
          <Card key={ci} className={solo || c.wide ? 'card--wide' : ''} eyebrow={c.eyebrow} title={c.title} badge={c.badge} link={c.link}>
            {(c.blocks || []).map((b, i) => {
              const C = BLOCKS[b && b.type] || null
              return C ? <C key={i} {...b} /> : null
            })}
          </Card>
        ))}
      </div>
    </div>
  )
}

function Card({ eyebrow, title, badge, link, className = '', children }) {
  return (
    <section className={`card ${className}`}>
      {(eyebrow || title || badge) && (
        <header className="card__head">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h3>{title}</h3>}
          </div>
          {badge && <span className="card__badge">{badge}</span>}
          {link && <span className="card__link">{link} ›</span>}
        </header>
      )}
      {children}
    </section>
  )
}

function Banner({ avatar, name, id, tags, subtitle, owner, facts }) {
  return (
    <section className="banner">
      <div className="banner__id">
        <span className="banner__avatar">{avatar}</span>
        <div>
          <h2>{name}</h2>
          <div className="banner__meta">
            {id && <span className="banner__code">ID {id}</span>}
            {tags?.map((t, i) => <span key={i}>{t}</span>)}
          </div>
          {subtitle && <div className="banner__dx">{subtitle}</div>}
          {owner && <div className="banner__owner">Owner · {owner}</div>}
        </div>
      </div>
      <div className="banner__facts">
        {facts?.map((f, i) => (
          <div key={i} className="banner__fact"><small>{f.label}</small><b>{f.value}</b></div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Blocks ---------------- */

function Table({ columns, rows, highlight, badges }) {
  return (
    <table className="grid">
      {columns && <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>}
      <tbody>
        {rows.map((r, i) => {
          const on = highlight && r[r.length - 1] === highlight
          return (
            <tr key={i} className={on ? 'row-hi' : ''} style={{ animationDelay: `${i * 45}ms` }}>
              {r.map((cell, j) => {
                const last = j === r.length - 1
                if (last && badges) return <td key={j}><span className="badge">✓ {cell}</span></td>
                if (last && highlight) return <td key={j}><span className={`pill ${on ? 'pill-hi' : ''}`}>{on && <i className="dot" />}{cell}</span></td>
                return <td key={j}>{cell}</td>
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Timeline({ title, nodes }) {
  const activeIdx = Math.max(0, nodes.findIndex((n) => n.active))
  const pct = (activeIdx / (nodes.length - 1)) * 100
  return (
    <>
      {title && <h4 className="sub">{title}</h4>}
      <div className="timeline">
        <div className="timeline__track"><span style={{ width: `${pct}%` }} /></div>
        {nodes.map((n, i) => (
          <div key={i} className={`tl-node ${n.active ? 'tl-now' : ''} ${i <= activeIdx ? 'tl-done' : ''}`} style={{ animationDelay: `${i * 80}ms` }}>
            <span className="tl-dot" /><b>{n.label}</b><small>{n.caption}</small>
          </div>
        ))}
      </div>
    </>
  )
}

function Stats({ title, items }) {
  return (
    <>
      {title && <h4 className="sub">{title}</h4>}
      <div className="kpis">
        {items.map((s, i) => (
          <div key={i} className={`kpi kpi--${s.trend || 'flat'}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="kpi__label">{s.label}</span>
            <span className="kpi__value">{s.value}</span>
            {s.note && <span className="kpi__note">{s.note}</span>}
          </div>
        ))}
      </div>
    </>
  )
}

function Compare({ left, right, caption }) {
  return (
    <>
      <div className="cmp">
        <figure><span className="cmp__label">{left.label}</span></figure>
        <figure className="cmp--b">
          <span className="cmp__label">{right.label}</span>
          <span className="cmp__ring" />
          {right.tag && <span className="cmp__tag">{right.tag}</span>}
        </figure>
      </div>
      {caption && <p className="cmp__cap">{caption}</p>}
    </>
  )
}

function Chart({ points, unit }) {
  const W = 520, H = 200, padX = 30, padY = 22
  const vals = points.map((p) => p.value)
  const max = Math.max(...vals) * 1.06, min = Math.min(...vals) * 0.9
  const x = (i) => padX + (i * (W - 2 * padX)) / (points.length - 1)
  const y = (v) => padY + ((max - v) / (max - min || 1)) * (H - 2 * padY)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')
  const area = `${line} L${x(points.length - 1)},${H - padY} L${x(0)},${H - padY} Z`
  const grid = [0, 0.5, 1].map((t) => padY + t * (H - 2 * padY))
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--pos)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--pos)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((gy, i) => <line key={i} className="chart-grid" x1={padX} x2={W - padX} y1={gy} y2={gy} />)}
      <path className="chart-area" d={area} fill="url(#ag)" />
      <path className="chart-line" d={line} />
      {points.map((p, i) => (
        <g key={i}>
          <circle className="chart-dot" cx={x(i)} cy={y(p.value)} r="4" style={{ animationDelay: `${i * 100}ms` }} />
          <text className="chart-x" x={x(i)} y={H - 5}>{p.label}</text>
          <text className="chart-v" x={x(i)} y={y(p.value) - 10}>{p.value}{unit ? '' : ''}</text>
        </g>
      ))}
    </svg>
  )
}

const ARROW = { down: '↓', up: '↑', flat: '→' }
function Trends({ columns, rows }) {
  return (
    <table className="grid trends">
      <thead><tr>{columns.map((c, i) => <th key={i} className={i > 0 ? 'r' : ''}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ animationDelay: `${i * 45}ms` }}>
            <td>{r.test}</td><td className="r">{r.prev}</td><td className="r">{r.curr}</td>
            <td className="r"><span className={`arrow arrow--${r.trend}`}>{ARROW[r.trend]}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function KeyValue({ items }) {
  return (
    <ul className="kv">
      {items.map((it, i) => (
        <li key={i} style={{ animationDelay: `${i * 60}ms` }}><span>{it.label}</span><b>{it.value}</b></li>
      ))}
    </ul>
  )
}

function Gauge({ percent, label, note }) {
  const r = 42, C = 2 * Math.PI * r
  return (
    <div className="gauge">
      <svg viewBox="0 0 110 110">
        <circle className="gauge__bg" cx="55" cy="55" r={r} />
        <circle className="gauge__fg" cx="55" cy="55" r={r} transform="rotate(-90 55 55)"
          strokeDasharray={C} strokeDashoffset={C * (1 - percent / 100)} />
      </svg>
      <div className="gauge__mid"><b>{percent}%</b></div>
      <div className="gauge__cap"><small>{label}</small><span>{note}</span></div>
    </div>
  )
}

function Checklist({ items, gauge, meter }) {
  return (
    <div className={gauge ? 'reclist reclist--split' : 'reclist'}>
      <ul className="recs">
        {items.map((r, i) => (
          <li key={i} style={{ animationDelay: `${i * 80}ms` }}><span className="recs__dot" />{r}</li>
        ))}
      </ul>
      {gauge && <Gauge {...gauge} />}
      {meter && (
        <div className="confidence">
          <div className="confidence__row"><small>{meter.label}</small><b>{meter.percent}%</b></div>
          <div className="conf-bar"><span style={{ width: `${meter.percent}%` }} /></div>
        </div>
      )}
    </div>
  )
}

function Flow({ items }) {
  return (
    <ul className="flow">
      {items.map((f, i) => (
        <li key={i} style={{ animationDelay: `${i * 90}ms` }}>
          <span className="flow-check">✓</span>
          <span className="flow-dept">{f.dept}</span>
          <span className="flow-status">{f.status}</span>
        </li>
      ))}
    </ul>
  )
}

function Text({ title, body }) {
  return <>{title && <h4 className="sub">{title}</h4>}<p className="block-text">{body}</p></>
}

// Structured multi-section document — clinical/legal reports, meeting minutes,
// anything with named sections and prose bodies.
function Report({ sections }) {
  return (
    <div className="report">
      {sections.map((s, i) => (
        <div key={i} className="report__section" style={{ animationDelay: `${i * 70}ms` }}>
          <h5>{s.heading}</h5>
          <p>{s.body}</p>
        </div>
      ))}
    </div>
  )
}

const BLOCKS = { table: Table, timeline: Timeline, stats: Stats, compare: Compare, chart: Chart, trends: Trends, keyvalue: KeyValue, checklist: Checklist, flow: Flow, report: Report, text: Text }
