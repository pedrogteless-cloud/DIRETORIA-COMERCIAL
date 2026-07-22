import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

// Assinatura desenhada no dedo/mouse. Exporta a imagem como dataURL (PNG)
// pra ir no PDF do pedido. Sem lib externa — canvas puro, com suporte a
// toque (previne o scroll da página enquanto assina) e telas retina.
const SignaturePad = forwardRef(function SignaturePad({ label }, ref) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const [temAssinatura, setTemAssinatura] = useState(false)

  function setup() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0E1420'
  }

  useEffect(() => {
    setup()
    const onResize = () => {
      // redimensionar limpa o canvas; só refaz o setup (assinatura some).
      setup()
      setTemAssinatura(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function pos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const point = e.touches ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  function start(e) {
    e.preventDefault()
    drawing.current = true
    last.current = pos(e)
  }

  function move(e) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (!temAssinatura) setTemAssinatura(true)
  }

  function end(e) {
    e.preventDefault()
    drawing.current = false
  }

  function limpar() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setTemAssinatura(false)
  }

  useImperativeHandle(ref, () => ({
    toDataURL: () => (temAssinatura ? canvasRef.current.toDataURL('image/png') : null),
    isEmpty: () => !temAssinatura,
    clear: limpar,
  }))

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-muted">{label}</span>
        <button type="button" onClick={limpar} className="text-xs text-coral hover:underline">
          limpar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-32 rounded-lg bg-white touch-none border border-border"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
    </div>
  )
})

export default SignaturePad
