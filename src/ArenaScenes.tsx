// Szenen der Arena: der Kampf (läuft von allein, aus der Kampf-id nachgespielt), das Brauen des Wochen-Tranks und die
// kurzen Hinweise beim Abhaken. Antippen springt in Kampf und Brauen ans Ende.
import { useEffect, useRef, useState } from 'react'
import { FULL_WIN_POINTS, POTIONS, ROUNDS, fighterImg, fighterMove, fighterName, leaderImg, simulate, type ArenaFight, type Hint, type Leader, type Recipe, type Side } from './arena'
import { Bottle, Ingredient, Joker, Kettle } from './ArenaIcons'
import { Sponge } from './Sponge'
import { leaderColors } from './Arena'
import { useBack } from './back'
import { burst, confetti } from './fx'
import { ELEMENTS, PEOPLE } from './game'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const ease = 'cubic-bezier(.3,1.3,.5,1)'
const mid = (el: Element) => {
  const r = el.getBoundingClientRect()
  return [r.left + r.width / 2, r.top + r.height / 2] as const
}

// Sprüche der Leiter: zur Begrüßung, wenn sie verlieren und wenn sie gewinnen.
const LINES: Record<string, string> = {
  gischt: 'Leinen los! Mal sehen, ob ihr seefest seid!',
  glut: 'Mal sehen, ob ihr meiner Hitze standhaltet!',
  moos: 'Geduld, ihr Lieben. Meine Pflanzen sind zäh!',
  boee: 'Anschnallen, es wird stürmisch!',
  funkel: 'Faszinierend! Ein Experiment mit euch!',
  grau: 'Na, dann wollen wir mal sehen.',
  brodel: 'Heute koche ich euch ein!',
  wirr: 'Huiii, alles fliegt durcheinander!',
  polarlicht: 'Zu zweit sind wir unschlagbar!',
  schmutzkoenig: 'Verneigt euch vor dem König des Drecks!',
  nebelfrau: 'Seht ihr mich überhaupt?',
  staubbaron: 'Gestatten: der Baron. Ich staube euch ab!',
}

type FightProps = { fight: ArenaFight; leader: Leader; bank: number; lost: boolean; onDone: () => void }

