// Boss-Endkampf als Szene ohne Eingaben: Auftritt, Rückblick auf die Putz-Treffer, die Angriffe des Trupps, ein
// Gegenangriff und das gespeicherte Ergebnis. Sieg: Der Boss zerplatzt in Seifenblasen, 6 Schwämme fliegen aufs Konto.
// Flucht: Er kichert und verschwindet. Antippen springt ans Ende.
import { useEffect, useRef, useState } from 'react'
import { useBack } from './back'
import { BOSS_POINTS, bossFor, bossImg, type Fight } from './bosses'
import { EVENT_LABEL } from './events'
import { burst, confetti } from './fx'
import { ELEMENTS, elementsOf, levelFor, monsterById, stageFor, type Element } from './game'
import { BEATS } from './expeditions'
import { Sponge } from './Sponge'

type Props = { fight: Fight; monsterXp: Record<string, number>; bank: number; onDone: () => void }

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const mid = (el: HTMLElement) => {
  const r = el.getBoundingClientRect()
  return [r.left + r.width / 2, r.top + r.height / 2] as const
}

export function BossFight({ fight, monsterXp, bank, onDone }: Props) {
  useBack(onDone)
  const boss = bossFor(fight.event)!
  const event = EVENT_LABEL[fight.event].replace(/^\S+ /, '')
  const trupp = fight.monsters.map(monsterById)
  const rest = fight.lp - fight.damage
  // Gespielter Rest nach der Flucht: knapp 15 % dessen, was nach dem Putzen übrig war.
  const fledAt = Math.max(1, Math.round(rest * 0.15))
  const [end, setEnd] = useState(false)
  const [points, setPoints] = useState(fight.won ? bank - BOSS_POINTS : bank)
  const stage = useRef<HTMLDivElement>(null)
  const bossEl = useRef<HTMLImageElement>(null)
  const hp = useRef<HTMLSpanElement>(null)
  const hpText = useRef<HTMLElement>(null)
  const call = useRef<HTMLSpanElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const bankEl = useRef<HTMLSpanElement>(null)
  const mons = useRef<(HTMLImageElement | null)[]>([])

  const skip = useRef(false)

  useEffect(() => {
    let alive = true
    const go = () => alive && !skip.current
    if (reduced()) return setEnd(true)
    const setHp = (lp: number) => {
      hp.current!.style.width = `${(lp / fight.lp) * 100}%`
      hpText.current!.textContent = `${Math.round(lp)} LP`
    }
    const say = (text: string, adv = false, duration = 1300) => {
      const c = call.current!
      c.textContent = text
      if (adv) {
        const tag = document.createElement('span')
        tag.className = 'advt'
        tag.textContent = 'VORTEIL!'
        c.append(' ', tag)
      }
      c.animate([{ opacity: 0, transform: 'translateX(-50%) scale(.6)' }, { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: 0.2 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration, easing: 'ease-out', fill: 'forwards' })
    }
    const shakeBoss = (strong: boolean) =>
      bossEl.current!.animate([{ transform: 'translateX(0)', filter: 'brightness(3)' }, { transform: 'translateX(14px) rotate(6deg)' }, { transform: 'translateX(-8px)' }, { transform: 'none', filter: 'none' }], { duration: strong ? 420 : 320, composite: 'add' })

    ;(async () => {
      const b = bossEl.current!
      setHp(fight.lp)
      b.animate([{ transform: 'translateY(-260px) scale(.8)' }, { transform: 'translateY(0) scale(1.1,.85)', offset: 0.7 }, { transform: 'none' }], { duration: 800, easing: 'cubic-bezier(.5,0,.5,1.4)', fill: 'backwards' })
      mons.current.forEach((m, i) => m?.animate([{ transform: 'translateX(-300px)' }, { transform: 'none' }], { duration: 700, delay: 300 + i * 150, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' }))
      await wait(900)
      if (!go()) return
      let [bx, by] = mid(b)
      burst(bx, by + 70, boss.element, 20, 120)
      b.animate([{ transform: 'none' }, { transform: 'scale(1.03,.97)' }, { transform: 'none' }], { duration: 1600, iterations: Infinity, easing: 'ease-in-out' })
      mons.current.forEach((m, i) => m?.animate([{ transform: 'none' }, { transform: 'scale(1.04,.95)' }, { transform: 'none' }], { duration: 1300, delay: i * 200, iterations: Infinity, easing: 'ease-in-out' }))
      await wait(700)
      if (!go()) return

      // Rückblick: Das Putzen hat ihn schon geschwächt.
      say(`Eure Putz-Treffer: −${fight.damage}`, false, 2100)
      const colors = ['licht', 'wasser', 'natur', 'luft', 'feuer'] as Element[]
      for (let i = 0; i < 14; i++) {
        setTimeout(() => {
          if (!go()) return
          const o = document.createElement('span')
          o.className = 'boss-orb'
          o.style.background = ELEMENTS[colors[i % colors.length]].strong
          stage.current!.append(o)
          const sx = 20 + Math.random() * (innerWidth - 40)
          o.animate([{ transform: `translate(${sx}px, ${innerHeight}px) scale(.6)` }, { transform: `translate(${bx - 13 + (Math.random() - 0.5) * 60}px, ${by - 13 + (Math.random() - 0.5) * 60}px) scale(.9)` }], { duration: 500, easing: 'cubic-bezier(.5,0,.7,1)' }).onfinish = () => {
            o.remove()
            burst(bx, by, 'licht', 3, 50)
            setHp(fight.lp - ((i + 1) / 14) * fight.damage)
          }
        }, i * 70)
      }
      await wait(2300)
      if (!go()) return

      // Angriffe: alle bis auf den letzten, dann ein Gegenangriff, dann der letzte Schlag.
      const n = trupp.length
      const leftAfter = (i: number) => (fight.won ? rest * (1 - (i + 1) / n) : Math.max(fledAt, rest * (1 - ((i + 1) / n) * 0.85)))
      const lunge = async (i: number) => {
        const m = trupp[i]
        const adv = elementsOf(m, monsterXp[m.id] ?? 0).some((e) => e !== 'ohne' && BEATS[e] === boss.element)
        mons.current[i]?.animate([{ transform: 'none' }, { transform: 'translate(40px,-40px) scale(1.1)', offset: 0.4 }, { transform: 'translate(140px,-140px) scale(1.05) rotate(10deg)', offset: 0.6 }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.4,0,.3,1)', composite: 'add' })
        say(`${m.move}!`, adv)
        await wait(380)
        if (!go()) return
        ;[bx, by] = mid(b)
        burst(bx, by, m.element, adv ? 26 : 12, adv ? 140 : 80)
        if (adv) flash.current!.animate([{ opacity: 0.7 }, { opacity: 0 }], { duration: 300 })
        shakeBoss(adv)
        navigator.vibrate?.(30)
        setHp(i === n - 1 && !fight.won ? fledAt : leftAfter(i))
        await wait(1100)
      }
      for (let i = 0; i < n - 1 && go(); i++) await lunge(i)
      if (!go()) return
      say('Gegenangriff!', false, 1200)
      b.animate([{ transform: 'none' }, { transform: 'translate(-30px,20px) scale(1.15)' }, { transform: 'none' }], { duration: 500, composite: 'add' })
      await wait(250)
      mons.current.forEach((m) => {
        if (!m) return
        const [x, y] = mid(m)
        burst(x, y, boss.element, 10, 70)
        m.animate([{ transform: 'none' }, { transform: 'translateX(-10px) rotate(-8deg)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 400, composite: 'add' })
      })
      stage.current!.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,4px)' }, { transform: 'translate(5px,-3px)' }, { transform: 'none' }], { duration: 350 })
      await wait(1200)
      if (!go()) return
      await lunge(n - 1)
      if (!go()) return

      if (fight.won) {
        ;[bx, by] = mid(b)
        for (let k = 0; k < 5; k++) setTimeout(() => go() && bubbles(bx, by, 14, 110), k * 220)
        b.getAnimations().forEach((a) => a.cancel())
        await b.animate([{ filter: 'none', transform: 'none' }, { filter: 'brightness(1.6) saturate(.3)', transform: 'scale(1.05)', offset: 0.4 }, { filter: 'brightness(2.2) saturate(0)', transform: 'scale(.2) rotate(20deg)', opacity: 0 }], { duration: 1300, easing: 'ease-in', fill: 'forwards' }).finished
        if (!go()) return
        bubbles(bx, by, 30, 160, 1.4)
        confetti(bx, by)
        navigator.vibrate?.([80, 40, 160])
        setEnd(true)
        await wait(900)
        if (!go() || !bankEl.current) return
        const [ex, ey] = mid(bankEl.current)
        for (let k = 0; k < BOSS_POINTS; k++) {
          const c = document.createElement('span')
          c.className = 'coin'
          c.innerHTML = '<svg width="30" height="25" viewBox="0 0 56 46"><path d="M5 9 Q4 4 9 4 L47 3 Q52 3 52 8 L53 38 Q53 43 48 43 L9 43 Q4 43 4 38 Z" fill="#FFD23F" stroke="#1B1530" stroke-width="3" stroke-linejoin="round"/></svg>'
          stage.current!.append(c)
          const x0 = innerWidth / 2 + (k - 2.5) * 36
          c.animate([{ transform: `translate(${x0}px, ${by}px) scale(.3)`, opacity: 0 }, { transform: `translate(${x0}px, ${by - 40}px) scale(1.2)`, opacity: 1, offset: 0.3 }, { transform: `translate(${ex - 15}px, ${ey - 12}px) scale(.7)`, opacity: 1 }], { duration: 900, delay: 200 + k * 140, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'backwards' }).onfinish = () => {
            c.remove()
            if (!go()) return
            setPoints((p) => p + 1)
            bankEl.current?.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 200 })
          }
        }
      } else {
        say('Hihihi …', false, 1400)
        b.getAnimations().forEach((a) => a.cancel())
        await b.animate([{ transform: 'none' }, { transform: 'rotate(-8deg) scale(1.05)' }, { transform: 'rotate(8deg) scale(1.05)' }, { transform: 'rotate(-6deg)' }, { transform: 'none' }], { duration: 1200 }).finished
        if (!go()) return
        ;[bx, by] = mid(b)
        b.animate([{ transform: 'none' }, { transform: 'translateY(-40px) scale(.9,1.1)', offset: 0.3 }, { transform: 'translateY(240px) scale(.4,1.4)', opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' })
        await wait(600)
        if (!go()) return
        burst(bx, by + 80, boss.element, 22, 110)
        setEnd(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const tap = () => {
    if (end) return
    skip.current = true
    call.current?.getAnimations().forEach((a) => a.cancel())
    setPoints(bank)
    setEnd(true)
  }

  return (
    <div className={`arena ${end ? 'end' : ''} ${end ? (fight.won ? 'won' : 'fled') : ''}`} ref={stage} onClick={tap}>
      <div className="floor" />
      <div className="tiles" />
      <span className="banner2">ENDKAMPF · {event.toUpperCase()}</span>
      {fight.won && (
        <span className="bank2" ref={bankEl}>
          <Sponge size={30} />
          <span>{points}</span>
        </span>
      )}
      <div className="boss-hp">
        <span className="nm">
          {boss.name} <small ref={hpText}>{fight.lp} LP</small>
        </span>
        <span className="hpbar">
          <span ref={hp} />
        </span>
      </div>
      <img ref={bossEl} className="boss-big" src={bossImg(boss)} alt={boss.name} />
      {trupp.map((m, i) => (
        <img key={m.id} ref={(el) => void (mons.current[i] = el)} className={`tm tm${i}`} src={m.files[stageFor(m, levelFor(monsterXp[m.id] ?? 0))]} alt="" />
      ))}
      <span className="call" ref={call} />
      <div className="flash" ref={flash} />
      {end && (
        <>
          <span className={`bigstamp ${fight.won ? '' : 'red'}`}>{fight.won ? 'BESIEGT!' : 'ENTKOMMEN!'}</span>
          <div className="endbar">
            <p>
              {fight.won ? `+${BOSS_POINTS} Streak-Punkte für euer Konto!` : `Knapp! Nur noch ${fledAt} LP.`}
              <br />
              <small>{fight.won ? `${boss.name} ist jetzt in eurer Boss-Sammlung.` : `${boss.name} kommt ${event} ${fight.year + 1} wieder.`}</small>
            </p>
            <button className="btn" onClick={onDone}>
              {fight.won ? 'Super!' : 'Nächstes Jahr!'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Seifenblasen steigen aus dem besiegten Boss.
function bubbles(x: number, y: number, n: number, spread: number, big = 1) {
  const layer = document.querySelector('.arena')
  if (!layer) return
  for (let i = 0; i < n; i++) {
    const b = document.createElement('span')
    b.className = 'soap'
    const s = (10 + Math.random() * 26) * big
    b.style.width = b.style.height = `${s}px`
    layer.append(b)
    const dx = (Math.random() - 0.5) * spread * 2
    const dy = -40 - Math.random() * spread * 1.4
    b.animate(
      [
        { transform: `translate(${x - s / 2 + (Math.random() - 0.5) * 60}px, ${y - s / 2 + (Math.random() - 0.5) * 60}px) scale(.2)`, opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: `translate(${x - s / 2 + dx}px, ${y - s / 2 + dy}px) scale(1)`, opacity: 0 },
      ],
      { duration: 1200 + Math.random() * 900, easing: 'cubic-bezier(.2,.7,.3,1)' },
    ).onfinish = () => b.remove()
  }
}
