// Was ist neu: Karte über der Startseite mit allen Neuigkeiten seit dem letzten Öffnen.
import { useBack } from './back'
import type { News } from './news'

export function NewsBox({ news, monsterImg, onDone }: { news: News[]; monsterImg: string; onDone: () => void }) {
  useBack(onDone)
  return (
    <div className="news" onClick={onDone}>
      <div className="news-card" role="dialog" aria-labelledby="news-title" onClick={(e) => e.stopPropagation()}>
        <div className="news-monster">
          <img src={monsterImg} alt="" />
        </div>
        <div className="kicker news-kicker">SEIT DEINEM LETZTEN BESUCH</div>
        <h2 id="news-title" className="news-title">
          Neu in Putzy
        </h2>
        <ul className="news-list">
          {news.map((n) => (
            <li key={n.id}>
              <i className="news-dot" />
              <div>
                <b>{n.title}</b>
                <span>{n.text}</span>
              </div>
            </li>
          ))}
        </ul>
        <button className="news-btn" onClick={onDone}>
          Alles klar!
        </button>
      </div>
    </div>
  )
}
