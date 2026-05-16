import { useEffect, useRef } from 'react'

export default function MagneticButton({ children, strength = 0.35, radius = 80 }) {
  const wrapRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const el = wrapRef.current
    if (!el) return

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < radius) {
        const pull = (1 - dist / radius) * strength
        el.style.transform = `translate(${dx * pull}px, ${dy * pull}px)`
        el.style.transition = 'transform 0.3s cubic-bezier(0.23,1,0.32,1)'
      } else {
        el.style.transform = 'translate(0,0)'
        el.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)'
      }
    }

    const onLeave = () => {
      el.style.transform = 'translate(0,0)'
      el.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)'
    }

    document.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [strength, radius])

  return (
    <div ref={wrapRef} style={{ display: 'inline-block' }}>
      {children}
    </div>
  )
}
