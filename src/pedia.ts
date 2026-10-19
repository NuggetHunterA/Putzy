// Putzy-Pedia: Texte pro Monsterreihe, Freischalt-Level und was als entdeckt gilt.
import type { Done, Seen, Task } from './db'
import { MAX_LEVEL, MONSTERS, STANDING, elementsOf, levelFor, stageFor, weekStart, type Monster, type MonsterElement, type Person } from './game'

export type Entry = {
  sizes: string[]
  weights: string[]
  // Größenvergleich mit etwas aus dem Haushalt, pro Stufe.
  compare: string[]
  room: string
  // Pedia-Eintrag pro Stufe.
  text: string[]
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
    compare: ['So groß wie ein Wäschekorb', 'So hoch wie eine Waschmaschine', 'So lang wie ein Sofa'],
    room: 'Wohnzimmer',
    text: [
      'Miezo schläft tagsüber in Sonnenflecken und sammelt dabei Licht in seinem Fell. Nachts lässt es den Halbmond auf der Stirn leuchten und findet so jedes verlorene Haargummi unter dem Sofa.',
      'Katzelot trägt seinen roten Umhang nur, wenn das Wohnzimmer aufgeräumt ist. Jeden Abend dreht es eine Runde ums Sofa und schiebt jede Fernbedienung zurück an ihren Platz.',
      'Sphinxar spricht nie, aber seine Kristalle leuchten heller, je weniger auf dem Couchtisch herumliegt. Breitet es die Flügel aus, fliegen die Staubflocken freiwillig aus dem Fenster.',
    ],
    likes: 'frisch geleerte Katzenklos, aufgeräumte Kissen',
    dislikes: 'Krümel auf der Fensterbank, Staubsauger vor 9 Uhr',
    legend: 'Man sagt, Sphinxar habe nie ein Rätsel gestellt. Es schaut nur so lange auf eine unaufgeräumte Ecke, bis jemand freiwillig aufräumt.',
  },
  '2': {
    sizes: ['0,25 m', '1,2 m', '6,5 m'],
    weights: ['1,5 l', '40 l', '1.200 l'],
    compare: ['Passt in eine Salatschüssel', 'So lang wie eine Kinderbadewanne', 'So lang wie ein Kleintransporter'],
    room: 'Bad oben',
    text: [
      'Plitsch besteht zu 100 % aus Wasser und zu 0 % aus Geduld. Es hüpft in jede Pfütze, die es findet, und wischt sie dabei versehentlich auf.',
      'Platschkoi schwimmt am liebsten durch frisch eingelassenes Badewasser. Mit seinen langen Flossen poliert es die Fliesen, bis man sich darin spiegeln kann.',
      'Tsunadra rollt wie eine Welle durchs Bad und lässt nichts als Glanz zurück. Ein einziges Brüllen von ihr löst selbst den hartnäckigsten Kalk.',
    ],
    likes: 'blanke Armaturen, das Geräusch einer vollen Wanne',
    dislikes: 'Kalkflecken, Handtücher auf dem Boden',
    legend: 'Als die erste Tsunadra auftauchte, glänzte die ganze Küste. Seitdem gilt eine einzige Schuppe von ihr als bester Spiegelreiniger der Welt.',
  },
  '3': {
    sizes: ['0,3 m', '0,8 m', '1,7 m'],
    weights: ['0,4 kg', '6 kg', '22 kg'],
    compare: ['So groß wie ein Staubwedel', 'So hoch wie ein Schuhregal', 'So groß wie ein Erwachsener'],
    room: 'Flur',
    text: [
      'Brisi besteht überwiegend aus Luft und guter Laune. Wenn es niest, ist der Flur hinterher staubfrei, und die Fußmatte liegt im Garten.',
      'Wirbelwusel trägt eine Fliegerbrille, weil es beim Rennen durch den Flur selbst Staub aufwirbelt. Es dreht sich so schnell um die eigene Achse, dass jede Ecke danach blitzt.',
      'Taifunox zieht einen kleinen Wirbelsturm hinter sich her, der alles einsammelt, was auf dem Boden liegt. Schuhe, die im Weg stehen, landen dabei manchmal auf dem Dach.',
    ],
    likes: 'offene Fenster, Wollmäuse zum Jagen',
    dislikes: 'verstopfte Staubsaugerbeutel, Windstille',
    legend: "Taifunox' Fliegerbrille stammt angeblich von einem Piloten, der nur kurz durch den Flur wollte. Er hat ihn bis heute nicht wieder gefunden, aber der Flur war noch nie so sauber.",
  },
  '4': {
    sizes: ['0,4 m', '1,6 m', '2,8 m'],
    weights: ['0,1 kg', '2 kg', '9 kg'],
    compare: ['So groß wie ein Putzeimer', 'So hoch wie ein Kühlschrank, aber leichter als ein Kissen', 'Stößt mit dem Kopf an die Zimmerdecke'],
    room: 'Bad unten',
    text: [
      'Schaumi entsteht, wenn jemand viel zu viel Spülmittel nimmt. Jede seiner Blasen schillert in einer anderen Farbe, und wenn eine platzt, ist darunter alles sauber.',
      'Blubbro schrubbt mit einer Bürste, die größer ist als es selbst, und singt dabei mit seinen Quietscheentchen. Je lauter es singt, desto mehr Schaum entsteht.',
      'Spumagon trägt eine Rüstung aus festem Seifenschaum und einen Schwamm als Schild. Es bewacht die Badewanne wie eine Burg, und kein Schmutzrand kommt an ihm vorbei.',
    ],
    likes: 'heiße Wannenbäder, Quietscheentchen',
    dislikes: 'Kakteen, Haare im Abfluss',
    legend: 'Spumagons Schild ist ein Schwamm, der seit tausend Jahren nicht ausgewrungen wurde. Wer ihn einmal auswringt, bekommt angeblich nie wieder eine dreckige Wanne.',
  },
  '5': {
    sizes: ['0,35 m', '1,1 m', '1,9 m'],
    weights: ['4 kg', '19 kg', '45 kg'],
    compare: ['So groß wie ein Kochtopf', 'So hoch wie ein Backofen', 'Mit Schweifen so lang wie eine ganze Küchenzeile'],
    room: 'Küche',
    text: [
      'Funki hält die Herdplatten warm, auch wenn niemand kocht. Eingebrannte Reste brennt es einfach noch einmal ein, bis sie aufgeben und abfallen.',
      'Glutfuchs trägt ein Halstuch, damit keine Funken in den Topf fallen. Es weiß immer genau, wann der Kuchen fertig ist, und schnüffelt so lange am Backofen, bis jemand ihn öffnet.',
      "Infernyx' Flammen sind so heiß, dass Fettspritzer schon in der Luft verdampfen. Ein Schwung seiner fünf Schweife, und die ganze Küche glänzt wie neu.",
    ],
    likes: 'saubere Backöfen, der Geruch von frischem Toast',
    dislikes: 'fettige Dunstabzugshauben, Wasserpistolen',
    legend: 'Infernyx zeigt sich nur in Küchen, deren Backofen nach Jahren endlich gereinigt wurde. Wer es sieht, darf sich ein Gericht wünschen, das nie anbrennt.',
  },
  '6': {
    sizes: ['0,3 m', '1,0 m', '2,5 m'],
    weights: ['5 kg', '60 kg', '900 kg'],
    compare: ['So groß wie ein Komposteimer', 'So groß wie eine Biotonne', 'So schwer wie ein Kleinwagen'],
    room: 'Ganzes Haus',
    text: [
      'Krümel isst alles, was runterfällt, und macht daraus Erde. Das Blatt auf seinem Kopf wächst nur, wenn der Müll pünktlich rausgebracht wird.',
      'Kompostkröte trägt einen kleinen Garten auf dem Rücken, der von Kaffeesatz und Apfelschalen lebt. Sie sitzt am liebsten neben der Biotonne und quakt, wenn jemand sie zu spät rausstellt.',
      'Gaiamoos bewegt sich so langsam, dass auf ihm Pilze und Bäume wachsen. Wo es sich niederlässt, riecht es nach Waldboden statt nach Mülleimer.',
    ],
    likes: 'Kaffeesatz, sortierter Müll',
    dislikes: 'Plastik im Biomüll, Fruchtfliegen',
    legend: "Auf Gaiamoos' Rücken wächst ein ganzer Wald. Forscher vermuten, dass er aus jedem Apfelgriebs entstanden ist, der jemals richtig entsorgt wurde.",
  },
  '7': {
    sizes: ['0,35 m', '1,0 m', '1,9 m'],
    weights: ['1,2 kg', '11 kg', '18 kg'],
    compare: ['So groß wie ein Kopfkissen', 'So hoch wie eine Kommode', 'So lang wie ein Bett'],
    room: 'Schlafzimmer',
    text: [
      'Flausch schüttelt jede Nacht die Kissen auf und fliegt dabei so leise, dass niemand aufwacht. Seine Wolle riecht immer nach frisch gewaschener Bettwäsche.',
      'Wollwächter hält beim Bettenmachen den Kissenbezug fest und strickt aus jeder Fluse einen neuen Schal. Ist eine Socke verschwunden, hat es sie meistens nur ausgeliehen.',
      'Kaschmira schwebt nachts über den Betten und streicht jede Falte glatt. Wer unter ihren Flügeln schläft, wacht garantiert ausgeruht auf.',
    ],
    likes: 'frisch bezogene Betten, warme Socken',
    dislikes: 'Staubmäuse unterm Bett, kratzige Wolldecken',
    legend: 'Kaschmiras Schal ist so lang, dass niemand je sein Ende gefunden hat. Es heißt, er reicht einmal um jedes Bett, das je ordentlich gemacht wurde.',
  },
  '8': {
    sizes: ['0,3 m', '1,3 m', '2,6 m'],
    weights: ['2 kg', '35 kg', '300 kg'],
    compare: ['So groß wie ein Schuhkarton', 'So groß wie ein Grundschulkind', 'Größer als ein Kleiderschrank'],
    room: 'Flur',
    text: [
      'Glitzi sortiert alles nach Farbe, Größe und Glanz. Wenn ein Schuh nicht im Regal steht, blinkt sein Stern so lange, bis jemand ihn wegräumt.',
      'Prismabot hat für jede Aufgabe einen anderen Arm: Bürste, Lappen, Tasse, Socke. Es sortiert die Garderobe nach Regenbogenfarben und piept zufrieden, wenn alles passt.',
      'Kristallos besteht aus tausend glänzenden Splittern, in denen sich jeder Raum spiegelt. Es merkt sofort, wenn irgendwo ein Fleck ist, weil es sich darin nicht mehr richtig sehen kann.',
    ],
    likes: 'ordentliche Garderoben, gefaltete Handtücher',
    dislikes: 'Kram auf der Treppe, verstaubte Regale',
    legend: 'Kristallos ist aus dem allerersten Glitzerstein gewachsen, den jemand beim Aufräumen aufgehoben statt weggeworfen hat. In jedem seiner Splitter bewahrt es etwas auf, das in diesem Haus einmal wiedergefunden wurde.',
  },
  '9': {
    sizes: ['0,2 m', '1,8 m'],
    weights: ['0,8 kg', '45 kg'],
    compare: ['So groß wie ein Toaster', 'So hoch wie eine Kühl-Gefrier-Kombi'],
    room: 'Küche',
    text: [
      'Kokeli wohnt im Toaster und kommt nur raus, wenn es nach Kakao riecht. Mit seiner warmen Schwanzspitze trocknet es nasse Geschirrtücher in drei Sekunden, manchmal auch in zwei und mit kleinem Brandloch.',
      'Salamandor kocht mit einem Pfannenwender und heizt die Pfanne mit seiner glühenden Schwanzspitze vor. Nach dem Essen spült es die Pfanne, bevor jemand überhaupt fragen kann.',
    ],
    likes: 'Pfannkuchen-Sonntage, ein aufgeräumter Gewürzschrank',
    dislikes: 'Kühlschranktüren, die offen stehen, angebrannte Pfannen',
    legend: 'Salamandor trägt eine Kochmütze, die noch nie einen Fleck abbekommen hat. Es heißt, wer in seiner Gegenwart die Pfanne gleich spült, dem brennt nie wieder etwas an, nicht einmal Milch.',
  },
  '10': {
    sizes: ['0,1 m', '0,5 m', '1,4 m', '8,0 m'],
    weights: ['0,2 kg', '3 kg', '40 kg', '2,5 t'],
    compare: ['So groß wie ein Joghurtbecher', 'So groß wie eine Gießkanne', 'So groß wie ein Gartenbesen', 'So hoch wie ein zweistöckiges Haus'],
    room: 'Draußen',
    text: [
      'Samsi ist ein Samenkorn, das beschlossen hat, nicht zu warten. Es rollt nachts durch die Wohnung, sucht sich den hellsten Platz am Fenster und schläft dort ein. Jedes Mal, wenn jemand die Pflanzen gießt, wächst es ein kleines bisschen.',
      'Sprössli trägt seine Schale noch als Mütze und hat immer eine kleine Gießkanne dabei. Es gießt jede Pflanze, an der es vorbeikommt, manchmal auch die künstlichen.',
      'Blattwart fegt mit einem Besen aus Zweigen den Gehweg und lässt dabei Blüten wachsen. Laub im Gully kann es nicht ausstehen und sammelt es sofort ein.',
      'Arborius ist so alt und groß, dass Vögel in seinem Bart wohnen. Mit einem Besen in jeder Hand fegt er den ganzen Garten in einem einzigen Schwung.',
    ],
    likes: 'volle Gießkannen, gefegte Gehwege',
    dislikes: 'vergessene Topfpflanzen, Laub im Gully',
    legend: 'Arborius war einmal ein winziges Samsi in einem Joghurtbecher auf einer Fensterbank. Man sagt, in seinen Ringen steht jede Aufgabe, die je in diesem Haus erledigt wurde, und wer ihm zuhört, hört das Rascheln von hundert Besen.',
  },
  '11': {
    sizes: ['0,4 m', '3,2 m'],
    weights: ['0,6 kg', '55 kg'],
    compare: ['So lang wie eine Klobürste', 'So lang wie zwei Badewannen'],
    room: 'Bad',
    text: [
      'Aali wohnt im Abfluss der Dusche und frisst alles, was dort nicht hingehört. Wenn das Wasser gurgelnd abläuft, ist das Aali, das sich bedankt.',
      'Siphonix schlängelt sich durch jedes Rohr und trägt einen Pümpel wie ein Zepter. Ein kurzes Gurgeln, und der Abfluss ist wieder frei.',
    ],
    likes: 'frei laufende Abflüsse, Haare im Sieb (zum Frühstück)',
    dislikes: 'Rohrreiniger aus der Flasche, Kalkränder',
    legend: 'Siphonix soll durch alle Rohre des Hauses gleichzeitig schwimmen können. Wer nachts ein leises Plätschern im Waschbecken hört, weiß: Hier verstopft so schnell nichts mehr.',
  },
  '12': {
    sizes: ['0,2 m', '0,5 m', '1,6 m'],
    weights: ['0,3 kg', '2 kg', '4 kg'],
    compare: ['So groß wie eine Socke', 'So groß wie ein eingerolltes Badetuch', 'So groß wie ein Wäscheständer'],
    room: 'Waschküche',
    text: [
      'Raupsi wohnt im Wäschekorb und knabbert nur an Fusseln. Es riecht immer nach frischem Weichspüler, und wer den Wäschekorb bis ganz unten ausräumt, findet dort meistens auch Raupsi.',
      'Kokonella hängt an einer Wäscheklammer und wickelt sich in ein frisch gewaschenes Handtuch. Sie schläft, bis die Wäsche trocken ist, und keine Minute länger.',
      'Papillora faltet als Erstes die Wäsche, aus der sie geschlüpft ist. Ihr Flügelstaub glitzert wie Sonne auf frischer Wäsche und hält jedes T-Shirt knitterfrei.',
    ],
    likes: 'warme Wäsche aus dem Trockner, Wäscheklammern',
    dislikes: 'volle Wäschekörbe, die tagelang stehen, Knitterfalten',
    legend: 'Papillora fliegt nur an Tagen, an denen die Wäsche draußen hängt. Wo ihre Flügel ein Laken streifen, ist es danach glatt wie gebügelt.',
  },
  '13': {
    sizes: ['0,3 m', '2,4 m', '18 m'],
    weights: ['2 kg', '300 kg', '9 t'],
    compare: ['Passt in eine Teetasse', 'So lang wie ein Hochbett', 'So lang wie ein ganzes Haus'],
    room: 'Badewanne',
    text: [
      'Tassi planscht am liebsten in Teetassen, die jemand stehen gelassen hat. Wenn es singt, beschlagen alle Spiegel im Haus, und wer genau hinhört, hört das Meer.',
      'Nebelwal schwebt morgens durch das beschlagene Bad und malt mit seiner Flosse Wellen an den Spiegel. Wo er vorbeischwimmt, perlen die Tropfen einfach ab.',
      'Leviara trägt den ganzen Nachthimmel auf dem Rücken. Wenn sie durch die Wohnung gleitet, wird jede Wanne zum See und jedes Waschbecken zum Sternenteich.',
    ],
    likes: 'Schaumbäder, Kamillentee',
    dislikes: 'leere Wannen, Kalk am Duschkopf',
    legend: 'Leviara schwimmt nicht durchs Wasser, sondern durch den Nachthimmel. Man sagt, jeder Stern ist ein Tropfen, den sie beim Auftauchen verloren hat.',
  },
  '14': {
    sizes: ['0,2 m', '0,7 m', '1,8 m'],
    weights: ['0,4 kg', '3 kg', '12 kg'],
    compare: ['So groß wie ein Taschenbuch', 'So hoch wie eine Schreibtischlampe', 'So groß wie ein Bücherregal'],
    room: 'Leseecke',
    text: [
      'Huhu schläft tagsüber zwischen zwei Buchdeckeln und wird erst wach, wenn es draußen dunkel wird. Seine Federn leuchten genau so hell, dass man noch eine Seite weiterlesen kann.',
      'Leuchteule trägt den Lampenschirm wie einen Hut und knipst das Licht an, sobald jemand ein Buch aufschlägt. Mit ihrer Lesebrille entdeckt sie jedes Staubkorn auf dem Regal.',
      'Astralux trägt Sternbilder in den Flügeln und stellt nachts jedes liegen gebliebene Buch zurück ins Regal. Morgens steht alles so gerade, als hätte nie jemand darin gelesen.',
    ],
    likes: 'warmes Leselicht, Lesezeichen',
    dislikes: 'Eselsohren, flackernde Glühbirnen',
    legend: 'Astralux hat noch nie eine Nacht verschlafen. Wer spät noch liest, sieht sie manchmal auf dem Fensterbrett sitzen und spürt, wie das Licht ein bisschen wärmer wird.',
  },
  '15': {
    sizes: ['0,15 m', '0,8 m', '2,2 m'],
    weights: ['0,2 kg', '2,5 kg', '15 kg'],
    compare: ['So groß wie eine Kerze', 'So hoch wie eine Weinflasche', 'Flügel so breit wie ein Esstisch'],
    room: 'Esstisch',
    text: [
      'Dochti sitzt im Kerzenständer und wartet auf gemütliche Abende. Wird eine Kerze ausgepustet, zieht es beleidigt Rauchkringel, bis jemand eine neue anzündet.',
      'Kerzenfalke wacht auf dem Kerzenständer über das Abendessen. Wenn Wachs auf die Tischdecke tropft, fängt er es auf, bevor es fest wird.',
      'Phönixa steigt aus jeder heruntergebrannten Kerze neu empor. Nach einem gemütlichen Abend fegt sie mit ihren glühenden Federn die Krümel vom Tisch.',
    ],
    likes: 'Kerzenschein beim Abendessen, Wachstropfen zum Spielen',
    dislikes: 'Zugluft, Teelichter, die keiner nachfüllt',
    legend: 'Phönixa ist schon tausendmal aus ihrer eigenen Asche aufgestiegen. Man sagt, sie kommt jedes Mal zurück, wenn in einem Haus nach einem langen Winter wieder zusammen gegessen wird.',
  },
  '16': {
    sizes: ['0,2 m', '0,6 m', '2,6 m'],
    weights: ['0,3 kg', '2 kg', '140 kg'],
    compare: ['So groß wie ein Hausschuh', 'So groß wie ein Kissenbezug', 'So lang wie ein Doppelbett'],
    room: 'Dachboden',
    text: [
      'Pusti klaut nachts Kopfkissenbezüge, aber nur, um damit vom Schrank zu segeln. Morgens liegt der Bezug wieder da, nur ein bisschen zerknitterter als vorher.',
      'Segelhörnchen breitet seine Flughaut aus und segelt von Schrank zu Schrank. Unterwegs pflückt es Spinnweben aus jeder Ecke, die man sonst nie erreicht.',
      'Zephyrion reitet auf dem Durchzug, wenn alle Fenster offen sind. Nach einem Flug durchs Haus riecht jedes Zimmer nach frischer Luft und Sommerwiese.',
    ],
    likes: 'offene Dachfenster, Bettwäsche frisch vom Wäscheständer',
    dislikes: 'geschlossene Türen, muffige Luft',
    legend: 'Zephyrion soll schon jeden Wind der Welt geritten haben. Wenn im Herbst ein warmer Windstoß durch den Garten fährt, war das angeblich er, auf dem Weg nach Süden.',
  },
  '17': {
    sizes: ['0,4 m', '1,3 m', '2,8 m'],
    weights: ['4 kg', '80 kg', '400 kg'],
    compare: ['So groß wie ein Blumentopf mit Pflanze', 'So hoch wie eine Gartenbank', 'So hoch wie ein Apfelbaum'],
    room: 'Garten',
    text: [
      'Kitzli nascht heimlich von den Balkonkräutern, aber nur von denen, die sowieso zurückgeschnitten werden müssten. Wo es schläft, wächst am nächsten Morgen ein kleines Kleeblatt.',
      'Farnhirsch trägt ein Geweih aus Farn und knabbert nur welke Blätter von den Pflanzen. Wo er steht, wächst Moos auf den Steinen, aber nie zwischen den Fugen.',
      'Silvarion zieht Blüten und Ranken hinter sich her, wenn er durch den Garten schreitet. Ein Schütteln seines Geweihs, und jedes Beet ist gejätet.',
    ],
    likes: 'frisch gegossene Beete, Morgentau',
    dislikes: 'Laubbläser, Rasenmähen am Sonntagmorgen',
    legend: 'Silvarion wandert nur in Vollmondnächten durch die Gärten. Jeder Baum, an dem er sein Geweih reibt, blüht im nächsten Frühling doppelt so schön.',
  },
  '18': {
    sizes: ['0,15 m', '0,5 m', '1,2 m'],
    weights: ['0,5 kg', '6 kg', '30 kg'],
    compare: ['So groß wie eine Teekanne', 'So hoch wie ein Hocker', 'So groß wie ein aufgestelltes Bügelbrett'],
    room: 'Ganzes Haus',
    text: [
      'Wichti erledigt nachts heimlich alles, was liegen geblieben ist, und lässt sich dabei nie erwischen. Wer morgens einen frisch zusammengelegten Pullover findet, den keiner gefaltet hat, weiß Bescheid.',
      'Heinzel trägt Besen und Fingerhut immer bei sich und flickt nachts, was kaputt ist. Quietscht morgens keine Tür mehr, war er nachts mit dem Ölkännchen unterwegs.',
      'Domovar wandert mit seiner Laterne durchs schlafende Haus und schaut, ob alles an seinem Platz ist. An seinem Gürtel hängt ein Schlüssel für jede Tür, die es je hier gab.',
    ],
    likes: 'einmalige Aufgaben, die endlich jemand angeht, Milch und Kekse',
    dislikes: 'neugierige Blicke, Zettel mit „Mach ich morgen“',
    legend: 'Domovar hat dieses Haus schon gehütet, bevor es gebaut wurde. Er zeigt sich nur denen, die jedem Element ein Monster großgezogen haben, und seitdem verschwindet in diesem Haus nie wieder ein Schlüssel.',
  },
  '19': {
    sizes: ['0,1 m', '0,6 m', '2,4 m'],
    weights: ['0,05 kg', '4 kg', '600 kg'],
    compare: ['So groß wie ein Spülschwamm', 'So groß wie ein Aquarium', 'So hoch wie ein Kleiderschrank'],
    room: 'Küchenspüle',
    text: [
      'Porli sieht aus wie der Schwamm neben der Spüle und wird deshalb ständig ausgewrungen. Es nimmt das niemandem übel, im Gegenteil: Je öfter es benutzt wird, desto glücklicher quietscht es.',
      'Riffling hat das Spülbecken verlassen und wohnt jetzt im Aquarium. Durch seine Poren schwimmen kleine Fische ein und aus, und es kichert dabei, weil es kitzelt.',
      'Korallgard trägt ein ganzes Riff auf dem Rücken. Wo er sich hinsetzt, wird das Wasser klar, und in seinen Korallen wohnen mehr Fische als in jedem Zoogeschäft.',
    ],
    likes: 'warmes Spülwasser, jeden einzelnen Tag am Stück',
    dislikes: 'ausgetrocknete Schwämme, Stahlwolle',
    legend: 'Man sagt, Korallgard sei aus dem ersten Schwamm gewachsen, den jemand sieben Tage lang jeden Abend ausgewaschen hat. Seitdem wächst sein Riff um eine Koralle, wann immer ein Haushalt eine ganze Woche durchhält.',
  },
  '20': {
    sizes: ['0,08 m', '0,7 m', '4 m (Spannweite der Scheren)'],
    weights: ['0,1 kg', '9 kg', '2 t'],
    compare: ['So groß wie ein Eierbecher', 'So hoch wie ein Wäschekorb', 'So breit wie ein Carport'],
    room: 'Strandkorb',
    text: [
      'Knacki wohnt in einem Schneckenhaus, das ihm eigentlich zwei Nummern zu groß ist. Es sammelt alles, was glänzt, und versteckt es darin, am liebsten verlorene Ohrringe.',
      'Scherenritter trägt seinen Panzer wie eine Rüstung mit Visier und grüßt jeden mit erhobener Schere. Er hält Wache an der Haustür, bis alle Schuhe ordentlich stehen.',
      'Abyssor schläft auf dem Meeresgrund und trägt ein altes Schiffswrack als Haus auf dem Rücken. Wenn er sich umdreht, entsteht an der Küste eine sanfte Welle.',
    ],
    likes: 'Muscheln mit Perlmutt, Sandburgen',
    dislikes: 'Fischernetze, Sand in den Schuhen',
    legend: 'In Abyssors Wrack sollen alle Dinge liegen, die je ins Meer gefallen sind. Wer am Strand eine Flaschenpost findet, hat angeblich einen Brief von ihm bekommen.',
  },
  '21': {
    sizes: ['0,5 m', '2,5 m', '6 m'],
    weights: ['6 kg', '300 kg', '1,5 t'],
    compare: ['So groß wie ein Bobbycar', 'So hoch wie eine Zimmerdecke', 'So hoch wie ein zweistöckiges Haus'],
    room: 'Dachterrasse',
    text: [
      'Tupfi ist so neugierig, dass es den Hals schon als Baby nach jedem Geräusch reckt. Seine Flecken werden warm wie Wärmflaschen, und an kalten Abenden kuschelt sich jeder gern an.',
      'Steppenhals frühstückt nur die obersten Blätter und schaut dabei über jeden Zaun. Auf dem Dachboden findet es Dinge, die seit Jahren keiner mehr gesehen hat.',
      'Serengo trägt die Abendsonne hinter dem Kopf mit sich herum. Wo es entlangläuft, wird es warm, und im Winter folgen ihm die Spatzen in einer langen Reihe.',
    ],
    likes: 'Sonnenuntergänge, hohe Regalbretter',
    dislikes: 'niedrige Türrahmen, Regentage',
    legend: 'Serengo soll die Sonne jeden Abend mit dem Kopf über den Horizont schieben. Wer bei Sonnenuntergang genau hinsieht, erkennt manchmal einen langen Hals vor dem roten Himmel.',
  },
  '22': {
    sizes: ['0,2 m', '1,6 m', '30 m (mit Waggons)'],
    weights: ['1 kg', '800 kg', '120 t'],
    compare: ['So groß wie ein Toaster', 'So lang wie ein Sofa', 'So lang wie ein Wohnhaus'],
    room: 'Kinderzimmer',
    text: [
      'Bimmli fährt nachts im Kreis um den Weihnachtsbaum, auch wenn gerade gar nicht Weihnachten ist. Seine kleine Glocke bimmelt immer dann, wenn jemand etwas fallen lässt.',
      'Signalok schaltet seine Laterne an, sobald es dunkel wird, und bringt jeden sicher bis zum Lichtschalter. Es hält nie zu spät, aber auch nie zu früh.',
      'Aurorail fährt auf Schienen aus Polarlicht über den Himmel. Seine Waggons sind leer, bis jemand einen Wunsch hat, dann nimmt es ihn mit.',
    ],
    likes: 'Pünktlichkeit, frisch geölte Räder',
    dislikes: 'Weichen, die klemmen, Legosteine auf den Gleisen',
    legend: 'Aurorail fährt nur in den längsten Nächten des Jahres. Wer dann noch wach ist, hört ganz leise eine Glocke und sieht am Himmel einen bunten Schweif.',
  },
  '23': {
    sizes: ['0,2 m (Spannweite)', '1,5 m (Spannweite)', '12 m (Spannweite)'],
    weights: ['0,005 kg', '25 kg', '3 t'],
    compare: ['So groß wie ein Blatt Papier', 'So breit wie ein Esstisch', 'So breit wie ein Tennisplatz'],
    room: 'Arbeitszimmer',
    text: [
      'Faltli wurde aus einem alten Einkaufszettel gefaltet und ist sofort losgeflogen. Es landet am liebsten auf Schreibtischen und bringt dabei jeden Papierstapel durcheinander.',
      'Propello hat sich aus Holz und Draht einen Propeller gebaut und fliegt damit Runden durchs Treppenhaus. Wenn es brummt, öffnet jemand freiwillig das Fenster.',
      'Stratonaut fliegt so hoch, dass es über den Wolken immer Sonne hat. Von dort oben sieht es jedes Haus, in dem gerade jemand lüftet, und winkt mit den Flügeln.',
    ],
    likes: 'offene Fenster, Rückenwind',
    dislikes: 'Gewitter, zerknülltes Papier',
    legend: 'Stratonaut soll einmal ohne Pause um die ganze Welt geflogen sein, nur um einen verlorenen Papierflieger zurückzubringen. Seitdem landen alle Papierflieger in diesem Haus sanft.',
  },
  '24': {
    sizes: ['0,05 m', '0,4 m', '2 m (mit Beinen 5 m)'],
    weights: ['0,01 kg', '2 kg', '90 kg'],
    compare: ['So groß wie ein Fingerhut', 'So groß wie eine Gießkanne', 'So breit wie ein Gartenhaus'],
    room: 'Gartenhecke',
    text: [
      'Tauli spinnt nachts ein winziges Netz zwischen zwei Grashalmen und sammelt darin Tautropfen. Morgens glitzert es, und Tauli trinkt sie einen nach dem anderen.',
      'Moosweber trägt ein weiches Mooskissen auf dem Rücken und webt Netze zwischen den Hecken. Fliegen fängt es nie, nur Pollen, die es dann den Bienen schenkt.',
      'Florachne webt ihre Netze aus blühenden Ranken. Wo sie eine Nacht verbringt, hängt am Morgen eine Blütengirlande zwischen den Bäumen.',
    ],
    likes: 'Morgentau, ungestörte Hecken',
    dislikes: 'Besen in den Ecken, Spinnen-Schreie',
    legend: 'Florachne soll den ersten Garten der Welt zusammengewebt haben, Faden für Faden. Wer im Spätsommer einen silbernen Faden durch die Luft schweben sieht, hat ein Stück davon entdeckt.',
  },
  '25': {
    sizes: ['0,1 m', '1 m', '5 m'],
    weights: ['2 kg', '250 kg', '40 t'],
    compare: ['So groß wie ein Briefbeschwerer', 'So hoch wie ein Gartenzaun', 'So hoch wie eine Laterne'],
    room: 'Gartenmauer',
    text: [
      'Kiesli lag jahrelang als Türstopper im Flur, bis es eines Tages einfach weggerollt ist. Es mag einmalige Aufgaben, weil die endlich etwas bewegen, genau wie es selbst.',
      'Ziegelbert ist aus alten Ziegeln zusammengesetzt und stellt sich überall hin, wo etwas wackelt. Wird im Haus gebohrt oder gestrichen, ist er der Erste, der hilft.',
      'Zitadell ist eine wandernde Burgmauer mit Zinnen auf den Schultern. In den Mauerritzen nisten Vögel, und keiner kommt ihm zu nahe, der Unordnung im Gepäck hat.',
    ],
    likes: 'Projekte, die endlich fertig werden, Sonnenwärme auf der Mauer',
    dislikes: 'Risse im Putz, Graffiti',
    legend: 'Zitadell soll jede Burg der Welt einmal besucht und von jeder einen Stein mitgenommen haben. Darum passt keiner seiner Steine zum anderen, und trotzdem hält er stärker als jede Mauer.',
  },
  '26': {
    sizes: ['0,15 m', '0,6 m (Spannweite 1,4 m)', '1,8 m (Spannweite 5 m)'],
    weights: ['0,08 kg', '3 kg', '45 kg'],
    compare: ['So groß wie eine Kaffeetasse', 'So breit wie ein Bügelbrett', 'So breit wie ein Carport'],
    room: 'Dachboden',
    text: [
      'Mondi schaukelt nachts kopfüber an einer kleinen Mondsichel und schläft tagsüber hinter dem Dachbalken. Wo es hängt, liegt am Morgen kein einziges Spinnennetz mehr.',
      'Sichelflatter leuchtet von innen wie Mondlicht und fliegt nachts durch die Flure, ohne irgendwo anzustoßen. Den Kürbis trägt es das ganze Jahr, falls jemand im Dunkeln den Lichtschalter sucht.',
      'Noctiluna breitet die Flügel aus, und hinter ihr geht der Vollmond auf. Ein Flügelschlag weht das ganze Herbstlaub vom Hof, ein zweiter lüftet das Haus bis in die letzte Ecke.',
    ],
    likes: 'Vollmondnächte, offene Dachfenster',
    dislikes: 'grelle Deckenlampen, Spinnweben im Gebälk',
    legend: 'Man sagt, Noctiluna habe den Mond einmal eine ganze Nacht lang festgehalten, damit ein verirrtes Kind nach Hause fand. Seitdem ist es an Halloween nie ganz dunkel.',
  },
  '27': {
    sizes: ['0,15 m', '0,7 m', '2,2 m'],
    weights: ['0,4 kg', '9 kg', '160 kg'],
    compare: ['So groß wie ein Tannenzapfen', 'So hoch wie ein Adventskranz-Ständer', 'So hoch wie ein Weihnachtsbaum im Wohnzimmer'],
    room: 'Vorgarten',
    text: [
      'Zapfi rollt sich bei Kälte zu einem Tannenzapfen zusammen und wartet im Schnee, bis jemand die Haustür öffnet. Dann kugelt es hinein und fegt dabei den Matsch von der Fußmatte.',
      'Nadelpelz trägt einen Mantel aus Tannenzweigen und einen Schal, den es selbst gestrickt hat. Es sammelt Zapfen für den Kamin und lässt dabei nie eine Nadel auf dem Teppich liegen.',
      'Lichterborst ist ein wandelnder Weihnachtsbaum. In seinen Kugeln brennt ein warmes Feuer, und wo es sich zur Ruhe legt, wird das ganze Zimmer gemütlich warm.',
    ],
    likes: 'Pulverschnee, Plätzchenduft',
    dislikes: 'nadelnde Billigbäume, Staubsauger unter dem Christbaum',
    legend: 'Lichterborst soll jedes Jahr in der Heiligen Nacht durch den Wald gehen und allen Tannen ein Licht schenken. Wer am Weihnachtsmorgen einen leuchtenden Zapfen findet, hat seine Spur entdeckt.',
  },
  '28': {
    sizes: ['0,3 m', '2,5 m', '12 m'],
    weights: ['2 kg', '60 kg', '900 kg'],
    compare: ['So groß wie ein Reiskocher', 'So lang wie ein Sofa', 'So lang wie ein Linienbus'],
    room: 'Küche',
    text: [
      'Zündi trägt seine Laterne überallhin und pustet kleine Flammen, wenn es sich freut. Den Herd heizt es lieber selbst vor, als den Knopf zu drehen.',
      'Lampionlong windet sich durch die Wohnung und hängt dabei Lampions auf, wo es dunkel ist. Rote Umschläge verteilt es an jeden, der seine Aufgaben geschafft hat.',
      'Wolkenkaiser reitet auf Wolken und hält eine Feuerperle in der Klaue. Wenn es über das Haus zieht, weht der alte Staub hinaus und das Glück für das neue Jahr herein.',
    ],
    likes: 'Feuerwerk, frisch geputzte Fenster zum neuen Jahr',
    dislikes: 'Besen am Neujahrstag, kalte Herdplatten',
    legend: 'Man sagt, Wolkenkaiser bringe jedes Jahr zum neuen Mond eine Perle vom Himmel mit. Wer am Neujahrsmorgen das Haus geputzt hat, findet ihr Leuchten in der Fensterscheibe.',
  },
}

