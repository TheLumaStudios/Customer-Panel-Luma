import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const glowRef = useRef(null)
  const dotRef = useRef(null)
  const mouse = useRef({ x: -999, y: -999 })
  const glow = useRef({ x: -999, y: -999 })
  const dot = useRef({ x: -999, y: -999 })
  const rafRef = useRef(null)
  const visible = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const onMove = (e) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      if (!visible.current) {
        glow.current.x = e.clientX
        glow.current.y = e.clientY
        dot.current.x = e.clientX
        dot.current.y = e.clientY
        visible.current = true
        if (glowRef.current) glowRef.current.style.opacity = '1'
        if (dotRef.current) dotRef.current.style.opacity = '1'
      }
    }

    const onLeave = () => {
      if (glowRef.current) glowRef.current.style.opacity = '0'
      if (dotRef.current) dotRef.current.style.opacity = '0'
      visible.current = false
    }

    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)

    const animate = () => {
      glow.current.x += (mouse.current.x - glow.current.x) * 0.06
      glow.current.y += (mouse.current.y - glow.current.y) * 0.06
      dot.current.x += (mouse.current.x - dot.current.x) * 0.22
      dot.current.y += (mouse.current.y - dot.current.y) * 0.22

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${glow.current.x - 200}px, ${glow.current.y - 200}px)`
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dot.current.x - 4}px, ${dot.current.y - 4}px)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div
        ref={glowRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{ width: 400, height: 400, opacity: 0, transition: 'opacity 0.3s' }}
      >
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,242,255,0.06) 0%, transparent 70%)' }} />
      </div>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ width: 8, height: 8, opacity: 0, transition: 'opacity 0.3s' }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{ background: 'rgba(0,242,255,0.7)', boxShadow: '0 0 8px rgba(0,242,255,0.9)' }}
        />
      </div>
    </>
  )
}
