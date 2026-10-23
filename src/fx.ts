// Effekte außerhalb von React: fliegendes Monster, Element-Partikel, Konfetti. Alles läuft in einer festen Ebene über der App.
import { ELEMENTS, type Element, type MonsterElement } from './game'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

let layer: HTMLDivElement | null = null
function fxLayer() {
  if (!layer) {
    layer = document.createElement('div')
    layer.className = 'fx'
    layer.setAttribute('aria-hidden', 'true')
    document.body.appendChild(layer)
  }
  return layer
}

function spawn(tag: 'span' | 'img', className: string) {
  const el = document.createElement(tag)
  el.className = className
  fxLayer().appendChild(el)
  return el
}

// Partikel im Stil des Elements: Feuer steigt, Wasser fällt, Blätter trudeln, Luft wirbelt, Licht funkelt.
export function burst(x: number, y: number, element: MonsterElement, n = 16, spread = 90) {
  if (reduced()) return
  for (let i = 0; i < n; i++) {
    const p = spawn('span', `p ${element}`)
    const a = Math.random() * Math.PI * 2
    const d = spread * (0.5 + Math.random() * 0.7)
    const dx = Math.cos(a) * d
    let dy = Math.sin(a) * d
    if (element === 'feuer') dy = -Math.abs(dy) - 30
    if (element === 'wasser') dy = Math.abs(dy) * 0.4 + 50
    const rot = (Math.random() - 0.5) * (element === 'natur' || element === 'luft' ? 720 : 180)
    const s = 0.7 + Math.random() * 0.8
    p.animate(
      [
        { transform: `translate(${x - 7}px, ${y - 7}px) scale(${s})`, opacity: 1 },
        { transform: `translate(${x - 7 + dx * 0.7}px, ${y - 7 + dy * 0.6 - (element === 'wasser' ? 30 : 0)}px) scale(${s}) rotate(${rot / 2}deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x - 7 + dx}px, ${y - 7 + dy}px) scale(${s * 0.3}) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' },
    ).onfinish = () => p.remove()
  }
}

// Partikel strömen von außen in einen Punkt, bis stop() aufgerufen wird.
export function pullIn(target: HTMLElement, element: MonsterElement) {
  if (reduced()) return () => {}
  const id = setInterval(() => {
    const c = center(target.getBoundingClientRect())
    for (let k = 0; k < 3; k++) {
      const p = spawn('span', `p ${element}`)
      const a = Math.random() * Math.PI * 2
      const d = 220 + Math.random() * 160
      p.animate(
        [
          { transform: `translate(${c.x + Math.cos(a) * d}px, ${c.y + Math.sin(a) * d}px) scale(1.4)`, opacity: 0 },
          { opacity: 1, offset: 0.3 },
          { transform: `translate(${c.x - 7}px, ${c.y - 7}px) scale(.2)`, opacity: 0 },
        ],
        { duration: 900, easing: 'cubic-bezier(.6,0,.9,.6)' },
      ).onfinish = () => p.remove()
    }
  }, 90)
  return () => clearInterval(id)
}

export function confetti(x: number, y: number) {
  if (reduced()) return
  const colors = ['#FFD23F', '#D6284A', '#3EC1F3', '#5BC44A', '#9B7BFF', '#FFFFFF']
  for (let i = 0; i < 40; i++) {
    const p = spawn('span', 'p confetti')
    p.style.background = colors[i % colors.length]
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4
    const v = 260 + Math.random() * 260
    const dx = Math.cos(a) * v
    const dy = Math.sin(a) * v
    p.animate(
      [
        { transform: `translate(${x}px, ${y}px)`, opacity: 1 },
        { transform: `translate(${x + dx * 0.8}px, ${y + dy * 0.8}px) rotate(${360 * Math.random()}deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${x + dx}px, ${y + dy + 520}px) rotate(${720 * Math.random()}deg)`, opacity: 0 },
      ],
      { duration: 2200 + Math.random() * 800, easing: 'cubic-bezier(.2,.6,.4,1)' },
    ).onfinish = () => p.remove()
  }
}

type Attack = {
  from: HTMLElement // Monsterbild im Badge
  to: HTMLElement // Element-Punkt der Aufgabe
  bar: HTMLElement // XP-Balken im Badge
  src: string
  element: MonsterElement
  taskElement?: Element // fehlt bei einmaligen Aufgaben
  xp: number
  onHit: () => void
}

// Monster springt aus dem Badge zur Aufgabe, greift an und hüpft zurück; die XP fliegen in den Balken.
export async function attack({ from, to, bar, src, element, taskElement, xp, onHit }: Attack) {
  if (reduced()) return onHit()
  const f = from.getBoundingClientRect()
  const t = center(to.getBoundingClientRect())
  const s0 = f.width / 120
  const home = `translate(${f.left + f.width / 2 - 60}px, ${f.top + f.height / 2 - 60}px)`
  const tx = t.x - 20
  const ty = t.y - 70
  const top = Math.min(f.top, ty) - 90
  const midX = (f.left + tx) / 2

  const fly = spawn('img', 'flyer') as HTMLImageElement
  fly.src = src
  from.style.visibility = 'hidden'
  const move = (frames: Keyframe[], duration: number, easing: string) => fly.animate(frames, { duration, easing, fill: 'forwards' }).finished

  await move(
    [
      { transform: `${home} scale(${s0})` },
      { transform: `${home} scale(${s0 * 1.2}, ${s0 * 0.7})`, offset: 0.12 },
      { transform: `translate(${midX}px, ${top}px) scale(1.05) rotate(-12deg)`, offset: 0.55 },
      { transform: `translate(${tx}px, ${ty}px) scale(.95) rotate(8deg)` },
    ],
    620,
    'cubic-bezier(.4,0,.2,1)',
  )
  await move(
    [
      { transform: `translate(${tx}px, ${ty}px) scale(.95) rotate(8deg)` },
      { transform: `translate(${tx + 18}px, ${ty - 6}px) scale(1.05, .9) rotate(14deg)`, offset: 0.4 },
      { transform: `translate(${tx - 26}px, ${ty + 4}px) scale(.9, 1.1) rotate(-10deg)` },
    ],
    260,
    'ease-in',
  )

  burst(t.x + 10, t.y, element, 18, 110)
  if (taskElement) burst(t.x + 10, t.y, taskElement, 8, 70)
  navigator.vibrate?.(30)
  onHit()

  const label = spawn('span', 'xp-fly')
  label.textContent = `+${xp} XP`
  const b = center(bar.getBoundingClientRect())
  label.animate(
    [
      { transform: `translate(${t.x}px, ${t.y - 20}px) scale(.4)`, opacity: 0 },
      { transform: `translate(${t.x - 10}px, ${t.y - 70}px) scale(1.2)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${t.x - 10}px, ${t.y - 80}px)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${b.x - 40}px, ${b.y - 20}px) scale(.5)`, opacity: 0.2 },
    ],
    { duration: 1600, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' },
  ).onfinish = () => label.remove()

  await move(
    [
      { transform: `translate(${tx - 26}px, ${ty + 4}px) scale(.9, 1.1) rotate(-10deg)` },
      { transform: `translate(${midX}px, ${top + 30}px) scale(.8) rotate(-360deg)`, offset: 0.5 },
      { transform: `${home} scale(${s0})` },
    ],
    560,
    'cubic-bezier(.4,0,.2,1)',
  )
  fly.remove()
  from.style.visibility = ''
}

// Frucht fliegt im Bogen von oben in der Mitte zum Ziel, dann onLand.
export function flyTo(src: string, to: DOMRect, onLand: () => void) {
  const { x, y } = center(to)
  if (reduced()) return onLand()
  const el = spawn('img', 'fly-fruit') as HTMLImageElement
  el.src = src
  const sx = innerWidth / 2 - 24
  el.animate(
    [
      { transform: `translate(${sx}px, 120px) scale(1)` },
      { transform: `translate(${(sx + x - 24) / 2}px, ${Math.min(120, y) - 80}px) scale(1.2)`, offset: 0.5 },
      { transform: `translate(${x - 24}px, ${y - 24}px) scale(.3)` },
    ],
    { duration: 650, easing: 'ease-in' },
  ).onfinish = () => {
    el.remove()
    onLand()
  }
}

// Boss-Treffer beim Abhaken: Kugel im Element der Aufgabe fliegt zum Boss-Bild, der Boss zuckt, die Schadenszahl springt
// heraus. Läuft neben dem Rückflug des Monsters her und bremst das Abhaken nicht.
export function bossHit(from: HTMLElement, to: HTMLElement, element: Element | undefined, damage: number, double: boolean) {
  if (reduced()) return
  const f = center(from.getBoundingClientRect())
  const t = center(to.getBoundingClientRect())
  const orb = spawn('span', `boss-orb${double ? ' big' : ''}`)
  orb.style.background = ELEMENTS[element ?? 'ohne'].strong
  orb.animate(
    [
      { transform: `translate(${f.x - 13}px, ${f.y - 13}px) scale(.4)` },
      { transform: `translate(${(f.x + t.x) / 2 + 40}px, ${Math.min(f.y, t.y) - 60}px) scale(1.1)`, offset: 0.5 },
      { transform: `translate(${t.x - 13}px, ${t.y - 13}px) scale(.9)` },
    ],
    { duration: 420, easing: 'cubic-bezier(.5,0,.6,1)' },
  ).onfinish = () => {
    orb.remove()
    burst(t.x, t.y, element ?? 'ohne', double ? 22 : 10, double ? 100 : 60)
    to.animate([{ transform: 'none', filter: 'brightness(3)' }, { transform: 'translateX(-8px) rotate(-6deg)' }, { transform: 'translateX(6px) rotate(4deg)' }, { transform: 'none', filter: 'none' }], { duration: double ? 450 : 300 })
    const n = spawn('span', `boss-dmg${double ? ' big' : ''}`)
    n.textContent = `−${damage}`
    if (double) n.dataset.double = '2×!'
    n.animate(
      [
        { transform: `translate(${t.x - 10}px, ${t.y - 20}px) scale(.3)`, opacity: 0 },
        { transform: `translate(${t.x + 10}px, ${t.y - 70}px) scale(1.15)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${t.x + 14}px, ${t.y - 84}px)`, opacity: 1, offset: 0.75 },
        { transform: `translate(${t.x + 14}px, ${t.y - 96}px)`, opacity: 0 },
      ],
      { duration: 1300, easing: 'cubic-bezier(.3,1.3,.5,1)' },
    ).onfinish = () => n.remove()
  }
}