// Pedia-Reihenfolge nach Nummer, nicht nach Element wie in der Monsterwahl.
export const PEDIA_ORDER = [...MONSTERS].sort((a, b) => Number(a.id) - Number(b.id))

// Gezählt werden nur sichtbare Reihen (geheime erst nach ihrer Freischaltung, src/secret.ts).
export const dexTotal = (monsters: Monster[]) => monsters.reduce((n, m) => n + m.stages.length, 0)

// Fortlaufende Nummer über alle Stufen der Reihen davor, denn Reihen haben 2 bis 4 Stufen. Geheime Reihen zählen mit,
// damit die Nummern fest bleiben, egal welche zuerst freigeschaltet wird.
export const dexNo = (m: Monster, stage: number) =>
  String(PEDIA_ORDER.slice(0, PEDIA_ORDER.indexOf(m)).reduce((n, r) => n + r.stages.length, 0) + stage + 1).padStart(2, '0')

export const lastStage = (m: Monster) => m.stages.length - 1

// Stufe 1 ist immer sichtbar, die anderen, sobald einer von euch die Entwicklung gesehen hat.
export const isDiscovered = (seen: Seen[], monster: string, stage: number) =>
  stage === 0 || seen.some((s) => s.monster === monster && s.stage === stage)

export const discoveredCount = (seen: Seen[], monsters: Monster[]) =>
  monsters.reduce((n, m) => n + m.stages.filter((_, s) => isDiscovered(seen, m.id, s)).length, 0)