export function ArenaFightScene({ fight, leader, bank, lost, onDone }: FightProps) {
  useBack(onDone)
  const sim = useRef(simulate(fight.id, fight.team, fight.foes, fight.potion, fight.master)).current
  const [end, setEnd] = useState(false)
  const [points, setPoints] = useState(fight.won && !lost ? bank - 1 : bank)
  const skip = useRef(false)
  const stage = useRef<HTMLDivElement>(null)
  const lead = useRef<HTMLImageElement>(null)
  const say = useRef<HTMLDivElement>(null)
  const name = useRef<HTMLSpanElement>(null)
  const hud = useRef<HTMLDivElement>(null)
  const round = useRef<HTMLSpanElement>(null)
  const call = useRef<HTMLSpanElement>(null)
  const joker = useRef<HTMLDivElement>(null)
  const konto = useRef<HTMLSpanElement>(null)
  const mons = useRef<Record<Side, (HTMLDivElement | null)[]>>({ team: [], foes: [] })
  const bars = useRef<Record<Side, HTMLSpanElement | null>>({ team: null, foes: null })
  const pcts = useRef<Record<Side, HTMLElement | null>>({ team: null, foes: null })
  const [a, b] = leaderColors(leader.elements)
  const size = Math.max(fight.team.length, fight.foes.length) > 4 ? 76 : 92

  // LP nach allen Treffern bis einschließlich n.
  const lpAfter = (n: number) => {
    const lp = { team: [...sim.max.team], foes: [...sim.max.foes] }
    for (const h of sim.hits.slice(0, n)) {
      const other: Side = h.side === 'team' ? 'foes' : 'team'
      lp[other][h.to] = Math.max(0, lp[other][h.to] - h.damage)
    }
    return lp
  }
  const show = (lp: ReturnType<typeof lpAfter>) => {
    for (const side of ['team', 'foes'] as Side[]) {
      const pct = Math.round((lp[side].reduce((n, x) => n + x, 0) / sim.max[side].reduce((n, x) => n + x, 0)) * 100)
      if (bars.current[side]) bars.current[side]!.style.width = `${pct}%`
      if (pcts.current[side]) pcts.current[side]!.textContent = `${pct}%`
      lp[side].forEach((x, i) => {
        const m = mons.current[side][i]
        if (!m) return
        ;(m.querySelector('.hp span') as HTMLElement).style.width = `${(x / sim.max[side][i]) * 100}%`
        m.classList.toggle('down', x === 0)
      })
    }
  }

  useEffect(() => {
    let alive = true
    const go = () => alive && !skip.current
    if (reduced()) {
      show(lpAfter(sim.hits.length))
      return setEnd(true)
    }
    const pop = (el: HTMLElement, from = 'scale(.6)') => el.animate([{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], { duration: 380, easing: ease, fill: 'both' })
    const talk = async (text: string, ms: number) => {
      say.current!.textContent = text
      pop(say.current!)
      await wait(ms)
      say.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' })
    }
    const banner = (text: string, small?: string, color = 'var(--paper)') => {
      const c = call.current!
      c.innerHTML = ''
      c.append(text)
      if (small) {
        const s = document.createElement('small')
        s.textContent = small
        c.append(s)
      }
      c.style.color = color
      c.getAnimations().forEach((x) => x.cancel())
      c.animate([{ opacity: 0, transform: 'translate(-50%,-50%) rotate(-4deg) scale(.4)' }, { opacity: 1, transform: 'translate(-50%,-50%) rotate(-4deg) scale(1)', offset: 0.25 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1100, fill: 'forwards' })
    }
    const dmgNumber = (x: number, y: number, n: number, adv: boolean) => {
      const d = document.createElement('span')
      d.className = `af-dmg${adv ? ' adv' : ''}`
      d.textContent = `−${n}`
      d.style.left = `${x}px`
      d.style.top = `${y - 30}px`
      stage.current!.append(d)
      d.animate([{ transform: 'translate(-50%,-50%) scale(.3)' }, { transform: 'translate(-50%,-120%) scale(1)', offset: 0.4 }, { transform: 'translate(-50%,-170%) scale(1)', opacity: 0 }], { duration: 1000 }).onfinish = () => d.remove()
      if (!adv) return
      const e = document.createElement('span')
      e.className = 'af-eff'
      e.textContent = 'Sehr effektiv!'
      e.style.left = `${x}px`
      e.style.top = `${y + 44}px`
      stage.current!.append(e)
      e.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.5)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: 0.3 }, { opacity: 0, transform: 'translate(-50%,-50%)' }], { duration: 1000 }).onfinish = () => e.remove()
    }

    ;(async () => {
      show(lpAfter(0))
      // Auftritt: Der Leiter springt herein und spricht, dann kommen die Teams.
      lead.current!.animate([{ transform: 'translateX(-50%) translateY(-110%)', opacity: 1 }, { transform: 'translateX(-50%)', opacity: 1 }], { duration: 650, easing: ease, fill: 'both' })
      await wait(500)
      if (!go()) return
      pop(name.current!, 'translateX(-50%) rotate(-3deg) scale(.3)').effect!.updateTiming({ fill: 'both' })
      await wait(200)
      await talk(LINES[leader.id], 1500)
      if (!go()) return
      name.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' })
      for (const m of mons.current.foes) m && pop(m, 'translateY(-40px) scale(.6)') && (await wait(90))
      for (const m of mons.current.team) m && pop(m, 'translateY(80px) scale(.6)') && (await wait(90))
      pop(hud.current!, 'translateY(-30px)')
      await wait(400)
      if (!go()) return
      if (fight.potion) {
        banner(`${fight.master ? 'Meister-' : ''}${POTIONS[fight.potion].name}!`, fight.master ? POTIONS[fight.potion].master : POTIONS[fight.potion].text, POTIONS[fight.potion].color)
        for (const m of mons.current.team) m?.classList.add('potion')
        await wait(1100)
      }

      // Runden: Jeder trifft das gegnerische Monster mit den wenigsten LP.
      const fast = sim.hits.length > 30
      let shown = 0
      for (const [n, h] of sim.hits.entries()) {
        if (!go()) return
        if (h.round !== shown) {
          shown = h.round
          round.current!.textContent = `RUNDE ${h.round} / ${ROUNDS}`
          round.current!.animate([{ transform: 'scale(1.4)' }, { transform: 'none' }], { duration: 300, easing: ease })
        }
        const other: Side = h.side === 'team' ? 'foes' : 'team'
        const from = mons.current[h.side][h.from]!
        const to = mons.current[other][h.to]!
        const f = (h.side === 'team' ? fight.team : fight.foes)[h.from]
        const [ax, ay] = mid(from)
        const [bx, by] = mid(to)
        if (!fast || n % 3 === 0) banner(`${fighterMove(f)}!`)
        const lunge = `translate(${(bx - ax) * 0.55}px,${(by - ay) * 0.55}px) scale(1.12)`
        await from.animate([{ transform: 'none' }, { transform: lunge }], { duration: fast ? 180 : 240, easing: 'ease-in' }).finished
        if (!go()) return
        burst(bx, by, f.elements.find((e) => e !== 'ohne') ?? 'ohne', h.advantage ? 18 : 10, h.advantage ? 100 : 70)
        to.animate([{ transform: 'none' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' }, { transform: 'none' }], { duration: 300 })
        show(lpAfter(n + 1))
        dmgNumber(bx, by, h.damage, h.advantage)
        from.animate([{ transform: lunge }, { transform: 'none' }], { duration: 300 })
        if (h.down) {
          to.querySelector('img')!.animate([{ transform: 'none' }, { transform: 'rotate(85deg) translateY(14px)', opacity: 0.5 }], { duration: 500, fill: 'forwards' })
          if (other === 'foes') lead.current!.animate([{ rotate: '0deg' }, { rotate: '-5deg' }, { rotate: '5deg' }, { rotate: '0deg' }], { duration: 450 })
        }
        await wait(fast ? 330 : 520)
      }
      if (!go()) return
      await wait(300)
      if (fight.won) lead.current!.animate([{ rotate: '0deg' }, { rotate: '-10deg', translate: '0 10px' }], { duration: 600, fill: 'forwards' })
      await talk(fight.won ? 'Uff … ihr habt gut vorbereitet!' : 'Haha! Versucht es nächste Woche wieder!', 1400)
      if (!go()) return
      setEnd(true)
    })()
    return () => {
      alive = false
    }
  }, [])

  // Ende: Bei einem Sieg fliegt die Joker-Karte aufs Konto. Ist es voll, erscheint stattdessen die Karte mit den Streak-Punkten.
  useEffect(() => {
    if (!end) return
    show(lpAfter(sim.hits.length))
    if (!fight.won) return
    const [x, y] = mid(stage.current!)
    confetti(x, y * 0.8)
    navigator.vibrate?.([80, 40, 160])
    if (reduced()) return setPoints(bank)
    const j = joker.current
    const k = konto.current
    if (!j || (!k && !lost)) return
    let alive = true
    ;(async () => {
      await j.animate([{ opacity: 0, transform: 'rotate(-30deg) scale(.2)' }, { opacity: 1, transform: 'rotate(-6deg) scale(1)' }], { duration: 600, easing: ease, fill: 'both' }).finished
      if (lost || !k) return
      await wait(600)
      if (!alive) return
      const kr = k.getBoundingClientRect()
      const jr = j.getBoundingClientRect()
      await j.animate([{ transform: 'rotate(-6deg) scale(1)' }, { transform: `translate(${kr.left - jr.left - 40}px,${kr.top - jr.top - 60}px) rotate(10deg) scale(.22)`, opacity: 0.9 }], { duration: 650, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' }).finished
      if (!alive) return
      j.style.visibility = 'hidden'
      setPoints(bank)
      k.animate([{ transform: 'scale(1.5)' }, { transform: 'none' }], { duration: 400, easing: ease })
    })()
    return () => {
      alive = false
    }
  }, [end])

  const tap = () => {
    if (end) return
    skip.current = true
    stage.current?.getAnimations({ subtree: true }).forEach((x) => x.finish())
    setEnd(true)
  }
  const place = (side: Side, i: number, n: number) => ({
    left: `calc(${((i + 0.5) / n) * 100}% - ${size / 2}px)`,
    top: side === 'foes' ? `calc(40% + ${(i === 0 || i === n - 1 ? 0 : 22)}px)` : `calc(70% + ${(i === 0 || i === n - 1 ? 0 : 46)}px)`,
    width: size,
  })

  return (
    <div className={`af${end ? ' end' : ''}`} onClick={tap}>
      <div className="af-stage" ref={stage}>
        <div className="af-tint" style={{ background: `radial-gradient(circle at 50% 30%, transparent, ${b}55)` }} />
        <img ref={lead} className="af-leader" src={leaderImg(leader)} alt={leader.name} />
        <span ref={name} className="af-name" style={{ background: a }}>
          {leader.name}
        </span>
        <div ref={say} className="af-say" />
        <div ref={hud} className="af-hud">
          <div className="af-tb">
            <span>{leader.name.split(' ').at(-1)}</span>
            <span className="af-bar">
              <span ref={(el) => void (bars.current.foes = el)} />
            </span>
            <b ref={(el) => void (pcts.current.foes = el)}>100%</b>
          </div>
          <div className="af-tb me">
            <span>{PEOPLE[fight.person]}</span>
            <span className="af-bar">
              <span ref={(el) => void (bars.current.team = el)} />
            </span>
            <b ref={(el) => void (pcts.current.team = el)}>100%</b>
          </div>
          <span ref={round} className="af-round">
            RUNDE 1 / {ROUNDS}
          </span>
        </div>
        {(['foes', 'team'] as Side[]).map((side) =>
          (side === 'team' ? fight.team : fight.foes).map((f, i, list) => (
            <div key={`${side}${i}`} ref={(el) => void (mons.current[side][i] = el)} className={`af-mon ${side}`} style={place(side, i, list.length)}>
              <img src={fighterImg(f)} alt="" style={{ width: size, height: size }} />
              <span className="hp">
                <span />
              </span>
              <span className="lv">Lv {f.level > 30 ? '30+' : f.level}</span>
            </div>
          )),
        )}
        <span ref={call} className="af-call" />
        {!end && <span className="af-skip">Tippen zum Vorspulen</span>}
        {end && (
          <>
            <div className="af-dim" />
            {fight.won && <div className="af-rays" />}
            <div className="af-banner">
              <span className="af-big">{fight.won ? 'Sieg!' : 'Verloren'}</span>
              <span className="af-chip">{fight.won ? `${leader.name} besiegt!` : `${leader.name} war zu stark.`}</span>
              {fight.won && lost && <span className="af-chip small">Joker-Konto voll, dafür gibt es {FULL_WIN_POINTS} Streak-Punkte.</span>}
            </div>
            {fight.won && (
              <div ref={joker} className={`af-jcard${lost ? ' pts' : ''}`}>
                {lost ? <Sponge size={56} /> : <Joker size={56} />}
                <b>{lost ? `+${FULL_WIN_POINTS} Streak-Punkte` : '+1 Joker'}</b>
              </div>
            )}
            {fight.won && !lost && (
              <span ref={konto} className="af-konto">
                <Joker size={26} />
                {points}
              </span>
            )}
            <button className="btn af-btn" onClick={onDone}>
              {fight.won ? (lost ? 'Super!' : 'Einsammeln') : 'Nächste Woche!'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Brauen: Die Zutaten fliegen nacheinander in den Kessel, der jedes Mal die Farbe wechselt, dann steigt die Flasche auf.
// Mit Meisterzutat kommt sie zuletzt, der Kessel leuchtet golden und die Flasche glänzt.
export function BrewScene({ recipe, master, onDone }: { recipe: Recipe; master: boolean; onDone: () => void }) {
  useBack(onDone)
  const list = master ? [...recipe.ingredients, recipe.master] : recipe.ingredients
  const [step, setStep] = useState(0)
  const [liquid, setLiquid] = useState('#3EC1F3')
  const [end, setEnd] = useState(false)
  const skip = useRef(false)
  const pot = useRef<HTMLDivElement>(null)
  const fly = useRef<HTMLDivElement>(null)
  const p = POTIONS[recipe.potion]

  useEffect(() => {
    let alive = true
    const go = () => alive && !skip.current
    if (reduced()) return setEnd(true)
    ;(async () => {
      await wait(500)
      for (const [i, ing] of list.entries()) {
        if (!go()) return
        setStep(i + 1)
        await wait(30)
        const f = fly.current!
        const [px, py] = mid(pot.current!)
        const [fx, fy] = mid(f)
        const side = i % 2 ? -1 : 1
        await f.animate(
          [
            { transform: `translate(${side * 120}px, -80px) scale(.6)`, opacity: 0 },
            { transform: 'none', opacity: 1, offset: 0.3 },
            { transform: `translate(${px - fx}px, ${py - fy - 30}px) scale(.4) rotate(${side * 160}deg)`, opacity: 1 },
          ],
          { duration: 1100, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' },
        ).finished
        if (!go()) return
        setLiquid(ing.element ? ELEMENTS[ing.element].strong : '#FFD23F')
        burst(px, py - 30, ing.element ?? 'licht', ing.element ? 12 : 26, 70)
        pot.current!.animate([{ transform: 'none' }, { transform: 'scale(1.08,.94)' }, { transform: 'none' }], { duration: 400 })
        await wait(450)
      }
      if (!go()) return
      setLiquid(p.color)
      await wait(400)
      if (go()) setEnd(true)
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!end || !pot.current) return
    const [x, y] = mid(pot.current)
    if (master) confetti(x, y - 120)
  }, [end])

  const ing = list[step - 1]
  return (
    <div
      className={`brew${end ? ' end' : ''}`}
      onClick={() => {
        if (end) return
        skip.current = true
        setEnd(true)
      }}
    >
      <span className="brew-tag">Wochen-Trank</span>
      {!end && ing && (
        <div key={step} ref={fly} className="brew-fly">
          <Ingredient element={ing.element} size={64} />
          <span>{ing.name}</span>
        </div>
      )}
      {end && (
        <div className="brew-bottle">
          <Bottle color={p.color} size={140} gold={master} />
        </div>
      )}
      {end && (
        <span className="brew-word">
          {master ? 'Meister-' : ''}
          {master && <br />}
          {p.name}!
        </span>
      )}
      <div ref={pot} className="brew-pot">
        <Kettle liquid={end ? (master ? '#FFD23F' : p.color) : liquid} size={190} glow={end && master} />
      </div>
      {!end ? (
        <span className="brew-line">
          {list.map((x, i) => (
            <span key={x.name} style={{ opacity: i < step ? 1 : 0.35 }}>
              <Ingredient element={x.element} size={22} />
            </span>
          ))}
          · {Math.min(step, list.length)} von {list.length}
        </span>
      ) : (
        <span className="brew-line">{master ? p.master : p.text} in euren Kämpfen dieser Woche</span>
      )}
      {end ? (
        <button className="btn brew-btn" onClick={onDone}>
          Super!
        </button>
      ) : (
        <span className="af-skip light">Tippen zum Überspringen</span>
      )}
    </div>
  )
}

// Hinweise beim Abhaken, unten über der Liste. Verschwinden nach ein paar Sekunden oder beim Antippen.
export function ArenaHints({ hints, onDone }: { hints: Hint[]; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <button className="hint-toast" onClick={onDone}>
      {hints.map((h, i) =>
        h.kind === 'zutat' ? (
          <span key={i} className="ht">
            <Ingredient element={h.ingredient.element} size={34} />
            <span>
              <b>Zutat gefunden: {h.ingredient.name}</b>
              <small>Wochen-Trank: {h.have} von 3 Zutaten</small>
            </span>
          </span>
        ) : h.kind === 'training' ? (
          <span key={i} className="ht red">
            <img className="ht-img" src={fighterImg(h.foe)} alt="" />
            <span>
              <b>Training gestört!</b>
              <small>{fighterName(h.foe)} verliert 1 Level für den Kampf</small>
            </span>
          </span>
        ) : (
          <span key={i} className="ht gold">
            <Ingredient element={null} size={34} />
            <span>
              <b>
                {h.kind === 'meister' ? 'Meisterzutat gefunden' : 'Meisterzutat entdeckt'}: {h.ingredient.name}
              </b>
              <small>{h.kind === 'meister' ? 'Braut ihr jetzt, wird es ein Meistertrank' : 'Ihr Fundort steht jetzt in der Arena'}</small>
            </span>
          </span>
        ),
      )}
    </button>
  )
}
