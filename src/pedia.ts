// Putzy-Pedia: Texte pro Monsterreihe, Freischalt-Level und was als entdeckt gilt.
import type { Seen } from './db'
import { MONSTERS, levelFor, stageFor, type Monster, type Person } from './game'

export type Entry = {
  sizes: string[]
  weights: string[]
  room: string
  text: string
  likes: string
  dislikes: string
  legend: string
}

// Ab diesem Level ist der jeweilige Infoblock sichtbar. Die Stufen kommen mit STAGE_LEVELS.
export const UNLOCK = { facts: 5, entry: 15, quirk: 20, legend: 30 }
export const UNLOCK_LEVELS = Object.values(UNLOCK)

export const PEDIA: Record<string, Entry> = {
  '1': {
    sizes: ['0,3 m', '0,9 m', '2,1 m'],
    weights: ['3,5 kg', '14 kg', '48 kg'],
    room: 'Wohnzimmer',
    text: 'Miezo schläft tagsüber in Sonnenflecken und sammelt dabei Licht in seinem Fell. Nachts lässt es den Halbmond auf der Stirn leuchten und findet so jedes verlorene Haargummi unter dem Sofa.',
    likes: 'frisch geleerte Katzenklos, aufgeräumte Kissen',
    dislikes: 'Krümel auf der Fensterbank, Staubsauger vor 9 Uhr',
    legend: 'Man sagt, Sphinxar habe nie ein Rätsel gestellt. Es schaut nur so lange auf eine unaufgeräumte Ecke, bis jemand freiwillig aufräumt.',
  },
  '2': {
    sizes: ['0,25 m', '1,2 m', '6,5 m'],
    weights: ['1,5 l', '40 l', '1.200 l'],
    room: 'Bad oben',
    text: 'Plitsch besteht zu 100 % aus Wasser und zu 0 % aus Geduld. Es hüpft in jede Pfütze, die es findet, und wischt sie dabei versehentlich auf.',
    likes: 'blanke Armaturen, das Geräusch einer vollen Wanne',
    dislikes: 'Kalkflecken, Handtücher auf dem Boden',
    legend: 'Als die erste Tsunadra auftauchte, glänzte die ganze Küste. Seitdem gilt eine einzige Schuppe von ihr als bester Spiegelreiniger der Welt.',
  },
  '3': {
    sizes: ['0,3 m', '0,8 m', '1,7 m'],
    weights: ['0,4 kg', '6 kg', '22 kg'],
    room: 'Flur',
    text: 'Fluffi besteht überwiegend aus Luft und guter Laune. Wenn es niest, ist der Flur hinterher staubfrei, und die Fußmatte liegt im Garten.',
    likes: 'offene Fenster, Wollmäuse zum Jagen',
    dislikes: 'verstopfte Staubsaugerbeutel, Windstille',
    legend: "Taifunox' Fliegerbrille stammt angeblich von einem Piloten, der nur kurz durch den Flur wollte. Er hat ihn bis heute nicht wieder gefunden, aber der Flur war noch nie so sauber.",
  },
  '4': {
    sizes: ['0,4 m', '1,6 m', '2,8 m'],
    weights: ['0,1 kg', '2 kg', '9 kg'],
    room: 'Bad unten',
    text: 'Schaumi entsteht, wenn jemand viel zu viel Spülmittel nimmt. Jede seiner Blasen schillert in einer anderen Farbe, und wenn eine platzt, ist darunter alles sauber.',
    likes: 'heiße Wannenbäder, Quietscheentchen',
    dislikes: 'Kakteen, Haare im Abfluss',
    legend: 'Spumagons Schild ist ein Schwamm, der seit tausend Jahren nicht ausgewrungen wurde. Wer ihn einmal auswringt, bekommt angeblich nie wieder eine dreckige Wanne.',
  },
  '5': {
    sizes: ['0,35 m', '1,1 m', '3,4 m Spannweite'],
    weights: ['4 kg', '19 kg', '31 kg'],
    room: 'Küche',
    text: 'Funki hält die Herdplatten warm, auch wenn niemand kocht. Eingebrannte Reste brennt es einfach noch einmal ein, bis sie aufgeben und abfallen.',
    likes: 'saubere Backöfen, der Geruch von frischem Toast',
    dislikes: 'fettige Dunstabzugshauben, Wasserpistolen',
    legend: 'Infernyx steigt aus jedem Backofen, der nach Jahren endlich gereinigt wurde. Wer es sieht, darf sich ein Gericht wünschen, das nie anbrennt.',
  },
  '6': {
    sizes: ['0,3 m', '1,0 m', '2,5 m'],
    weights: ['5 kg', '60 kg', '900 kg'],
    room: 'Ganzes Haus',
    text: 'Krümel isst alles, was runterfällt, und macht daraus Erde. Das Blatt auf seinem Kopf wächst nur, wenn der Müll pünktlich rausgebracht wird.',
    likes: 'volle Gießkannen, sortierter Müll',
    dislikes: 'Plastik im Biomüll, vertrocknete Zimmerpflanzen',
    legend: "Auf Gaiamoos' Rücken wächst ein ganzer Wald. Forscher vermuten, dass er aus jedem Apfelgriebs entstanden ist, der jemals richtig entsorgt wurde.",
  },
  '7': {
    sizes: ['0,35 m', '1,0 m', '1,9 m'],
    weights: ['1,2 kg', '11 kg', '18 kg'],
    room: 'Schlafzimmer',
    text: 'Flausch schüttelt jede Nacht die Kissen auf und fliegt dabei so leise, dass niemand aufwacht. Seine Wolle riecht immer nach frisch gewaschener Bettwäsche.',
    likes: 'frisch bezogene Betten, warme Socken',
    dislikes: 'Staubmäuse unterm Bett, kratzige Wolldecken',
    legend: 'Kaschmiras Schal ist so lang, dass niemand je sein Ende gefunden hat. Es heißt, er reicht einmal um jedes Bett, das je ordentlich gemacht wurde.',
  },
  '8': {
    sizes: ['0,3 m', '1,3 m', '2,6 m'],
    weights: ['2 kg', '35 kg', '300 kg'],
    room: 'Flur',
    text: 'Funkel sortiert alles nach Farbe, Größe und Glanz. Wenn ein Schuh nicht im Regal steht, blinkt sein Stern so lange, bis jemand ihn wegräumt.',
    likes: 'ordentliche Garderoben, gefaltete Handtücher',
    dislikes: 'einzelne Socken, verstaubte Regale',
    legend: 'Kristallos wurde aus allen verlorenen Socken der Welt zusammengesetzt, die es je wiedergefunden hat. Die fehlende linke Socke sucht es bis heute.',
  },
  '9': {
    sizes: ['0,2 m', '1,8 m'],
    weights: ['0,8 kg', '45 kg'],
    room: 'Küche',
    text: 'Kokeli wohnt im Toaster und kommt nur raus, wenn es nach Kakao riecht. Mit seiner warmen Schwanzspitze trocknet es nasse Geschirrtücher in drei Sekunden, manchmal auch in zwei und mit kleinem Brandloch.',
    likes: 'blitzblanke Herdplatten, Pfannkuchen-Sonntage',
    dislikes: 'Kühlschranktüren, die offen stehen, Spritzer auf dem Ceranfeld',
    legend: 'Salamandor trägt eine Kochmütze aus Rauch, die nie verweht. Es heißt, wer in seiner Gegenwart den Herd abwischt, dem brennt nie wieder etwas an, nicht einmal Milch.',
  },
  '10': {
    sizes: ['0,1 m', '0,5 m', '1,4 m', '8,0 m'],
    weights: ['0,2 kg', '3 kg', '40 kg', '2,5 t'],
    room: 'Draußen',
    text: 'Samsi ist ein Samenkorn, das beschlossen hat, nicht zu warten. Es rollt nachts durch die Wohnung, sucht sich den hellsten Platz am Fenster und schläft dort ein. Jedes Mal, wenn jemand die Pflanzen gießt, wächst es ein kleines bisschen.',
    likes: 'volle Gießkannen, gefegte Gehwege',
    dislikes: 'vergessene Topfpflanzen, Laub im Gully',
    legend: 'Arborius war einmal ein winziges Samsi in einem Joghurtbecher auf einer Fensterbank. Man sagt, in seinen Ringen steht jede Aufgabe, die je in diesem Haus erledigt wurde, und wer ihm zuhört, hört das Rascheln von hundert Besen.',
  },
  '11': {
    sizes: ['0,4 m', '3,2 m'],
    weights: ['0,6 kg', '55 kg'],
    room: 'Bad',
    text: 'Aali wohnt im Abfluss der Dusche und frisst alles, was dort nicht hingehört. Wenn das Wasser gurgelnd abläuft, ist das Aali, das sich bedankt.',
    likes: 'blanke Armaturen, Haare im Sieb (zum Frühstück)',
    dislikes: 'Rohrreiniger aus der Flasche, Kalkränder',
    legend: 'Siphonix soll durch alle Rohre des Hauses gleichzeitig schwimmen können. Wer nachts ein leises Plätschern im Waschbecken hört, weiß: Hier verstopft so schnell nichts mehr.',
  },
  '12': {
    sizes: ['0,2 m', '0,5 m', '1,6 m'],
    weights: ['0,3 kg', '2 kg', '4 kg'],
    room: 'Waschküche',
    text: 'Raupsi wohnt im Wäschekorb und knabbert nur an Fusseln. Es riecht immer nach frischem Weichspüler, und wer eine Socke ohne Partner findet, findet meistens auch Raupsi.',
    likes: 'warme Wäsche aus dem Trockner, Wäscheklammern',
    dislikes: 'volle Wäschekörbe, die tagelang stehen, Knitterfalten',
    legend: 'Papillora fliegt nur an Tagen, an denen die Wäsche draußen hängt. Wo ihre Flügel ein Laken streifen, ist es danach glatt wie gebügelt.',
  },
}