// Listenansicht: jede Stufe einzeln. Ein Zweitelement gehört nur zur Endstufe und erst, wenn die Reihe sie erreicht hat.
export type DexFilter = MonsterElement | 'alle'
export type ListStage = { m: Monster; stage: number; elements: MonsterElement[] }

export const stageElements = (m: Monster, stage: number, xp: number) => (stage === lastStage(m) ? elementsOf(m, xp) : [m.element])

export const listStages = (monsters: Monster[], monsterXp: Record<string, number>, filter: DexFilter): ListStage[] =>
  PEDIA_ORDER.filter((m) => monsters.includes(m))
    .flatMap((m) => m.stages.map((_, stage) => ({ m, stage, elements: stageElements(m, stage, monsterXp[m.id] ?? 0) })))
    .filter((s) => filter === 'alle' || s.elements.includes(filter))

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

// Legenden-Szene auf Level 30: in seen als eigene Stufe gemerkt, damit jede Person sie einmal sieht.
export const LEGEND_STAGE = 30

export const unseenLegends = (seen: Seen[], person: Person, monsterXp: Record<string, number>) =>
  PEDIA_ORDER.filter((m) => levelFor(monsterXp[m.id] ?? 0) === MAX_LEVEL && !seen.some((s) => s.person === person && s.monster === m.id && s.stage === LEGEND_STAGE))

