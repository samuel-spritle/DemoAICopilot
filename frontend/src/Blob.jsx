// Siri-style glowing orb. `state` drives the animation intensity.
export default function Blob({ state, onTap }) {
  return (
    <button className={`blob blob--${state}`} onClick={onTap} aria-label="Tap to speak">
      <span className="blob__core" />
      <span className="blob__ring" />
      <span className="blob__ring blob__ring--2" />
    </button>
  )
}
