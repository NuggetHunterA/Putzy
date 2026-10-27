// Arena-Seite: eine lange Seite mit Sprungmarken. Leiter und sein Team, „So funktioniert's“, Element-Kreis,
// Trainingszeiten, Wochen-Trank mit Kessel, dann Team, Einschätzung und „Antreten!“. Erklärt alles, ohne das Konzept zu kennen.
import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  FULL_WIN_POINTS, MASTER_REVEAL, MAX_JOKERS, POTIONS, counters, factor, fighterImg, fighterName, fighterOf, leaderImg, progress, roomTasks, spotText, verdict, bestTeam,
  type ArenaFight, type ArenaWeek, type Ctx, type Fighter, type Ingredient as Ing, type WeekState,
} from './arena'
import { Bottle, ElementCircle, Ingredient, Joker, Kettle, Trophy } from './ArenaIcons'
import { useBack } from './back'
import { Dot } from './Boss'
import type { Done, Snapshot } from './db'
import { awayMonsters, BEATS } from './expeditions'
import { ELEMENTS, PEOPLE, STANDING, backdrop, dayString, monsterById, type Element, type MonsterElement, type Monster, type Person } from './game'

// Farben für Kachel, Kopf und Karte: hell und dunkel aus dem ersten Element, bei zwei Elementen beide dunkel.
const SHADES: Record<MonsterElement, [string, string]> = {
  wasser: ['#7FD8F7', '#1E7FB8'],
  feuer: ['#FF8A4C', '#B8321E'],
  natur: ['#A8E68A', '#2E8A2A'],
  luft: ['#C9B2FF', '#7D5BE0'],
  licht: ['#FFE07A', '#C98A00'],
  ohne: ['#C9CDDB', '#6E7590'],
}
export const leaderColors = (els: MonsterElement[]): [string, string] => (els.length > 1 ? [SHADES[els[0]][1], SHADES[els[1]][1]] : SHADES[els[0]])

const HOW_STORAGE = 'putzy.arenaHow'
const shortDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return { wd: date.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '').toUpperCase(), dm: `${d}.${m}.` }
}

type Props = {
  snap: Snapshot
  person: Person
  monsters: Monster[]
  now: Date
  week: ArenaWeek
  ctx: Ctx
  s: WeekState
  jokers: number
  onBack: () => void
  onFight: (team: Monster[]) => void
  onBrew: () => void
  onReplay: (f: ArenaFight) => void
}