export type Stats = { favorite: { name: string; tasks: number } | null; since: Date | null; record: { tasks: number; week: number } | null }

// Kalenderwoche nach ISO (Woche mit dem ersten Donnerstag ist KW 1).
export function isoWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round((d.getTime() - jan4.getTime()) / 864e5 / 7 - (3 - ((jan4.getDay() + 6) % 7)) / 7)
}

// Eure Werte im Steckbrief: häufigste Aufgabe (ohne einmalige), erste Erledigung und die Woche mit den meisten.
export function monsterStats(done: Done[], monster: string, tasks: Task[]): Stats {
  const mine = done.filter((c) => c.monster === monster)
  const names = new Map<string, number>()
  const weeks = new Map<string, { tasks: number; at: Date }>()
  let since: Date | null = null
  for (const c of mine) {
    const at = new Date(c.done_at)
    if (!since || at < since) since = at
    const name = c.standing ? STANDING.find((s) => s.id === c.standing)?.name : tasks.find((t) => t.id === c.task_id)?.name
    if (name) names.set(name, (names.get(name) ?? 0) + 1)
    const w = weekStart(at)
    weeks.set(w, { tasks: (weeks.get(w)?.tasks ?? 0) + 1, at })
  }
  const favorite = [...names].reduce<[string, number] | null>((a, b) => (!a || b[1] > a[1] ? b : a), null)
  const best = [...weeks.values()].reduce<{ tasks: number; at: Date } | null>((a, b) => (!a || b.tasks > a.tasks ? b : a), null)
  return { favorite: favorite && { name: favorite[0], tasks: favorite[1] }, since, record: best && { tasks: best.tasks, week: isoWeek(best.at) } }
}