// Pedia-Reihenfolge nach Nummer, nicht nach Element wie in der Monsterwahl.
export const PEDIA_ORDER = [...MONSTERS].sort((a, b) => Number(a.id) - Number(b.id))

export const DEX_TOTAL = MONSTERS.reduce((n, m) => n + m.stages.length, 0)

// Fortlaufende Nummer über alle Stufen der Reihen davor, denn Reihen haben 2 bis 4 Stufen.
export const dexNo = (m: Monster, stage: number) =>
  String(PEDIA_ORDER.slice(0, PEDIA_ORDER.indexOf(m)).reduce((n, r) => n + r.stages.length, 0) + stage + 1).padStart(2, '0')

export const lastStage = (m: Monster) => m.stages.length - 1

// Stufe 1 ist immer sichtbar, die anderen, sobald einer von euch die Entwicklung gesehen hat.
export const isDiscovered = (seen: Seen[], monster: string, stage: number) =>
  stage === 0 || seen.some((s) => s.monster === monster && s.stage === stage)

export const discoveredCount = (seen: Seen[]) =>
  MONSTERS.reduce((n, m) => n + m.stages.filter((_, s) => isDiscovered(seen, m.id, s)).length, 0)

// Erreichte Entwicklungen, die diese Person noch nicht gesehen hat, in Abspiel-Reihenfolge.
export function unseen(seen: Seen[], person: Person, monsterXp: Record<string, number>) {
  return PEDIA_ORDER.flatMap((m) =>
    m.levels
      .map((_, i) => i + 1)
      .filter((stage) => stage <= stageFor(m, levelFor(monsterXp[m.id] ?? 0)))
      .filter((stage) => !seen.some((s) => s.person === person && s.monster === m.id && s.stage === stage))
      .map((stage) => ({ monster: m, stage })),
  )
}