export function Arena({ snap, person, monsters, now, week, ctx, s, jokers, onBack, onFight, onBrew, onReplay }: Props) {
  useBack(onBack)
  const l = s.leader
  const [a, b] = leaderColors(l.elements)
  const other: Person = person === 'adrian' ? 'ulrike' : 'adrian'
  const fightOf = (p: Person) => snap.arenaFights.find((f) => f.week_start === week.week_start && f.person === p)
  const mine = fightOf(person)
  const hitCount = s.hits.filter(Boolean).length
  const gotCount = s.got.filter(Boolean).length
  const refs = { leiter: useRef<HTMLDivElement>(null), training: useRef<HTMLDivElement>(null), trank: useRef<HTMLDivElement>(null), kampf: useRef<HTMLDivElement>(null) }
  const jump = (k: keyof typeof refs) => refs[k].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <main className="screen arena-screen">
      <div className="bar">
        <button className="btn back" onClick={onBack} aria-label="Zurück">
          ←
        </button>
        <h1 className="bar-title">Arena</h1>
        <span className="joker big" aria-label={`${jokers} Joker`}>
          <Joker size={20} />
          {jokers}
        </span>
      </div>

      <nav className="jump">
        <button onClick={() => jump('leiter')}>Leiter</button>
        <button onClick={() => jump('training')}>
          Training <i>{hitCount}/3</i>
        </button>
        <button onClick={() => jump('trank')}>
          Trank <i>{s.brew ? '✓' : `${gotCount}/3`}</i>
        </button>
        <button className={mine ? '' : 'hot'} onClick={() => jump('kampf')}>
          Kampf
        </button>
      </nav>

      <div ref={refs.leiter} className="ar-hero" style={{ background: `linear-gradient(140deg, ${a}, ${b})` }}>
        <img className="ar-fig" src={leaderImg(l)} alt="" />
        <div className="ar-info">
          <span className="ar-kicker">LEITER DER WOCHE</span>
          <h2 className="ar-name">{l.name}</h2>
          <span className="ar-els">
            {l.elements.map((e) => (
              <span key={e} className="pill">
                <Dot e={e} />
                {ELEMENTS[e].name}
              </span>
            ))}
          </span>
          <span className="ar-status">
            {([person, other] as Person[]).map((p) => {
              const f = fightOf(p)
              return (
                <span key={p} className="ps">
                  {PEOPLE[p]}
                  <span className={`st ${f ? (f.won ? 'won' : 'lost') : 'open'}`}>{f ? (f.won ? 'Sieg ✓' : 'verloren') : 'offen'}</span>
                </span>
              )
            })}
          </span>
        </div>
      </div>

      <h3 className="sub">Sein Team</h3>
      <div className="foe-row">
        {s.foes.map((f, i) => (
          <FoeCard key={i} f={f} base={week.foes[i].level} />
        ))}
      </div>

      <How />

      <div className="card">
        <h4>Element-Kreis</h4>
        <div className="circle-wrap">
          <ElementCircle lead={l.elements} />
          <CircleText elements={l.elements} />
        </div>
      </div>

      <div ref={refs.training} className="card">
        <h4>
          Trainingszeiten <span className="r">{hitCount} von 3 gestört</span>
        </h4>
        <p>
          Erledigt im Fenster eine <b>{l.elements.includes('ohne') ? 'beliebige Aufgabe mit Element' : `${counters(l).map((e) => ELEMENTS[e].name).join('- oder ')}-Aufgabe`}</b>, dann verliert sein stärkstes Monster 1 Level. Ein Treffer pro Fenster, egal wer putzt.
        </p>
        {week.windows.map((w, i) => (
          <TrainingRow key={w.day} w={w} hit={s.hits[i]} now={now} snap={snap} />
        ))}
        <span className="fine">Ein Joker kann eine Aufgabe so verschieben, dass sie im Fenster fällig ist.</span>
      </div>

      <div ref={refs.trank} className="card">
        <div className="potion-head">
          <Bottle color={POTIONS[week.recipe.potion].color} size={40} gold={!!s.brew?.master} />
          <h4>{POTIONS[week.recipe.potion].name}</h4>
        </div>
        <p>
          {POTIONS[week.recipe.potion].text}. Als Meistertrank: {POTIONS[week.recipe.potion].master}. Wirkt in euren beiden Kämpfen dieser Woche.
        </p>
        {week.recipe.ingredients.map((ing, i) => (
          <IngredientRow key={ing.name} ing={ing} got={s.got[i] || !!s.brew} text={spotText(ing.spot, l)} p={progress(ing.spot, ctx)} />
        ))}
        {s.masterKnown ? (
          <IngredientRow ing={week.recipe.master} got={s.masterGot || !!s.brew?.master} text={spotText(week.recipe.master.spot, l)} p={progress(week.recipe.master.spot, ctx)} master />
        ) : (
          <div className="ing secret">
            <Ingredient element={null} size={32} unknown />
            <span className="t">
              Geheime Meisterzutat
              <small>Erscheint nach {MASTER_REVEAL} Aufgaben im Raum „{l.room}“</small>
              <span className="prog">
                <span style={{ width: `${(roomTasks(ctx) / MASTER_REVEAL) * 100}%`, background: '#F2A900' }} />
              </span>
            </span>
            <span className="n">
              {roomTasks(ctx)} / {MASTER_REVEAL}
            </span>
          </div>
        )}
      </div>

      <div className="card kettle-card">
        <Kettle liquid={s.brew ? POTIONS[week.recipe.potion].color : '#3EC1F3'} size={64} glow={!!s.brew?.master} />
        <p>
          <b>Kessel</b>
          <br />
          {s.brew
            ? `${PEOPLE[s.brew.person]} hat ${s.brew.master ? 'den Meister-' : 'den '}${POTIONS[week.recipe.potion].name} gebraut.`
            : gotCount < 3
              ? `Noch ${3 - gotCount === 1 ? '1 Zutat' : `${3 - gotCount} Zutaten`}, dann könnt ihr brauen.`
              : s.masterGot
                ? 'Alles da, mit Meisterzutat!'
                : 'Alles da. Ohne Meisterzutat verzichtet ihr diese Woche auf den Meistertrank.'}
        </p>
        {!s.brew && (
          <button className={`btn${gotCount < 3 ? ' off' : ''}`} disabled={gotCount < 3} onClick={onBrew}>
            Brauen
          </button>
        )}
      </div>

      <div ref={refs.kampf} className="kampf">
        {mine ? (
          <div className={`card ar-result ${mine.won ? 'won' : 'lost'}`}>
            <span className="stampw">{mine.won ? 'SIEG' : 'VERLOREN'}</span>
            <span className="ar-faces">
              {mine.team.map((f, i) => (
                <Face key={i} f={f} size={44} />
              ))}
            </span>
            <span>{mine.won ? `${l.name} besiegt, +1 Joker!` : `${l.name} war diesmal zu stark. Nächsten Montag kommt ein neuer Leiter.`}</span>
            {!fightOf(other) && <span className="bhint">Was jetzt noch passiert, hilft nur noch {PEOPLE[other]}.</span>}
            <button className="btn" onClick={() => onReplay(mine)}>
              Kampf nochmal ansehen
            </button>
          </div>
        ) : (
          <Fight monsters={monsters} snap={snap} now={now} s={s} week={week} other={other} onFight={onFight} />
        )}
      </div>

      <div className="card expire">
        <p>⏳ Am Montag verfallen alle Zutaten und ein ungebrauchter Trank. Dann kommt ein neuer Leiter.</p>
      </div>
    </main>
  )
}

