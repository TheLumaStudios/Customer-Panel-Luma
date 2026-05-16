import { useRef, useEffect } from 'react'

export default function TiltCard({ children, className = '', maxTilt = 10 }) {
  const cardRef = useRef(null)
  const shineRef = useRef(null)
  const current = useRef({ rx: 0, ry: 0 })
  const target = useRef({ rx: 0, ry: 0 })
  const rafRef = useRef(null)
  const isMobile = useRef(
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  )

  useEffect(() => {
    if (isMobile.current) return
    const card = cardRef.current
    if (!card) return

    const animate = () => {
      current.current.rx += (target.current.rx - current.current.rx) * 0.1
      current.current.ry += (target.current.ry - current.current.ry) * 0.1
      card.style.transform = `perspective(900px) rotateX(${current.current.rx}deg) rotateY(${current.current.ry}deg)`
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    const onMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) / (rect.width / 2)
      const dy = (e.clientY - cy) / (rect.height / 2)
      target.current.rx = -dy * maxTilt
      target.current.ry = dx * maxTilt

      if (shineRef.current) {
        const px = ((e.clientX - rect.left) / rect.width) * 100
        const py = ((e.clientY - rect.top) / rect.height) * 100
        shineRef.current.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.06) 0%, transparent 60%)`
      }
    }

    const onMouseLeave = () => {
      target.current.rx = 0
      target.current.ry = 0
      if (shineRef.current) shineRef.current.style.background = 'transparent'
    }

    card.addEventListener('mousemove', onMouseMove)
    card.addEventListener('mouseleave', onMouseLeave)
    return () => {
      card.removeEventListener('mousemove', onMouseMove)
      card.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [maxTilt])

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}
    >
      <div
        ref={shineRef}
        className="absolute inset-0 rounded-2xl pointer-events-none z-10"
        style={{ transition: 'background 0.1s' }}
      />
      {children}
    </div>
  )
}
