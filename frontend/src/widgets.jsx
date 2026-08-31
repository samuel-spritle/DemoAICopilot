// Generic, domain-agnostic UI kit. All content lives in demo.json — swap it for any
// domain and this code is unchanged. To add a block type, write a component and
// register it in BLOCKS at the bottom.

import { useState, useEffect, useRef, useCallback } from 'react'
import logo from './assets/Spritle.png'

/* ---------------- App shell ---------------- */

export function TopNav({ product, doctor, nav, railOpen, onToggleRail }) {
  return (
    <header className="nav app-topbar">
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
        {onToggleRail && (
          <button className="nav__rail-toggle" onClick={onToggleRail} aria-label="Toggle sidebar">
            {railOpen ? '◀' : '▶'}
          </button>
        )}
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

/* ---------------- Inspector (Phase 3) ---------------- */

export function Inspector({ selected }) {
  if (!selected) return (
    <aside className="app-inspector">
      <div className="insp-empty">
        <span className="eyebrow">Select an object</span>
        <p>Click a row or card to view details</p>
      </div>
    </aside>
  )

  return (
    <aside className="app-inspector">
      <div className="insp-head">
        <span className="eyebrow">{selected.section || 'Object'}</span>
        <h2>{selected.title}</h2>
      </div>

      {selected.fields && (
        <div className="insp-fields">
          {selected.fields.map((f, i) => (
            <div key={i} className="field">
              <span className="f-key">{f.label}</span>
              <span className={`f-val ${f.mono ? 'mono' : ''}`}>{f.value}</span>
            </div>
          ))}
        </div>
      )}

      {selected.miniChart && (
        <div className="insp-section">
          <span className="insp-label">Trend · 30d</span>
          <div className="insp-chart">
            <svg viewBox="0 0 280 80">
              <line x1="0" y1="70" x2="280" y2="70" stroke="currentColor" strokeWidth="1" opacity=".2" />
              <polyline points={selected.miniChart} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity=".5" />
              <circle cx="280" cy={selected.miniChartY || 22} r="2.5" fill="currentColor" />
            </svg>
          </div>
        </div>
      )}

      {selected.activity && (
        <div className="insp-section">
          <span className="insp-label">Activity</span>
          <ul className="feed">
            {selected.activity.map((a, i) => (
              <li key={i}>
                <span className="feed-time">{a.time}</span>
                <span className="feed-body"><b>{a.label}</b> {a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

/* ---------------- Command Palette (Phase 3) ---------------- */

export function CommandPalette({ open, onClose, onNavigate, sections }) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { inputRef.current?.focus(); setQuery(''); setActiveIdx(0) }
  }, [open])

  const actions = [
    { id: '__new_appt', label: 'New appointment', glyph: '+' },
    { id: '__run_wf', label: 'Run workflow', glyph: '⎇' },
  ]

  const filtered = sections.filter(s =>
    s.label.toLowerCase().includes(query.toLowerCase())
  )

  const allItems = [...actions, ...filtered]

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allItems.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && allItems[activeIdx]) {
      const item = allItems[activeIdx]
      if (item.id && !item.id.startsWith('__')) { onNavigate(item.id); onClose() }
      else { onClose() }
    }
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null
  return (
    <div className="cmdk-scrim" onClick={onClose}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette" onClick={e => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <span className="kbd">⌘K</span>
          <input ref={inputRef} className="cmdk-input"
            placeholder="Search objects, actions, people…"
            value={query} onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={handleKeyDown} />
        </div>
        <div className="cmdk-group">
          <div className="cmdk-group-label">Actions</div>
          {actions.map((a, i) => (
            <div key={a.id} className={`cmdk-item ${i === activeIdx ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)} onClick={onClose}>
              <span className="glyph">{a.glyph}</span> {a.label}
            </div>
          ))}
        </div>
        <div className="cmdk-group">
          <div className="cmdk-group-label">Sections</div>
          {filtered.map((s, i) => {
            const idx = actions.length + i
            return (
              <div key={s.id} className={`cmdk-item ${idx === activeIdx ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => { onNavigate(s.id); onClose() }}>
                <span className="glyph">○</span> {s.label}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Dashboard + cards ---------------- */

const SPLIT = {
  table:     { prop: 'rows',     title: (row) => row[1] || row[0] },
  stats:     { prop: 'items',    title: (item) => item.label },
  flow:      { prop: 'items',    title: (item) => item.dept },
  checklist: { prop: 'items',    title: (text) => text },
  report:    { prop: 'sections', title: (sec) => sec.heading },
  trends:    { prop: 'rows',     title: (row) => row.test },
  keyvalue:  { prop: 'items',    title: (item) => item.label },
}

function expandCards(cards) {
  return cards.flatMap(card => {
    const expanded = []
    for (const block of (card.blocks || [])) {
      const split = SPLIT[block.type]
      if (split) {
        const items = block[split.prop] || []
        items.forEach((item, i) => {
          expanded.push({
            ...card,
            id: `${card.id}-${i}`,
            title: split.title(item),
            blocks: [{ ...block, [split.prop]: [item] }]
          })
        })
        if (block.type === 'checklist' && block.gauge) {
          expanded.push({
            ...card,
            id: `${card.id}-gauge`,
            title: block.gauge.label,
            blocks: [{ type: 'checklist', items: [], gauge: block.gauge }]
          })
        }
      } else {
        expanded.push({ ...card })
        break
      }
    }
    return expanded.length ? expanded : [card]
  })
}

function useColumnCount() {
  const [cols, setCols] = useState(3)
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      setCols(w < 640 ? 1 : w < 900 ? 2 : 3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return cols
}

export function Dashboard({ banner, cards, onRowClick, selectedIdx }) {
  const expanded = expandCards(cards)
  const cols = useColumnCount()

  // Separate table blocks (render as DataTable) from other blocks (render as cards)
  const tableCards = expanded.filter(c => c.blocks?.[0]?.type === 'table')
  const otherCards = expanded.filter(c => c.blocks?.[0]?.type !== 'table')

  return (
    <div className="dash">
      {banner && <Banner {...banner} />}
      {tableCards.map((c, i) => {
        const block = c.blocks[0]
        return (
          <DataTable key={`${c.id}-${i}`} columns={block.columns} rows={block.rows}
            highlight={block.highlight} title={c.title} section={c.section}
            onRowClick={onRowClick} selectedIdx={selectedIdx} />
        )
      })}
      <div className="dash__cols" style={{ columnCount: cols }}>
        {otherCards.map((c, ci) => (
          <div key={ci} className="dash__col-item">
            <Card eyebrow={c.eyebrow} title={c.title} badge={c.badge} link={c.link}
              onClick={() => onRowClick?.({ title: c.title, section: c.section, id: c.id })}>
              {(c.blocks || []).map((b, i) => {
                const C = BLOCKS[b && b.type] || null
                return C ? <C key={i} {...b} /> : null
              })}
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- DataTable (Phase 2) ---------------- */

function DataTable({ columns, rows, highlight, title, section, onRowClick, selectedIdx }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const sorted = sortCol !== null
    ? [...rows].sort((a, b) => {
        const cmp = String(a[sortCol]).localeCompare(String(b[sortCol]))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : rows

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  return (
    <div className="dtable-section">
      <div className="app-head">
        <div className="head-row">
          <div className="head-title">
            <span className="eyebrow">{section}</span>
            <h1>{title}</h1>
          </div>
          <div className="toolbar">
            <input className="app-field" placeholder={`Filter ${rows.length} rows…`} />
          </div>
        </div>
      </div>
      <div className="dtable-wrap">
        <table className="dtable" role="grid" aria-label={title}>
          <thead>
            <tr role="row">
              {columns.map((c, i) => (
                <th key={i} role="columnheader"
                  className={`sortable ${sortCol === i ? 'is-sorted' : ''}`}
                  aria-sort={sortCol === i ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onClick={() => toggleSort(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort(i) } }}>
                  {c} <span className="caret">{sortCol === i ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const on = highlight && r[r.length - 1] === highlight
              return (
                <tr key={i} role="row" tabIndex={0}
                  className={`dtable-row ${on ? 'row-hi' : ''} ${selectedIdx === i ? 'is-selected' : ''}`}
                  onClick={() => onRowClick?.({
                    title: r[1], section, fields: columns.map((c, j) => ({ label: c, value: r[j], mono: j === 0 })),
                    activity: [{ time: r[0], label: r[1], text: r[2] }],
                    miniChart: '0,60 56,52 112,56 168,36 224,28 280,20', miniChartY: 20
                  })}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.click() }}
                  style={{ animationDelay: `${i * 30}ms` }}>
                  {r.map((cell, j) => {
                    const last = j === r.length - 1
                    if (last) {
                      const statusClass = on ? 'is-success' : 'is-neutral'
                      return <td key={j}><span className={`status-dot ${statusClass}`} />{cell}</td>
                    }
                    if (j === 0) return <td key={j} className="mono">{cell}</td>
                    return <td key={j}>{cell}</td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="dtable-foot">
          <span>{rows.length} rows</span>
        </div>
      </div>
    </div>
  )
}

function Card({ eyebrow, title, badge, link, children, onClick }) {
  return (
    <section className="card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
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