function Face({ f, size = 54 }: { f: Fighter; size?: number }) {
  return (
    <span className="face" style={{ width: size, height: size, background: backdrop(f.elements[0]) }}>
      <img src={fighterImg(f)} alt="" />
    </span>
  )
}

function FoeCard({ f, base }: { f: Fighter; base: number }) {
  const lv = (n: number) => (n > 30 ? '30+' : n)
  return (
    <div className="foe">
      <span className="elmini">
        {f.elements.map((e) => (
          <Dot key={e} e={e} size={16} />
        ))}
      </span>
      <Face f={f} />
      <b>{fighterName(f)}</b>
      <small>
        {f.level !== base && <s>{lv(base)}</s>}Lv {lv(f.level)}
      </small>
      {f.level !== base && <span className="hit">−{base - f.level}</span>}
    </div>
  )
}

function How() {
  const [open, setOpen] = useState(() => !localStorage.getItem(HOW_STORAGE))
  const toggle = () => {
    localStorage.setItem(HOW_STORAGE, '1')
    setOpen(!open)
  }
  const items: [ReactNode, string][] = [
    [<Trophy size={16} />, 'Jeden Montag kommt ein neuer Arenaleiter. Jeder von euch tritt einmal pro Woche gegen ihn an.'],
    [<Joker size={18} />, `Ein Sieg bringt einen Joker: Er schiebt eine Aufgabe, die heute oder morgen fällig ist, um einen Tag. Liegen schon ${MAX_JOKERS} Joker auf dem Konto, gibt es stattdessen ${FULL_WIN_POINTS} Streak-Punkte.`],
    [<Dot e="wasser" size={22} />, 'Ohne Vorbereitung ist er zu stark. Stört seine Trainings, braut den Wochen-Trank und nehmt Monster mit, die sein Element schlagen.'],
    ['⚔', 'Der Kampf läuft von allein: Jedes Monster greift einmal pro Runde an und trifft das schwächste gegnerische. Wer nach 12 Runden mehr übrig hat, gewinnt.'],
  ]
  return (
    <div className={`card how${open ? '' : ' closed'}`}>
      <button className="how-head" onClick={toggle} aria-expanded={open}>
        <h4>So funktioniert’s</h4>
        <span className="r">{open ? 'einklappen ▴' : 'aufklappen ▾'}</span>
      </button>
      {open && (
        <ul>
          {items.map(([ic, text]) => (
            <li key={text}>
              <span className="ic">{ic}</span>
              {text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CircleText({ elements }: { elements: MonsterElement[] }) {
  const own = elements.filter((e): e is Element => e !== 'ohne')
  if (own.length === 0)
    return (
      <p>
        Pfeil heißt „schlägt“. <b>Sein Team hat kein Element:</b> Kein Monster ist gegen ihn im Vorteil oder Nachteil. Monster ohne Element haben 20 % mehr LP.
      </p>
    )
  const name = (list: Element[]) => list.map((e) => ELEMENTS[e].name).join(' und ')
  const strong = own.map((e) => (Object.keys(BEATS) as Element[]).find((k) => BEATS[k] === e)!)
  const weak = own.map((e) => BEATS[e])
  return (
    <p>
      Pfeil heißt „schlägt“. <b>{strong.map((e, i) => `${ELEMENTS[e].name} schlägt ${ELEMENTS[own[i]].name}`).join(', ')}.</b>
      <br />
      <br />
      {name(strong)}-Monster treffen sein Team stärker, {name(weak)}-Monster sind im Nachteil. Monster mit zwei Elementen greifen mit dem günstigeren an.
    </p>
  )
}

function TrainingRow({ w, hit: doneHit, now, snap }: { w: ArenaWeek['windows'][number]; hit: Done | null; now: Date; snap: Snapshot }) {
  const { wd, dm } = shortDay(w.day)
  const today = dayString(now)
  const h = now.getHours() + now.getMinutes() / 60
  const running = today === w.day && h >= w.from && h < w.to
  const later = w.day > today || (today === w.day && h < w.from)
  const left = Math.round((w.to - h) * 60)
  const what = doneHit && (doneHit.task_id ? snap.tasks.find((t) => t.id === doneHit.task_id)?.name : STANDING.find((x) => x.id === doneHit.standing)?.name)
  const state = doneHit ? 'hit' : running ? 'now' : later ? 'later' : 'miss'
  return (
    <div className={`win ${state}`}>
      <span className="day">
        {wd}
        <small>{dm}</small>
      </span>
      <span className="t">
        {w.from} – {w.to} Uhr
        <small>
          {doneHit ? `${PEOPLE[doneHit.person]}: ${what ?? 'Aufgabe'}` : running ? `läuft gerade, noch ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} h` : later ? 'kommt noch' : 'verpasst'}
        </small>
      </span>
      <span className="ok">{doneHit ? '✓' : running ? 'jetzt' : ''}</span>
    </div>
  )
}

function IngredientRow({ ing, got, text, p, master = false }: { ing: Ing; got: boolean; text: string; p: { have: number; need: number }; master?: boolean }) {
  return (
    <div className={`ing${got ? ' got' : ''}${master ? ' master' : ''}`}>
      <Ingredient element={ing.element} size={32} />
      <span className="t">
        {ing.name}
        {master && ' (Meisterzutat)'}
        <small>{text}</small>
        {!got && p.need > 1 && (
          <span className="prog">
            <span style={{ width: `${(p.have / p.need) * 100}%` }} />
          </span>
        )}
      </span>
      <span className="n">{got ? '✓ da' : `${p.have} / ${p.need}`}</span>
    </div>
  )
}

// Team-Auswahl, Einschätzung und „Antreten!“.
function Fight({ monsters, snap, now, s, week, other, onFight }: { monsters: Monster[]; snap: Snapshot; now: Date; s: WeekState; week: ArenaWeek; other: Person; onFight: (team: Monster[]) => void }) {
  const xp = snap.monsterXp
  const away = awayMonsters(snap.expeditions, now)
  const free = monsters.filter((m) => !away.has(m.id))
  const size = Math.min(week.foes.length, free.length)
  const [ids, setIds] = useState(() => bestTeam(free, xp, s.foes, size).map((m) => m.id))
  const [picking, setPicking] = useState(false)
  const team = ids.map(monsterById)
  const fighters = team.map((m) => fighterOf(m, xp))
  const potion = s.brew ? week.recipe.potion : null
  const v = useMemo(() => verdict(fighters, s.foes, potion, !!s.brew?.master), [ids.join(), s.foes.map((f) => f.level).join(), potion, s.brew?.master])
  const edge = (f: Fighter) => Math.max(...s.foes.map((foe) => factor(f.elements, foe.elements)))
  const good = fighters.filter((f) => edge(f) > 1).length
  const bad = team.filter((_, i) => edge(fighters[i]) < 1)
  const hitCount = s.hits.filter(Boolean).length
  const bars = { schwer: 1, ausgeglichen: 2, leicht: 3 }[v]
  return (
    <>
      <h3 className="sub">
        Dein Team · {size} Monster
      </h3>
      <div className="slots" style={{ gridTemplateColumns: `repeat(${Math.max(3, size)}, 1fr)` }}>
        {Array.from({ length: size }, (_, i) => {
          const m = team[i]
          if (!m)
            return (
              <button key={i} className="slot empty" onClick={() => setPicking(true)}>
                Platz {i + 1}
              </button>
            )
          const e = edge(fighters[i])
          return (
            <button key={m.id} className="slot" onClick={() => setPicking(true)}>
              {e !== 1 && <span className={`adv ${e > 1 ? 'up' : 'down'}`}>{e > 1 ? '▲' : '▼'}</span>}
              <span className="pic" style={{ background: backdrop(m.element) }}>
                <img src={fighterImg(fighters[i])} alt="" />
              </span>
              <b>{fighterName(fighters[i])}</b>
              <span className="small">Lv {fighters[i].level}</span>
            </button>
          )
        })}
      </div>
      <div className="card">
        <h4>Einschätzung</h4>
        <div className="verdict">
          <span className="meter">
            <span className="bars">
              {[1, 2, 3].map((n) => (
                <i key={n} className={n <= bars ? `on${bars}` : ''} />
              ))}
            </span>
            <b>{v === 'leicht' ? 'Leicht' : v === 'ausgeglichen' ? 'Ausgeglichen' : 'Schwer'}</b>
          </span>
          <span className="prep">
            <span className={good ? 'y' : 'n'}>
              <i>{good ? '✓' : '–'}</i>
              {good ? `${good} Monster im Vorteil` : 'kein Monster im Vorteil'}
            </span>
            <span className={hitCount ? 'y' : 'n'}>
              <i>{hitCount ? '✓' : '–'}</i>
              {hitCount} von 3 Trainings gestört
            </span>
            <span className={s.brew ? 'y' : 'n'}>
              <i>{s.brew ? '✓' : '–'}</i>
              {s.brew ? `${s.brew.master ? 'Meister-' : ''}${POTIONS[week.recipe.potion].name}` : 'noch kein Trank'}
            </span>
            {bad.length > 0 && (
              <span className="n">
                <i>▼</i>
                {bad.map((m) => fighterName(fighterOf(m, xp))).join(', ')} im Nachteil
              </span>
            )}
          </span>
        </div>
      </div>
      <button className="go-btn" disabled={team.length === 0} onClick={() => onFight(team)}>
        Antreten!
      </button>
      <span className="fine">Monster auf Expedition können nicht antreten. Was nach deinem Kampf passiert, hilft nur noch {PEOPLE[other]}.</span>
      {picking && <TeamSheet monsters={monsters} away={away} xp={xp} foes={s.foes} size={size} ids={ids} onDone={(next) => (setIds(next), setPicking(false))} />}
    </>
  )
}

// Team-Auswahl als Blatt von unten: ▲ im Vorteil gegen sein Team, ▼ im Nachteil. Monster auf Expedition sind unterwegs.
function TeamSheet({ monsters, away, xp, foes, size, ids: start, onDone }: { monsters: Monster[]; away: Set<string>; xp: Record<string, number>; foes: Fighter[]; size: number; ids: string[]; onDone: (ids: string[]) => void }) {
  const [ids, setIds] = useState(start)
  const close = () => onDone(ids.length > 0 ? ids : start)
  useBack(close)
  const edge = (m: Monster) => Math.max(...foes.map((foe) => factor(fighterOf(m, xp).elements, foe.elements)))
  const list = [...monsters].sort((a, b) => Number(away.has(a.id)) - Number(away.has(b.id)) || edge(b) - edge(a) || (xp[b.id] ?? 0) - (xp[a.id] ?? 0))
  const toggle = (id: string) => setIds((x) => (x.includes(id) ? x.filter((y) => y !== id) : x.length < size ? [...x, id] : x))
  return (
    <div className="sheet-wrap" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <span className="grab" />
        <h3>
          Team wählen <small>
            {ids.length} von {size}
          </small>
        </h3>
        <div className="legend">
          <span>▲ im Vorteil gegen sein Team</span>
          <span>▼ im Nachteil</span>
        </div>
        <div className="pickgrid">
          {list.map((m) => {
            const out = away.has(m.id)
            const e = edge(m)
            const n = ids.indexOf(m.id) + 1
            const f = fighterOf(m, xp)
            return (
              <button key={m.id} className={`pk ${n ? 'on' : ''} ${out ? 'off away' : ''}`} disabled={out} onClick={() => toggle(m.id)}>
                {e !== 1 && <span className={`mark ${e > 1 ? 'up' : 'down'}`}>{e > 1 ? '▲' : '▼'}</span>}
                {n > 0 && <span className="num">{n}</span>}
                <span className="pic" style={{ background: backdrop(m.element) }}>
                  <img src={fighterImg(f)} alt="" />
                </span>
                {out ? 'unterwegs' : `Lv ${f.level}`}
              </button>
            )
          })}
        </div>
        <div className="sheet-foot">
          <span className="bhint">Alle Monster gehören euch beiden, ihr dürft dieselben nehmen.</span>
          <button className="btn" disabled={ids.length === 0} onClick={close}>
            Fertig
          </button>
        </div>
      </div>
    </div>
  )
}
