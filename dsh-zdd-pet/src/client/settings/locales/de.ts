/**
 * 设置页德语文案；键集与 zh 完全一致。
 */
import type { Key } from './zh.ts';

export const de: Record<Key, string> = {
  nav: 'Desktop-Pet-Konfiguration',
  intro: 'Mehrere Pets verwalten: Jedes Pet hat eigene Größe und Position (gilt sofort nach dem Speichern).',
  // 卡片标题与卡片级说明；说明统一进问号气泡。
  petCardTitle: 'Pet-Konfiguration',
  avatarLabel: 'Avatar',
  avatarHint:
    'Das kleine Bild neben den Nachrichten dieses Pets im Chatfenster. Ohne Upload erscheint das Standard-Logo des Plugins; ein Upload greift sofort und ersetzt das vorherige — „Speichern" ist nicht nötig.',
  avatarUpload: 'Avatar hochladen',
  avatarChange: 'Ändern',
  avatarUploading: 'Wird hochgeladen…',
  avatarUploaded: 'Avatar aktualisiert',
  petCardHint:
    'Einstellungen pro Pet: Name / Größe / Anzeige / Position / Offsets / die vier Funktionsschalter. Nach dem Ändern unten auf „Speichern" klicken – gilt sofort.',
  globalTitle: 'Globale Schalter',
  globalHint:
    'Gilt für alle Pets (ein Pet-Pack kann dies in seiner Art-Datei überschreiben). Diese Schalter ändern nur den lokalen Zustand und werden beim „Speichern" mit in die Benutzerkonfiguration geschrieben (kein sofortiges Schreiben); Systembenachrichtigungen werden nach dem Speichern sofort neu eingelesen, ohne Neuladen der Seite.',
  cornerHint: 'An welcher Bildschirmecke das Pet klebt (im Desktop-Modus pro Monitor-Arbeitsbereich).',
  marginXHint: 'Horizontaler Abstand zur gewählten Ecke (px), beliebige Zahl.',
  marginYHint: 'Vertikaler Abstand zur gewählten Ecke (px), beliebige Zahl.',
  // 「/」命令菜单的行标题（图标由 app.ts 经 command-faces.ts 补上）。
  'cmd.chat': 'Chat',
  'cmd.pet': 'Pet',
  'cmd.balance': 'Guthaben',
  'shortcut.open': 'Pet-Chat öffnen',
  'shortcut.chat': 'Chatfenster öffnen',
  'shortcut.hear': 'Spracheingabe',
  'shortcut.capture': 'Bildschirmfoto in den Chat',
  shortcutCardTitle: 'Tastenkürzel',
  shortcutCardHint: 'Aufgeklappt zwei Gruppen: Pet-Tastenkürzel und globale Tastenkürzel.',
  shortcutRowChat: 'Chat öffnen',
  shortcutRowHold: 'Zum Sprechen halten',
  shortcutRowHear: 'Spracheingabe',
  shortcutRowCapture: 'Bildschirmfoto',
  shortcutRowPaste: 'Bild einfügen',
  shortcutRowTodo: 'Aufgaben',
  shortcutRowSleep: 'Schlafen / Aufwachen',
  shortcutRowDisplay: 'Anzeigeposition',
  shortcutRowSidebar: 'Seitenleisten-Chat öffnen',
  shortcutGroupPet: 'Pet-Tastenkürzel',
  shortcutGroupPetHint:
    'Im Web genügt der Zeiger auf dem Pet. Im Desktop-Fenster zuerst auf das Pet klicken, damit es den Tastaturfokus bekommt.',
  shortcutGroupGlobal: 'Globale Tastenkürzel',
  shortcutGroupGlobalHint:
    'Werden von DSH im Web und im Desktop-Fenster verteilt; änderbar unter Einstellungen → Allgemein → Tastenkürzel.',
  petsLabel: 'Pet-Liste',
  add: 'Pet hinzufügen',
  remove: 'Entfernen',
  confirmRemove: 'Pet „{id}" wirklich löschen?',
  confirmTitle: 'Aktion bestätigen',
  cancel: 'Abbrechen',
  ok: 'Verstanden',
  atLeastOne: 'Mindestens ein Pet muss erhalten bleiben.',
  emptyPets: 'Noch keine Pets – auf „Pet hinzufügen" klicken, um eines zu erstellen.',
  sizeLabel: 'Größe (Breite px)',
  sizeHint: 'Höhe automatisch = Breite × 9/16.',
  sizePercentLabel: 'Max. Bildschirmbreite (%)',
  sizePercentHint:
    'Wie viel der Bildschirmbreite der Pet höchstens einnimmt: 100 = nie breiter als ein Bildschirm (bei breiten Fenstern identisch mit px); 30–40 macht ihn auf dem Handy deutlich kleiner, ohne den Desktop zu verändern. Wird beim Laden einmal berechnet; nach Größenänderung neu laden.',
  nameLabel: 'Name',
  nameHint:
    'Anzeigename: erscheint beim Hovern über dem Pet und fließt in die KI-Persona ein („Dein Name ist X"). Doppelt erlaubt; leer = es gilt die Pet-ID.',
  personaLabel: 'Persona (optional)',
  personaHint:
    'Gilt nur für dieses Pet. Leer lassen = Persona des Eintrags übernehmen – der graue Text im Feld ist genau diese. Das tatsächlich an das Modell gesendete System = dieser Text + automatisch angehängtem Hinweis „Dein Name ist <Name>" + aktuellem Zeitkontext; Name und Datum hier also nicht wiederholen.',
  personaCount: '{n} Zeichen',
  balanceEnabled: 'Guthaben-Funktion',
  balanceEnabledHint: 'Wenn aktiv, spielt dieses Pet Guthaben-Animationen und zeigt die Guthaben-Blase.',
  whisperEnabled: 'Flüstern',
  whisperEnabledHint:
    'Wenn aktiv, erzeugt dieses Pet regelmäßig per KI einen Satz und spielt die Flüstern-Animation (Persona siehe Feld „Persona" unten; leer = Eintrag übernehmen).',
  workStatusEnabled: 'Arbeitsstatus-Kopplung',
  workStatusEnabledHint:
    'Wenn aktiv, folgt dieses Pet dem DSH-Arbeitsstatus: Denken / Arbeiten / Warten auf Bestätigung / Fertig / Fehler wechseln automatisch die passende Animation und zeigen eine Blase (Animationspool in der Top-Level-Konfiguration; nur Zuhören, keine Modellaufrufe).',
  fixedEnabled: 'Pet fixieren',
  fixedEnabledHint:
    'Wenn aktiv, dreht sich das Pet bei Zufallsanimationen nicht mehr selbst um und läuft nicht weg – es spielt nur Leerlauf und kleine Aktionen am Platz. Rechtsklick-Auswahl, API-Auslöser sowie Guthaben-/Flüstern-/Arbeitsstatus-Animationen sind nicht betroffen.',
  displayLabel: 'Anzeige',
  displayHint: 'web = nur Browser / desktop = nur Desktop / both = beides / none = nichts',
  'display.web': 'Nur Browser',
  'display.desktop': 'Nur Desktop',
  'display.both': 'Beides',
  'display.none': 'Nichts',
  cornerLabel: 'Position',
  'corner.top-left': 'Oben links',
  'corner.top-right': 'Oben rechts',
  'corner.bottom-left': 'Unten links',
  'corner.bottom-right': 'Unten rechts',
  marginX: 'Horizontaler Versatz',
  marginY: 'Vertikaler Versatz',
  save: 'Speichern',
  saveHotkey: 'Ctrl+S / Cmd+S',
  sync: 'Synchronisieren',
  confirmSync:
    'Wirklich synchronisieren? Die mitgelieferte Standardkonfiguration (alle Felder + Kommentare) überschreibt die Benutzerkonfiguration; Ihre aktuellen Anpassungen gehen verloren.',
  corruptTitle: 'Benutzerkonfiguration beschädigt – nicht gespeichert',
  corruptConfirm: 'Trotzdem speichern',
  corruptBody:
    'Die Benutzerkonfigurationsdatei ist nicht lesbar (beschädigt, kein gültiges JSON/JSONC): {path}. Beim Weiterspeichern wird die Datei anhand der Whitelist neu aufgebaut – alle aktuellen Inhalte (animations / physics / memes und weitere eigene Felder) gehen verloren. Abbrechen = Datei unverändert lassen (zuerst die Konfiguration reparieren, dann speichern); Bestätigen = trotzdem speichern (vorhandene Inhalte verwerfen).',
  syncHint:
    '„Synchronisieren" schreibt die mitgelieferte Standardkonfiguration (inkl. Kommentare und aller erweiterten Felder) in die Benutzerkonfigurationsdatei und überschreibt die aktuellen Anpassungen; danach ist die Datei direkt bearbeitbar. Zwei Hinweise: (1) Sobald die Datei existiert, ist sie eine explizite Override-Schicht – spätere Änderungen an den mitgelieferten Standards greifen nicht automatisch (außer bei erneuter Synchronisierung oder Löschen der Datei); (2) „Speichern" auf dieser Seite schreibt die Datei anhand der Whitelist neu (Feldwerte bleiben, Kommentare entfallen).',
  configMeta: 'Erweitert (Dateien)',
  configMetaHint:
    'Die Benutzerkonfiguration kann Pet-Liste / Animationspools / Wiedergabegewichtung überschreiben; Änderungen greifen nach Aktualisieren oder Neustart: im Browser die Seite neu laden, im Desktop-Modus Rechtsklick auf das Pet → „Konfiguration neu laden" (lädt alle Desktop-Pet-Fenster neu); die Standardkonfiguration ist die vollständige Referenz.',
  defaultConfig: 'Standardkonfiguration (schreibgeschützt, vollständige Referenz)',
  userConfig: 'Benutzerkonfiguration (eigene Überschreibungen)',
  todosFile: 'To-do-Daten (Listentext, Fälligkeit und Erledigt-Status; Löschen entspricht alle To-dos leeren)',
  animationDir: 'Verzeichnis der Animations-Assets (Animationen anpassen/ergänzen)',
  memesDir: 'Verzeichnis der Meme-Bilder (Bilder anpassen/ergänzen)',
  logFile: 'Protokolldatei (für die Fehlersuche; kann geleert werden)',
  logFileNote:
    'Die Desktop-Version hat keine Konsole, daher gehen alle Laufzeitprotokolle des Plugins (Start, Absturz/Neustart des Desktop-Pets, Fehler und Warnungen) in diese eine Datei; bitte bei Problemmeldungen anhängen. Maximal 1 MB pro Datei, danach bleiben nur die letzten 512 KB erhalten.',
  saved: 'Gespeichert – die Pets gelten sofort.',
  loadError: 'Konfiguration konnte nicht geladen werden',
  saveError:
    'Konfiguration konnte nicht gespeichert werden. Bitte Serververbindung, Schreibrechte im Konfigurationsverzeichnis und Serverprotokoll prüfen.',
  saveInvalid: 'Konfiguration konnte nicht gespeichert werden: Inhalt ungültig. Bitte prüfen und erneut versuchen.',
  syncError:
    'Synchronisieren fehlgeschlagen. Bitte Serververbindung und Schreibrechte im Konfigurationsverzeichnis prüfen.',
  loading: 'Konfiguration wird geladen…',
  retry: 'Erneut versuchen',
  invalid: 'Bitte Eingaben prüfen: Größe muss positiv sein, Ränder dürfen beliebige Zahlen sein.',
  busy: 'Wird gespeichert…',
  extraPetsHint:
    'Weitere {n} Art(en) stammen aus Dateien im Verzeichnis pet/ (<Name>-config.json + <Name>-animation/); oben in der Zeile „Arten" umschalten und bearbeiten. Speichern schreibt jeweils in die eigene Paketkonfiguration, nie in main-config.jsonc.',
  kindLabel: 'Arten',
  kindMain: 'Integriert',
  lastOfKind:
    '„{entry}" hat nur noch dieses eine Pet – beim Löschen verschwindet die ganze Art. Zum vollständigen Entfernen die Pet-Pack-Dateien löschen.',
  savePartial:
    'Haupt-Pets gespeichert, aber {names} konnten nicht zurückgeschrieben werden: Prüfen Sie, ob die Pack-Konfiguration gültig und das Verzeichnis beschreibbar ist.',
  notifyToggle: 'Systembenachrichtigungen',
  notifyToggleHint:
    'System-Toasts (unten rechts auf dem Desktop) bei Abschluss einer Konversation, Fehlern, Berechtigungsanfragen und Rückfragen – nur wenn das Fenster nicht fokussiert ist.',
  clickSoundToggle: 'Klick-Sound',
  clickSoundToggleHint:
    'Beim Klick auf ein Pet ertönt der integrierte Klick-Sound (assets/sound/click-duck.wav, Lautstärke 0.5); Klicks innerhalb von 100 ms werden nur einmal abgespielt, auch bei mehreren Pets überlagert sich nichts. Aus = völlig stumm. Wird beim „Speichern" in die Benutzerkonfiguration geschrieben.',
  whisperImageToggle: 'Flüstern-Bilder',
  whisperImageToggleHint:
    'Hängt an jede Flüstern-Zeile ein zufälliges Meme aus dem Pool (Bildzuordnung im Top-Level-Feld `memes` der Konfiguration). Token: Flüstern ruft ohnehin pro Zyklus das Modell auf, das Bild fügt nur Name + Beschreibung des gezogenen Memes (ca. 100 Zeichen / ≈60 Token) an dieselbe Anfrage an – vernachlässigbar.',
  chatImageToggle: 'Chat-Bilder',
  chatImageToggleHint:
    'Die KI wählt im Chat passend zum Kontext ein Meme aus dem Pool (optional; Zuordnung im Top-Level-Feld `memes`). Token: Jede Nachricht führt den gesamten Katalog mit – aktuell ca. 1,1k Zeichen (≈650 Token, etwa 11-mal so viel wie beim Flüstern) und linear mit der Bildanzahl wachsend; aus = es wird kein Zeichen angehängt.',
  chatAnimationToggle: 'Chat-Aktionen',
  chatAnimationToggleHint:
    'Wenn an, enthält die Chat-Anfrage die Liste der spielbaren Animationen (alle Aktionen unter animations.categories): Hält das Modell die Zeile für eine tatsächliche Aufführung, spielt das Pet sie sofort; sonst antwortet es nur mit Text. Token: Jede Nachricht führt die ganze Liste mit; aus = es wird nichts angehängt. Globaler Standard für alle Pets (ein Pet-Pack kann ihn in seiner eigenen Konfigurationsdatei überschreiben).',
  confineToggle: 'Auf aktuellen Bildschirm begrenzen',
  confineToggleHint:
    'Mehrere Monitore: Wenn an, bleibt das Pet auf dem Bildschirm, auf dem es sich gerade befindet – ein geworfenes Pet prallt nur innerhalb des Bildschirms ab, auf dem es losgelassen wurde (Bildschirmfugen wirken als Wände, es fliegt nicht zum Nachbarmonitor), und autonomes Umherlaufen bleibt auf dem aktuellen Bildschirm (ein Schritt über die Fuge wird einfach verworfen). Aus = Überqueren der Bildschirme wie gewohnt. Nur Desktop-Modus – das Browser-Overlay bleibt ohnehin im Viewport.',
  trayToggle: 'System-Tray',
  trayToggleHint:
    'Zeigt im Desktop-Modus ein Tray-Symbol (Windows: Infobereich, macOS: Menüleiste). Es listet alle Pets der Konfiguration und schaltet die Anzeige um – auch für Pets, die gerade nicht auf dem Desktop sind und kein Fenster zum Rechtsklicken haben. Ohne Tray lässt sich ein Pet nur über den Browser (Einstellungsseite oder Rechtsklick auf das Web-Pet) zurück auf den Desktop holen. Windows blendet das Symbol ohnehin in die „ausgeblendeten Symbole" aus. Nur Desktop-Modus.',
  voiceTitle: 'Sprachausgabe',
  voiceHint:
    'Vier Schalter und eine Stimme: Jede Art von Sprachausgabe hat ihren eigenen Schalter, keiner hängt von einem anderen ab. Standardmäßig alle aus; wird beim „Speichern" in die Benutzerkonfiguration geschrieben (kein sofortiges Schreiben).',
  voiceEnabled: 'Manuelles Flüstern sprechen',
  voiceEnabledHint:
    'Spricht Flüstern-Sätze, die über das Kontextmenü oder einen Slash-Befehl ausgelöst werden, sowie Chat-Antworten. Die Lautsprecher-Schaltfläche im Chat-Panel spricht einen einzelnen Satz, sobald Sie sie drücken. Es betrifft nur das Sprechen: Blasen, Chat-Gedächtnis und Systembenachrichtigungs-Popups bleiben unberührt; eine fehlgeschlagene Synthese wird nur protokolliert und unterbricht den Chat nicht.',
  voiceWhisperEnabled: 'Flüstern sprechen',
  voiceWhisperEnabledHint:
    'Spricht den regelmäßig erzeugten Flüstern-Satz. Standardmäßig aus – Flüstern ist Hintergrundbegleitung und sollte nicht ungefragt Geräusche machen.',
  voiceTodoEnabled: 'To-do-Erinnerungen sprechen',
  voiceTodoEnabledHint:
    'Spricht eine fällige To-do-Erinnerung (die Blase erscheint weiterhin; dieser Schalter entscheidet nur, ob gesprochen wird). Standardmäßig aus.',
  voiceNotifyEnabled: 'Arbeitsstatus sprechen',
  voiceNotifyEnabledHint:
    'Spricht eine konfigurierte Arbeitsstatus-Zeile, wenn eine Aufgabe abgeschlossen ist, fehlschlägt oder auf Ihre Bestätigung wartet. Wie Systembenachrichtigungen wird nur gesprochen, während Sie nicht auf dieser Seite sind (weggewechselt, ohne Fokus, minimiert) – keine Unterbrechung, während Sie auf den Bildschirm schauen. Nur die konfigurierte Zeile wird gesprochen, nie das Aufgabendetail. Standardmäßig aus.',
  voiceNameLabel: 'Stimme',
  voiceVolumeLabel: 'Lautstärke',
  voiceVolumeHint:
    'Wiedergabelautstärke als Dezimalzahl 0–1: 1 ist die maximale Lautstärke (100 %), 0 ist stumm. Ändert nur die Lautheit und synthetisiert kein Audio neu, kostet also nichts extra. Alle vier Arten von Sprachausgabe teilen sich diese eine Lautstärke.',
  physicsTitle: 'Physik (Zieh- und Wurfgefühl)',
  physicsHint:
    'Globaler Standard für alle Pets (ein Pet-Pack kann ihn in seiner Art-Datei überschreiben); wird beim „Speichern" in die Benutzerkonfiguration geschrieben (kein sofortiges Schreiben). Im Browser sofort wirksam, im Desktop-Modus, sobald das Speichern die Pet-Fenster neu lädt.',
  mobileTitle: 'Mobil-Effekte',
  mobileHint:
    'Nur im Handy-Browser sinnvoll: Vibration braucht einen Motor, die beiden Bewegungs-Schalter brauchen Neigungs-/Beschleunigungssensoren, und Sensoren gibt es nur über HTTPS oder localhost.',
  'physics.gravity': 'Schwerkraft',
  'physics.gravityHint': 'px/s², größer = fällt schneller; 0 = schwerelos (fliegt geradeaus weiter)',
  'physics.restitution': 'Elastizität',
  'physics.restitutionHint':
    '0–1, Geschwindigkeitsanteil beim Abprallen von Wand/Boden (1 = voll elastisch, 0 = bleibt sofort stehen)',
  'physics.groundFriction': 'Kontaktreibung',
  'physics.groundFrictionHint':
    '/s, Abklingen der Geschwindigkeit entlang jeder Kontaktfläche (Wand, Boden, Decke); 0 = überall eisglatt',
  'physics.throwPower': 'Wurfkraft',
  'physics.throwPowerHint':
    '> 0, Gesamtfaktor für Federfolge und Abwurfgeschwindigkeit (1 = Standard; höher = folgt enger, wirft härter)',
  physicsCeilingBounce: 'Deckenabprall',
  physicsCeilingBounceHint: 'Aus: Würfe können oben aus dem Bildschirm fliegen (die Schwerkraft holt sie zurück)',
  physicsPetCollision: 'Pet-Kollisionen',
  physicsPetCollisionHint: 'Ein fliegendes Pet prallt mit Impulserhaltung von anderen ab (Masse ∝ Größe²)',
  physicsHaptic: 'Kollisions-Vibration',
  physicsHapticHint:
    'Ein Impuls pro Treffer (Wand, Boden, Decke, andere Pets). Funktioniert in Chrome/Edge; nicht auf iOS oder in WebView-Hüllen wie Via. „Nicht stören“ blockiert die Vibration.',
  physicsTilt: 'Schwerkraft per Neigung',
  physicsTiltHint:
    'Handy neigen: die Schwerkraft folgt der Neigung (Betrag = der Wert oben). Bei Schwerkraft 0 bewirkt Neigen nichts. Benötigt HTTPS/localhost.',
  physicsShake: 'Schütteln zum Werfen',
  physicsShakeHint:
    'Schütteln schleudert den Pet in Wurfrichtung; die Stärke folgt throwPower. Unabhängig von der Schwerkraft, funktioniert also auch bei 0. Benötigt HTTPS/localhost.',
  invalidPhysics: 'Bitte Physikwerte prüfen: Schwerkraft / Bodenreibung ≥ 0, Elastizität 0–1, Wurfkraft > 0.',
  fontTitle: 'Aussehen & Schrift',
  fontHint:
    'Die Schriftart gilt für alle Texte, die derzeit die Candy-Schrift nutzen: Pet-Blase, Hover-Tooltip, Chat-Fenster, Score-Popup; die Schriftgröße gilt nur für Pet-Blase und Hover-Tooltip (Chat- und Score-Popup behalten ihre Größe). Globaler Standard für alle Pets (ein Pet-Pack kann ihn in seiner Art-Datei überschreiben); wird beim „Speichern" in die Benutzerkonfiguration geschrieben – im Browser sofort wirksam, im Desktop-Modus, sobald das Speichern die Pet-Fenster neu lädt.',
  fontFamilyLabel: 'Schriftart',
  fontFamilyHint:
    '„Candy (integriert)" wird mit dem Plugin geliefert; die übrigen sind Systemschriften. Fehlt eine Schrift auf diesem Rechner, greift die nächste im Stapel (nie leer, kein Fehler).',
  fontSizeLabel: 'Schriftgröße (px)',
  fontSizeHint:
    'Schriftgröße des Blasentexts; Tooltip und kleinere Zeilen in der Blase skalieren anteilig. Bereich 4–200.',
  fontFollowToggle: 'Schriftgröße mit Pet-Größe skalieren',
  fontFollowToggleHint:
    'An (Standard): die Schrift wächst mit dem Pet – bei 462 px Breite entspricht sie genau der obigen Größe. Aus: die Größe bleibt unabhängig von der Pet-Größe konstant.',
  invalidFont:
    'Bitte Schrifteinstellungen prüfen: Die Schriftart muss in der Liste stehen, die Größe eine Zahl zwischen 4 und 200 sein.',
  'font.candy': 'Candy (integriert)',
  'font.yahei': 'Microsoft YaHei / PingFang',
  'font.youyuan': 'YouYuan',
  'font.kaiti': 'KaiTi',
  'font.simsun': 'SimSun',
  'font.comic': 'Comic Sans MS',
  'font.system': 'Systemstandard',
  modelTitle: 'Chat & Modelle',
  modelHint:
    'Welches Modell Flüstern und Chat jeweils nutzen und wie viel Verlauf jeder Chat-Aufruf mitführt. „Aktueller Konversation folgen" = das Modell, das Ihre aktuelle Konversation verwendet (Standard). Globaler Standard: gilt für alle Pets, ein Pet-Pack kann ihn in seiner Art-Datei überschreiben. Die Optionen stammen aus derselben Quelle wie die Modellauswahl von DSH und werden vom Host live geliefert.',
  modelFollow: 'Aktueller Konversation folgen',
  modelSearch: 'Modelle suchen…',
  modelEmpty: 'Keine passenden Modelle.',
  modelNoModels: 'Keine Modelle verfügbar.',
  modelLoading: 'Modellliste wird aktualisiert…',
  modelTriggerAria: 'Modell wählen, aktuell {model}',
  modelUnknown: ' (aktuelle Konfiguration, nicht in der Liste)',
  modelNone: 'Für diesen Anbieter sind keine Modelle verfügbar',
  whisperModelLabel: 'Flüstern-Modell',
  chatModelLabel: 'Chat-Modell',
  modelFieldHint:
    '„Aktueller Konversation folgen" = Modell der aktuellen Konversation; schlägt ein gewähltes Modell fehl, fällt das Plugin auf das Modell der aktuellen Konversation zurück und versucht es einmal erneut.',
  invalidModel:
    'Bitte Modelleinstellungen prüfen: Anbieter und Modell entweder beide wählen oder beide leer lassen (aktuelle Konversation folgen).',
  modelCatalogFailed:
    'Modellliste konnte nicht geladen werden (Seite neu laden für einen neuen Versuch); die aktuellen Konfigurationswerte bleiben unverändert erhalten.',
  chatMemory: 'Chat-Verlaufsrunden',
  chatMemoryHint:
    'Wie viele der letzten Runden jeder Chat-Aufruf mitführt (1 Runde = 1 Frage + 1 Antwort; 0 = kein Verlauf, jede Nachricht ist neu). Das Gedächtnis selbst behält alles – dieser Wert bestimmt nur, wie viel in den Kontext kommt: mehr merkt mehr und kostet mehr Token. Globaler Standard für alle Pets (ein Pet-Pack kann ihn in seiner Art-Datei überschreiben).',
  invalidChatMemory: 'Bitte Chat-Verlaufsrunden prüfen: Zahl ≥ 0 erforderlich.',
  chatImageLimit: 'Max. Chat-Bilder',
  chatImageLimitHint:
    'Wie viele Memes beim Chat höchstens an das Modell gelistet werden („erste N" = die ersten N in der Konfiguration; was bevorzugt gesendet werden soll, nach vorne verschieben). Die ganze Liste wird an jede Nachricht angehängt, Token wachsen linear mit der Anzahl – eine lange Liste kostet nur. Mit der Grenze auf die ersten N wählt das Modell nur daraus. 0 = keine Grenze (alles senden). Integrierter Standard 10. Globaler Standard für alle Pets (ein Pet-Pack kann ihn in seiner Art-Datei überschreiben). Nur Chat-Auswahl: Flüstern führt nur das gezogene Meme mit.',
  invalidChatImageLimit: 'Bitte das Limit für Chat-Bilder prüfen: Zahl ≥ 0 erforderlich (0 = keine Grenze).',
  notifyTest: 'Testbenachrichtigung',
  notifyTestOk: 'Testbenachrichtigung gesendet – bitte unten rechts auf dem Desktop prüfen.',
  notifyDenyUnsupported:
    'Systembenachrichtigungen werden in dieser Umgebung nicht unterstützt (keine Notification-API).',
  notifyDenyBlocked: 'Die Benachrichtigungsberechtigung ist im Browser blockiert.',
  notifyDenyRejected: 'Sie haben im Berechtigungsdialog „Blockieren" gewählt.',
  notifyDenyError: 'Fehler beim Anfordern der Berechtigung',
  notifyGuide:
    'Anleitung: links neben der Adressleiste auf 🔒/ⓘ klicken → „Website-Einstellungen" → „Benachrichtigungen" → auf „Zulassen" setzen, Seite neu laden und erneut versuchen.',
  storageTitle: 'Deinstallation & Speicher',
  storageHint:
    'Alle Orte, an denen das Plugin auf diesem Rechner Daten ablegt. Cache löschen ist unschädlich (wird automatisch neu geladen/neu aufgebaut); „Plugin-Benutzerdaten" löschen kostet Konfiguration und Chat-Gedächtnis.',
  'storage.userData':
    'Plugin-Benutzerdaten: eigene Konfiguration main-config.jsonc, Chat-Gedächtnis memory.json, eigene Animations-Assets main-animation/, Datei-Pets pet/',
  'storage.electron':
    'Electron-Laufzeit für das Desktop-Pet (groß; wird beim nächsten Start des Desktop-Modus automatisch neu heruntergeladen)',
  'storage.desktopCache':
    'Cache der Desktop-Pet-Fenster und Skalierungs-Cache des Hauptbildschirms (löschbar, wird automatisch neu aufgebaut)',
  'storage.electronCache': 'Download-Cache des Electron-Installers (löschbar, wird bei Bedarf neu geladen)',
  'storage.package':
    'Das Plugin selbst (aus lokalen Quellen installiert: die Profil-Abhängigkeit zeigt auf ein lokales Verzeichnis dsh-zdd-pet-install; Deinstallation siehe unten)',
  storageMissing: ' (noch nicht erstellt)',
  uninstallTitle: 'So deinstallieren Sie',
  uninstallStep1:
    '1. Zuerst DSH beenden (das Desktop-Pet beendet sich mit); die obigen Dateien nicht löschen, während das Pet läuft.',
  uninstallStep2:
    '2. Plugin entfernen — am besten über die Seite „Plugin-Verwaltung" von DSH, indem Sie {name} deinstallieren (am einfachsten; entfernt es auch aus den Profil-Abhängigkeiten und der Bundle-Schicht); oder führen Sie den folgenden Befehl in einem Terminal aus:',
  uninstallStep3:
    '3. Wenn kein nutzbarer dsh-Befehl verfügbar ist (häufig, wenn DSH in der Desktop-App läuft), deinstallieren Sie manuell: Bearbeiten Sie {profileDir}/package.json — entfernen Sie "{name}" aus dependencies und "{name}" aus dsh.profile.bundles; löschen Sie das Verzeichnis node_modules/{name}; starten Sie danach DSH neu.',
  motionTitle: 'Aktionshäufigkeit',
  motionHint:
    'Vier Felder: Leerlauf / Drehen / Bewegen sind editierbar, die Zufallsaktion wird berechnet (100 − die anderen drei). Globaler Standard für alle Pets; ein Pet-Pack kann ihn in seiner Art-Datei überschreiben.',
  'motion.idle': 'Leerlauf',
  'motion.turn': 'Drehen',
  'motion.move': 'Bewegen',
  'motion.action': 'Zufallsaktion',
  uninstallCmd: 'dsh plugin --profile {profile} remove {name}',
  // ── 本 fork 追加：心情 / 亲密度 / 番茄钟 / 随机小事件 / 主动关心 / 任务完成提示 / 气泡表情包 ──
  bubbleImageToggle: 'Memes in den Blasen',
  bubbleImageToggleHint:
    'Hauptschalter: Legt fest, ob alle Blasen ein Bild bekommen — Flüstern, Chat, Pomodoro, Easter Eggs bei Aufgaben, der Guthaben-Auftritt und der Startgruß richten sich danach. Aus = überall nur Text (ruhiger, spart Token); an = jede Funktion hängt ihre eigenen Memes nach ihrer eigenen Logik an (Zuordnung im Top-Level-Feld `memes`).',
  pomodoroTitle: 'Pomodoro / Bewegungs-Erinnerung',
  pomodoroHint:
    'In festen Abständen sagt das Pet etwas (keine Token). Globaler Standard für alle Pets (ein Pet-Pack kann ihn in seiner Art-Datei überschreiben); wird beim „Speichern" geschrieben — im Browser sofort, auf dem Desktop nach dem Neuladen.',
  pomodoroLabel: 'Bewegungs-Erinnerung',
  pomodoroLabelHint:
    '„Aus" wählen, um sie abzuschalten; eine Minutenzahl aktiviert sie, und das Pet erinnert Sie in diesem Abstand daran, sich zu bewegen.',
  pomodoroOff: 'Aus',
  pomodoroEvery: 'Alle {n} Min.',
  pomodoroBreakLabel: 'Pausenlänge',
  pomodoroBreakHint: 'Wie lange Sie nach jeder Fokusphase pausieren.',
  pomodoroLongBreakLabel: 'Länge der langen Pause',
  pomodoroLongBreakHint: 'Eine längere Pause nach mehreren Fokusphasen.',
  pomodoroRoundsLabel: 'Runden pro langer Pause',
  pomodoroRoundsHint: 'Wie viele Fokusphasen vor einer langen Pause (1–24).',
  pomodoroAutoBreak: 'Pause automatisch starten',
  pomodoroAutoBreakHint:
    'Wenn an, startet der Pausen-Countdown automatisch, sobald die Fokusphase endet; wenn aus, starten Sie sie aus dem Menü heraus.',
  pomodoroAutoFocus: 'Nächste Fokusphase automatisch starten',
  pomodoroAutoFocusHint: 'Wenn an, startet die nächste Fokusphase automatisch, sobald die Pause endet.',
  invalidPomodoro: 'Pomodoro prüfen: Das Intervall muss eine Zahl zwischen 1 und 1440 sein.',
  greetingTitle: 'Startgruß',
  greetingHint:
    'Bei jedem Start von DSH sagt das Pet einen Glückwunsch (mit Meme). Ist das Modell nicht verfügbar, greift es auf fest eingebaute Zeilen zurück.',
  greetingEnabled: 'Startgruß aktivieren',
  greetingMode: 'Erzeugungsart',
  greetingModeHint:
    'Pool: Ein Stapel wird vorab erzeugt und lokal gespeichert, und bei jedem Start wird per Zufall eine Zeile gezogen (spart Token); Live: Bei jedem Start wird das Modell aufgerufen.',
  greetingModePool: 'Pool (vorab erzeugen, zufällig wählen)',
  greetingModeLive: 'Live (bei jedem Start)',
  greetingPoolSize: 'Größe des Pools',
  greetingPoolSizeHint: 'Wie viele Zeilen vorab erzeugt werden (1~200); wird nur im Modus Pool verwendet.',
  invalidGreeting: 'Startgruß prüfen: Die Pool-Größe muss eine ganze Zahl zwischen 1 und 200 sein.',
  moodTitle: 'Stimmung / Nähe',
  moodHint:
    'Streicheln macht es fröhlich, Ignorieren macht es missmutig. Die Stufe beeinflusst Klick-Texte und Verhalten im Leerlauf (fröhlich = albern, missmutig = seufzt oder schläft schneller ein). Der Wert wird lokal pro Pet gespeichert. Globaler Standard für alle Pets; wird beim „Speichern" geschrieben — im Browser sofort, auf dem Desktop nach dem Neuladen.',
  moodEnabled: 'Stimmungssystem aktivieren',
  moodEnabledHint:
    'Wenn aus, sammelt sich keine Stimmung mehr an: Klick-Texte verwenden direkt clickTexts, und das Verhalten im Leerlauf ignoriert die Stimmung.',
  moodInitial: 'Anfangsstimmung',
  moodInitialHint: 'Der Startwert, wenn das Pet zum ersten Mal gesehen wird (0–100).',
  moodTouchGain: 'Gewinn pro Streicheln',
  moodTouchGainHint: 'Wie viele Punkte jeder Klick auf das Pet hinzufügt (0–100).',
  moodDecay: 'Abfall pro Stunde',
  moodDecayHint: 'Wie viele Punkte pro untätiger Stunde verloren gehen (0–100).',
  moodLow: 'Untere Schwelle',
  moodLowHint: 'Unter diesem Wert gilt es als „etwas lustlos" (0–100).',
  moodHigh: 'Obere Schwelle',
  moodHighHint: 'Über diesem Wert gilt es als „sehr guter Laune" (0–100).',
  invalidMood: 'Stimmung prüfen: Alle fünf Werte müssen zwischen 0 und 100 liegen.',
  intimacyTitle: 'Nähe-Stufen',
  intimacyHint:
    'Teilt die Stimmung in vier Stufen (fremd / vertraut / nah / eng verbunden); je näher, desto schmeichelhafter die Klick-Texte. Jede Stufe hat einen Jahrestag, der an seinem Tag eine eigene Show auslöst. Für eigene Texte oder Jahrestage bearbeiten Sie intimacy.stages in main-config.jsonc.',
  intimacyEnabled: 'Nähe-Stufen aktivieren',
  intimacyEnabledHint:
    'Wenn aus, bleiben nur die drei Stimmungsstufen; keine Show zu freigeschalteten Stufen und keine zu Jahrestagen.',
  intimacyFestivalPrefix: 'Jahrestag: ',
  idleEventsTitle: 'Zufällige Mini-Ereignisse',
  idleEventsHint:
    'Im Leerlauf tut das Pet ab und zu von selbst etwas (strecken / umschauen / gähnen…), manchmal mit einem Satz. Für eine eigene Auswahl bearbeiten Sie idleEvents.events in main-config.jsonc.',
  idleEventsEnabled: 'Zufällige Mini-Ereignisse aktivieren',
  idleEventsEnabledHint: 'Wenn aus, unterhält sich das Pet im Leerlauf nicht mehr selbst.',
  idleEventsMin: 'Mindestabstand (s)',
  idleEventsMinHint: 'Der kürzeste Abstand zwischen zwei Mini-Ereignissen (20–86400).',
  idleEventsMax: 'Höchstabstand (s)',
  idleEventsMaxHint: 'Der längste Abstand zwischen zwei Mini-Ereignissen (20–86400).',
  invalidIntimacy: 'Nähe prüfen: Das Format ist ungültig.',
  invalidIdleEvents: 'Zufällige Mini-Ereignisse prüfen: Die Abstände müssen zwischen 20 und 86400 Sekunden liegen.',
  proactiveTitle: 'Aktive Fürsorge / Langzeitgedächtnis',
  proactiveHint:
    'Das Pet meldet sich von selbst, wenn Sie eine Weile nichts von ihm gehört haben, wenn es spät ist und Sie noch arbeiten, oder direkt nach einer Fokusphase (das ruft das Modell auf). Das Langzeitgedächtnis gewinnt aus Gesprächen „Fakten über Sie" (Identität, laufende Projekte, Vorlieben) heraus und behält sie, damit das nächste Gespräch anknüpfen kann.',
  proactiveEnabled: 'Aktive Fürsorge aktivieren',
  proactiveEnabledHint: 'Wenn aus, spricht das Pet nur, wenn Sie mit ihm sprechen.',
  proactiveCooldown: 'Mindestabstand (Stunden)',
  proactiveCooldownHint: 'Mindestabstand zwischen zwei Fürsorge-Nachrichten desselben Pets (1–720).',
  proactiveIdle: 'Untätigkeits-Schwelle (Stunden)',
  proactiveIdleHint: 'Nach so vielen Stunden ohne Interaktion kann eine Fürsorge-Nachricht ausgelöst werden (1–720).',
  proactiveLateFrom: 'Späte Nacht ab (0–23)',
  proactiveLateHint: 'Beginn des Zeitfensters der späten Nacht; kann über Mitternacht hinausgehen (z. B. 23).',
  proactiveLateTo: 'Späte Nacht bis (0–23)',
  proactiveLongMemory: 'Langzeitgedächtnis aktivieren',
  invalidProactive:
    'Aktive Fürsorge prüfen: Die Abstände müssen 1–720 Stunden betragen, die Stunden der späten Nacht ganze Zahlen von 0 bis 23.',
  completionTitle: 'Hinweis bei Aufgabenende',
  completionHint:
    'Wenn eine Aufgabe endet oder fehlschlägt, zeigt das Pet eine Blase mit dem Ergebnis. Standardmäßig verschwindet sie, sobald Sie die Maus über das Pet bewegen (zusätzlich gibt es eine automatische Ausblendung nach etwa 20 s); oder Sie deaktivieren das automatische Ausblenden, dann bleibt sie stehen, bis die nächste Meldung sie überschreibt.',
  completionEnabled: 'Hinweis bei Aufgabenende aktivieren',
  completionEnabledHint:
    'Wenn aus, erscheint bei Erfolg oder Fehler keine Blase (Systemmeldungen und Easter Eggs bleiben unberührt).',
  completionHoldUntilFocus: 'Bei Mauszeiger über dem Pet ausblenden',
  completionHoldUntilFocusHint:
    'An: Bewegen Sie die Maus über das Pet, verschwindet die Blase; zusätzlich blendet sie nach etwa 20 s automatisch aus. Aus: Sie bleibt stehen, bis die nächste Meldung sie überschreibt oder Sie sie manuell löschen.',
  invalidCompletion: 'Hinweis bei Aufgabenende prüfen: Das Format ist ungültig.',
  uninstallStep4:
    '4. Löschen Sie die obigen Orte nach Bedarf: Caches (Electron-Laufzeit / Desktop-Cache / Download-Cache) sind unschädlich und werden automatisch neu geladen bzw. neu aufgebaut; „Plugin-Benutzerdaten" löschen kostet Konfiguration und Chat-Gedächtnis (sichern Sie vorher main-config.jsonc, wenn Sie es behalten wollen).',
};
