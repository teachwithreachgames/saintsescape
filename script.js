/* ═══════════════════════════════════════════════════════════════════
   THE VATICAN ARCHIVES HEIST — script.js
   Framework & game engine. Puzzle logic goes in the clearly marked
   PUZZLE SETUP sections below — one function per room.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════════════════════
// MUSIC ENGINE
// Plays two audio files that loop one after another.
// Place song_1.mp3 and song_2.mp3 in the same folder as index.html.
// The HUD toggle turns music on/off at any point during gameplay.
// ═══════════════════════════════════════════════════════════════════

const music = {
  tracks:      [],       // Array of two Audio elements
  current:     0,        // Index of the currently playing track (0 or 1)
  enabled:     false,    // Whether the user has turned music on
};

/** Called once on game init — creates the two Audio elements. */
function initMusic() {
  const files = ['song_1.mp3', 'song_2.mp3'];
  music.tracks = files.map((src, i) => {
    const audio     = new Audio(src);
    audio.loop      = false;       // We handle looping manually (song → song)
    audio.volume    = 0.5;
    audio.preload   = 'auto';

    // When a track finishes, advance to the next and play it
    audio.addEventListener('ended', () => {
      if (!music.enabled) return;
      music.current = (i + 1) % music.tracks.length;
      playCurrentTrack();
    });

    return audio;
  });
}

/** Starts playing whichever track is current. */
function playCurrentTrack() {
  const track = music.tracks[music.current];
  if (!track) return;
  track.currentTime = 0;
  track.play().catch(() => {
    // Autoplay blocked — silently fail; user can press toggle again
  });
}

/** Stops all tracks immediately. */
function stopAllTracks() {
  music.tracks.forEach(t => {
    t.pause();
    t.currentTime = 0;
  });
}

/** HUD button handler — toggles music on/off. */
function toggleMusic() {
  music.enabled = !music.enabled;

  if (music.enabled) {
    playCurrentTrack();
  } else {
    stopAllTracks();
  }

  updateMusicToggleUI(music.enabled);
}

function updateMusicToggleUI(on) {
  const icon  = $('#music-icon');
  const label = $('#music-label');
  const btn   = $('#btn-music');
  if (icon)  icon.textContent  = on ? '🔊' : '🔇';
  if (label) label.textContent = on ? 'ON'  : 'MUSIC';
  if (btn)   btn.classList.toggle('music-on', on);
}




// ─────────────────────────────────────────────────────────────────────

/** Total mission time in seconds (75 minutes). */
const TIMER_DURATION = 75 * 60;

/** Hint allowance per mission. */
const MAX_HINTS = 3;

/**
 * Room definitions.
 * Add/edit: name, tag, icon, sidebar label, hint text.
 * completePrev  → the index of the room that must be done first (-1 = always unlocked).
 * unlockMessage → shown in feedback when THIS room is unlocked by completing another.
 */
const ROOMS = [
  {
    id: 0, tag: 'FILE_001', icon: '🗝️',
    name:  { en: 'Saint Peter',             fr: 'Saint Pierre' },
    short: { en: 'St. Peter',               fr: 'St. Pierre' },
    clueWord: { en: 'KEY',                  fr: 'CLÉ' },
    completePrev: -1,
    hint: {
      en: 'CHRONICLE INTEL: Five events, one apostle. Think chronologically — where did Peter first encounter Jesus? That is your starting point. The water came before the rooster crowed. The Spirit descended before the chains were finally cut.',
      fr: 'CHRONIQUE INTEL : Cinq événements, un apôtre. Pensez chronologiquement — où Pierre a-t-il rencontré Jésus pour la première fois ? C\'est votre point de départ. L\'eau est venue avant que le coq chante. L\'Esprit est descendu avant que les chaînes soient finalement brisées.',
    },
  },
  {
    id: 1, tag: 'FILE_002', icon: '📜',
    name:  { en: 'St. Bernard of Clairvaux', fr: 'Saint Bernard de Clairvaux' },
    short: { en: 'St. Bernard',              fr: 'St. Bernard' },
    clueWord: { en: 'LIGHT',                 fr: 'LUMIÈRE' },
    completePrev: 0,
    hint: {
      en: 'MANUSCRIPT INTEL: Bernard\'s maxim begins with a call to action — what does one do with information? Then ask: what comes after? The wise man neither rushes nor withholds. Three words follow the opening verb. The quote ends with a place of reflection.',
      fr: 'MANUSCRIT INTEL : La maxime de Bernard commence par un appel à l\'action — que fait-on avec l\'information ? Puis demandez : que vient ensuite ? L\'homme sage ne se précipite pas et ne retient pas. Trois mots suivent le verbe d\'ouverture. La citation se termine par un lieu de réflexion.',
    },
  },
  {
    id: 2, tag: 'FILE_003', icon: '🕊️',
    name:  { en: 'St. Francis of Assisi',    fr: 'Saint François d\'Assise' },
    short: { en: 'St. Francis',              fr: 'St. François' },
    clueWord: { en: 'POVERTY',               fr: 'PAUVRETÉ' },
    completePrev: 1,
    hint: {
      en: 'NATURE CODEX INTEL: Each virtue appears in the Canticle of the Sun — Brother Sun illumines truth, Sister Water purifies, Brother Wind moves the spirit. Francis owned nothing, controlled nothing, yet cared for everything. Match what he did to why he did it.',
      fr: 'CODEX NATURE INTEL : Chaque vertu apparaît dans le Cantique du Soleil — Frère Soleil illumine la vérité, Sœur Eau purifie, Frère Vent meut l\'esprit. François ne possédait rien, ne contrôlait rien, mais prenait soin de tout. Associez ce qu\'il a fait à la raison pour laquelle il l\'a fait.',
    },
  },
  {
    id: 3, tag: 'FILE_004', icon: '📖',
    name:  { en: 'St. Anthony of Padua',     fr: 'Saint Antoine de Padoue' },
    short: { en: 'St. Anthony',              fr: 'St. Antoine' },
    clueWord: { en: 'TRUTH',                 fr: 'VÉRITÉ' },
    completePrev: 2,
    hint: {
      en: 'MANUSCRIPT INTEL: Anthony\'s cipher uses four symbols. The lily marks purity and Marian devotion. The cross shaped like a Greek letter belongs to the Franciscans. The bread connects to a mother\'s vow. The Scripture marks the first Franciscan theologian.',
      fr: 'MANUSCRIT INTEL : Le chiffre d\'Antoine utilise quatre symboles. Le lys marque la pureté et la dévotion mariale. La croix en forme de lettre grecque appartient aux Franciscains. Le pain est lié au vœu d\'une mère. L\'Écriture marque le premier théologien franciscain.',
    },
  },
  {
    id: 4, tag: 'FILE_005', icon: '✝️',
    name:  { en: 'Pope Pius X',              fr: 'Pape Pie X' },
    short: { en: 'Pius X',                   fr: 'Pie X' },
    clueWord: { en: 'EUCHARIST',             fr: 'EUCHARISTIE' },
    completePrev: 3,
    hint: {
      en: 'REFORM INTEL: Pius X reorganised what was scattered, lowered the age for what had been restricted, condemned what he called the synthesis of all heresies, and replaced the complex with the simple. Think: what came first — the law, the sacrament, or the condemnation?',
      fr: 'RÉFORME INTEL : Pie X a réorganisé ce qui était dispersé, abaissé l\'âge de ce qui avait été restreint, condamné ce qu\'il appelait la synthèse de toutes les hérésies, et remplacé le complexe par le simple. Pensez : qu\'est-ce qui est venu en premier — la loi, le sacrement ou la condamnation ?',
    },
  },
  {
    id: 5, tag: 'FILE_006', icon: '⭐',
    name:  { en: 'St. Maximilian Kolbe',     fr: 'Saint Maximilien Kolbe' },
    short: { en: 'St. Kolbe',                fr: 'St. Kolbe' },
    clueWord: { en: 'SACRIFICE',             fr: 'SACRIFICE' },
    completePrev: 4,
    hint: {
      en: 'MORAL COMPASS INTEL: Kolbe did not act out of despair, impulse, or pride — he stepped forward with calm, deliberate love. At every decision point, ask: what would a man of faith, not fear, do? Silence can be cowardice. Speech can be courage. And the truest sacrifice is the one freely chosen.',
      fr: 'BOUSSOLE MORALE INTEL : Kolbe n\'a pas agi par désespoir, impulsion ou orgueil — il s\'est avancé avec un amour calme et délibéré. À chaque point de décision, demandez : que ferait un homme de foi, et non de peur ? Le silence peut être de la lâcheté. La parole peut être du courage. Et le vrai sacrifice est celui qui est librement choisi.',
    },
  },
  {
    id: 6, tag: 'VAULT_IGNATIAN', icon: '🏛️',
    name:  { en: 'Ignatian Vault',           fr: 'Coffre-fort ignatien' },
    short: { en: 'Ignatius',                 fr: 'Ignace' },
    clueWord: { en: '',                      fr: '' },
    completePrev: 5,
    hint: {
      en: 'VAULT INTEL: Six clue words, six saints — each word is a fragment of the master key. The man who founded the Society of Jesus, who wrote the Spiritual Exercises, and who believed faith must become action: his name opens the vault.',
      fr: 'COFFRE-FORT INTEL : Six mots clés, six saints — chaque mot est un fragment de la clé maîtresse. L\'homme qui a fondé la Compagnie de Jésus, qui a écrit les Exercices Spirituels, et qui croyait que la foi doit devenir action : son nom ouvre le coffre-fort.',
    },
    isVault: true,
  },
];

// ─────────────────────────────────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────────────────────────────────

const state = {
  currentRoom:   0,
  roomsComplete: [],
  hintsUsed:     0,
  timerSeconds:  TIMER_DURATION,
  timerInterval: null,
  gameStarted:   false,
  gameOver:      false,
  lang:          'en',   // 'en' or 'fr' — set on language selection screen
};

// ─────────────────────────────────────────────────────────────────────
// LANGUAGE SYSTEM
// t(key) returns the string for the current language.
// All translatable UI strings live here. Puzzle data arrays and
// DOSSIER_DATA carry bilingual { en, fr } objects per entry.
// ─────────────────────────────────────────────────────────────────────

const LANG = {
  en: {
    // Boot screen
    bootClassified:    'CLASSIFIED · LEVEL OMEGA · CLEARANCE REQUIRED',
    bootAlert:         'CRITICAL SYSTEM BREACH DETECTED — 6 SAINT FILES CORRUPTED',
    bootBriefing:      'Agent, a cyberattack has compromised the Vatican Secret Archives. Six sacred saint dossiers have been encrypted and the Ignatian Vault is sealed. You must restore each file to unlock the Final Vault before the system purges all records permanently.',
    bootMeta1:         'MISSION DURATION:',
    bootMeta2:         'ROOMS:',
    bootMeta3:         'CLEARANCE:',
    bootStart:         'INITIATE MISSION',
    // HUD
    hudLogo:           '✝ ARCHIVUM',
    timerIcon:         '⏱',
    musicLabel:        'MUSIC',
    musicOn:           'ON',
    langToggle:        'FR',
    // Sidebar
    saintFiles:        '// SAINT FILES',
    hintsRemaining:    'HINTS REMAINING:',
    requestHint:       'REQUEST HINT',
    noHintsLeft:       'NO HINTS REMAINING',
    // Room status badges
    badgeCorrupted:    'CORRUPTED',
    badgeLocked:       'LOCKED',
    badgeActive:       'ACTIVE',
    badgeRestored:     'RESTORED',
    badgeSealed:       'SEALED',
    // Lock overlays
    fileEncrypted:     'FILE ENCRYPTED',
    vaultSealed:       'IGNATIAN VAULT SEALED',
    restoreToDecrypt:  'Complete {prev} file to decrypt',
    restoreAllToUnseal:'Restore all 6 saint files to unseal the vault',
    // Progress sidebar statuses
    statusRestored:    'RESTORED',
    statusLocked:      'LOCKED',
    statusActive:      'ACTIVE',
    statusOpen:        'OPEN',
    statusSealed:      'SEALED',
    // Hint modal
    classifiedIntel:   'CLASSIFIED INTEL',
    acknowledge:       'ACKNOWLEDGE',
    // Buttons
    btnSubmit:         'SUBMIT SEQUENCE',
    btnVerify:         'VERIFY MANUSCRIPT',
    btnSubmitMatches:  'SUBMIT MATCHES',
    btnUnlockDossier:  'UNLOCK DOSSIER',
    btnConfirmMatches: 'CONFIRM MATCHES',
    btnSubmitSequence: 'SUBMIT SEQUENCE',
    btnAuthenticate:   'AUTHENTICATE',
    btnCompile:        'COMPILE CIPHER FRAGMENTS',
    btnDev:            'DEV: UNLOCK ROOM',
    btnDevVault:       'DEV: COMPLETE MISSION',
    // Dossier
    dossierDeclassified: 'DECLASSIFIED',
    dossierStamp:        'RESTORED',
    comprehensionTitle:  'COMPREHENSION CHECK — READ BEFORE ANSWERING',
    comprehensionSub:    'Answer all three questions correctly to recover the cipher word and unlock the next file.',
    cipherRecovered:     '// CIPHER WORD RECOVERED //',
    qTrue:               'TRUE',
    qFalse:              'FALSE',
    qTypeTF:             'TRUE / FALSE',
    qTypeMC:             'MULTIPLE CHOICE',
    qTypeMatch:          'MATCHING',
    // Completion card
    dossierFullyRestored: 'DOSSIER FULLY RESTORED',
    cipherFragmentLabel:  'Cipher fragment recovered:',
    nextFileLabel:        'Next file:',
    proceedBtn:           'PROCEED TO NEXT FILE',
    openVaultBtn:         '⛪ OPEN THE VAULT',
    // Feedback messages — rooms
    successPeter:      '✓ FILE_001 RESTORED — Saint Peter authenticated. Archive key transmitted.',
    successBernard:    '✓ FILE_002 RESTORED — St. Bernard decrypted. Cistercian cipher broken.',
    successFrancis:    '✓ FILE_003 RESTORED — St. Francis authenticated. Canticle sequence verified.',
    successAnthony:    '✓ FILE_004 RESTORED — St. Anthony located. Scattered fragments reassembled.',
    successPiusX:      '✓ FILE_005 RESTORED — Pope Pius X authenticated. Liturgical keys extracted.',
    successKolbe:      '✓ FILE_006 RESTORED — St. Maximilian Kolbe authenticated. Final key obtained.',
    successVault:      '✓ IGNATIAN VAULT UNSEALED — All archives restored. Mission complete.',
    // Victory screen
    victoryLabel:      'MISSION ACCOMPLISHED · ARCHIVE RESTORED',
    vaultOpenTitle:    'THE IGNATIAN VAULT\nIS OPEN',
    cipherLabel:       'RECOVERED CIPHER',
    finalMsg1:         'The saints you have encountered today did not live their faith quietly. Peter led. Bernard reformed. Francis gave everything away. Anthony taught. Pius X opened the sacraments to all. Kolbe laid down his life.',
    finalMsg2:         'And Ignatius of Loyola gathered all of it into a single conviction: faith is not a feeling — it is a decision, made daily, to act with courage, wisdom, and love in the world as it actually is.',
    finalQuote:        '"Go forth and set the world on fire."',
    finalQuoteAttr:    '— St. Ignatius of Loyola',
    returnToStart:     '↩ RETURN TO START',
    // Failure screen
    missionFailed:     'MISSION FAILED',
    systemPurge:       'SYSTEM PURGE COMPLETE',
    timeExpired:       'Time expired. The Vatican Archives have been permanently encrypted. The Ignatian Vault remains sealed. The records are lost.',
    retryMission:      'RETRY MISSION',
    // Time extension
    timeExpiredAlert:  'TIME EXPIRED',
    missionIncomplete: 'MISSION INCOMPLETE',
    filesRestored:     '{done} of 7 files restored — {left} remaining',
    extensionMsg:      'The archive purge was halted by an emergency failsafe. A <strong>15-minute extension</strong> has been authorised. Use it wisely — the vault will not wait forever.',
    acceptExtension:   '⏱ ACCEPT +15 MINUTES',
    startOver:         '↩ START OVER',
    progressPreserved: 'Your progress so far is preserved if you accept the extension.',
    extensionGranted:  '✓ +15:00 EXTENSION GRANTED — CONTINUE YOUR MISSION',
    // Penalty
    timePenalty:       '-1:00 TIME PENALTY',
    // Vault
    vaultDirective:    'CIPHER DIRECTIVE — FINAL VAULT',
    vaultSub:          'All six saint files have been restored. The cipher fragments collected across the archive must now be assembled. Watch as the master key compiles — then answer the final challenge to open the vault.',
    vaultAssemblyLabel:'ASSEMBLING CIPHER — RECOVERED FRAGMENTS',
    vaultAuthRequired: 'FINAL AUTHENTICATION REQUIRED',
    vaultAuthSub:      'The cipher is compiled. One question remains before the vault opens.',
    vaultQ:            'He was a soldier turned saint. He founded an order whose motto was "For the greater glory of God." He wrote the Spiritual Exercises — a 30-day programme of prayer and discernment that transformed the Church. He believed that faith without action was hollow, and sent his men across the world as teachers, missionaries, and servants.',
    vaultPrompt:       'Name this saint to open the Ignatian Vault:',
    vaultPlaceholder:  'Enter the saint\'s name…',
    vaultWrong1:       '✗ Incorrect. Think: who founded the Society of Jesus — the Jesuits?',
    vaultWrong2:       '✗ Not recognised. He wrote the Spiritual Exercises and sent missionaries worldwide.',
    vaultWrong3:       '✗ Try again. His motto: "Ad Maiorem Dei Gloriam" — For the greater glory of God.',
    vaultCipherLabel:  '// CIPHER CRACKED — DOSSIER UNLOCKED //',
    vaultCipherSub:    'Record this word — it belongs to the Ignatian Vault sequence.',
    vaultNoEntry:      '✗ No name entered. Type the saint\'s name and authenticate.',
    vaultSuccess:      '✓ IDENTITY CONFIRMED — Ignatius of Loyola. Initiating vault unlock sequence…',
    vaultOpen:         'VAULT OPEN',
    // Dossier fields labels
    fieldBorn:         'Born',
    fieldDied:         'Died',
    fieldOrigName:     'Original Name',
    fieldFeast:        'Feast Day',
    fieldCanon:        'Canonised',
    fieldDoctor:       'Doctor of the Church',
    fieldTitle:        'Title',
    fieldPatron:       'Patron Of',
    fieldSymbols:      'Key Symbols',
    fieldFounded:      'Founded',
    fieldOrder:        'Order',
    fieldDesignated:   'Designated',
    fieldReign:        'Papal Reign',
    fieldBirthName:    'Birth Name',
    fieldMotto:        'Motto',
    // Dossier section headings
    secBiography:      'BIOGRAPHY',
    secLegacy:         'LEGACY',
    secIgnatian:       'IGNATIAN CONNECTION',
    // Questions re-read prompt
    qWrongReread:      'Not quite. Re-read the section below, then try again.',
    // Kolbe scenario
    kolbeCorrected:    'Correct — Kolbe\'s true character confirmed. Advancing…',
    kolbeWrong:        '✗ This is not the path Kolbe chose. Reflect on the moral below and try again.',
    kolbePath:         'KOLBE\'S PATH',
    kolbeMoralReflect: 'MORAL REFLECTION',
    // Room 0 directive
    r0directive:       'MISSION DIRECTIVE: Restore the corrupted chronological record. Arrange the five events from Saint Peter\'s life in the correct historical order — earliest to latest. Drag to reorder, or tap a card then tap its destination.',
    r0arrange:         'ARRANGE EVENTS',
    r0timeline:        'TIMELINE REFERENCE',
    r0earliest:        'EARLIEST EVENT',
    r0latest:          'LATEST EVENT',
    r0cardDesc:        'Each card shows the event title and a brief dossier excerpt.',
    r0submit:          'SUBMIT SEQUENCE',
    r0verified:        'SEQUENCE VERIFIED ✓',
    r0wrong:           '✗ SEQUENCE ERROR — {n} event{s} out of position. Re-examine the archive.',
    r0clueLabel:       '// DECRYPTED ARCHIVE KEY //',
    r0clueSub:         'Record this code word — it may be required later in the mission.',
    // Room 1 directive
    r1directive:       'CIPHER DIRECTIVE — FILE_002',
    r1sub:             'A maxim from the writings of St. Bernard of Clairvaux has been fragmented by the archive breach. Reconstruct the original sentence by selecting words from the scattered pool below. Click a word to place it — click a placed word to return it to the pool.',
    r1reconstructed:   '// RECONSTRUCTED TEXT',
    r1scattered:       'SCATTERED FRAGMENTS — select to place',
    r1verify:          'VERIFY MANUSCRIPT',
    r1clear:           'CLEAR',
    r1placed:          'Words placed:',
    r1empty:           'All fragments placed — verify or clear to revise.',
    r1wrong:           '✗ MANUSCRIPT ERROR — {n} word{s} misplaced. Consult Bernard\'s writings.',
    r1verified:        'MANUSCRIPT VERIFIED ✓',
    r1clueLabel:       '// ILLUMINATED CIPHER RECOVERED //',
    r1clueSub:         'Transcribe this word into your mission dossier.',
    // Room 2 directive
    r2directive:       'CODEX DIRECTIVE — FILE_003',
    r2sub:             'Nine teachings from the life of St. Francis have been scattered. <strong>Click a teaching card</strong> to select it, then click the matching <strong>virtue column</strong> to assign it. Assign all nine, then click <strong>SUBMIT MATCHES</strong>. Correct pairs lock green — wrong ones return to the pool for reassignment.',
    r2teachings:       'TEACHINGS — select one, then choose its virtue',
    r2submit:          'SUBMIT MATCHES',
    r2assigned:        'assigned',
    r2submitVerified:  'ALL MATCHES VERIFIED ✓',
    r2wrong:           '✗ {n} wrong match{es} — returned to pool.',
    r2locked:          '{n} locked correctly.',
    r2success:         '✓ ALL TEACHINGS MATCHED — The Canticle cipher is restored. FILE_003 authenticated.',
    r2clueLabel:       '// CANTICLE CIPHER RECOVERED //',
    r2clueSub:         'Record this sacred word — it will be needed at the Ignatian Vault.',
    // Room 3 directive
    r3directive:       'CIPHER DIRECTIVE — FILE_004',
    r3sub:             'Anthony\'s dossier is sealed behind a four-symbol combination lock. Each wheel must show the correct attribute from Anthony\'s life. Read each clue, identify the matching attribute, then use ▲ ▼ to dial it in. Submit when all four wheels are set.',
    r3cipherKey:       'CIPHER KEY — ATTRIBUTE SYMBOLS',
    r3clues:           'ENCODED CLUES',
    r3wheel:           'Wheel',
    r3up:              '▲',
    r3down:            '▼',
    r3lockBrand:       'ARCHIVUM · VATICANUM',
    r3unlock:          'UNLOCK DOSSIER',
    r3unlocked:        'DOSSIER UNLOCKED ✓',
    r3wrong:           '✗ INCORRECT COMBINATION — {n} wheel{s} misaligned. Re-examine the clues.',
    r3success:         '✓ COMBINATION ACCEPTED — Anthony\'s dossier decrypted. FILE_004 authenticated.',
    r3clueLabel:       '// RECOVERED DOSSIER CIPHER //',
    r3clueSub:         'Record this word — it belongs to the Ignatian Vault sequence.',
    // Room 4 directive
    r4directive:       'TEMPORAL DIRECTIVE — FILE_005',
    r4sub:             'Six reform decrees from the papacy of Pius X (1903–1914) have been severed from their dates. <strong>Click a reform card</strong> to select it, then <strong>click a year slot</strong> on the timeline to place it. Rearrange freely, then click <strong>SUBMIT SEQUENCE</strong>. Correct placements lock — wrong ones return to the pool.',
    r4reforms:         'REFORM DECREES — select one, then place it',
    r4timeline:        'PONTIFICATE TIMELINE',
    r4placeHere:       '← place here',
    r4submit:          'SUBMIT SEQUENCE',
    r4verified:        'SEQUENCE VERIFIED ✓',
    r4wrong:           '✗ {n} reform{s} misplaced — highlighted in red and returned to the pool.',
    r4locked:          '{n} locked correctly.',
    r4partial:         '✓ {n} reform{s} correctly placed and locked. Continue with the remaining cards.',
    r4success:         '✓ ALL REFORMS PLACED — Pontifical timeline restored. FILE_005 authenticated.',
    r4clueLabel:       '// PONTIFICAL CIPHER RECOVERED //',
    r4clueSub:         'Record this word — it belongs to the Ignatian Vault sequence.',
    // Room 5 directive
    r5directive:       'MORAL CIPHER DIRECTIVE — FILE_006',
    r5sub:             'The Kolbe dossier is locked behind a moral reconstruction sequence. Navigate three critical moments from Auschwitz, 1941. Read each scene carefully. Only the choices that reflect Kolbe\'s true character will unlock the archive. Wrong choices return you to the same decision — reflect and try again.',
    r5success:         '✓ MORAL PATH COMPLETED — Kolbe dossier fully restored. FILE_006 authenticated.',
    r5clueLabel:       '// DOSSIER CIPHER RECOVERED //',
    r5clueSub:         'Record this word — it belongs to the Ignatian Vault sequence.',
  },

  fr: {
    // Boot screen
    bootClassified:    'CLASSIFIÉ · NIVEAU OMÉGA · ACCRÉDITATION REQUISE',
    bootAlert:         'VIOLATION CRITIQUE DU SYSTÈME DÉTECTÉE — 6 FICHIERS DE SAINTS CORROMPUS',
    bootBriefing:      'Agent, une cyberattaque a compromis les Archives secrètes du Vatican. Six dossiers de saints sacrés ont été chiffrés et le Coffre-fort ignatien est scellé. Vous devez restaurer chaque fichier pour déverrouiller le Coffre-fort final avant que le système purge définitivement tous les documents.',
    bootMeta1:         'DURÉE DE LA MISSION :',
    bootMeta2:         'SALLES :',
    bootMeta3:         'ACCRÉDITATION :',
    bootStart:         'INITIER LA MISSION',
    // HUD
    hudLogo:           '✝ ARCHIVUM',
    timerIcon:         '⏱',
    musicLabel:        'MUSIQUE',
    musicOn:           'ON',
    langToggle:        'EN',
    // Sidebar
    saintFiles:        '// FICHIERS DES SAINTS',
    hintsRemaining:    'INDICES RESTANTS :',
    requestHint:       'DEMANDER UN INDICE',
    noHintsLeft:       'AUCUN INDICE RESTANT',
    // Room status badges
    badgeCorrupted:    'CORROMPU',
    badgeLocked:       'VERROUILLÉ',
    badgeActive:       'ACTIF',
    badgeRestored:     'RESTAURÉ',
    badgeSealed:       'SCELLÉ',
    // Lock overlays
    fileEncrypted:     'FICHIER CHIFFRÉ',
    vaultSealed:       'COFFRE-FORT IGNATIEN SCELLÉ',
    restoreToDecrypt:  'Complétez le fichier {prev} pour déchiffrer',
    restoreAllToUnseal:'Restaurez les 6 fichiers de saints pour désceller le coffre-fort',
    // Progress sidebar statuses
    statusRestored:    'RESTAURÉ',
    statusLocked:      'VERROUILLÉ',
    statusActive:      'ACTIF',
    statusOpen:        'OUVERT',
    statusSealed:      'SCELLÉ',
    // Hint modal
    classifiedIntel:   'RENSEIGNEMENT CLASSIFIÉ',
    acknowledge:       'ACCUSÉ DE RÉCEPTION',
    // Buttons
    btnSubmit:         'SOUMETTRE LA SÉQUENCE',
    btnVerify:         'VÉRIFIER LE MANUSCRIT',
    btnSubmitMatches:  'SOUMETTRE LES CORRESPONDANCES',
    btnUnlockDossier:  'DÉVERROUILLER LE DOSSIER',
    btnConfirmMatches: 'CONFIRMER LES CORRESPONDANCES',
    btnSubmitSequence: 'SOUMETTRE LA SÉQUENCE',
    btnAuthenticate:   'AUTHENTIFIER',
    btnCompile:        'COMPILER LES FRAGMENTS DU CHIFFRE',
    btnDev:            'DEV: DÉVERROUILLER',
    btnDevVault:       'DEV: TERMINER LA MISSION',
    // Dossier
    dossierDeclassified: 'DÉCLASSIFIÉ',
    dossierStamp:        'RESTAURÉ',
    comprehensionTitle:  'VÉRIFICATION DE COMPRÉHENSION — LISEZ AVANT DE RÉPONDRE',
    comprehensionSub:    'Répondez correctement aux trois questions pour récupérer le mot chiffré et déverrouiller le prochain fichier.',
    cipherRecovered:     '// MOT CHIFFRÉ RÉCUPÉRÉ //',
    qTrue:               'VRAI',
    qFalse:              'FAUX',
    qTypeTF:             'VRAI / FAUX',
    qTypeMC:             'CHOIX MULTIPLE',
    qTypeMatch:          'ASSOCIATION',
    // Completion card
    dossierFullyRestored: 'DOSSIER ENTIÈREMENT RESTAURÉ',
    cipherFragmentLabel:  'Fragment chiffré récupéré :',
    nextFileLabel:        'Prochain fichier :',
    proceedBtn:           'PASSER AU PROCHAIN FICHIER',
    openVaultBtn:         '⛪ OUVRIR LE COFFRE-FORT',
    // Feedback messages
    successPeter:      '✓ FICHIER_001 RESTAURÉ — Saint Pierre authentifié. Clé d\'archive transmise.',
    successBernard:    '✓ FICHIER_002 RESTAURÉ — Saint Bernard déchiffré. Chiffre cistercien brisé.',
    successFrancis:    '✓ FICHIER_003 RESTAURÉ — Saint François authentifié. Séquence du Cantique vérifiée.',
    successAnthony:    '✓ FICHIER_004 RESTAURÉ — Saint Antoine localisé. Fragments dispersés réassemblés.',
    successPiusX:      '✓ FICHIER_005 RESTAURÉ — Pape Pie X authentifié. Clés liturgiques extraites.',
    successKolbe:      '✓ FICHIER_006 RESTAURÉ — Saint Maximilien Kolbe authentifié. Clé finale obtenue.',
    successVault:      '✓ COFFRE-FORT IGNATIEN DESCELLÉ — Toutes les archives restaurées. Mission accomplie.',
    // Victory screen
    victoryLabel:      'MISSION ACCOMPLIE · ARCHIVES RESTAURÉES',
    vaultOpenTitle:    'LE COFFRE-FORT IGNATIEN\nEST OUVERT',
    cipherLabel:       'CHIFFRE RÉCUPÉRÉ',
    finalMsg1:         'Les saints que vous avez rencontrés aujourd\'hui n\'ont pas vécu leur foi tranquillement. Pierre dirigea. Bernard réforma. François donna tout. Antoine enseigna. Pie X ouvrit les sacrements à tous. Kolbe donna sa vie.',
    finalMsg2:         'Et Ignace de Loyola rassembla tout cela en une seule conviction : la foi n\'est pas un sentiment — c\'est une décision, prise chaque jour, d\'agir avec courage, sagesse et amour dans le monde tel qu\'il est vraiment.',
    finalQuote:        '« Allez et embrasez le monde. »',
    finalQuoteAttr:    '— Saint Ignace de Loyola',
    returnToStart:     '↩ RETOUR AU DÉBUT',
    // Failure screen
    missionFailed:     'MISSION ÉCHOUÉE',
    systemPurge:       'PURGE DU SYSTÈME COMPLÈTE',
    timeExpired:       'Temps écoulé. Les Archives du Vatican ont été définitivement chiffrées. Le Coffre-fort ignatien reste scellé. Les documents sont perdus.',
    retryMission:      'RÉESSAYER LA MISSION',
    // Time extension
    timeExpiredAlert:  'TEMPS ÉCOULÉ',
    missionIncomplete: 'MISSION INCOMPLÈTE',
    filesRestored:     '{done} fichiers sur 7 restaurés — {left} restants',
    extensionMsg:      'La purge des archives a été stoppée par un système de sécurité d\'urgence. Une <strong>prolongation de 15 minutes</strong> a été autorisée. Utilisez-la judicieusement — le coffre-fort n\'attendra pas éternellement.',
    acceptExtension:   '⏱ ACCEPTER +15 MINUTES',
    startOver:         '↩ RECOMMENCER',
    progressPreserved: 'Votre progression est préservée si vous acceptez la prolongation.',
    extensionGranted:  '✓ +15:00 PROLONGATION ACCORDÉE — CONTINUEZ VOTRE MISSION',
    // Penalty
    timePenalty:       '-1:00 PÉNALITÉ DE TEMPS',
    // Vault
    vaultDirective:    'DIRECTIVE DE CHIFFREMENT — COFFRE-FORT FINAL',
    vaultSub:          'Les six fichiers de saints ont été restaurés. Les fragments du chiffre recueillis dans les archives doivent maintenant être assemblés. Regardez la clé maîtresse se compiler — puis répondez au défi final pour ouvrir le coffre-fort.',
    vaultAssemblyLabel:'ASSEMBLAGE DU CHIFFRE — FRAGMENTS RÉCUPÉRÉS',
    vaultAuthRequired: 'AUTHENTIFICATION FINALE REQUISE',
    vaultAuthSub:      'Le chiffre est compilé. Une dernière question avant l\'ouverture du coffre-fort.',
    vaultQ:            'Il était un soldat devenu saint. Il fonda un ordre dont la devise était « Pour la plus grande gloire de Dieu. » Il écrivit les Exercices Spirituels — un programme de prière et de discernement de 30 jours qui transforma l\'Église. Il croyait que la foi sans l\'action était vide, et envoya ses hommes à travers le monde comme enseignants, missionnaires et serviteurs.',
    vaultPrompt:       'Nommez ce saint pour ouvrir le Coffre-fort ignatien :',
    vaultPlaceholder:  'Entrez le nom du saint…',
    vaultWrong1:       '✗ Incorrect. Pensez : qui fonda la Compagnie de Jésus — les Jésuites ?',
    vaultWrong2:       '✗ Non reconnu. Il écrivit les Exercices Spirituels et envoya des missionnaires dans le monde entier.',
    vaultWrong3:       '✗ Réessayez. Sa devise : « Ad Maiorem Dei Gloriam » — Pour la plus grande gloire de Dieu.',
    vaultCipherLabel:  '// CHIFFRE DÉCHIFFRÉ — DOSSIER DÉVERROUILLÉ //',
    vaultCipherSub:    'Notez ce mot — il appartient à la séquence du Coffre-fort ignatien.',
    vaultNoEntry:      '✗ Aucun nom saisi. Tapez le nom du saint et authentifiez.',
    vaultSuccess:      '✓ IDENTITÉ CONFIRMÉE — Ignace de Loyola. Démarrage de la séquence d\'ouverture du coffre-fort…',
    vaultOpen:         'COFFRE-FORT OUVERT',
    // Dossier field labels
    fieldBorn:         'Né',
    fieldDied:         'Décédé',
    fieldOrigName:     'Nom d\'origine',
    fieldFeast:        'Fête',
    fieldCanon:        'Canonisé',
    fieldDoctor:       'Docteur de l\'Église',
    fieldTitle:        'Titre',
    fieldPatron:       'Patron de',
    fieldSymbols:      'Symboles clés',
    fieldFounded:      'Fondateur',
    fieldOrder:        'Ordre',
    fieldDesignated:   'Désigné',
    fieldReign:        'Pontificat',
    fieldBirthName:    'Nom de naissance',
    fieldMotto:        'Devise',
    // Dossier section headings
    secBiography:      'BIOGRAPHIE',
    secLegacy:         'HÉRITAGE',
    secIgnatian:       'CONNEXION IGNATIENNE',
    // Questions re-read prompt
    qWrongReread:      'Pas tout à fait. Relisez la section ci-dessous, puis réessayez.',
    // Kolbe scenario
    kolbeCorrected:    'Correct — Le vrai caractère de Kolbe confirmé. Progression…',
    kolbeWrong:        '✗ Ce n\'est pas le chemin qu\'a choisi Kolbe. Réfléchissez à la leçon morale ci-dessous et réessayez.',
    kolbePath:         'LE CHEMIN DE KOLBE',
    kolbeMoralReflect: 'RÉFLEXION MORALE',
    // Room 0 directive
    r0directive:       'DIRECTIVE DE MISSION : Restaurez le dossier chronologique corrompu. Arrangez les cinq événements de la vie de saint Pierre dans le bon ordre historique — du plus ancien au plus récent. Glissez pour réorganiser, ou appuyez sur une carte puis sur sa destination.',
    r0arrange:         'ORGANISER LES ÉVÉNEMENTS',
    r0timeline:        'RÉFÉRENCE CHRONOLOGIQUE',
    r0earliest:        'ÉVÉNEMENT LE PLUS ANCIEN',
    r0latest:          'ÉVÉNEMENT LE PLUS RÉCENT',
    r0cardDesc:        'Chaque carte affiche le titre de l\'événement et un bref extrait du dossier.',
    r0submit:          'SOUMETTRE LA SÉQUENCE',
    r0verified:        'SÉQUENCE VÉRIFIÉE ✓',
    r0wrong:           '✗ ERREUR DE SÉQUENCE — {n} événement{s} hors position. Réexaminez les archives.',
    r0clueLabel:       '// CLÉ D\'ARCHIVE DÉCHIFFRÉE //',
    r0clueSub:         'Notez ce mot de code — il pourra être nécessaire plus tard dans la mission.',
    // Room 1 directive
    r1directive:       'DIRECTIVE DE CHIFFREMENT — FICHIER_002',
    r1sub:             'Une maxime des écrits de saint Bernard de Clairvaux a été fragmentée par la violation des archives. Reconstituez la phrase originale en sélectionnant les mots dans le pool dispersé ci-dessous. Cliquez sur un mot pour le placer — cliquez sur un mot placé pour le retourner au pool.',
    r1reconstructed:   '// TEXTE RECONSTRUIT',
    r1scattered:       'FRAGMENTS DISPERSÉS — sélectionnez pour placer',
    r1verify:          'VÉRIFIER LE MANUSCRIT',
    r1clear:           'EFFACER',
    r1placed:          'Mots placés :',
    r1empty:           'Tous les fragments placés — vérifiez ou effacez pour réviser.',
    r1wrong:           '✗ ERREUR DE MANUSCRIT — {n} mot{s} mal placé{s}. Consultez les écrits de Bernard.',
    r1verified:        'MANUSCRIT VÉRIFIÉ ✓',
    r1clueLabel:       '// CHIFFRE ILLUMINÉ RÉCUPÉRÉ //',
    r1clueSub:         'Transcrivez ce mot dans votre dossier de mission.',
    // Room 2 directive
    r2directive:       'DIRECTIVE DU CODEX — FICHIER_003',
    r2sub:             'Neuf enseignements de la vie de saint François ont été dispersés. <strong>Cliquez sur une carte d\'enseignement</strong> pour la sélectionner, puis cliquez sur la colonne de <strong>vertu correspondante</strong> pour l\'assigner. Assignez les neuf, puis cliquez sur <strong>SOUMETTRE LES CORRESPONDANCES</strong>. Les paires correctes se verrouillent en vert — les mauvaises retournent au pool.',
    r2teachings:       'ENSEIGNEMENTS — sélectionnez-en un, puis choisissez sa vertu',
    r2submit:          'SOUMETTRE LES CORRESPONDANCES',
    r2assigned:        'assigné',
    r2submitVerified:  'TOUTES LES CORRESPONDANCES VÉRIFIÉES ✓',
    r2wrong:           '✗ {n} mauvaise{s} correspondance{s} — retournée{s} au pool.',
    r2locked:          '{n} verrouillée{s} correctement.',
    r2success:         '✓ TOUS LES ENSEIGNEMENTS CORRESPONDENT — Le chiffre du Cantique est restauré. FICHIER_003 authentifié.',
    r2clueLabel:       '// CHIFFRE DU CANTIQUE RÉCUPÉRÉ //',
    r2clueSub:         'Notez ce mot sacré — il sera nécessaire au Coffre-fort ignatien.',
    // Room 3 directive
    r3directive:       'DIRECTIVE DE CHIFFREMENT — FICHIER_004',
    r3sub:             'Le dossier d\'Antoine est scellé derrière un cadenas à quatre symboles. Chaque roue doit afficher l\'attribut correct de la vie d\'Antoine. Lisez chaque indice, identifiez l\'attribut correspondant, puis utilisez ▲ ▼ pour le régler. Soumettez quand les quatre roues sont réglées.',
    r3cipherKey:       'CLÉ DE CHIFFREMENT — SYMBOLES DES ATTRIBUTS',
    r3clues:           'INDICES ENCODÉS',
    r3wheel:           'Roue',
    r3up:              '▲',
    r3down:            '▼',
    r3lockBrand:       'ARCHIVUM · VATICANUM',
    r3unlock:          'DÉVERROUILLER LE DOSSIER',
    r3unlocked:        'DOSSIER DÉVERROUILLÉ ✓',
    r3wrong:           '✗ COMBINAISON INCORRECTE — {n} roue{s} mal alignée{s}. Réexaminez les indices.',
    r3success:         '✓ COMBINAISON ACCEPTÉE — Dossier d\'Antoine déchiffré. FICHIER_004 authentifié.',
    r3clueLabel:       '// CHIFFRE DU DOSSIER RÉCUPÉRÉ //',
    r3clueSub:         'Notez ce mot — il appartient à la séquence du Coffre-fort ignatien.',
    // Room 4 directive
    r4directive:       'DIRECTIVE TEMPORELLE — FICHIER_005',
    r4sub:             'Six décrets de réforme du pontificat de Pie X (1903–1914) ont été séparés de leurs dates. <strong>Cliquez sur une carte de réforme</strong> pour la sélectionner, puis <strong>cliquez sur un emplacement d\'année</strong> sur la chronologie pour la placer. Réorganisez librement, puis cliquez sur <strong>SOUMETTRE LA SÉQUENCE</strong>. Les placements corrects se verrouillent — les mauvais retournent au pool.',
    r4reforms:         'DÉCRETS DE RÉFORME — sélectionnez-en un, puis placez-le',
    r4timeline:        'CHRONOLOGIE DU PONTIFICAT',
    r4placeHere:       '← placer ici',
    r4submit:          'SOUMETTRE LA SÉQUENCE',
    r4verified:        'SÉQUENCE VÉRIFIÉE ✓',
    r4wrong:           '✗ {n} réforme{s} mal placée{s} — mise{s} en évidence en rouge et retournée{s} au pool.',
    r4locked:          '{n} verrouillée{s} correctement.',
    r4partial:         '✓ {n} réforme{s} correctement placée{s} et verrouillée{s}. Continuez avec les cartes restantes.',
    r4success:         '✓ TOUTES LES RÉFORMES PLACÉES — Chronologie pontificale restaurée. FICHIER_005 authentifié.',
    r4clueLabel:       '// CHIFFRE PONTIFICAL RÉCUPÉRÉ //',
    r4clueSub:         'Notez ce mot — il appartient à la séquence du Coffre-fort ignatien.',
    // Room 5 directive
    r5directive:       'DIRECTIVE DE CHIFFREMENT MORAL — FICHIER_006',
    r5sub:             'Le dossier de Kolbe est verrouillé derrière une séquence de reconstruction morale. Naviguez à travers trois moments critiques d\'Auschwitz, en 1941. Lisez attentivement chaque scène. Seuls les choix qui reflètent le vrai caractère de Kolbe déverrouilleront les archives. Les mauvais choix vous renvoient à la même décision — réfléchissez et réessayez.',
    r5success:         '✓ CHEMIN MORAL COMPLÉTÉ — Dossier de Kolbe entièrement restauré. FICHIER_006 authentifié.',
    r5clueLabel:       '// CHIFFRE DU DOSSIER RÉCUPÉRÉ //',
    r5clueSub:         'Notez ce mot — il appartient à la séquence du Coffre-fort ignatien.',
  },
};

/** Returns the translated string for the current language. Falls back to English. */
function t(key) {
  return LANG[state.lang]?.[key] ?? LANG.en[key] ?? key;
}

/**
 * setLanguage(lang)
 * Switches the active language and re-renders all currently visible UI.
 * Does NOT reset game progress.
 */
function setLanguage(lang) {
  state.lang = lang;
  updateLangToggleUI(lang);
  rerenderCurrentLanguage();
}

/** Updates the EN/FR pill in the HUD. */
function updateLangToggleUI(lang) {
  const pill = $('#lang-toggle');
  if (!pill) return;
  pill.textContent = lang === 'en' ? 'FR' : 'EN';
  pill.setAttribute('aria-label', lang === 'en' ? 'Switch to French' : 'Passer en anglais');
}

/**
 * rerenderCurrentLanguage()
 * Re-renders all dynamic text that is currently visible.
 * Called every time setLanguage() fires mid-game.
 */
function rerenderCurrentLanguage() {
  // Update static HUD strings
  const hudLogo = $('.hud-logo');
  if (hudLogo) hudLogo.textContent = t('hudLogo');
  const sidebarHeadingEl = $('.sidebar-heading');
  if (sidebarHeadingEl) sidebarHeadingEl.textContent = t('saintFiles');
  const hintCountLabel = $('.hint-count');
  if (hintCountLabel) {
    const count = MAX_HINTS - state.hintsUsed;
    hintCountLabel.innerHTML = `${t('hintsRemaining')} <span id="hint-count">${count}</span>`;
  }
  const btnHintEl = $('#btn-hint');
  if (btnHintEl && !btnHintEl.disabled) btnHintEl.textContent = t('requestHint');
  const musicLabelEl = $('#music-label');
  if (musicLabelEl) musicLabelEl.textContent = music.enabled ? t('musicOn') : t('musicLabel');

  // Re-render sidebar and progress track labels
  renderProgressTrack();
  renderSidebar();
  localiseRoomHeaders();

  // Re-render current room
  if (state.gameStarted && !state.gameOver) {
    showRoom(state.currentRoom);
    // Re-run the active puzzle setup so all puzzle strings update
    rerenderActivePuzzle(state.currentRoom);
  }
}

/** Re-runs the setup function for the currently active room's puzzle. */
function rerenderActivePuzzle(roomIdx) {
  const setupFns = [
    setupRoom0Puzzle, setupRoom1Puzzle, setupRoom2Puzzle,
    setupRoom3Puzzle, setupRoom4Puzzle, setupRoom5Puzzle,
    setupRoom6Puzzle,
  ];
  // Only re-render if the room is not yet complete (don't wipe a finished dossier)
  if (!state.roomsComplete.includes(roomIdx)) {
    try { setupFns[roomIdx]?.(); } catch(e) { console.warn('Language rerender:', e); }
  }
}


// ─────────────────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

/**
 * Bilingual room header content — title and intro paragraph per room.
 * Updated by localiseRoomHeaders() on language change.
 */
const ROOM_HEADERS = [
  {
    title: { en: 'Saint Peter',              fr: 'Saint Pierre' },
    intro: {
      en: 'Simeon bar Jonah, known as Peter, was the first Bishop of Rome and head of the Twelve Apostles. His file contains the foundational keys to Vatican cryptographic authority. Without restoring this record, no further archives can be accessed.',
      fr: 'Simeon bar Jonah, connu sous le nom de Pierre, était le premier évêque de Rome et chef des Douze Apôtres. Son fichier contient les clés fondamentales de l\'autorité cryptographique du Vatican. Sans restaurer ce dossier, aucune autre archive ne peut être consultée.',
    },
  },
  {
    title: { en: 'St. Bernard of Clairvaux', fr: 'Saint Bernard de Clairvaux' },
    intro: {
      en: 'Bernard of Clairvaux, Doctor Mellifluus, was the primary mover of the Second Crusade and a reformer of Cistercian monasticism. His archived writings contain encryption keys derived from his mystical theology.',
      fr: 'Bernard de Clairvaux, Docteur Mellifluus, fut le principal instigateur de la Deuxième Croisade et un réformateur du monachisme cistercien. Ses écrits archivés contiennent des clés de chiffrement tirées de sa théologie mystique.',
    },
  },
  {
    title: { en: 'St. Francis of Assisi',    fr: 'Saint François d\'Assise' },
    intro: {
      en: 'Giovanni di Pietro di Bernardone, patron of animals and ecology, founded the Order of Friars Minor. His archive holds sequences encoded within the Canticle of the Sun — a cipher of creation and praise.',
      fr: 'Giovanni di Pietro di Bernardone, patron des animaux et de l\'écologie, fonda l\'Ordre des Frères Mineurs. Ses archives contiennent des séquences encodées dans le Cantique du Soleil — un chiffre de la création et de la louange.',
    },
  },
  {
    title: { en: 'St. Anthony of Padua',     fr: 'Saint Antoine de Padoue' },
    intro: {
      en: 'Fernando Martins de Bulhões, Doctor Evangelicus, was renowned for his powerful preaching and miracles. His dossier is indexed under "Lost & Found" — fragments scattered across the archive, waiting to be reassembled.',
      fr: 'Fernando Martins de Bulhões, Docteur Évangélique, était renommé pour la puissance de sa prédication et ses miracles. Son dossier est indexé sous « Objets perdus » — des fragments dispersés dans les archives, attendant d\'être réassemblés.',
    },
  },
  {
    title: { en: 'Pope Pius X',              fr: 'Pape Pie X' },
    intro: {
      en: 'Giuseppe Melchiorre Sarto, the "Pope of the Eucharist," modernized Church law and championed frequent communion. His archive is protected by liturgical sequences buried within the Motu Proprio documents.',
      fr: 'Giuseppe Melchiorre Sarto, le « Pape de l\'Eucharistie », modenisa le droit de l\'Église et défendit la communion fréquente. Son archive est protégée par des séquences liturgiques enfouies dans les documents du Motu Proprio.',
    },
  },
  {
    title: { en: 'St. Maximilian Kolbe',     fr: 'Saint Maximilien Kolbe' },
    intro: {
      en: 'Rajmund Kolbe, the "Martyr of Charity," sacrificed his life for a fellow prisoner at Auschwitz. The final saint file before the Ignatian Vault — its key is encoded in the language of total self-gift.',
      fr: 'Rajmund Kolbe, le « Martyr de la charité », sacrifia sa vie pour un compagnon prisonnier à Auschwitz. Le dernier fichier de saint avant le Coffre-fort ignatien — sa clé est encodée dans le langage du don total de soi.',
    },
  },
  {
    title: { en: 'The Ignatian Vault',       fr: 'Le Coffre-fort ignatien' },
    intro: {
      en: 'Íñigo López de Loyola, founder of the Society of Jesus, composed the Spiritual Exercises — a system of prayer and discernment that shaped the modern Church. This vault contains the master decryption key for the entire archive. All six saint files must be restored before entry is permitted.',
      fr: 'Íñigo López de Loyola, fondateur de la Compagnie de Jésus, composa les Exercices Spirituels — un système de prière et de discernement qui façonna l\'Église moderne. Ce coffre-fort contient la clé de déchiffrement maîtresse de toutes les archives. Les six fichiers de saints doivent tous être restaurés avant que l\'accès soit accordé.',
    },
  },
];

/** Updates all room title h2s and intro paragraphs to the current language. */
function localiseRoomHeaders() {
  ROOM_HEADERS.forEach((rh, i) => {
    const titleEl = $(`#room-title-${i}`);
    const introEl = $(`#dossier-text-${i}`);
    if (titleEl) titleEl.textContent = rh.title[state.lang];
    if (introEl) introEl.innerHTML   = `<p>${rh.intro[state.lang]}</p>`;
  });
}


const dom = {
  langScreen:    $('#lang-screen'),
  bootScreen:    $('#boot-screen'),
  gameScreen:    $('#game-screen'),
  victoryScreen: $('#victory-screen'),
  failureScreen: $('#failure-screen'),
  btnStart:      $('#btn-start'),
  timerDisplay:  $('#timer-display'),
  hintModal:     $('#hint-modal'),
  hintText:      $('#hint-text'),
  btnHint:       $('#btn-hint'),
  hintCount:     $('#hint-count'),
  progressTrack: $('#progress-track'),
  roomList:      $('#room-list'),
  victoryStats:  $('#victory-stats'),
  failureStats:  $('#failure-stats'),
  vaultPrereqs:  $('#vault-prereqs'),
  sidebar:       $('.sidebar'),
  sidebarHeading:$('.sidebar-heading'),
};

// ─────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────

// Language selection screen
$('#btn-lang-en')?.addEventListener('click', () => selectLanguageAndBoot('en'));
$('#btn-lang-fr')?.addEventListener('click', () => selectLanguageAndBoot('fr'));

function selectLanguageAndBoot(lang) {
  state.lang = lang;
  updateLangToggleUI(lang);
  localiseRoomHeaders();

  // Transition lang screen → boot screen
  const langScreen = dom.langScreen;
  const bootScreen = dom.bootScreen;
  if (langScreen) { langScreen.classList.add('fade-out'); setTimeout(() => { langScreen.classList.remove('active','fade-out'); }, 600); }

  // Localise the boot screen content before showing it
  localiseBootScreen(lang);

  setTimeout(() => {
    if (bootScreen) bootScreen.classList.add('active');
  }, 350);
}

function localiseBootScreen(lang) {
  const L = LANG[lang];
  const el = (id) => document.getElementById(id);
  // Sub label
  const sub = document.querySelector('#boot-screen .boot-sub');
  if (sub) sub.textContent = L.bootClassified;
  // Alert
  const alert = document.querySelector('#boot-screen .boot-alert span:nth-child(2)');
  if (alert) alert.textContent = L.bootAlert;
  // Briefing
  const brief = document.querySelector('#boot-screen .boot-briefing');
  if (brief) brief.textContent = L.bootBriefing;
  // Meta labels
  const metas = document.querySelectorAll('#boot-screen .boot-meta span');
  if (metas[0]) metas[0].innerHTML = `${L.bootMeta1} <strong>75 ${lang === 'fr' ? 'MINUTES' : 'MINUTES'}</strong>`;
  if (metas[1]) metas[1].innerHTML = `${L.bootMeta2} <strong>7</strong>`;
  if (metas[2]) metas[2].innerHTML = `${L.bootMeta3} <strong>OMEGA</strong>`;
  // Start button
  const startBtn = document.getElementById('btn-start');
  if (startBtn) startBtn.textContent = L.bootStart;
}

dom.btnStart.addEventListener('click', startGame);

function startGame() {
  dom.bootScreen.classList.add('fade-out');
  setTimeout(() => {
    dom.bootScreen.classList.remove('active', 'fade-out');
    dom.bootScreen.style.display = 'none';
    dom.gameScreen.classList.add('active');
    state.gameStarted = true;
    initGame();
  }, 600);
}

// ─────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────

function initGame() {
  renderProgressTrack();
  renderSidebar();
  showRoom(0);
  startTimer();
  updateVaultPrereqs();
  initAllPuzzles();

  // Language toggle
  const langToggleBtn = $('#lang-toggle');
  if (langToggleBtn) langToggleBtn.addEventListener('click', () => {
    setLanguage(state.lang === 'en' ? 'fr' : 'en');
  });

  // Mobile sidebar toggle
  if (dom.sidebarHeading) {
    dom.sidebarHeading.addEventListener('click', () => {
      dom.sidebar.classList.toggle('expanded');
    });
  }

  // Hint button
  dom.btnHint.addEventListener('click', requestHint);
}

// ─────────────────────────────────────────────────────────────────────
// PROGRESS TRACK (top HUD)
// ─────────────────────────────────────────────────────────────────────

function renderProgressTrack() {
  dom.progressTrack.innerHTML = '';
  ROOMS.forEach((room, i) => {
    // Connector before node (except first)
    if (i > 0) {
      const connector = document.createElement('div');
      connector.className = 'progress-connector';
      connector.id = `connector-${i}`;
      dom.progressTrack.appendChild(connector);
    }

    const node = document.createElement('div');
    node.className = `progress-node${room.isVault ? ' vault-node' : ''}`;
    node.id = `progress-node-${i}`;
    node.title = room.name[state.lang];
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.setAttribute('aria-label', `Navigate to ${room.name[state.lang]}`);
    node.innerHTML = `
      <div class="progress-node-dot">${room.icon}</div>
      <span class="progress-node-label">${room.short[state.lang]}</span>
    `;
    node.addEventListener('click', () => navigateToRoom(i));
    node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') navigateToRoom(i); });
    dom.progressTrack.appendChild(node);
  });
  refreshProgressTrack();
}

function refreshProgressTrack() {
  ROOMS.forEach((room, i) => {
    const node = $(`#progress-node-${i}`);
    if (!node) return;
    node.classList.remove('unlocked', 'active', 'complete');

    const isComplete = state.roomsComplete.includes(i);
    const isActive   = state.currentRoom === i;
    const isLocked   = isRoomLocked(i);

    if (isComplete)       node.classList.add('complete');
    else if (isActive)    node.classList.add('active');
    else if (!isLocked)   node.classList.add('unlocked');

    // Connector
    if (i > 0) {
      const connector = $(`#connector-${i}`);
      if (connector) {
        connector.classList.toggle('complete', state.roomsComplete.includes(i - 1));
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────────
// SIDEBAR ROOM LIST
// ─────────────────────────────────────────────────────────────────────

function renderSidebar() {
  dom.roomList.innerHTML = '';
  ROOMS.forEach((room, i) => {
    const li = document.createElement('li');
    li.className = `room-list-item${room.isVault ? ' vault-item' : ''}`;
    li.id = `list-item-${i}`;

    const statusLabel = getStatusLabel(i);
    li.innerHTML = `
      <span class="room-list-icon">${room.icon}</span>
      <span class="room-list-text">
        <span class="room-list-name">${room.name[state.lang]}</span>
        <span class="room-list-tag">${room.tag}</span>
      </span>
      <span class="room-list-status ${statusLabel.cls}" id="list-status-${i}">${statusLabel.text}</span>
    `;
    li.addEventListener('click', () => navigateToRoom(i));
    dom.roomList.appendChild(li);
  });
  refreshSidebar();
}

function refreshSidebar() {
  ROOMS.forEach((room, i) => {
    const li     = $(`#list-item-${i}`);
    const status = $(`#list-status-${i}`);
    if (!li || !status) return;

    const isComplete = state.roomsComplete.includes(i);
    const isActive   = state.currentRoom === i;
    const isLocked   = isRoomLocked(i);

    li.classList.remove('active-item', 'complete-item', 'locked-item');
    if (isComplete) li.classList.add('complete-item');
    else if (isActive) li.classList.add('active-item');
    else if (isLocked) li.classList.add('locked-item');

    const statusLabel = getStatusLabel(i);
    status.className  = `room-list-status ${statusLabel.cls}`;
    status.textContent = statusLabel.text;
  });
}

function getStatusLabel(i) {
  const room = ROOMS[i];
  if (state.roomsComplete.includes(i)) return { cls: 'status-complete', text: t('statusRestored') };
  if (isRoomLocked(i))                 return { cls: room.isVault ? 'status-sealed' : 'status-locked', text: room.isVault ? t('statusSealed') : t('statusLocked') };
  if (state.currentRoom === i)         return { cls: 'status-active', text: t('statusActive') };
  return { cls: 'status-active', text: t('statusOpen') };
}

// ─────────────────────────────────────────────────────────────────────
// ROOM NAVIGATION
// ─────────────────────────────────────────────────────────────────────

function isRoomLocked(i) {
  const room = ROOMS[i];
  // Room 0 always unlocked; vault needs all 6 complete; others need prev complete
  if (room.completePrev === -1) return false;
  if (room.isVault) return state.roomsComplete.length < 6;
  return !state.roomsComplete.includes(room.completePrev);
}

function navigateToRoom(i) {
  if (state.gameOver) return;
  if (isRoomLocked(i)) {
    // Flash the lock overlay
    const overlay = $(`#lock-overlay-${i}`);
    if (overlay) {
      overlay.style.transition = 'none';
      overlay.style.background = 'rgba(192,57,43,0.3)';
      setTimeout(() => {
        overlay.style.transition = '';
        overlay.style.background = '';
      }, 200);
    }
    return;
  }
  state.currentRoom = i;
  showRoom(i);
  refreshProgressTrack();
  refreshSidebar();

  // Collapse mobile sidebar
  if (dom.sidebar) dom.sidebar.classList.remove('expanded');
}

function showRoom(i) {
  // Hide all rooms
  $$('.room').forEach((r) => r.classList.remove('visible'));

  const roomEl = $(`#room-${i}`);
  if (roomEl) {
    roomEl.classList.add('visible');
    updateRoomBadge(i);
    updateIntegrity(i);
  }
}

// ─────────────────────────────────────────────────────────────────────
// ROOM COMPLETION (called by puzzle logic when correct answer given)
// ─────────────────────────────────────────────────────────────────────

/**
 * completeRoom(i) — call this from inside each puzzle's success handler.
 * It marks the room done, updates UI, and unlocks the next room.
 * For room 6 (vault), it triggers the victory sequence.
 */
function completeRoom(i) {
  if (state.roomsComplete.includes(i) || state.gameOver) return;

  state.roomsComplete.push(i);

  // Update integrity to 100%
  updateIntegrity(i);
  updateRoomBadge(i);
  updateVaultPrereqs();
  refreshProgressTrack();
  refreshSidebar();

  // Unlock NEXT room overlay and show advance button
  const nextIndex = i + 1;
  if (nextIndex < ROOMS.length) {
    const nextOverlay = $(`#lock-overlay-${nextIndex}`);
    if (nextOverlay) {
      nextOverlay.classList.add('hidden');
      const nextRoom = $(`#room-${nextIndex}`);
      if (nextRoom) nextRoom.classList.remove('locked');
    }
    // Open the saint dossier — questions must be answered before advance button appears
    setTimeout(() => openDossier(i), 1400);
  }

  // Show success feedback in current room
  showFeedback(i, 'success', getSuccessMessage(i));

  // Vault completion → victory
  if (i === 6) {
    setTimeout(triggerVictory, 1800);
  }
}

/**
 * injectAdvanceButton(completedRoomIdx, nextRoomIdx)
 * Called only after dossier questions are all answered correctly.
 */
function injectAdvanceButton(completedIdx, nextIdx) {
  const feedbackEl = $(`#feedback-${completedIdx}`);
  if (!feedbackEl) return;
  if (feedbackEl.querySelector('.btn-advance')) return;

  const nextRoom = ROOMS[nextIdx];
  if (!nextRoom) return;

  const btn = document.createElement('button');
  btn.className = 'btn-advance';
  btn.setAttribute('aria-label', `Proceed to ${nextRoom.name}`);
  btn.innerHTML = `
    <span class="btn-advance-icon">→</span>
    PROCEED TO ${nextRoom.name.toUpperCase()}
    <span class="btn-advance-tag">${nextRoom.tag}</span>
  `;
  btn.addEventListener('click', () => navigateToRoom(nextIdx));
  feedbackEl.appendChild(btn);
}

// ─────────────────────────────────────────────────────────────────────
// DOSSIER DATA
// Each entry: fields (label/value pairs), biography, legacy,
// ignatianLink, and 3 questions (each with type, text, options/pairs,
// answer, and scrollTarget — the CSS selector to scroll to on wrong answer).
// ─────────────────────────────────────────────────────────────────────

const DOSSIER_DATA = [
  {
    roomIdx: 0, fileTag: 'FILE_001',
    saint: { en: 'Saint Peter', fr: 'Saint Pierre' },
    fields: {
      en: [
        { label: 'Born',        value: 'c. 1 AD, Bethsaida, Galilee' },
        { label: 'Died',        value: 'c. 64–68 AD, Rome' },
        { label: 'Original Name', value: 'Simon bar Jonah' },
        { label: 'Feast Day',   value: 'June 29' },
        { label: 'Canonised',   value: 'Pre-Congregation — venerated from apostolic times' },
        { label: 'Patron Of',   value: 'Fishermen, popes, bridge builders' },
        { label: 'Key Symbols', value: 'Keys, inverted cross, fish' },
      ],
      fr: [
        { label: 'Né',          value: 'v. 1 apr. J.-C., Bethsaïde, Galilée' },
        { label: 'Décédé',      value: 'v. 64–68 apr. J.-C., Rome' },
        { label: "Nom d'origine", value: 'Simon bar Jonah' },
        { label: 'Fête',        value: '29 juin' },
        { label: 'Canonisé',    value: 'Pré-Congrégation — vénéré depuis les temps apostoliques' },
        { label: 'Patron de',   value: 'Les pêcheurs, les papes, les constructeurs de ponts' },
        { label: 'Symboles clés', value: 'Clés, croix inversée, poisson' },
      ],
    },
    biography: {
      en: `Simon was a fisherman on the Sea of Galilee when Jesus called him with two words: "Follow me." Jesus renamed him Peter — from the Greek Petros, meaning rock — and declared that on this rock he would build his Church. Peter was impulsive, passionate, and deeply flawed. He walked on water, then sank. He declared Jesus the Son of God, then denied knowing him three times before the rooster crowed. Yet it was Peter whom Jesus asked three times after the Resurrection — once for each denial — "Do you love me? Feed my sheep."\n\nAfter Pentecost, Peter became the fearless leader of the early Church, preaching to thousands and performing miracles. When sentenced to crucifixion under Emperor Nero, Peter asked to be crucified upside-down — deeming himself unworthy to die as his Lord did. He was buried on Vatican Hill, and the great Basilica of St. Peter stands above his tomb today.`,
      fr: `Simon était un pêcheur sur la mer de Galilée quand Jésus l'appela avec deux mots : « Suis-moi. » Jésus le renomma Pierre — du grec Petros, signifiant roc — et déclara que sur ce roc il bâtirait son Église. Pierre était impulsif, passionné et profondément imparfait. Il marcha sur l'eau, puis coula. Il déclara Jésus Fils de Dieu, puis le renia trois fois avant que le coq chante. Pourtant, c'est Pierre que Jésus interrogea trois fois après la Résurrection — une fois pour chaque reniement — « M'aimes-tu ? Nourris mes brebis. »\n\nAprès la Pentecôte, Pierre devint le chef intrépide de la première Église, prêchant à des milliers de personnes et accomplissant des miracles. Condamné à la crucifixion sous l'empereur Néron, Pierre demanda à être crucifié la tête en bas — se jugeant indigne de mourir de la même manière que son Seigneur. Il fut enterré sur la colline du Vatican, et la grande basilique Saint-Pierre s'élève aujourd'hui au-dessus de sa tombe.`,
    },
    legacy: {
      en: `Peter is considered the first Bishop of Rome — the first Pope. Every pope since has understood himself as a successor to Peter, holding the keys of authority Christ entrusted to him. His life proves that God does not call the perfect — he calls the willing and transforms them.`,
      fr: `Pierre est considéré comme le premier évêque de Rome — le premier pape. Chaque pape depuis lors s'est compris comme successeur de Pierre, tenant les clés de l'autorité que le Christ lui a confiées. Sa vie témoigne que Dieu n'appelle pas les parfaits — il appelle les disponibles et les transforme.`,
    },
    ignatianLink: {
      en: `Ignatius of Loyola drew deeply on Peter's model of a faith that acts despite failure. The Spiritual Exercises invite retreatants to encounter Christ personally — exactly the kind of direct, transforming relationship Peter had beside the Sea of Galilee.`,
      fr: `Ignace de Loyola s'est profondément inspiré du modèle de Pierre : une foi qui agit malgré l'échec. Les Exercices Spirituels invitent les retraitants à rencontrer le Christ personnellement — exactement le type de relation directe et transformatrice que Pierre a vécue au bord de la mer de Galilée.`,
    },
    questions: [
      {
        type: 'truefalse',
        text:        { en: 'St. Peter was born in Rome, where he eventually died.', fr: 'Saint Pierre est né à Rome, là où il est finalement décédé.' },
        answer: 'false',
        explanation:{ en: 'FALSE — Peter was born in Bethsaida, Galilee. He died in Rome.', fr: 'FAUX — Pierre est né à Bethsaïde, en Galilée. Il est mort à Rome.' },
        scrollTarget: '.ds-fields-table',
      },
      {
        type: 'multiple',
        text:   { en: 'What does the name "Peter" mean?', fr: 'Que signifie le nom « Pierre » ?' },
        options:{ en: ['Shepherd','Rock','Fisherman','Key-bearer'], fr: ['Berger','Roc','Pêcheur','Porteur de clés'] },
        answer: { en: 'Rock', fr: 'Roc' },
        explanation:{ en: 'Jesus renamed Simon "Peter" from the Greek Petros, meaning rock.', fr: 'Jésus renomma Simon « Pierre » du grec Petros, signifiant roc.' },
        scrollTarget: '.ds-biography',
      },
      {
        type: 'matching',
        text:  { en: 'Match each symbol to its meaning for St. Peter.', fr: 'Associez chaque symbole à sa signification pour saint Pierre.' },
        pairs: {
          en: [
            { left: 'Keys',           right: 'Authority given by Christ over the Church' },
            { left: 'Inverted cross', right: 'How Peter chose to be crucified' },
            { left: 'Fish',           right: 'His life before following Jesus' },
          ],
          fr: [
            { left: 'Clés',           right: 'Autorité confiée par le Christ sur l\'Église' },
            { left: 'Croix inversée', right: 'Comment Pierre choisit d\'être crucifié' },
            { left: 'Poisson',        right: 'Sa vie avant de suivre Jésus' },
          ],
        },
        answer: {
          en: ['Authority given by Christ over the Church','How Peter chose to be crucified','His life before following Jesus'],
          fr: ['Autorité confiée par le Christ sur l\'Église','Comment Pierre choisit d\'être crucifié','Sa vie avant de suivre Jésus'],
        },
        explanation:{ en: 'Each symbol reflects a different part of Peter\'s life and mission.', fr: 'Chaque symbole reflète une partie différente de la vie et de la mission de Pierre.' },
        scrollTarget: '.ds-fields-table',
      },
    ],
  },
  {
    roomIdx: 1, fileTag: 'FILE_002',
    saint: { en: 'St. Bernard of Clairvaux', fr: 'Saint Bernard de Clairvaux' },
    fields: {
      en: [
        { label: 'Born',                 value: '1090 AD, Fontaine-lès-Dijon, Burgundy, France' },
        { label: 'Died',                 value: '20 August 1153 AD, Clairvaux, France' },
        { label: 'Feast Day',            value: 'August 20' },
        { label: 'Canonised',            value: '1174 AD by Pope Alexander III' },
        { label: 'Doctor of the Church', value: '1830 AD by Pope Pius VIII' },
        { label: 'Title',                value: 'Doctor Mellifluus — "The Honey-Sweet Doctor"' },
        { label: 'Patron Of',            value: 'Cistercian Order, beekeepers, candlemakers' },
        { label: 'Key Symbols',          value: 'Beehive, white habit, book' },
      ],
      fr: [
        { label: 'Né',                   value: '1090 apr. J.-C., Fontaine-lès-Dijon, Bourgogne, France' },
        { label: 'Décédé',               value: '20 août 1153 apr. J.-C., Clairvaux, France' },
        { label: 'Fête',                 value: '20 août' },
        { label: 'Canonisé',             value: '1174 apr. J.-C. par le pape Alexandre III' },
        { label: "Docteur de l'Église",  value: '1830 apr. J.-C. par le pape Pie VIII' },
        { label: 'Titre',                value: 'Docteur Mellifluus — « Le Docteur au miel doux »' },
        { label: 'Patron de',            value: 'Ordre cistercien, apiculteurs, fabricants de bougies' },
        { label: 'Symboles clés',        value: 'Ruche, habit blanc, livre' },
      ],
    },
    biography: {
      en: `Bernard was born into a noble Burgundian family and could have lived a comfortable life of privilege. Instead, at twenty-two, he entered the struggling monastery of Cîteaux and brought thirty of his own relatives with him. Within three years, his abbot sent him to found a new monastery at a remote valley called Clairvaux — the Valley of Light.\n\nBernard became the most powerful churchman of his age — advising popes, settling schisms, preaching the Second Crusade, and writing theological works of extraordinary beauty. His sermons on the Song of Songs — eighty-six of them, never finished — remain among the most read mystical texts in Christian history. He had a gift for words so extraordinary that he was called Doctor Mellifluus: the honey-sweet doctor. Yet Bernard considered himself nothing. He wrote: "What a person is before God, that he is and nothing more."`,
      fr: `Bernard naquit dans une noble famille bourguignonne et aurait pu mener une vie confortable de privilèges. Au lieu de cela, à vingt-deux ans, il entra dans le monastère chancelant de Cîteaux et amena avec lui trente de ses propres proches. En trois ans, son abbé l'envoya fonder un nouveau monastère dans une vallée reculée appelée Clairvaux — la Vallée de la Lumière.\n\nBernard devint l'homme d'Église le plus puissant de son époque — conseillant des papes, résolvant des schismes, prêchant la Deuxième Croisade et écrivant des œuvres théologiques d'une beauté extraordinaire. Ses sermons sur le Cantique des Cantiques — quatre-vingt-six au total, jamais achevés — demeurent parmi les textes mystiques les plus lus de l'histoire chrétienne. Il avait un don pour les mots si extraordinaire qu'on l'appelait Docteur Mellifluus : le docteur au miel doux. Pourtant Bernard se considérait lui-même comme rien. Il écrivit : « Ce qu'un homme est devant Dieu, voilà ce qu'il est, rien de plus. »`,
    },
    legacy: {
      en: `Bernard reformed the Cistercian Order, returning it to strict simplicity and manual labour. He believed that the spiritual life required both contemplation and action — a conviction that would later shape Ignatius of Loyola's own vision for the Jesuits.`,
      fr: `Bernard réforma l'Ordre cistercien, le ramenant à une stricte simplicité et au travail manuel. Il croyait que la vie spirituelle exigeait à la fois contemplation et action — une conviction qui allait plus tard façonner la vision d'Ignace de Loyola pour les Jésuites.`,
    },
    ignatianLink: {
      en: `Bernard's insistence that faith must produce fruit in the world — not retreat from it — directly echoes Ignatius's motto: Ad Maiorem Dei Gloriam. For the greater glory of God.`,
      fr: `L'insistance de Bernard sur le fait que la foi doit porter du fruit dans le monde — et non s'en retirer — fait directement écho à la devise d'Ignace : Ad Maiorem Dei Gloriam. Pour la plus grande gloire de Dieu.`,
    },
    questions: [
      {
        type: 'multiple',
        text:    { en: 'What title was given to Bernard because of his beautiful writing?', fr: 'Quel titre fut donné à Bernard en raison de ses beaux écrits ?' },
        options: { en: ['Doctor Angelicus','Doctor Mellifluus','Doctor Evangelicus','Doctor Maximus'], fr: ['Docteur Angelicus','Docteur Mellifluus','Docteur Evangelicus','Docteur Maximus'] },
        answer:  { en: 'Doctor Mellifluus', fr: 'Docteur Mellifluus' },
        explanation: { en: 'Bernard was called Doctor Mellifluus — the honey-sweet doctor — for his extraordinarily beautiful theological writing.', fr: 'Bernard fut appelé Docteur Mellifluus — le docteur au miel doux — pour ses écrits théologiques extraordinairement beaux.' },
        scrollTarget: '.ds-fields-table',
      },
      {
        type: 'truefalse',
        text:        { en: 'Bernard was born into a poor family and entered the monastery to escape poverty.', fr: 'Bernard est né dans une famille pauvre et est entré au monastère pour échapper à la pauvreté.' },
        answer: 'false',
        explanation:{ en: 'FALSE — Bernard was born into a noble family and chose monastic life over a life of privilege.', fr: 'FAUX — Bernard est né dans une famille noble et a choisi la vie monastique plutôt qu\'une vie de privilèges.' },
        scrollTarget: '.ds-biography',
      },
      {
        type: 'matching',
        text:  { en: 'Match each symbol to its meaning for St. Bernard.', fr: 'Associez chaque symbole à sa signification pour saint Bernard.' },
        pairs: {
          en: [ { left: 'Beehive', right: 'His eloquent writing — "honey-sweet doctor"' }, { left: 'White habit', right: 'The Cistercian Order he reformed' }, { left: 'Book', right: 'His theological writings and sermons' } ],
          fr: [ { left: 'Ruche', right: 'Ses écrits éloquents — « docteur au miel doux »' }, { left: 'Habit blanc', right: "L'Ordre cistercien qu'il réforma" }, { left: 'Livre', right: 'Ses écrits théologiques et ses sermons' } ],
        },
        answer: {
          en: ['His eloquent writing — "honey-sweet doctor"','The Cistercian Order he reformed','His theological writings and sermons'],
          fr: ['Ses écrits éloquents — « docteur au miel doux »',"L'Ordre cistercien qu'il réforma",'Ses écrits théologiques et ses sermons'],
        },
        explanation: { en: 'Each symbol points to a different aspect of Bernard\'s life and legacy.', fr: 'Chaque symbole pointe vers un aspect différent de la vie et de l\'héritage de Bernard.' },
        scrollTarget: '.ds-fields-table',
      },
    ],
  },
  {
    roomIdx: 2, fileTag: 'FILE_003',
    saint: { en: 'St. Francis of Assisi', fr: "Saint François d'Assise" },
    fields: {
      en: [
        { label: 'Born',        value: '1181 AD, Assisi, Umbria, Italy' },
        { label: 'Died',        value: '3 October 1226 AD, Assisi' },
        { label: 'Feast Day',   value: 'October 4' },
        { label: 'Canonised',   value: '1228 AD by Pope Gregory IX' },
        { label: 'Founded',     value: 'Order of Friars Minor (Franciscans)' },
        { label: 'Patron Of',   value: 'Animals, ecology, Italy, merchants' },
        { label: 'Key Symbols', value: 'Tau cross, wolf, birds, stigmata' },
      ],
      fr: [
        { label: 'Né',          value: '1181 apr. J.-C., Assise, Ombrie, Italie' },
        { label: 'Décédé',      value: '3 octobre 1226 apr. J.-C., Assise' },
        { label: 'Fête',        value: '4 octobre' },
        { label: 'Canonisé',    value: '1228 apr. J.-C. par le pape Grégoire IX' },
        { label: 'Fondateur',   value: 'Ordre des Frères Mineurs (Franciscains)' },
        { label: 'Patron de',   value: 'Les animaux, l\'écologie, l\'Italie, les marchands' },
        { label: 'Symboles clés', value: 'Croix tau, loup, oiseaux, stigmates' },
      ],
    },
    biography: {
      en: `Giovanni di Pietro di Bernardone grew up the son of a wealthy cloth merchant. A serious illness and imprisonment during a local war began to change him. The decisive moment came when he heard Christ speak from a crucifix in the chapel of San Damiano: "Francis, rebuild my Church." He took it literally at first — restoring the chapel stone by stone — then understood the deeper call.\n\nIn a dramatic public act, he stripped off his fine clothes before the Bishop of Assisi, returned them to his furious father, and walked away owning nothing but a simple tunic. He preached, embraced lepers, and cared for the poorest of the poor. In 1224, near the end of his life, Francis received the stigmata — the wounds of Christ in his own hands, feet, and side — the first person in recorded history to do so. He composed the Canticle of the Sun, one of the oldest surviving poems in Italian, praising God through Brother Sun, Sister Moon, and Mother Earth.`,
      fr: `Giovanni di Pietro di Bernardone grandit en fils d'un riche marchand de draps. Une grave maladie et une période d'emprisonnement lors d'une guerre locale commencèrent à le transformer. Le moment décisif vint lorsqu'il entendit le Christ lui parler depuis un crucifix dans la chapelle San Damiano : « François, rebâtis mon Église. » Il le prit d'abord au sens littéral — restaurant la chapelle pierre par pierre — puis comprit l'appel plus profond.\n\nDans un acte public dramatique, il se déshabilla de ses beaux vêtements devant l'évêque d'Assise, les rendit à son père furieux et repartit sans rien d'autre qu'une simple tunique. Il prêcha, embrassa les lépreux et prit soin des plus pauvres. En 1224, vers la fin de sa vie, François reçut les stigmates — les plaies du Christ dans ses propres mains, pieds et côté — la première personne dans l'histoire documentée à le faire. Il composa le Cantique du Soleil, l'un des plus anciens poèmes survivants en langue italienne, louant Dieu à travers Frère Soleil, Sœur Lune et Mère Terre.`,
    },
    legacy: {
      en: `Francis demonstrated that radical poverty was not deprivation — it was freedom. Owning nothing, he was available to everyone. He is recognised as a patron of ecology, and Pope Francis took his name directly from him.`,
      fr: `François démontra que la pauvreté radicale n'était pas une privation — c'était la liberté. Ne possédant rien, il était disponible pour tous. Il est reconnu comme patron de l'écologie, et le pape François a pris son nom directement de lui.`,
    },
    ignatianLink: {
      en: `Francis's spirituality of finding God in all created things deeply influenced the Jesuit tradition of contemplation in action — seeking the divine in the ordinary world.`,
      fr: `La spiritualité de François, qui consiste à trouver Dieu dans toutes les créatures, a profondément influencé la tradition jésuite de la contemplation dans l'action — chercher le divin dans le monde ordinaire.`,
    },
    questions: [
      {
        type: 'truefalse',
        text:        { en: 'Francis received the stigmata — the wounds of Christ — making him the first person in recorded history to do so.', fr: 'François reçut les stigmates — les plaies du Christ — devenant ainsi la première personne dans l\'histoire documentée à le faire.' },
        answer: 'true',
        explanation:{ en: 'TRUE — In 1224, near the end of his life, Francis received the stigmata, the first documented case in history.', fr: 'VRAI — En 1224, vers la fin de sa vie, François reçut les stigmates, le premier cas documenté dans l\'histoire.' },
        scrollTarget: '.ds-biography',
      },
      {
        type: 'multiple',
        text:    { en: 'What is the Canticle of the Sun?', fr: 'Qu\'est-ce que le Cantique du Soleil ?' },
        options: {
          en: ['A prayer for the sick','One of the oldest surviving poems in Italian, praising God through creation','A set of rules for the Franciscan Order','A hymn sung at Francis\'s canonisation'],
          fr: ['Une prière pour les malades','L\'un des plus anciens poèmes survivants en langue italienne, louant Dieu à travers la création','Un ensemble de règles pour l\'Ordre franciscain','Un hymne chanté lors de la canonisation de François'],
        },
        answer:  { en: 'One of the oldest surviving poems in Italian, praising God through creation', fr: "L'un des plus anciens poèmes survivants en langue italienne, louant Dieu à travers la création" },
        explanation: { en: 'The Canticle of the Sun is one of the oldest surviving works in the Italian language — Francis praised God through Brother Sun, Sister Moon, and Mother Earth.', fr: 'Le Cantique du Soleil est l\'une des plus anciennes œuvres survivantes en langue italienne — François louait Dieu à travers Frère Soleil, Sœur Lune et Mère Terre.' },
        scrollTarget: '.ds-biography',
      },
      {
        type: 'matching',
        text:  { en: 'Match each symbol to its meaning for St. Francis.', fr: 'Associez chaque symbole à sa signification pour saint François.' },
        pairs: {
          en: [ { left: 'Tau cross', right: 'Sign of the Franciscan Order and obedience' }, { left: 'Wolf', right: "The wolf of Gubbio, tamed by Francis's compassion" }, { left: 'Stigmata', right: 'The wounds of Christ received by Francis in 1224' } ],
          fr: [ { left: 'Croix tau', right: "Signe de l'Ordre franciscain et d'obéissance" }, { left: 'Loup', right: 'Le loup de Gubbio, apprivoisé par la compassion de François' }, { left: 'Stigmates', right: 'Les plaies du Christ reçues par François en 1224' } ],
        },
        answer: {
          en: ['Sign of the Franciscan Order and obedience',"The wolf of Gubbio, tamed by Francis's compassion",'The wounds of Christ received by Francis in 1224'],
          fr: ["Signe de l'Ordre franciscain et d'obéissance",'Le loup de Gubbio, apprivoisé par la compassion de François','Les plaies du Christ reçues par François en 1224'],
        },
        explanation: { en: 'Each symbol reflects a key moment or virtue in Francis\'s life.', fr: 'Chaque symbole reflète un moment clé ou une vertu dans la vie de François.' },
        scrollTarget: '.ds-fields-table',
      },
    ],
  },
  {
    roomIdx: 3, fileTag: 'FILE_004',
    saint: { en: 'St. Anthony of Padua', fr: 'Saint Antoine de Padoue' },
    fields: {
      en: [
        { label: 'Born',                 value: '15 August 1195 AD, Lisbon, Portugal' },
        { label: 'Died',                 value: '13 June 1231 AD, Padua, Italy' },
        { label: 'Feast Day',            value: 'June 13' },
        { label: 'Canonised',            value: '1232 AD by Pope Gregory IX — less than one year after death' },
        { label: 'Doctor of the Church', value: '1946 AD by Pope Pius XII' },
        { label: 'Title',                value: 'Doctor Evangelicus' },
        { label: 'Patron Of',            value: 'Lost things, the poor, travellers, Portugal' },
        { label: 'Key Symbols',          value: 'Lily, bread, Christ Child, book' },
      ],
      fr: [
        { label: 'Né',                   value: '15 août 1195 apr. J.-C., Lisbonne, Portugal' },
        { label: 'Décédé',               value: '13 juin 1231 apr. J.-C., Padoue, Italie' },
        { label: 'Fête',                 value: '13 juin' },
        { label: 'Canonisé',             value: '1232 apr. J.-C. par le pape Grégoire IX — moins d\'un an après sa mort' },
        { label: "Docteur de l'Église",  value: '1946 apr. J.-C. par le pape Pie XII' },
        { label: 'Titre',                value: 'Docteur Évangélique' },
        { label: 'Patron de',            value: 'Les objets perdus, les pauvres, les voyageurs, le Portugal' },
        { label: 'Symboles clés',        value: 'Lys, pain, Enfant Jésus, livre' },
      ],
    },
    biography: {
      en: `Fernando Martins de Bulhões was born in Lisbon and joined the Augustinians as a young man. After the relics of the first Franciscan martyrs passed through Lisbon, he joined the Franciscans, took the name Anthony, and sailed for Morocco to preach — only to fall gravely ill and be redirected to Italy.\n\nAt a public ordination where no one had prepared a sermon, Anthony was asked to speak. What followed astonished everyone. Francis of Assisi appointed him the first Franciscan teacher of theology. Anthony became the most popular preacher in Europe — drawing crowds so large that no church could contain them. One celebrated miracle: when heretics in Rimini refused to hear him, he went to the shore and preached to the fish — who gathered, raised their heads, and listened.\n\nHis canonisation came less than twelve months after his death — the fastest in Church history. He died at just thirty-five.`,
      fr: `Fernando Martins de Bulhões naquit à Lisbonne et rejoignit les Augustiniens comme jeune homme. Après que les reliques des premiers martyrs franciscains passèrent par Lisbonne, il rejoignit les Franciscains, prit le nom d'Antoine et s'embarqua pour le Maroc pour prêcher — avant de tomber gravement malade et d'être redirigé vers l'Italie.\n\nLors d'une ordination publique où personne n'avait préparé de sermon, on demanda à Antoine de prendre la parole. Ce qui suivit stupéfia tous les présents. François d'Assise le nomma premier professeur de théologie franciscain. Antoine devint le prédicateur le plus populaire d'Europe — attirant des foules si grandes qu'aucune église ne pouvait les contenir. L'un de ses miracles les plus célèbres : lorsque des hérétiques à Rimini refusèrent de l'entendre, il se rendit au bord de la mer et prêcha aux poissons — qui se rassemblèrent, levèrent la tête et écoutèrent.\n\nSa canonisation prit moins de douze mois après sa mort — la plus rapide de l'histoire de l'Église. Il mourut à seulement trente-cinq ans.`,
    },
    legacy: {
      en: `Anthony is patron of lost things — a tradition rooted in a story about a stolen psalter returned after a terrifying vision. He is one of the most beloved saints in the Catholic world.`,
      fr: `Antoine est le patron des objets perdus — une tradition enracinée dans l'histoire d'un psautier volé rendu après une vision terrifiante. Il est l'un des saints les plus aimés du monde catholique.`,
    },
    ignatianLink: {
      en: `Anthony's fusion of rigorous scholarship with passionate preaching modelled exactly what Ignatius built into the Jesuit ideal: the contemplative in action, whose prayer produces mission.`,
      fr: `La fusion d'Antoine entre l'érudition rigoureuse et la prédication passionnée a modelé exactement ce qu'Ignace allait intégrer dans l'idéal jésuite : le contemplatif dans l'action, dont la prière produit la mission.`,
    },
    questions: [
      {
        type: 'multiple',
        text:    { en: 'How quickly was Anthony canonised after his death?', fr: 'Dans quel délai Antoine fut-il canonisé après sa mort ?' },
        options: { en: ['5 years','10 years','Less than one year','25 years'], fr: ['5 ans','10 ans','Moins d\'un an','25 ans'] },
        answer:  { en: 'Less than one year', fr: "Moins d'un an" },
        explanation: { en: 'Anthony was canonised less than one year after his death — the fastest canonisation in Church history.', fr: 'Antoine fut canonisé moins d\'un an après sa mort — la canonisation la plus rapide de l\'histoire de l\'Église.' },
        scrollTarget: '.ds-fields-table',
      },
      {
        type: 'truefalse',
        text:        { en: 'Anthony was born in Padua, the city where he is buried.', fr: 'Antoine est né à Padoue, la ville où il est enterré.' },
        answer: 'false',
        explanation:{ en: 'FALSE — Anthony was born in Lisbon, Portugal. He died and is buried in Padua, Italy.', fr: 'FAUX — Antoine est né à Lisbonne, au Portugal. Il est mort et enterré à Padoue, en Italie.' },
        scrollTarget: '.ds-fields-table',
      },
      {
        type: 'matching',
        text:  { en: 'Match each symbol to its meaning for St. Anthony.', fr: 'Associez chaque symbole à sa signification pour saint Antoine.' },
        pairs: {
          en: [ { left: 'Lily', right: 'Purity and his devotion to Mary' }, { left: 'Bread', right: "St. Anthony's Bread — alms given to the poor" }, { left: 'Christ Child', right: 'The vision witnessed by the nobleman who sheltered him' } ],
          fr: [ { left: 'Lys', right: 'Pureté et dévotion à Marie' }, { left: 'Pain', right: 'Le Pain de saint Antoine — aumônes données aux pauvres' }, { left: 'Enfant Jésus', right: 'La vision dont fut témoin le noble qui l\'hébergea' } ],
        },
        answer: {
          en: ['Purity and his devotion to Mary',"St. Anthony's Bread — alms given to the poor",'The vision witnessed by the nobleman who sheltered him'],
          fr: ['Pureté et dévotion à Marie','Le Pain de saint Antoine — aumônes données aux pauvres','La vision dont fut témoin le noble qui l\'hébergea'],
        },
        explanation: { en: 'Each symbol reflects a miracle or virtue associated with Anthony\'s life.', fr: 'Chaque symbole reflète un miracle ou une vertu associé à la vie d\'Antoine.' },
        scrollTarget: '.ds-fields-table',
      },
    ],
  },
  {
    roomIdx: 4, fileTag: 'FILE_005',
    saint: { en: 'Pope Pius X', fr: 'Pape Pie X' },
    fields: {
      en: [
        { label: 'Born',        value: '2 June 1835 AD, Riese, Veneto, Italy' },
        { label: 'Died',        value: '20 August 1914 AD, Rome' },
        { label: 'Papal Reign', value: '1903–1914' },
        { label: 'Feast Day',   value: 'August 21' },
        { label: 'Canonised',   value: '1954 AD by Pope Pius XII' },
        { label: 'Birth Name',  value: 'Giuseppe Melchiorre Sarto' },
        { label: 'Patron Of',   value: 'First communicants, pilgrims' },
        { label: 'Motto',       value: 'Instaurare omnia in Christo — To restore all things in Christ' },
      ],
      fr: [
        { label: 'Né',          value: '2 juin 1835 apr. J.-C., Riese, Vénétie, Italie' },
        { label: 'Décédé',      value: '20 août 1914 apr. J.-C., Rome' },
        { label: 'Pontificat',  value: '1903–1914' },
        { label: 'Fête',        value: '21 août' },
        { label: 'Canonisé',    value: '1954 apr. J.-C. par le pape Pie XII' },
        { label: 'Nom de naissance', value: 'Giuseppe Melchiorre Sarto' },
        { label: 'Patron de',   value: 'Les premiers communiants, les pèlerins' },
        { label: 'Devise',      value: 'Instaurare omnia in Christo — Restaurer toutes choses dans le Christ' },
      ],
    },
    biography: {
      en: `Giuseppe Sarto was the second of ten children born to a village postman and a seamstress — the first pope in centuries to come from genuine poverty. As a young priest he was known for simplicity and care for the poor.\n\nAs Pope from 1903, he set about reforming a Church he felt had grown too formal and distant from ordinary people. He ordered the first unified Code of Canon Law. He reformed sacred music, banning theatrical compositions and restoring Gregorian chant. He published a catechism in plain language. Most dramatically, he lowered the age for first Holy Communion from around twelve to the age of reason — approximately seven — declaring that Christ belonged to children too. He encouraged daily Communion at a time when many Catholics received it only a few times a year.\n\nWhen World War One broke out in August 1914, Pius X, who had worked tirelessly for peace, is said to have broken down weeping. He died twelve days after the war began, his heart broken.`,
      fr: `Giuseppe Sarto était le deuxième de dix enfants nés d'un facteur de village et d'une couturière — le premier pape depuis des siècles à venir d'une véritable pauvreté. Comme jeune prêtre, il était connu pour sa simplicité et son soin des pauvres.\n\nComme pape à partir de 1903, il entreprit de réformer une Église qu'il estimait trop formelle et trop distante des gens ordinaires. Il ordonna le premier Code de droit canonique unifié. Il réforma la musique sacrée, interdisant les compositions théâtrales et restaurant le chant grégorien. Il publia un catéchisme en langage simple. De façon la plus dramatique, il abaissa l'âge de la première communion de douze ans environ à l'âge de raison — environ sept ans — déclarant que le Christ appartenait aussi aux enfants. Il encouragea la communion quotidienne à une époque où beaucoup de catholiques la recevaient seulement quelques fois par an.\n\nLorsque la Première Guerre mondiale éclata en août 1914, Pie X, qui avait travaillé sans relâche pour la paix, aurait fondu en larmes. Il mourut douze jours après le début de la guerre, le cœur brisé.`,
    },
    legacy: {
      en: `Pius X is remembered as the Pope who opened the Eucharist to all. His motto — Instaurare omnia in Christo — shaped his entire papacy: everything reformed, everything restored, everything for Christ.`,
      fr: `Pie X est rappelé comme le pape qui ouvrit l'Eucharistie à tous. Sa devise — Instaurare omnia in Christo — façonna tout son pontificat : tout réformé, tout restauré, tout pour le Christ.`,
    },
    ignatianLink: {
      en: `The Jesuit tradition emphasises frequent prayer and sacrament as the foundation of active life. Pius X's insistence on frequent Communion and accessible catechesis aligned directly with the Ignatian vision of faith that nourishes daily action.`,
      fr: `La tradition jésuite a toujours mis l'accent sur la prière fréquente et les sacrements comme fondement de la vie active. L'insistance de Pie X sur la communion fréquente et la catéchèse accessible s'alignait directement avec la vision ignatienne d'une foi qui nourrit l'action quotidienne.`,
    },
    questions: [
      {
        type: 'truefalse',
        text:        { en: 'Pius X came from a wealthy noble family, which gave him the connections to become Pope.', fr: 'Pie X venait d\'une riche famille noble, ce qui lui donna les relations pour devenir pape.' },
        answer: 'false',
        explanation:{ en: 'FALSE — He was born into genuine poverty, the son of a village postman and a seamstress.', fr: 'FAUX — Il est né dans une véritable pauvreté, fils d\'un facteur de village et d\'une couturière.' },
        scrollTarget: '.ds-biography',
      },
      {
        type: 'multiple',
        text:    { en: 'What was Pius X\'s papal motto?', fr: 'Quelle était la devise pontificale de Pie X ?' },
        options: { en: ['Ad Maiorem Dei Gloriam','Instaurare omnia in Christo','Pax et Bonum','Soli Deo Gloria'], fr: ['Ad Maiorem Dei Gloriam','Instaurare omnia in Christo','Pax et Bonum','Soli Deo Gloria'] },
        answer:  { en: 'Instaurare omnia in Christo', fr: 'Instaurare omnia in Christo' },
        explanation: { en: 'His motto was Instaurare omnia in Christo — To restore all things in Christ.', fr: 'Sa devise était Instaurare omnia in Christo — Restaurer toutes choses dans le Christ.' },
        scrollTarget: '.ds-fields-table',
      },
      {
        type: 'matching',
        text:  { en: 'Match each reform to what Pius X changed.', fr: 'Associez chaque réforme à ce que Pie X a changé.' },
        pairs: {
          en: [ { left: 'First Communion age', right: 'Lowered from ~12 to the age of reason (~7)' }, { left: 'Sacred music', right: 'Restored Gregorian chant, banned theatrical music' }, { left: 'Code of Canon Law', right: 'Ordered the first unified revision of Church law' } ],
          fr: [ { left: 'Âge de la première communion', right: 'Abaissé de ~12 ans à l\'âge de raison (~7 ans)' }, { left: 'Musique sacrée', right: 'Restauration du chant grégorien, interdiction de la musique théâtrale' }, { left: 'Code de droit canonique', right: 'Première révision unifiée du droit de l\'Église ordonnée' } ],
        },
        answer: {
          en: ['Lowered from ~12 to the age of reason (~7)','Restored Gregorian chant, banned theatrical music','Ordered the first unified revision of Church law'],
          fr: ['Abaissé de ~12 ans à l\'âge de raison (~7 ans)','Restauration du chant grégorien, interdiction de la musique théâtrale','Première révision unifiée du droit de l\'Église ordonnée'],
        },
        explanation: { en: 'Each reform addressed a different aspect of Church life that Pius X felt needed restoration.', fr: 'Chaque réforme abordait un aspect différent de la vie de l\'Église que Pie X estimait nécessiter une restauration.' },
        scrollTarget: '.ds-biography',
      },
    ],
  },
  {
    roomIdx: 5, fileTag: 'FILE_006',
    saint: { en: 'St. Maximilian Kolbe', fr: 'Saint Maximilien Kolbe' },
    fields: {
      en: [
        { label: 'Born',        value: '8 January 1894 AD, Zduńska Wola, Poland' },
        { label: 'Died',        value: '14 August 1941 AD, Auschwitz, Poland' },
        { label: 'Feast Day',   value: 'August 14' },
        { label: 'Canonised',   value: '1982 AD by Pope John Paul II' },
        { label: 'Order',       value: 'Order of Friars Minor Conventual (Franciscan)' },
        { label: 'Designated',  value: 'Martyr of Charity' },
        { label: 'Patron Of',   value: 'Drug addicts, political prisoners, journalists, families' },
        { label: 'Key Symbols', value: 'Franciscan habit, prisoner number 16670, Immaculate Mary' },
      ],
      fr: [
        { label: 'Né',          value: '8 janvier 1894 apr. J.-C., Zduńska Wola, Pologne' },
        { label: 'Décédé',      value: '14 août 1941 apr. J.-C., Auschwitz, Pologne' },
        { label: 'Fête',        value: '14 août' },
        { label: 'Canonisé',    value: '1982 apr. J.-C. par le pape Jean-Paul II' },
        { label: 'Ordre',       value: 'Ordre des Frères Mineurs Conventuels (Franciscain)' },
        { label: 'Désigné',     value: 'Martyr de la charité' },
        { label: 'Patron de',   value: 'Les toxicomanes, les prisonniers politiques, les journalistes, les familles' },
        { label: 'Symboles clés', value: 'Habit franciscain, numéro de prisonnier 16670, Marie Immaculée' },
      ],
    },
    biography: {
      en: `Rajmund Kolbe was born in occupied Poland and entered the Franciscan order as a teenager. He became a prolific publisher — founding a religious magazine that eventually reached one million readers. When Germany invaded Poland in 1939, his friary sheltered thousands of refugees, including approximately 2,000 Jews.\n\nHe was arrested by the Gestapo in 1941 and sent to Auschwitz as prisoner 16670. In July 1941, a prisoner escaped from Block 14. As punishment, the commandant selected ten men to die by starvation. One of the ten — Franciszek Gajowniczek — cried out for his wife and children. Kolbe stepped forward: "I am a Catholic priest. I wish to take the place of this man." The commandant accepted.\n\nFor three weeks, Kolbe led the condemned men in prayer and hymns. Guards reported singing from the bunker instead of screaming. Kolbe died last, on 14 August 1941 — the eve of the Feast of the Assumption. He offered his arm to the guard without a word. Gajowniczek lived until 1995, spending fifty-four years telling the world what happened.`,
      fr: `Rajmund Kolbe naquit en Pologne occupée et entra dans l'Ordre franciscain comme adolescent. Il devint un éditeur prolifique — fondant un magazine religieux qui atteignit finalement un million de lecteurs. Lorsque l'Allemagne envahit la Pologne en 1939, son monastère accueillit des milliers de réfugiés, dont environ 2 000 Juifs.\n\nIl fut arrêté par la Gestapo en 1941 et envoyé à Auschwitz comme prisonnier 16670. En juillet 1941, un prisonnier s'échappa du Bloc 14. En punition, le commandant sélectionna dix hommes pour mourir de faim dans un bunker souterrain. L'un des dix — Franciszek Gajowniczek — cria pour sa femme et ses enfants. Kolbe s'avança : « Je suis un prêtre catholique. Je souhaite prendre la place de cet homme. » Le commandant accepta.\n\nPendant trois semaines, Kolbe conduisit les condamnés dans la prière et les cantiques. Les gardes rapportèrent avoir entendu du chant depuis le bunker au lieu des cris. Kolbe mourut en dernier, le 14 août 1941 — la veille de la Fête de l'Assomption. Il offrit son bras au gardien sans un mot. Gajowniczek vécut jusqu'en 1995, passant cinquante-quatre ans à raconter au monde ce qui s'était passé.`,
    },
    legacy: {
      en: `John Paul II — a fellow Pole who lived through the same war — canonised Kolbe in 1982 and called him a martyr of charity. Gajowniczek was present at the canonisation.`,
      fr: `Jean-Paul II — un compatriote polonais qui a vécu la même guerre — canonisa Kolbe en 1982 et l'appela martyr de la charité. Gajowniczek était présent lors de la canonisation.`,
    },
    ignatianLink: {
      en: `Ignatius wrote that the greatest love is to lay down one's life for another. Kolbe enacted that principle without hesitation — one of the purest expressions of the Ignatian ideal that faith must cost something.`,
      fr: `Ignace écrivit que le plus grand amour est de donner sa vie pour un autre. Kolbe réalisa ce principe sans hésitation — l'une des expressions les plus pures de l'idéal ignatien que la foi doit coûter quelque chose.`,
    },
    questions: [
      {
        type: 'multiple',
        text:    { en: 'Who was Franciszek Gajowniczek?', fr: 'Qui était Franciszek Gajowniczek ?' },
        options: {
          en: ['The Nazi commandant who accepted Kolbe\'s offer','A fellow priest imprisoned with Kolbe','The man whose place Kolbe took in the starvation bunker','The prisoner who escaped, causing the punishment'],
          fr: ['Le commandant nazi qui accepta l\'offre de Kolbe','Un prêtre compagnon emprisonné avec Kolbe','L\'homme dont Kolbe prit la place dans le bunker d\'affamement','Le prisonnier qui s\'échappa, causant la punition'],
        },
        answer:  { en: 'The man whose place Kolbe took in the starvation bunker', fr: "L'homme dont Kolbe prit la place dans le bunker d'affamement" },
        explanation: { en: 'Gajowniczek was one of the ten men selected to die. Kolbe stepped forward and offered to take his place.', fr: 'Gajowniczek était l\'un des dix hommes sélectionnés pour mourir. Kolbe s\'avança et offrit de prendre sa place.' },
        scrollTarget: '.ds-biography',
      },
      {
        type: 'truefalse',
        text:        { en: 'Kolbe died on 14 August — the eve of the Feast of the Assumption of Mary.', fr: 'Kolbe mourut le 14 août — la veille de la Fête de l\'Assomption de Marie.' },
        answer: 'true',
        explanation:{ en: 'TRUE — Kolbe died on 14 August 1941, the eve of the Assumption, which was significant given his deep devotion to Mary.', fr: 'VRAI — Kolbe mourut le 14 août 1941, la veille de l\'Assomption, ce qui était significatif étant donné sa profonde dévotion à Marie.' },
        scrollTarget: '.ds-fields-table',
      },
      {
        type: 'matching',
        text:  { en: 'Match each fact to its detail for St. Maximilian Kolbe.', fr: 'Associez chaque fait à son détail pour saint Maximilien Kolbe.' },
        pairs: {
          en: [ { left: 'Prisoner number', right: '16670' }, { left: "Man whose life he saved", right: 'Franciszek Gajowniczek' }, { left: 'Year canonised', right: '1982 by Pope John Paul II' } ],
          fr: [ { left: 'Numéro de prisonnier', right: '16670' }, { left: 'Homme dont il sauva la vie', right: 'Franciszek Gajowniczek' }, { left: 'Année de canonisation', right: '1982 par le pape Jean-Paul II' } ],
        },
        answer: {
          en: ['16670','Franciszek Gajowniczek','1982 by Pope John Paul II'],
          fr: ['16670','Franciszek Gajowniczek','1982 par le pape Jean-Paul II'],
        },
        explanation: { en: "These details are key facts from Kolbe's time at Auschwitz and his canonisation.", fr: 'Ces détails sont des faits clés de la période de Kolbe à Auschwitz et de sa canonisation.' },
        scrollTarget: '.ds-fields-table',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────
// DOSSIER ENGINE
// ─────────────────────────────────────────────────────────────────────

/** Per-room dossier state: which questions answered, matching selections. */
const dossierState = {};

/**
 * openDossier(roomIdx)
 * Called by completeRoom() after puzzle success.
 * Injects the full dossier panel into the room body.
 */
function openDossier(roomIdx) {
  const data = DOSSIER_DATA[roomIdx];
  if (!data) {
    // No dossier (e.g. vault) — go straight to advance
    injectAdvanceButton(roomIdx, roomIdx + 1);
    return;
  }

  // Initialise per-room question state
  dossierState[roomIdx] = {
    answered:  new Array(data.questions.length).fill(false),
    matching:  data.questions.map(q => q.type === 'matching' ? new Array(q.pairs.length).fill(null) : null),
  };

  const roomBody = $(`#room-${roomIdx} .room-body`);
  if (!roomBody) return;

  // Remove any existing dossier panel
  const existing = $(`#dossier-panel-${roomIdx}`);
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.className = 'ds-panel';
  panel.id = `dossier-panel-${roomIdx}`;

  panel.innerHTML = `
    <div class="ds-header">
      <div class="ds-header-left">
        <span class="ds-file-tag">${data.fileTag} — ${t('dossierDeclassified')}</span>
        <h3 class="ds-saint-name">${data.saint[state.lang]}</h3>
      </div>
      <div class="ds-stamp">${t('dossierStamp')}</div>
    </div>

    <div class="ds-fields-table">
      ${data.fields[state.lang].map(f => `
        <div class="ds-field-row">
          <span class="ds-field-label">${f.label}</span>
          <span class="ds-field-value">${f.value}</span>
        </div>
      `).join('')}
    </div>

    <div class="ds-section">
      <p class="ds-section-label">${t('secBiography')}</p>
      <div class="ds-biography">
        ${data.biography[state.lang].split('\n\n').map(p => `<p class="ds-para">${p}</p>`).join('')}
      </div>
    </div>

    <div class="ds-section">
      <p class="ds-section-label">${t('secLegacy')}</p>
      <p class="ds-para">${data.legacy[state.lang]}</p>
    </div>

    <div class="ds-section">
      <p class="ds-section-label">${t('secIgnatian')}</p>
      <p class="ds-para ds-ignatian">${data.ignatianLink[state.lang]}</p>
    </div>

    <div class="ds-divider"></div>

    <div class="ds-questions-header">
      <span class="ds-q-icon">📋</span>
      <div>
        <p class="ds-q-title">${t('comprehensionTitle')}</p>
        <p class="ds-q-sub">${t('comprehensionSub')}</p>
      </div>
    </div>

    <div class="ds-questions" id="ds-questions-${roomIdx}"></div>

    <div class="ds-clue-wrap" id="ds-clue-${roomIdx}" aria-hidden="true">
      <p class="ds-clue-label">${t('cipherRecovered')}</p>
      <div class="ds-clue-letters" id="ds-clue-letters-${roomIdx}"></div>
    </div>
  `;

  roomBody.appendChild(panel);

  // Scroll panel into view
  setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  // Render questions after reading delay (give students time to read)
  renderDossierQuestions(roomIdx);
}

/** Builds and injects all 3 question widgets for a room. */
function renderDossierQuestions(roomIdx) {
  const data      = DOSSIER_DATA[roomIdx];
  const container = $(`#ds-questions-${roomIdx}`);
  if (!container || !data) return;
  container.innerHTML = '';

  data.questions.forEach((q, qIdx) => {
    const block = document.createElement('div');
    block.className = 'ds-question-block';
    block.id = `ds-q-${roomIdx}-${qIdx}`;

    const qHeader = document.createElement('div');
    qHeader.className = 'ds-q-header';
    qHeader.innerHTML = `
      <span class="ds-q-num">Q${qIdx + 1}</span>
      <span class="ds-q-type-badge">${q.type === 'truefalse' ? t('qTypeTF') : q.type === 'multiple' ? t('qTypeMC') : t('qTypeMatch')}</span>
    `;
    block.appendChild(qHeader);

    const qText = document.createElement('p');
    qText.className = 'ds-q-text';
    qText.textContent = q.text[state.lang];
    block.appendChild(qText);

    // Build the interactive widget
    if (q.type === 'truefalse') {
      block.appendChild(buildTrueFalseWidget(roomIdx, qIdx, q));
    } else if (q.type === 'multiple') {
      block.appendChild(buildMultipleWidget(roomIdx, qIdx, q));
    } else if (q.type === 'matching') {
      block.appendChild(buildMatchingWidget(roomIdx, qIdx, q));
    }

    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'ds-q-feedback';
    feedbackEl.id = `ds-qfb-${roomIdx}-${qIdx}`;
    block.appendChild(feedbackEl);

    container.appendChild(block);
  });
}

/** True/False widget. */
function buildTrueFalseWidget(roomIdx, qIdx, q) {
  const wrap = document.createElement('div');
  wrap.className = 'ds-tf-wrap';
  [['true', t('qTrue')], ['false', t('qFalse')]].forEach(([val, label]) => {
    const btn = document.createElement('button');
    btn.className = 'ds-tf-btn';
    btn.textContent = label;
    btn.dataset.val = val;
    btn.addEventListener('click', () => checkDossierAnswer(roomIdx, qIdx, val, btn));
    wrap.appendChild(btn);
  });
  return wrap;
}

/** Multiple choice widget. */
function buildMultipleWidget(roomIdx, qIdx, q) {
  const wrap = document.createElement('div');
  wrap.className = 'ds-mc-wrap';
  q.options[state.lang].forEach(opt => {
    const btn = document.createElement('div');
    btn.className = 'ds-mc-option';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.textContent = opt;
    btn.addEventListener('click', () => checkDossierAnswer(roomIdx, qIdx, opt, btn));
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); checkDossierAnswer(roomIdx, qIdx, opt, btn); } });
    wrap.appendChild(btn);
  });
  return wrap;
}

/** Matching widget — left items + right dropdown per row. */
function buildMatchingWidget(roomIdx, qIdx, q) {
  const wrap = document.createElement('div');
  wrap.className = 'ds-match-wrap';

  // Shuffled right-side options — use bilingual pairs
  const pairs = Array.isArray(q.pairs) ? q.pairs : q.pairs[state.lang];
  const rightOptions = shuffleArray(pairs.map(p => p.right));

  pairs.forEach((pair, pIdx) => {
    const row = document.createElement('div');
    row.className = 'ds-match-row';

    const leftEl = document.createElement('div');
    leftEl.className = 'ds-match-left';
    leftEl.textContent = pair.left;

    const arrow = document.createElement('span');
    arrow.className = 'ds-match-arrow';
    arrow.textContent = '→';

    const select = document.createElement('select');
    select.className = 'ds-match-select';
    select.id = `ds-match-${roomIdx}-${qIdx}-${pIdx}`;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '— select —';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    rightOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      dossierState[roomIdx].matching[qIdx][pIdx] = select.value;
    });

    row.appendChild(leftEl);
    row.appendChild(arrow);
    row.appendChild(select);
    wrap.appendChild(row);
  });

  // Submit matching button
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn-submit ds-match-submit';
  submitBtn.textContent = 'CONFIRM MATCHES';
  submitBtn.addEventListener('click', () => {
    const selections = dossierState[roomIdx].matching[qIdx];
    checkDossierAnswer(roomIdx, qIdx, selections, submitBtn);
  });
  wrap.appendChild(submitBtn);

  return wrap;
}

/**
 * checkDossierAnswer(roomIdx, qIdx, givenAnswer, clickedEl)
 * Validates the answer. On wrong: shows explanation and scrolls to
 * the relevant dossier section. On correct: locks the question green.
 */
function checkDossierAnswer(roomIdx, qIdx, givenAnswer, clickedEl) {
  const data = DOSSIER_DATA[roomIdx];
  const q    = data.questions[qIdx];
  const ds   = dossierState[roomIdx];
  const lang = state.lang;   // global state — NOT shadowed

  if (!ds || ds.answered[qIdx]) return;

  let isCorrect = false;

  if (q.type === 'truefalse') {
    isCorrect = givenAnswer.toLowerCase() === q.answer.toLowerCase();
  } else if (q.type === 'multiple') {
    const correctAns = typeof q.answer === 'object' ? q.answer[lang] : q.answer;
    isCorrect = givenAnswer === correctAns;
  } else if (q.type === 'matching') {
    const correctArr = Array.isArray(q.answer) ? q.answer : q.answer[lang];
    isCorrect = Array.isArray(givenAnswer) &&
      givenAnswer.every((sel, i) => sel === correctArr[i]);
  }

  const feedbackEl = $(`#ds-qfb-${roomIdx}-${qIdx}`);
  const block      = $(`#ds-q-${roomIdx}-${qIdx}`);

  if (isCorrect) {
    ds.answered[qIdx] = true;
    if (block)    block.classList.add('ds-q-correct');
    if (feedbackEl) {
      feedbackEl.className = 'ds-q-feedback ds-q-fb-correct';
      const expText = typeof q.explanation === 'object' ? q.explanation[lang] : q.explanation;
      feedbackEl.innerHTML = `<span class="ds-fb-icon">✓</span> ${expText}`;
    }
    lockDossierQuestion(roomIdx, qIdx);
    if (ds.answered.every(Boolean)) {
      setTimeout(() => revealDossierClue(roomIdx), 600);
    }
  } else {
    if (block)    block.classList.add('ds-q-wrong');
    if (feedbackEl) {
      feedbackEl.className = 'ds-q-feedback ds-q-fb-wrong';
      feedbackEl.innerHTML = `<span class="ds-fb-icon">✗</span> ${t('qWrongReread')}`;
    }
    // Shake the clicked element
    shakeInput(clickedEl);
    // Scroll to the relevant dossier section
    setTimeout(() => {
      const panel     = $(`#dossier-panel-${roomIdx}`);
      const target    = panel && panel.querySelector(q.scrollTarget);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
    // Clear wrong state after delay
    setTimeout(() => {
      if (block) block.classList.remove('ds-q-wrong');
    }, 2000);
  }
}

/** Disables all interactive elements in a completed question. */
function lockDossierQuestion(roomIdx, qIdx) {
  const block = $(`#ds-q-${roomIdx}-${qIdx}`);
  if (!block) return;
  block.querySelectorAll('button, select, [role="button"]').forEach(el => {
    el.disabled = true;
    el.style.pointerEvents = 'none';
  });
}

/**
 * Reveals the clue word for the room letter-by-letter,
 * then injects a full completion card with the advance button.
 */
function revealDossierClue(roomIdx) {
  const clueWrap  = $(`#ds-clue-${roomIdx}`);
  const lettersEl = $(`#ds-clue-letters-${roomIdx}`);
  const clueWord  = ROOMS[roomIdx]?.clueWord?.[state.lang] || '';
  const nextIdx   = roomIdx + 1;
  const nextRoom  = ROOMS[nextIdx];

  if (!clueWrap || !lettersEl || !clueWord) {
    injectAdvanceButton(roomIdx, nextIdx);
    return;
  }

  // Reveal the clue word panel
  clueWrap.removeAttribute('aria-hidden');
  clueWrap.classList.add('visible');

  lettersEl.innerHTML = '';
  [...clueWord].forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'ds-clue-letter';
    span.textContent = ch;
    span.style.animationDelay = `${i * 140}ms`;
    lettersEl.appendChild(span);
  });

  clueWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // After clue animation, inject a full completion card
  const delay = clueWord.length * 140 + 700;
  setTimeout(() => {
    injectCompletionCard(roomIdx, clueWord, nextRoom, nextIdx);
  }, delay);
}

/**
 * injectCompletionCard(roomIdx, clueWord, nextRoom, nextIdx)
 * Replaces the plain advance button with a styled completion card
 * that celebrates the dossier being fully restored.
 */
function injectCompletionCard(roomIdx, clueWord, nextRoom, nextIdx) {
  const feedbackEl = $(`#feedback-${roomIdx}`);
  if (!feedbackEl) return;
  if (feedbackEl.querySelector('.ds-completion-card')) return;

  const isVault = !nextRoom;
  const card    = document.createElement('div');
  card.className = 'ds-completion-card';

  card.innerHTML = `
    <div class="ds-completion-inner">
      <div class="ds-completion-left">
        <div class="ds-completion-check" aria-hidden="true">✓</div>
        <div class="ds-completion-text">
          <p class="ds-completion-title">${t('dossierFullyRestored')}</p>
          <p class="ds-completion-sub">
            ${t('cipherFragmentLabel')}
            <span class="ds-completion-word">${clueWord}</span>
          </p>
          ${isVault ? '' : `<p class="ds-completion-next">${t('nextFileLabel')} <strong>${nextRoom.name[state.lang]}</strong> — ${nextRoom.tag}</p>`}
        </div>
      </div>
      ${isVault
        ? `<button class="ds-completion-btn ds-completion-btn-vault" id="ds-advance-${roomIdx}">
             ${t('openVaultBtn')}
           </button>`
        : `<button class="ds-completion-btn" id="ds-advance-${roomIdx}">
             ${t('proceedBtn')} <span class="ds-btn-icon ds-btn-arrow">→</span>
           </button>`
      }
    </div>
  `;

  feedbackEl.appendChild(card);

  // Wire the button
  const btn = $(`#ds-advance-${roomIdx}`);
  if (btn) {
    btn.addEventListener('click', () => {
      if (isVault) {
        triggerVictory();
      } else {
        navigateToRoom(nextIdx);
      }
    });
    // Pulse animation after short delay
    setTimeout(() => btn.classList.add('ds-btn-pulse'), 300);
  }

  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


function getSuccessMessage(i) {
  const keys = ['successPeter','successBernard','successFrancis','successAnthony','successPiusX','successKolbe','successVault'];
  return t(keys[i]) || t('successVault');
}

// ─────────────────────────────────────────────────────────────────────
// FEEDBACK MESSAGES
// ─────────────────────────────────────────────────────────────────────

/**
 * showFeedback(roomIndex, type, message)
 * type: 'success' | 'error'
 * Use this from puzzle logic to display inline feedback.
 */
function showFeedback(i, type, message) {
  const el = $(`#feedback-${i}`);
  if (!el) return;
  el.innerHTML = '';
  const div = document.createElement('div');
  div.className = type === 'success' ? 'feedback-success' : 'feedback-error';
  div.textContent = message;
  el.appendChild(div);

  // Auto-clear error messages after 4 seconds
  if (type === 'error') {
    setTimeout(() => { if (el.firstChild === div) el.innerHTML = ''; }, 4000);
  }
}

/**
 * shakeInput(element) — visual shake for wrong answers.
 * Pass a DOM element (e.g. an input or puzzle zone).
 */
function shakeInput(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth; // reflow
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

// ─────────────────────────────────────────────────────────────────────
// ROOM BADGE & INTEGRITY
// ─────────────────────────────────────────────────────────────────────

function updateRoomBadge(i) {
  const badge = $(`#badge-${i}`);
  if (!badge) return;
  badge.className = 'room-status-badge';

  if (state.roomsComplete.includes(i)) {
    badge.classList.add('badge-complete');
    badge.textContent = t('badgeRestored');
  } else if (isRoomLocked(i)) {
    badge.classList.add(ROOMS[i].isVault ? 'badge-sealed' : 'badge-locked');
    badge.textContent = ROOMS[i].isVault ? t('badgeSealed') : t('badgeLocked');
  } else {
    badge.classList.add('badge-active');
    badge.textContent = t('badgeActive');
  }
}

function updateIntegrity(i) {
  const el = $(`#integrity-${i}`);
  if (!el) return;
  const pct = state.roomsComplete.includes(i) ? 100 : 0;
  el.textContent = `INTEGRITY: ${pct}%`;
  el.classList.toggle('complete', pct === 100);
}

// ─────────────────────────────────────────────────────────────────────
// VAULT PREREQ STATUS (shown inside vault lock overlay)
// ─────────────────────────────────────────────────────────────────────

function updateVaultPrereqs() {
  const container = dom.vaultPrereqs;
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const done = state.roomsComplete.includes(i);
    const item = document.createElement('div');
    item.className = `vault-prereq-item${done ? ' done' : ''}`;
    item.innerHTML = `
      <span class="prereq-dot"></span>
      <span>${ROOMS[i].short}</span>
    `;
    container.appendChild(item);
  }
}

// ─────────────────────────────────────────────────────────────────────
// TIMER
// ─────────────────────────────────────────────────────────────────────

function startTimer() {
  state.timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  if (state.gameOver) return;
  state.timerSeconds -= 1;
  renderTimer();
  if (state.timerSeconds <= 0) {
    clearInterval(state.timerInterval);
    triggerFailure();
  }
  // Urgent styling at 10 minutes remaining
  if (state.timerSeconds <= 600) {
    dom.timerDisplay.parentElement.classList.add('urgent');
  }
}

/**
 * applyTimePenalty(seconds, roomIndex)
 * Deducts `seconds` from the timer and briefly shows a penalty flash.
 * Call from any room's wrong-answer handler.
 */
function applyTimePenalty(seconds, roomIndex) {
  if (state.gameOver) return;
  state.timerSeconds = Math.max(0, state.timerSeconds - seconds);
  renderTimer();

  // Flash the timer red
  const timerEl = dom.timerDisplay.parentElement;
  timerEl.classList.add('timer-penalty');
  setTimeout(() => timerEl.classList.remove('timer-penalty'), 1200);

  // Show a penalty notification in the HUD
  showPenaltyNotification(seconds);
}

/** Briefly shows a "-N:00 TIME PENALTY" banner beneath the HUD. */
function showPenaltyNotification(seconds) {
  // Remove any existing notification
  const old = $('#penalty-notification');
  if (old) old.remove();

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = mins > 0
    ? `-${mins}:${String(secs).padStart(2,'0')} TIME PENALTY`
    : `-${secs}s TIME PENALTY`;

  const el = document.createElement('div');
  el.id = 'penalty-notification';
  el.className = 'penalty-notification';
  el.textContent = '⚠ ' + label;
  document.body.appendChild(el);

  // Animate in, hold, animate out
  requestAnimationFrame(() => el.classList.add('penalty-visible'));
  setTimeout(() => {
    el.classList.remove('penalty-visible');
    el.classList.add('penalty-exit');
    setTimeout(() => el.remove(), 500);
  }, 2500);
}

function renderTimer() {
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  dom.timerDisplay.textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function timeElapsed() {
  const elapsed = TIMER_DURATION - state.timerSeconds;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function timeRemaining() {
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────
// HINT SYSTEM
// ─────────────────────────────────────────────────────────────────────

function requestHint() {
  if (state.hintsUsed >= MAX_HINTS || state.gameOver) return;
  state.hintsUsed += 1;
  const remaining = MAX_HINTS - state.hintsUsed;
  dom.hintCount.textContent = remaining;
  if (remaining === 0) {
    dom.btnHint.disabled = true;
    dom.btnHint.textContent = 'NO HINTS REMAINING';
  }

  // Show hint for active room
  const hintData = ROOMS[state.currentRoom]?.hint;
  const hint = (typeof hintData === 'object' ? hintData[state.lang] : hintData) || (state.lang === 'fr' ? 'Aucun indice disponible pour cette salle.' : 'No hint available for this room.');
  dom.hintText.textContent = hint;
  dom.hintModal.classList.add('open');
}

/** closeHint — called from HTML onclick */
function closeHint() {
  dom.hintModal.classList.remove('open');
}

// Close hint modal on backdrop click
dom.hintModal.addEventListener('click', (e) => {
  if (e.target === dom.hintModal) closeHint();
});

// ─────────────────────────────────────────────────────────────────────
// VICTORY / FAILURE
// ─────────────────────────────────────────────────────────────────────

function triggerVictory() {
  state.gameOver = true;
  clearInterval(state.timerInterval);
  dom.gameScreen.classList.remove('active');
  dom.victoryScreen.classList.add('active');

  // Localise victory screen static content
  const vLabel  = dom.victoryScreen.querySelector('.victory-label');
  const vTitle  = dom.victoryScreen.querySelector('.victory-title');
  const vCLabel = dom.victoryScreen.querySelector('.victory-clues-label');
  const vMsg1   = dom.victoryScreen.querySelectorAll('.victory-message-text')[0];
  const vMsg2   = dom.victoryScreen.querySelectorAll('.victory-message-text')[1];
  const vQuote  = dom.victoryScreen.querySelector('.victory-message-quote');
  const vAttr   = dom.victoryScreen.querySelector('.victory-quote-attr');
  const vBtn    = dom.victoryScreen.querySelector('.victory-btn');
  if (vLabel)  vLabel.textContent  = t('victoryLabel');
  if (vTitle)  vTitle.innerHTML    = t('vaultOpenTitle').replace('\n', '<br>');
  if (vCLabel) vCLabel.textContent = t('cipherLabel');
  if (vMsg1)   vMsg1.textContent   = t('finalMsg1');
  if (vMsg2)   vMsg2.innerHTML     = t('finalMsg2').replace('faith is not', '<em>faith is not').replace('as it actually is.', 'as it actually is.</em>');
  if (vQuote)  vQuote.textContent  = t('finalQuote');
  if (vAttr)   vAttr.textContent   = t('finalQuoteAttr');
  if (vBtn)    vBtn.textContent    = t('returnToStart');

  // Localise cipher word row
  const clueWords = dom.victoryScreen.querySelectorAll('.victory-clue-word');
  const wordList  = VAULT_CLUES.map(c => c.word[state.lang]);
  clueWords.forEach((el, i) => { if (wordList[i]) el.textContent = wordList[i]; });

  dom.victoryStats.innerHTML = `
    <span>${state.lang === 'fr' ? 'TEMPS RESTANT :' : 'TIME REMAINING:'} <strong>${timeRemaining()}</strong></span>
    <span>${state.lang === 'fr' ? 'INDICES UTILISÉS :' : 'HINTS USED:'} <strong>${state.hintsUsed} / ${MAX_HINTS}</strong></span>
    <span>${state.lang === 'fr' ? 'FICHIERS RESTAURÉS :' : 'FILES RESTORED:'} <strong>7 / 7</strong></span>
  `;
}

function triggerFailure() {
  state.gameOver = true;
  // Instead of going straight to the failure screen, show the time extension prompt
  showTimeExtensionPrompt();
}

/**
 * showTimeExtensionPrompt()
 * Shows a modal overlay within the game screen offering +15 minutes.
 * Students can accept (resume with 15:00 on clock) or restart from the beginning.
 */
function showTimeExtensionPrompt() {
  // Remove any existing prompt
  const existing = $('#time-extension-modal');
  if (existing) existing.remove();

  const roomsDone  = state.roomsComplete.length;
  const roomsLeft  = 7 - roomsDone;
  const pct        = Math.round((roomsDone / 7) * 100);

  const modal = document.createElement('div');
  modal.id        = 'time-extension-modal';
  modal.className = 'tex-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Time extension offer');

  modal.innerHTML = `
    <div class="tex-box">
      <div class="tex-alert-row" aria-hidden="true">
        <span class="tex-alert-icon">⚠</span>
        <span class="tex-alert-text">${t('timeExpiredAlert')}</span>
        <span class="tex-alert-icon">⚠</span>
      </div>
      <h2 class="tex-title">${t('missionIncomplete')}</h2>
      <div class="tex-progress-wrap" aria-label="Mission progress">
        <div class="tex-progress-bar-outer">
          <div class="tex-progress-bar-inner" style="width: ${pct}%"></div>
        </div>
        <p class="tex-progress-label">
          ${t('filesRestored').replace('{done}', roomsDone).replace('{left}', roomsLeft)}
        </p>
      </div>
      <p class="tex-message">${t('extensionMsg')}</p>
      <div class="tex-actions">
        <button class="tex-btn-extend" id="tex-btn-extend">
          ${t('acceptExtension')}
        </button>
        <button class="tex-btn-restart" id="tex-btn-restart">
          ${t('startOver')}
        </button>
      </div>
      <p class="tex-footnote">${t('progressPreserved')}</p>
    </div>
  `;

  document.body.appendChild(modal);

  // Animate in
  requestAnimationFrame(() => modal.classList.add('tex-visible'));

  // Wire buttons
  $('#tex-btn-extend').addEventListener('click', acceptTimeExtension);
  $('#tex-btn-restart').addEventListener('click', () => {
    modal.remove();
    // Show the failure screen briefly then reset
    dom.gameScreen.classList.remove('active');
    dom.failureScreen.classList.add('active');
    dom.failureStats.innerHTML = `
      <span>FILES RESTORED: <strong>${roomsDone} / 7</strong></span>
      <span>EXTENSION: <strong>DECLINED</strong></span>
    `;
  });
}

/**
 * acceptTimeExtension()
 * Grants 15 additional minutes and resumes the game.
 */
function acceptTimeExtension() {
  const modal = $('#time-extension-modal');
  if (modal) {
    modal.classList.remove('tex-visible');
    setTimeout(() => modal.remove(), 400);
  }

  // Reset gameOver flag and restore 15 minutes
  state.gameOver     = false;
  state.timerSeconds = 15 * 60;

  // Remove urgent styling
  dom.timerDisplay.parentElement.classList.remove('urgent');
  renderTimer();

  // Restart timer interval
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(tickTimer, 1000);

  // Flash the timer gold to signal the extension
  showPenaltyNotification(-900); // negative = addition (handled below)

  // Show a positive notification instead
  showExtensionNotification();
}

/** Shows a green "+15:00 EXTENSION GRANTED" banner. */
function showExtensionNotification() {
  const old = $('#extension-notification');
  if (old) old.remove();

  const el = document.createElement('div');
  el.id        = 'extension-notification';
  el.className = 'extension-notification';
  el.textContent = t('extensionGranted');
  document.body.appendChild(el);

  requestAnimationFrame(() => el.classList.add('ext-visible'));
  setTimeout(() => {
    el.classList.remove('ext-visible');
    el.classList.add('ext-exit');
    setTimeout(() => el.remove(), 500);
  }, 3500);
}

/** resetGame — called from HTML onclick on end screens */
function resetGame() {
  // Reset state
  state.currentRoom    = 0;
  state.roomsComplete  = [];
  state.hintsUsed      = 0;
  state.timerSeconds   = TIMER_DURATION;
  state.gameOver       = false;

  // Reset timer display
  dom.timerDisplay.parentElement.classList.remove('urgent');
  renderTimer();

  // Reset hint UI
  dom.hintCount.textContent  = MAX_HINTS;
  dom.btnHint.disabled       = false;
  dom.btnHint.textContent    = 'REQUEST HINT';

  // Reset all room lock overlays and badges
  ROOMS.forEach((room, i) => {
    const overlay = $(`#lock-overlay-${i}`);
    if (overlay) overlay.classList.remove('hidden');

    const roomEl = $(`#room-${i}`);
    if (roomEl && i > 0) roomEl.classList.add('locked');

    const feedback = $(`#feedback-${i}`);
    if (feedback) feedback.innerHTML = '';

    updateRoomBadge(i);
    updateIntegrity(i);
  });

  updateVaultPrereqs();

  // Clear all puzzle state — call the reset helpers defined below
  resetAllPuzzles();

  // Stop music and reset toggle UI
  stopAllTracks();
  music.enabled = false;
  music.current = 0;
  updateMusicToggleUI(false);

  state.lang = 'en';
  updateLangToggleUI('en');

  // Return to language selection screen
  dom.victoryScreen.classList.remove('active');
  dom.failureScreen.classList.remove('active');
  dom.gameScreen.classList.remove('active');
  dom.bootScreen.classList.remove('active');
  if (dom.langScreen) {
    dom.langScreen.style.display = '';
    dom.langScreen.classList.add('active');
  }

  // Rebuild UI for fresh run
  renderProgressTrack();
  renderSidebar();
  showRoom(0);
}

// ─────────────────────────────────────────────────────────────────────
// MUSIC — wire on DOM ready so toggle works from boot screen onward
// ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initMusic();
  const btnMusic = $('#btn-music');
  if (btnMusic) btnMusic.addEventListener('click', toggleMusic);
});

// ─────────────────────────────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  // Escape closes hint modal
  if (e.key === 'Escape') closeHint();
  // Number keys 1-7 navigate rooms (if unlocked)
  if (e.key >= '1' && e.key <= '7' && state.gameStarted) {
    navigateToRoom(parseInt(e.key) - 1);
  }
});

// ─────────────────────────────────────────────────────────────────────
// PUZZLE INITIALISATION DISPATCHER
// ─────────────────────────────────────────────────────────────────────

/**
 * initAllPuzzles — called once when the game starts.
 * Add your per-room setup calls here.
 */
function initAllPuzzles() {
  const setups = [
    ['Room 0 (Peter)',   setupRoom0Puzzle],
    ['Room 1 (Bernard)', setupRoom1Puzzle],
    ['Room 2 (Francis)', setupRoom2Puzzle],
    ['Room 3 (Anthony)', setupRoom3Puzzle],
    ['Room 4 (Pius X)',  setupRoom4Puzzle],
    ['Room 5 (Kolbe)',   setupRoom5Puzzle],
    ['Room 6 (Vault)',   setupRoom6Puzzle],
  ];
  setups.forEach(([label, fn]) => {
    try { fn(); }
    catch (e) { console.error(`Puzzle init failed — ${label}:`, e); }
  });
}

/**
 * resetAllPuzzles — called on game reset.
 * Restore each puzzle to its initial state here.
 */
function resetAllPuzzles() {
  resetRoom0Puzzle();
  resetRoom1Puzzle();
  resetRoom2Puzzle();
  resetRoom3Puzzle();
  resetRoom4Puzzle();
  resetRoom5Puzzle();
  resetRoom6Puzzle();
}

// ─────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
//   ██████╗ ██╗   ██╗███████╗███████╗██╗     ███████╗███████╗
//   ██╔══██╗██║   ██║╚══███╔╝╚══███╔╝██║     ██╔════╝██╔════╝
//   ██████╔╝██║   ██║  ███╔╝   ███╔╝ ██║     █████╗  ███████╗
//   ██╔═══╝ ██║   ██║ ███╔╝   ███╔╝  ██║     ██╔══╝  ╚════██║
//   ██║     ╚██████╔╝███████╗███████╗███████╗███████╗███████║
//   ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝╚══════╝╚══════╝
//
//   ADD YOUR PUZZLE LOGIC BELOW — ONE SECTION PER ROOM
//   Each section has: setup (init), answer check, and reset.
// ═══════════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════
// ROOM 0 — SAINT PETER
// Puzzle zone DOM ID: #puzzle-zone-0
// Complete with: completeRoom(0)
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// ROOM 0 — SAINT PETER: TIMELINE ORDERING PUZZLE
// Students arrange 5 events from Peter's life in chronological order.
// Supports drag-and-drop (desktop) and tap-to-select (touch / Chromebook).
// On success: reveals clue word "KEY", unlocks Room 1 (St. Bernard).
// ─────────────────────────────────────────────────────────────────────

/** Correct chronological order — indices into PETER_EVENTS. Do not change. */
const PETER_CORRECT_ORDER = [0, 1, 2, 3, 4];

/** Event data. id matches position in correct order array above.
 *  NOTE: No dates displayed — students must know the sequence from context. */
const PETER_EVENTS = [
  {
    id: 0, icon: '🎣',
    title: { en: 'The Calling of Peter',  fr: 'La vocation de Pierre' },
    desc:  { en: 'Jesus calls Simon the fisherman beside the Sea of Galilee: "Follow me, and I will make you fishers of men." Simon leaves his nets and follows.',
             fr: 'Jésus appelle Simon le pêcheur au bord de la mer de Galilée : « Suis-moi, et je ferai de toi un pêcheur d\'hommes. » Simon quitte ses filets et le suit.' },
  },
  {
    id: 1, icon: '🌊',
    title: { en: 'Walking on Water',       fr: 'La marche sur les eaux' },
    desc:  { en: 'During a storm on the Sea of Galilee, Peter steps out of the boat toward Jesus — the only apostle to walk on water — before his faith wavers and he begins to sink.',
             fr: 'Lors d\'une tempête sur la mer de Galilée, Pierre sort du bateau vers Jésus — le seul apôtre à marcher sur l\'eau — avant que sa foi vacille et qu\'il commence à couler.' },
  },
  {
    id: 2, icon: '🐓',
    title: { en: 'The Denial of Jesus',    fr: 'Le reniement de Jésus' },
    desc:  { en: 'In the courtyard of the high priest, Peter denies knowing Jesus three times before the rooster crows, fulfilling Christ\'s prophecy.',
             fr: 'Dans la cour du grand prêtre, Pierre nie connaître Jésus trois fois avant que le coq chante, accomplissant la prophétie du Christ.' },
  },
  {
    id: 3, icon: '🔥',
    title: { en: 'Pentecost',              fr: 'La Pentecôte' },
    desc:  { en: 'Fifty days after Passover, the Holy Spirit descends on the Apostles. Peter preaches to the crowds in Jerusalem; three thousand are baptised that day.',
             fr: 'Cinquante jours après la Pâque, l\'Esprit Saint descend sur les Apôtres. Pierre prêche aux foules à Jérusalem ; trois mille personnes sont baptisées ce jour-là.' },
  },
  {
    id: 4, icon: '✝️',
    title: { en: 'Martyrdom in Rome',      fr: 'Le martyre à Rome' },
    desc:  { en: 'Under Emperor Nero, Peter is crucified upside-down on Vatican Hill — deeming himself unworthy to die as his Lord did. His tomb lies beneath St. Peter\'s Basilica.',
             fr: 'Sous l\'empereur Néron, Pierre est crucifié la tête en bas sur la colline du Vatican — se jugeant indigne de mourir comme son Seigneur. Sa tombe se trouve sous la basilique Saint-Pierre.' },
  },
];

/** Module-level drag state for Room 0. */
const r0 = {
  order: [],          // Current arrangement of event IDs in the list
  dragSrcId: null,    // ID of the card being dragged
  tapSelectedId: null,// ID of the card selected by tap (touch mode)
  attempts: 0,        // Wrong-answer count
  solved: false,
};

function setupRoom0Puzzle() {
  // Randomise initial order (ensure it's never accidentally correct)
  r0.order = shuffleArray([...PETER_CORRECT_ORDER]);
  while (isRoom0OrderCorrect()) r0.order = shuffleArray([...PETER_CORRECT_ORDER]);
  r0.solved    = false;
  r0.attempts  = 0;
  r0.dragSrcId = null;
  r0.tapSelectedId = null;

  const zone = $('#puzzle-zone-0');
  zone.innerHTML = `
    <div class="tl-header">
      <p class="tl-instruction">
        <span class="tl-instruction-icon">📋</span>
        ${t('r0directive')}
      </p>
    </div>

    <div class="tl-columns">
      <div class="tl-list-wrap">
        <div class="tl-list-label">${t('r0arrange')} <span class="tl-arrow">↕</span></div>
        <ul class="tl-list" id="tl-list-0" aria-label="Timeline ordering list"></ul>
      </div>

      <div class="tl-legend">
        <div class="tl-legend-label">${t('r0timeline')}</div>
        <div class="tl-legend-line">
          <div class="tl-legend-dot start"></div>
          <span>${t('r0earliest')}</span>
        </div>
        <div class="tl-legend-track"></div>
        <div class="tl-legend-line">
          <div class="tl-legend-dot end"></div>
          <span>${t('r0latest')}</span>
        </div>
        <div class="tl-legend-note">${t('r0cardDesc')}</div>
      </div>
    </div>

    <div class="tl-actions">
      <button class="btn-submit" id="tl-submit-0">${t('r0submit')}</button>
      <span class="tl-attempt-count" id="tl-attempts-0"></span>
    </div>

    <div class="tl-clue-wrap" id="tl-clue-0" aria-hidden="true">
      <p class="tl-clue-label">${t('r0clueLabel')}</p>
      <div class="tl-clue-word" id="tl-clue-letters-0"></div>
      <p class="tl-clue-sub">${t('r0clueSub')}</p>
    </div>
  `;

  renderRoom0Cards();
  $('#tl-submit-0').addEventListener('click', checkRoom0Order);
}

/** Renders (or re-renders) the draggable card list from r0.order. */
function renderRoom0Cards() {
  const list = $('#tl-list-0');
  if (!list) return;
  list.innerHTML = '';

  r0.order.forEach((eventId) => {
    const ev = PETER_EVENTS[eventId];
    const li = document.createElement('li');
    li.className = 'tl-card';
    li.dataset.id = eventId;
    li.setAttribute('draggable', 'true');
    li.setAttribute('role', 'listitem');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `${ev.title[state.lang]}. Press Space to select, then Space on destination to swap.`);

    li.innerHTML = `
      <div class="tl-card-grip" aria-hidden="true">⠿</div>
      <div class="tl-card-icon">${ev.icon}</div>
      <div class="tl-card-body">
        <span class="tl-card-title">${ev.title[state.lang]}</span>
        <span class="tl-card-desc">${ev.desc[state.lang]}</span>
      </div>
      <div class="tl-card-pos" aria-hidden="true"></div>
    `;

    // ── Drag-and-drop (desktop / Chromebook) ──────────────────────────
    li.addEventListener('dragstart', (e) => {
      r0.dragSrcId = parseInt(li.dataset.id);
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', r0.dragSrcId);
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      list.querySelectorAll('.tl-card').forEach(c => c.classList.remove('drag-over'));
    });
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.tl-card').forEach(c => c.classList.remove('drag-over'));
      if (parseInt(li.dataset.id) !== r0.dragSrcId) li.classList.add('drag-over');
    });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetId = parseInt(li.dataset.id);
      if (targetId === r0.dragSrcId) return;
      li.classList.remove('drag-over');
      swapRoom0Cards(r0.dragSrcId, targetId);
    });

    // ── Tap / keyboard selection (touch & Chromebook) ─────────────────
    li.addEventListener('click', () => handleRoom0Tap(parseInt(li.dataset.id)));
    li.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleRoom0Tap(parseInt(li.dataset.id));
      }
      // Arrow key reordering
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = r0.order.indexOf(parseInt(li.dataset.id));
        const newIdx = e.key === 'ArrowUp' ? idx - 1 : idx + 1;
        if (newIdx >= 0 && newIdx < r0.order.length) {
          swapRoom0Cards(r0.order[idx], r0.order[newIdx]);
          // Restore focus to moved card
          setTimeout(() => {
            const moved = list.querySelector(`[data-id="${r0.order[newIdx === idx - 1 ? idx - 1 : idx + 1]}"]`);
            if (moved) moved.focus();
          }, 60);
        }
      }
    });

    list.appendChild(li);
  });

  updateRoom0Positions();
}

/** Updates the position badge (1–5) on each card. */
function updateRoom0Positions() {
  const cards = $$('#tl-list-0 .tl-card');
  cards.forEach((card, i) => {
    const pos = card.querySelector('.tl-card-pos');
    if (pos) pos.textContent = i + 1;
  });
}

/** Swaps two event IDs in r0.order and re-renders. */
function swapRoom0Cards(idA, idB) {
  const idxA = r0.order.indexOf(idA);
  const idxB = r0.order.indexOf(idB);
  if (idxA === -1 || idxB === -1) return;
  [r0.order[idxA], r0.order[idxB]] = [r0.order[idxB], r0.order[idxA]];
  r0.tapSelectedId = null;
  renderRoom0Cards();
}

/** Tap-select logic: first tap selects, second tap swaps. */
function handleRoom0Tap(eventId) {
  if (r0.solved) return;
  if (r0.tapSelectedId === null) {
    r0.tapSelectedId = eventId;
    // Highlight selected card
    $$('#tl-list-0 .tl-card').forEach(c => {
      c.classList.toggle('tap-selected', parseInt(c.dataset.id) === eventId);
    });
  } else if (r0.tapSelectedId === eventId) {
    // Deselect
    r0.tapSelectedId = null;
    $$('#tl-list-0 .tl-card').forEach(c => c.classList.remove('tap-selected'));
  } else {
    // Swap with previously selected
    swapRoom0Cards(r0.tapSelectedId, eventId);
  }
}

/** Returns true if the current r0.order matches the correct sequence. */
function isRoom0OrderCorrect() {
  return r0.order.every((id, i) => id === PETER_CORRECT_ORDER[i]);
}

/** Called when the student clicks SUBMIT SEQUENCE. */
function checkRoom0Order() {
  if (r0.solved) return;
  r0.attempts += 1;

  const attemptsEl = $('#tl-attempts-0');
  if (attemptsEl) attemptsEl.textContent = `Attempt ${r0.attempts}`;

  if (isRoom0OrderCorrect()) {
    r0.solved = true;
    triggerRoom0Success();
  } else {
    // Highlight incorrect positions in red
    const cards = $$('#tl-list-0 .tl-card');
    let wrongCount = 0;
    cards.forEach((card, i) => {
      const isRight = r0.order[i] === PETER_CORRECT_ORDER[i];
      card.classList.toggle('card-wrong', !isRight);
      card.classList.toggle('card-right', isRight);
      if (!isRight) wrongCount++;
    });
    shakeInput($('#tl-list-0'));
    applyTimePenalty(60, 0);
    const errMsg = t('r0wrong')
      .replace('{n}', wrongCount)
      .replace('{s}', wrongCount > 1 ? 's' : '');
    showFeedback(0, 'error', errMsg);
    // Clear position feedback after 1.5s so it doesn't persist
    setTimeout(() => {
      $$('#tl-list-0 .tl-card').forEach(c => {
        c.classList.remove('card-wrong', 'card-right');
      });
    }, 1500);
  }
}

/** Runs success animation sequence and reveals clue word. */
function triggerRoom0Success() {
  // Lock all cards
  $$('#tl-list-0 .tl-card').forEach((card, i) => {
    card.setAttribute('draggable', 'false');
    card.classList.add('card-solved');
    card.style.animationDelay = `${i * 80}ms`;
  });

  // Disable submit button
  const submit = $('#tl-submit-0');
  if (submit) {
    submit.disabled = true;
    submit.textContent = t('r0verified');
    submit.classList.add('btn-submit-done');
  }

  // Reveal clue word — letter by letter
  setTimeout(() => {
    const clueWrap = $('#tl-clue-0');
    if (clueWrap) {
      clueWrap.classList.add('visible');
      const lettersEl = $('#tl-clue-letters-0');
      if (lettersEl) {
        const word = ROOMS[0].clueWord[state.lang];
        lettersEl.innerHTML = '';
        [...word].forEach((ch, i) => {
          const span = document.createElement('span');
          span.className = 'tl-clue-letter';
          span.textContent = ch;
          span.style.animationDelay = `${300 + i * 200}ms`;
          lettersEl.appendChild(span);
        });
      }
    }
  }, 600);

  // Fire the global completeRoom after animations settle
  setTimeout(() => completeRoom(0), 900);
}

function resetRoom0Puzzle() {
  r0.order        = [];
  r0.dragSrcId    = null;
  r0.tapSelectedId = null;
  r0.attempts     = 0;
  r0.solved       = false;
  // Re-run setup to rebuild the DOM with a fresh shuffle
  setupRoom0Puzzle();
}

// ═══════════════════════════════════════════════════════════════════
// ROOM 1 — ST. BERNARD OF CLAIRVAUX
// PUZZLE: Scrambled-quote word arrangement.
// Students reconstruct the authentic Bernard maxim by clicking words
// from a pool into a manuscript sentence area in correct order.
// Correct quote: "Learn what you ought, then teach what you have learned."
// Clue word on success: LIGHT
// ═══════════════════════════════════════════════════════════════════

/** The authentic Bernard of Clairvaux quote, split into word tokens.
 *  Punctuation is attached to the word it follows so tokens stay atomic. */
const BERNARD_QUOTE = {
  en: ['Learn', 'what', 'you', 'ought,', 'then', 'teach', 'what', 'you', 'have', 'learned.'],
  fr: ['Apprenez', 'ce', 'que', 'vous', 'devez,', 'puis', 'enseignez', 'ce', 'que', 'vous', 'avez', 'appris.'],
};
// Accessor — always use this instead of the array directly
const BERNARD_QUOTE_PROXY = new Proxy({}, {
  get: (_, prop) => BERNARD_QUOTE[state.lang] ?? BERNARD_QUOTE.en,
});
// Helper to get the current words array
function bernardWords() { return BERNARD_QUOTE[state.lang] ?? BERNARD_QUOTE.en; }

/** Module-level state for Room 1. */
const r1 = {
  pool: [],         // Indices into bernardWords() still in the word pool
  placed: [],       // Indices (into bernardWords()) placed in the sentence so far
  attempts: 0,
  solved: false,
};

function setupRoom1Puzzle() {
  r1.pool    = [];
  r1.placed  = [];
  r1.attempts = 0;
  r1.solved  = false;

  /* Build the scrambled pool — shuffle a copy of the indices.
     Because two words repeat ('what', 'you'), we keep index identity
     so each token is treated as a distinct slot. */
  const indices = bernardWords().map((_, i) => i);
  r1.pool = shuffleArray([...indices]);
  // Ensure pool is never accidentally already sorted
  while (r1.pool.every((v, i) => v === indices[i])) r1.pool = shuffleArray([...indices]);

  const zone = $('#puzzle-zone-1');
  zone.innerHTML = `
    <div class="ms-header">
      <div class="ms-illumination" aria-hidden="true">B</div>
      <div class="ms-header-text">
        <p class="ms-directive">${t('r1directive')}</p>
        <p class="ms-sub">${t('r1sub')}</p>
      </div>
    </div>

    <div class="ms-parchment" id="ms-parchment-1" aria-label="Sentence construction area">
      <div class="ms-parchment-label">${t('r1reconstructed')}</div>
      <div class="ms-sentence" id="ms-sentence-1" aria-live="polite"></div>
      <div class="ms-line ms-line-1"></div>
      <div class="ms-line ms-line-2"></div>
      <div class="ms-line ms-line-3"></div>
      <div class="ms-cursor-blink" id="ms-cursor-1" aria-hidden="true">▍</div>
    </div>

    <div class="ms-pool-wrap">
      <div class="ms-pool-label">${t('r1scattered')}</div>
      <div class="ms-pool" id="ms-pool-1" aria-label="Available word fragments"></div>
    </div>

    <div class="ms-actions">
      <button class="btn-submit" id="ms-submit-1">${t('r1verify')}</button>
      <button class="btn-clear" id="ms-clear-1">${t('r1clear')}</button>
      <span class="ms-progress-label">
        ${t('r1placed')} <span id="ms-placed-count-1">0</span> / \${bernardWords().length}
      </span>
    </div>

    <div class="ms-clue-wrap" id="ms-clue-1" aria-hidden="true">
      <div class="ms-clue-inner">
        <p class="ms-clue-label">${t('r1clueLabel')}</p>
        <div class="ms-clue-word" id="ms-clue-letters-1"></div>
        <p class="ms-clue-sub">${t('r1clueSub')}</p>
      </div>
    </div>
  `;

  renderRoom1Pool();
  renderRoom1Sentence();

  $('#ms-submit-1').addEventListener('click', checkRoom1Answer);
  $('#ms-clear-1').addEventListener('click', clearRoom1);
}

/** Renders the pool of available word tokens. */
function renderRoom1Pool() {
  const pool = $('#ms-pool-1');
  if (!pool) return;
  pool.innerHTML = '';
  r1.pool.forEach((wordIdx) => {
    const btn = document.createElement('button');
    btn.className = 'ms-word-token ms-pool-token';
    btn.textContent = bernardWords()[wordIdx];
    btn.dataset.idx = wordIdx;
    btn.setAttribute('aria-label', `Place word: ${bernardWords()[wordIdx]}`);
    btn.addEventListener('click', () => placeRoom1Word(wordIdx));
    pool.appendChild(btn);
  });
  // Show empty-pool message if all words are placed
  if (r1.pool.length === 0) {
    const msg = document.createElement('span');
    msg.className = 'ms-pool-empty';
    msg.textContent = t('r1empty');
    pool.appendChild(msg);
  }
}

/** Renders the placed words in the sentence area. */
function renderRoom1Sentence() {
  const sentence = $('#ms-sentence-1');
  const cursor   = $('#ms-cursor-1');
  const counter  = $('#ms-placed-count-1');
  if (!sentence) return;

  sentence.innerHTML = '';
  r1.placed.forEach((wordIdx, pos) => {
    const span = document.createElement('span');
    span.className = 'ms-word-token ms-placed-token';
    span.textContent = bernardWords()[wordIdx];
    span.dataset.pos = pos;
    span.setAttribute('role', 'button');
    span.setAttribute('tabindex', '0');
    span.setAttribute('aria-label', `Remove word: ${bernardWords()[wordIdx]}`);
    span.addEventListener('click', () => removeRoom1Word(pos));
    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); removeRoom1Word(pos); }
    });
    sentence.appendChild(span);
  });

  // Blink cursor when sentence is incomplete
  if (cursor) cursor.style.display = r1.placed.length < bernardWords().length ? 'inline' : 'none';
  if (counter) counter.textContent = r1.placed.length;

  // Sync submit button state
  const submit = $('#ms-submit-1');
  if (submit) submit.disabled = r1.placed.length < bernardWords().length;
}

/** Moves a word from pool → sentence. */
function placeRoom1Word(wordIdx) {
  if (r1.solved) return;
  const poolPos = r1.pool.indexOf(wordIdx);
  if (poolPos === -1) return;
  r1.pool.splice(poolPos, 1);
  r1.placed.push(wordIdx);
  renderRoom1Pool();
  renderRoom1Sentence();
  // Brief placed animation
  const tokens = $$('#ms-sentence-1 .ms-placed-token');
  const last = tokens[tokens.length - 1];
  if (last) last.classList.add('ms-token-pop');
}

/** Moves a word from sentence → pool (returns to end of pool). */
function removeRoom1Word(pos) {
  if (r1.solved) return;
  const [wordIdx] = r1.placed.splice(pos, 1);
  r1.pool.push(wordIdx);
  renderRoom1Pool();
  renderRoom1Sentence();
}

/** Clears the entire sentence back into the pool. */
function clearRoom1() {
  if (r1.solved) return;
  r1.pool  = [...r1.pool, ...r1.placed];
  r1.placed = [];
  // Re-shuffle the pool for freshness
  r1.pool = shuffleArray(r1.pool);
  renderRoom1Pool();
  renderRoom1Sentence();
  // Clear any lingering feedback
  const fb = $('#feedback-1');
  if (fb) fb.innerHTML = '';
}

/** Verifies the sentence against the correct order. */
function checkRoom1Answer() {
  if (r1.solved || r1.placed.length < bernardWords().length) return;
  r1.attempts += 1;

  const isCorrect = r1.placed.every((wordIdx, i) => wordIdx === i);
  // Note: because there are duplicate words ('what'×2, 'you'×2), we
  // compare the actual word text as a fallback for semantic correctness.
  const placedText = r1.placed.map(i => bernardWords()[i].toLowerCase().replace(/[^a-z]/g,''));
  const correctText = bernardWords().map(w => w.toLowerCase().replace(/[^a-z]/g,''));
  const textMatch   = placedText.join(' ') === correctText.join(' ');

  if (isCorrect || textMatch) {
    r1.solved = true;
    triggerRoom1Success();
  } else {
    // Mark wrong tokens red, correct-position tokens green
    const tokens = $$('#ms-sentence-1 .ms-placed-token');
    let wrongCount = 0;
    tokens.forEach((tok, i) => {
      const placedW = bernardWords()[r1.placed[i]].toLowerCase().replace(/[^a-z]/g,'');
      const correctW = correctText[i];
      const ok = placedW === correctW;
      tok.classList.toggle('ms-token-wrong', !ok);
      tok.classList.toggle('ms-token-right',  ok);
      if (!ok) wrongCount++;
    });
    shakeInput($('#ms-parchment-1'));
    applyTimePenalty(60, 1);
    showFeedback(1, 'error',
      `✗ MANUSCRIPT ERROR — ${wrongCount} word${wrongCount > 1 ? 's' : ''} misplaced. Consult Bernard's writings.`
    );
    setTimeout(() => {
      $$('#ms-sentence-1 .ms-placed-token').forEach(t => {
        t.classList.remove('ms-token-wrong', 'ms-token-right');
      });
    }, 1600);
  }
}

/** Runs success animation sequence and reveals clue word LIGHT. */
function triggerRoom1Success() {
  // Seal all placed tokens
  $$('#ms-sentence-1 .ms-placed-token').forEach((tok, i) => {
    tok.classList.add('ms-token-solved');
    tok.style.animationDelay = `${i * 60}ms`;
    tok.removeAttribute('tabindex');
  });

  // Disable controls
  const submit = $('#ms-submit-1');
  const clear  = $('#ms-clear-1');
  if (submit) { submit.disabled = true; submit.textContent = t('r1verified'); submit.classList.add('btn-submit-done'); }
  if (clear)  { clear.disabled  = true; }

  // Hide cursor
  const cursor = $('#ms-cursor-1');
  if (cursor) cursor.style.display = 'none';

  // Illuminate the initial cap
  const cap = $('.ms-illumination');
  if (cap) cap.classList.add('ms-illuminated');

  // Reveal clue word letter-by-letter
  setTimeout(() => {
    const clueWrap = $('#ms-clue-1');
    if (clueWrap) {
      clueWrap.removeAttribute('aria-hidden');
      clueWrap.classList.add('visible');
      const lettersEl = $('#ms-clue-letters-1');
      if (lettersEl) {
        lettersEl.innerHTML = '';
        const word1 = ROOMS[1].clueWord[state.lang];
        [...word1].forEach((ch, i) => {
          const span = document.createElement('span');
          span.className = 'ms-clue-letter';
          span.textContent = ch;
          span.style.animationDelay = `${280 + i * 180}ms`;
          lettersEl.appendChild(span);
        });
      }
    }
  }, 700);

  // Fire global completion after animations settle
  setTimeout(() => completeRoom(1), 1000);
}

function resetRoom1Puzzle() {
  r1.pool    = [];
  r1.placed  = [];
  r1.attempts = 0;
  r1.solved  = false;
  setupRoom1Puzzle();
}

// ═══════════════════════════════════════════════════════════════════
// ROOM 2 — ST. FRANCIS OF ASSISI
// PUZZLE: Virtue-matching — students connect actions/teachings to the
// correct Franciscan virtue column. Three virtues, seven pairs each.
// A pair is confirmed immediately on correct selection; wrong guesses
// shake and deduct a strike. All 7 pairs matched → success.
// Clue word on success: POVERTY
// ═══════════════════════════════════════════════════════════════════

/**
 * Three Franciscan virtue columns.
 * Each virtue has: id, label, icon, colour token (CSS var suffix), description.
 */
const FRANCIS_VIRTUES = [
  {
    id: 'poverty',
    icon: '🌿', color: 'fv-green',
    label: { en: 'Poverty',          fr: 'Pauvreté' },
    desc:  { en: 'Owning nothing — freed to receive everything from God.',
             fr: 'Ne rien posséder — libéré pour tout recevoir de Dieu.' },
  },
  {
    id: 'humility',
    icon: '🕊️', color: 'fv-dove',
    label: { en: 'Humility',         fr: 'Humilité' },
    desc:  { en: 'The lowest place — ground from which all virtue grows.',
             fr: 'La place la plus basse — le sol d\'où pousse toute vertu.' },
  },
  {
    id: 'creation',
    icon: '☀️', color: 'fv-sun',
    label: { en: 'Care for Creation', fr: 'Soin de la création' },
    desc:  { en: 'All creatures are kin — Brother Sun, Sister Moon, Mother Earth.',
             fr: 'Toutes les créatures sont nos proches — Frère Soleil, Sœur Lune, Mère Terre.' },
  },
];

/**
 * Seven action/teaching cards.
 * correctVirtue must match a FRANCIS_VIRTUES id exactly.
 * text: the statement students read.
 * sub: a brief source note (displayed smaller).
 */
const FRANCIS_PAIRS = [
  { id: 0, correctVirtue: 'poverty',
    text: { en: 'Francis surrendered his fine garments and his father\'s wealth, walking away with nothing but a simple tunic.',
            fr: 'François abandonna ses beaux vêtements et la richesse de son père, repartant avec rien d\'autre qu\'une simple tunique.' },
    sub:  { en: 'Conversion of Francis, 1206', fr: 'Conversion de François, 1206' } },
  { id: 1, correctVirtue: 'humility',
    text: { en: '"Preach the Gospel always; when necessary, use words." Action before speech.',
            fr: '« Prêchez l\'Évangile en tout temps ; si nécessaire, utilisez des mots. » L\'action avant la parole.' },
    sub:  { en: 'Attributed maxim', fr: 'Maxime attribuée' } },
  { id: 2, correctVirtue: 'creation',
    text: { en: 'He addressed the sun, moon, wind, fire, and water as brothers and sisters in his Canticle of the Creatures.',
            fr: 'Il s\'adressa au soleil, à la lune, au vent, au feu et à l\'eau comme à des frères et sœurs dans son Cantique des Créatures.' },
    sub:  { en: 'Canticle of the Sun, c. 1224', fr: 'Cantique du Soleil, v. 1224' } },
  { id: 3, correctVirtue: 'poverty',
    text: { en: '"It is in giving that we receive." The friars held no property, shared all goods.',
            fr: '« C\'est en donnant qu\'on reçoit. » Les frères ne possédaient rien, partageaient tout.' },
    sub:  { en: 'Peace Prayer tradition', fr: 'Tradition de la Prière pour la paix' } },
  { id: 4, correctVirtue: 'humility',
    text: { en: 'He knelt before lepers — those society had cast out — washing and kissing their wounds.',
            fr: 'Il s\'agenouilla devant les lépreux — ceux que la société avait rejetés — lavant et embrassant leurs plaies.' },
    sub:  { en: 'Testament of Francis, 1226', fr: 'Testament de François, 1226' } },
  { id: 5, correctVirtue: 'creation',
    text: { en: 'Francis negotiated with a wolf terrorising Gubbio, calling it "Brother Wolf" and brokering peace.',
            fr: 'François négocia avec un loup qui terrorisait Gubbio, l\'appelant « Frère Loup » et établissant la paix.' },
    sub:  { en: 'Fioretti, Ch. 21', fr: 'Fioretti, ch. 21' } },
  { id: 6, correctVirtue: 'poverty',
    text: { en: 'He instructed the friars to own no building, keeping only what they needed for the day.',
            fr: 'Il ordonna aux frères de ne posséder aucun bâtiment, gardant seulement ce dont ils avaient besoin pour la journée.' },
    sub:  { en: 'Rule of 1223', fr: 'Règle de 1223' } },
  { id: 7, correctVirtue: 'humility',
    text: { en: '"What a person is before God, that he is and nothing more." Francis refused all titles and honours.',
            fr: '« Ce qu\'un homme est devant Dieu, voilà ce qu\'il est, rien de plus. » François refusa tous les titres et honneurs.' },
    sub:  { en: 'Admonitions of Francis', fr: 'Admonitions de François' } },
  { id: 8, correctVirtue: 'creation',
    text: { en: 'He asked a friar never to uproot weeds entirely, so the garden could always remember wildness.',
            fr: 'Il demanda à un frère de ne jamais arracher complètement les mauvaises herbes, pour que le jardin se souvienne toujours de la nature sauvage.' },
    sub:  { en: 'Thomas of Celano, Life of Francis', fr: 'Thomas de Celano, Vie de François' } },
];

/** Module-level state for Room 2. */
const r2 = {
  // pendingMap: { pairId: virtueId } — tentative selections, not yet validated
  pendingMap:   {},
  // lockedMap:  { pairId: virtueId } — confirmed correct after submit
  lockedMap:    {},
  selected:     null,   // pairId of currently highlighted card
  attempts:     0,
  solved:       false,
  shuffledPairs: [],
};

function setupRoom2Puzzle() {
  r2.pendingMap  = {};
  r2.lockedMap   = {};
  r2.selected    = null;
  r2.attempts    = 0;
  r2.solved      = false;
  r2.shuffledPairs = shuffleArray([...FRANCIS_PAIRS]);

  const zone = $('#puzzle-zone-2');
  zone.innerHTML = `
    <div class="fv-header">
      <div class="fv-canopy" aria-hidden="true">
        <span class="fv-leaf fv-leaf-1">🍃</span>
        <span class="fv-leaf fv-leaf-2">🌿</span>
        <span class="fv-sun-icon">☀️</span>
        <span class="fv-leaf fv-leaf-3">🌿</span>
        <span class="fv-leaf fv-leaf-4">🍃</span>
      </div>
      <div class="fv-directive">
        <p class="fv-directive-label">${t('r2directive')}</p>
        <p class="fv-directive-sub">${t('r2sub')}</p>
      </div>
    </div>

    <div class="fv-layout">
      <div class="fv-virtues" id="fv-virtues-2">
        ${FRANCIS_VIRTUES.map(v => `
          <div class="fv-virtue-col ${v.color}" id="fv-col-${v.id}" data-virtue="${v.id}"
               role="button" tabindex="0" aria-label="Virtue column: ${v.label[state.lang]}">
            <div class="fv-virtue-header">
              <span class="fv-virtue-icon">${v.icon}</span>
              <span class="fv-virtue-label">${v.label[state.lang]}</span>
            </div>
            <p class="fv-virtue-desc">${v.desc[state.lang]}</p>
            <div class="fv-matched-stack" id="fv-stack-${v.id}"></div>
            <div class="fv-virtue-count"><span id="fv-count-${v.id}">0</span> ${t('r2assigned')}</div>
          </div>
        `).join('')}
      </div>

      <div class="fv-cards-wrap">
        <div class="fv-cards-label">${t('r2teachings')}</div>
        <div class="fv-cards" id="fv-cards-2"></div>
        <div class="fv-submit-row">
          <button class="btn-submit" id="fv-submit-2" disabled>${t('r2submit')}</button>
          <span class="fv-attempt-count" id="fv-attempts-2"></span>
        </div>
        <div class="fv-progress">
          <div class="fv-progress-bar-wrap">
            <div class="fv-progress-bar" id="fv-progress-bar-2"></div>
          </div>
          <span class="fv-progress-label">
            <span id="fv-matched-count-2">0</span> / ${FRANCIS_PAIRS.length} ${t('r2assigned')}
          </span>
        </div>
      </div>
    </div>

    <div class="fv-clue-wrap" id="fv-clue-2" aria-hidden="true">
      <div class="fv-clue-vines" aria-hidden="true">
        <span>🌿</span><span>🍃</span><span>✦</span><span>🍃</span><span>🌿</span>
      </div>
      <p class="fv-clue-label">${t('r2clueLabel')}</p>
      <div class="fv-clue-word" id="fv-clue-letters-2"></div>
      <p class="fv-clue-sub">${t('r2clueSub')}</p>
    </div>
  `;

  renderRoom2Cards();

  FRANCIS_VIRTUES.forEach(v => {
    const col = $(`#fv-col-${v.id}`);
    if (!col) return;
    col.addEventListener('click', () => handleRoom2VirtueClick(v.id));
    col.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRoom2VirtueClick(v.id); }
    });
  });

  $('#fv-submit-2').addEventListener('click', checkRoom2Submission);
}

/** Renders all unassigned cards and chips for tentatively-assigned cards. */
function renderRoom2Cards() {
  const container = $('#fv-cards-2');
  if (!container) return;
  container.innerHTML = '';

  // Cards still in pool (not locked, not tentatively assigned)
  const inPool = r2.shuffledPairs.filter(p => !(p.id in r2.lockedMap) && !(p.id in r2.pendingMap));

  inPool.forEach(pair => {
    const card = document.createElement('div');
    card.className = 'fv-action-card';
    card.id = `fv-card-${pair.id}`;
    card.dataset.pairid = pair.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Teaching: ${pair.text[state.lang]}`);
    card.innerHTML = `
      <div class="fv-card-inner">
        <p class="fv-card-text">${pair.text[state.lang]}</p>
        <span class="fv-card-sub">${pair.sub[state.lang]}</span>
      </div>
      <div class="fv-card-select-indicator" aria-hidden="true">→</div>
    `;
    card.addEventListener('click', () => handleRoom2CardClick(pair.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRoom2CardClick(pair.id); }
    });
    container.appendChild(card);
  });

  updateRoom2SubmitState();
  updateRoom2Progress();
}

function handleRoom2CardClick(pairId) {
  if (r2.solved || pairId in r2.lockedMap) return;
  if (r2.selected === pairId) {
    r2.selected = null;
    clearRoom2Selection();
  } else {
    r2.selected = pairId;
    highlightRoom2Selection(pairId);
  }
}

function highlightRoom2Selection(pairId) {
  $$('.fv-action-card').forEach(c => c.classList.remove('fv-card-selected'));
  $$('.fv-virtue-col').forEach(c => c.classList.remove('fv-col-awaiting'));
  const card = $(`#fv-card-${pairId}`);
  if (card) card.classList.add('fv-card-selected');
  FRANCIS_VIRTUES.forEach(v => {
    const col = $(`#fv-col-${v.id}`);
    if (col) col.classList.add('fv-col-awaiting');
  });
}

function clearRoom2Selection() {
  $$('.fv-action-card').forEach(c => c.classList.remove('fv-card-selected'));
  $$('.fv-virtue-col').forEach(c => c.classList.remove('fv-col-awaiting', 'fv-col-wrong'));
  r2.selected = null;
}

/** Tentatively assigns the selected card to a virtue column. */
function handleRoom2VirtueClick(virtueId) {
  if (r2.solved || r2.selected === null) return;
  const pairId = r2.selected;
  const pair   = FRANCIS_PAIRS.find(p => p.id === pairId);
  const virtue = FRANCIS_VIRTUES.find(v => v.id === virtueId);
  if (!pair || !virtue) return;

  // If card was previously assigned elsewhere, remove that pending chip
  const prevVirtue = r2.pendingMap[pairId];
  if (prevVirtue) removePendingChip(pairId, prevVirtue);

  // Record tentative assignment
  r2.pendingMap[pairId] = virtueId;
  r2.selected = null;
  clearRoom2Selection();

  // Hide card from pool
  const card = $(`#fv-card-${pairId}`);
  if (card) card.style.display = 'none';

  // Place a pending chip in the column stack
  const stack = $(`#fv-stack-${virtueId}`);
  if (stack) {
    const chip = document.createElement('div');
    chip.className = `fv-matched-chip fv-chip-pending ${virtue.color}`;
    chip.id = `fv-chip-${pairId}`;
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('title', 'Click to return to pool');
    chip.innerHTML = `<span class="fv-chip-icon">${virtue.icon}</span><span class="fv-chip-text">${pair.text[state.lang].slice(0, 46)}…</span><span class="fv-chip-remove">✕</span>`;
    chip.addEventListener('click', () => returnRoom2CardToPool(pairId, virtueId));
    stack.appendChild(chip);
  }

  // Update column assigned count
  const colCount = $(`#fv-count-${virtueId}`);
  if (colCount) colCount.textContent = getVirtueAssignedCount(virtueId);

  updateRoom2SubmitState();
  updateRoom2Progress();
}

/** Returns a card from a pending chip back to the pool. */
function returnRoom2CardToPool(pairId, virtueId) {
  if (r2.solved || r2.lockedMap[pairId]) return;
  removePendingChip(pairId, virtueId);
  delete r2.pendingMap[pairId];

  // Show card again in pool
  const card = $(`#fv-card-${pairId}`);
  if (card) { card.style.display = ''; card.classList.remove('fv-card-wrong'); }

  const colCount = $(`#fv-count-${virtueId}`);
  if (colCount) colCount.textContent = getVirtueAssignedCount(virtueId);

  updateRoom2SubmitState();
  updateRoom2Progress();
}

function removePendingChip(pairId, virtueId) {
  const chip = $(`#fv-chip-${pairId}`);
  if (chip) chip.remove();
}

function getVirtueAssignedCount(virtueId) {
  const pending = Object.values(r2.pendingMap).filter(v => v === virtueId).length;
  const locked  = Object.values(r2.lockedMap).filter(v => v === virtueId).length;
  return pending + locked;
}

/** Submit is enabled only when all 9 unmatched cards have been assigned. */
function updateRoom2SubmitState() {
  const totalAssigned = Object.keys(r2.pendingMap).length + Object.keys(r2.lockedMap).length;
  const submitBtn = $('#fv-submit-2');
  if (submitBtn) submitBtn.disabled = totalAssigned < FRANCIS_PAIRS.length;
}

function updateRoom2Progress() {
  const total    = FRANCIS_PAIRS.length;
  const assigned = Object.keys(r2.pendingMap).length + Object.keys(r2.lockedMap).length;
  const bar   = $('#fv-progress-bar-2');
  const label = $('#fv-matched-count-2');
  if (bar)   bar.style.width = `${Math.round((assigned / total) * 100)}%`;
  if (label) label.textContent = assigned;
}

/** Batch-validates all pending assignments. */
function checkRoom2Submission() {
  if (r2.solved) return;
  r2.attempts++;
  const attemptsEl = $('#fv-attempts-2');
  if (attemptsEl) attemptsEl.textContent = `Attempt ${r2.attempts}`;

  let wrongCount   = 0;
  let correctCount = 0;
  const snapshot   = { ...r2.pendingMap };

  Object.entries(snapshot).forEach(([pairIdStr, virtueId]) => {
    const pairId = parseInt(pairIdStr);
    const pair   = FRANCIS_PAIRS.find(p => p.id === pairId);
    const chip   = $(`#fv-chip-${pairId}`);
    if (!pair) return;

    if (pair.correctVirtue === virtueId) {
      // ── Lock correct ─────────────────────────────────────
      correctCount++;
      r2.lockedMap[pairId] = virtueId;
      delete r2.pendingMap[pairId];
      if (chip) {
        chip.classList.remove('fv-chip-pending');
        chip.classList.add('fv-chip-locked');
        chip.removeAttribute('role');
        chip.removeAttribute('tabindex');
        chip.onclick = null;
        const removeBtn = chip.querySelector('.fv-chip-remove');
        if (removeBtn) removeBtn.remove();
      }
      // Update column count
      const colCount = $(`#fv-count-${virtueId}`);
      if (colCount) colCount.textContent = getVirtueAssignedCount(virtueId);

      // Flash column green
      const col = $(`#fv-col-${virtueId}`);
      if (col) { col.classList.add('fv-col-correct'); setTimeout(() => col.classList.remove('fv-col-correct'), 800); }

    } else {
      // ── Wrong — flash red then bounce back ───────────────
      wrongCount++;
      if (chip) { chip.classList.add('fv-chip-wrong'); }
      const col = $(`#fv-col-${virtueId}`);
      if (col) { col.classList.add('fv-col-wrong'); setTimeout(() => col.classList.remove('fv-col-wrong'), 900); }

      setTimeout(() => {
        delete r2.pendingMap[pairId];
        removePendingChip(pairId, virtueId);
        const card = $(`#fv-card-${pairId}`);
        if (card) { card.style.display = ''; card.classList.remove('fv-card-wrong'); }
        const colCount = $(`#fv-count-${virtueId}`);
        if (colCount) colCount.textContent = getVirtueAssignedCount(virtueId);
        updateRoom2SubmitState();
        updateRoom2Progress();
      }, 900);
    }
  });

  if (wrongCount > 0) {
    applyTimePenalty(60, 2);
    const wrongMsg = t('r2wrong').replace('{n}', wrongCount).replace('{es}', wrongCount > 1 ? 'es' : '');
    const lockMsg  = correctCount > 0 ? ' ' + t('r2locked').replace('{n}', correctCount) : '';
    showFeedback(2, 'error', wrongMsg + lockMsg);
    shakeInput($('#fv-submit-2'));
  } else if (correctCount > 0) {
    if (Object.keys(r2.lockedMap).length === FRANCIS_PAIRS.length) {
      setTimeout(triggerRoom2Success, 500);
    } else {
      showFeedback(2, 'success', `\u2713 ${correctCount} ${t('r2locked').replace('{n}', correctCount)}`);
    }
  }

  updateRoom2SubmitState();
}

/** Updates the strike pip display. */
function updateRoom2Strikes() {}   // no longer used — kept for safety

/** Called when max strikes reached — kept as no-op (strikes removed). */
function revealRoom2Answers() {}

/** Full success sequence. */
function triggerRoom2Success() {
  r2.solved = true;

  FRANCIS_VIRTUES.forEach((v, i) => {
    const col = $(`#fv-col-${v.id}`);
    if (col) { col.style.animationDelay = `${i * 150}ms`; col.classList.add('fv-col-solved'); }
  });

  $$('.fv-leaf, .fv-sun-icon').forEach((el, i) => {
    el.style.animationDelay = `${i * 80}ms`;
    el.classList.add('fv-leaf-bloom');
  });

  const submitBtn = $('#fv-submit-2');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('r2submitVerified'); submitBtn.classList.add('btn-submit-done'); }

  setTimeout(() => {
    const clueWrap = $('#fv-clue-2');
    if (clueWrap) {
      clueWrap.removeAttribute('aria-hidden');
      clueWrap.classList.add('visible');
      const lettersEl = $('#fv-clue-letters-2');
      if (lettersEl) {
        lettersEl.innerHTML = '';
        const word = ROOMS[2].clueWord[state.lang];
        [...word].forEach((ch, i) => {
          const span = document.createElement('span');
          span.className = 'fv-clue-letter';
          span.textContent = ch;
          span.style.animationDelay = `${320 + i * 150}ms`;
          lettersEl.appendChild(span);
        });
      }
    }
  }, 500);

  showFeedback(2, 'success', t('r2success'));
  setTimeout(() => completeRoom(2), 900);
}

function resetRoom2Puzzle() {
  r2.pendingMap  = {};
  r2.lockedMap   = {};
  r2.selected    = null;
  r2.attempts    = 0;
  r2.solved      = false;
  r2.shuffledPairs = [];
  setupRoom2Puzzle();
}

// ═══════════════════════════════════════════════════════════════════
// ROOM 3 — ST. ANTHONY OF PADUA
const CIPHER_SYMBOLS = [
  { id: 'lily',  glyph: '⚜',
    label: { en: 'Lily',         fr: 'Lys' },
    desc:  { en: 'Purity & Marian devotion', fr: 'Pureté et dévotion mariale' } },
  { id: 'book',  glyph: '✦',
    label: { en: 'Scripture',    fr: 'Écriture Sainte' },
    desc:  { en: 'Word of God / theology',   fr: 'Parole de Dieu / théologie' } },
  { id: 'bread', glyph: '∿',
    label: { en: 'Bread',        fr: 'Pain' },
    desc:  { en: 'Alms & Providence',        fr: 'Aumônes et Providence' } },
  { id: 'child', glyph: '☩',
    label: { en: 'Christ Child', fr: 'Enfant Jésus' },
    desc:  { en: 'Vision of the Infant Jesus', fr: 'Vision de l\'Enfant Jésus' } },
];

const CIPHER_WHEELS = [
  { slot: 0, correctIndex: 1,
    clueLabel: { en: 'CLUE I',   fr: 'INDICE I' },
    clue: { en: 'Francis himself appointed Anthony the first Franciscan teacher of theology — armed with the Word, not the sword.',
            fr: 'François d\'Assise lui-même nomma Antoine le premier professeur de théologie franciscain — armé de la Parole, non de l\'épée.' } },
  { slot: 1, correctIndex: 0,
    clueLabel: { en: 'CLUE II',  fr: 'INDICE II' },
    clue: { en: 'Anthony is rarely painted without it. White and unblemished, it marks him as a preacher devoted to Our Lady.',
            fr: 'Antoine est rarement peint sans lui. Blanc et immaculé, il le marque comme un prédicateur dévoué à Notre-Dame.' } },
  { slot: 2, correctIndex: 2,
    clueLabel: { en: 'CLUE III', fr: 'INDICE III' },
    clue: { en: "A grieving mother's vow gave rise to a tradition still practised today — food given to the poor in thanksgiving for his intercession.",
            fr: 'Le vœu d\'une mère en deuil a donné naissance à une tradition encore pratiquée aujourd\'hui — de la nourriture donnée aux pauvres en action de grâce pour son intercession.' } },
  { slot: 3, correctIndex: 3,
    clueLabel: { en: 'CLUE IV',  fr: 'INDICE IV' },
    clue: { en: 'A nobleman who sheltered Anthony witnessed a blazing light and, entering the room, found Anthony cradling a radiant infant.',
            fr: 'Un noble qui hébergea Antoine fut témoin d\'une lumière éclatante et, en entrant dans la pièce, trouva Antoine berçant un enfant radieux.' } },
];

const r3 = {
  dials:    [0, 0, 0, 0],
  attempts: 0,
  solved:   false,
};

function setupRoom3Puzzle() {
  r3.dials    = [0, 0, 0, 0];
  r3.attempts = 0;
  r3.solved   = false;

  const zone = $('#puzzle-zone-3');
  zone.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'cb-header';
  header.innerHTML = `
    <div class="cb-title-row">
      <span class="cb-icon">🔐</span>
      <div>
        <p class="cb-directive-label">${t('r3directive')}</p>
        <p class="cb-directive-sub">${t('r3sub')}</p>
      </div>
    </div>
  `;
  zone.appendChild(header);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'cb-legend';
  const legendLabel = document.createElement('p');
  legendLabel.className = 'cb-legend-label';
  legendLabel.textContent = t('r3cipherKey');
  legend.appendChild(legendLabel);
  const legendGrid = document.createElement('div');
  legendGrid.className = 'cb-legend-grid';
  CIPHER_SYMBOLS.forEach(sym => {
    const item = document.createElement('div');
    item.className = 'cb-legend-item';
    item.innerHTML = `<span class="cb-legend-glyph">${sym.glyph}</span><span class="cb-legend-name">${sym.label[state.lang]}</span><span class="cb-legend-desc">${sym.desc[state.lang]}</span>`;
    legendGrid.appendChild(item);
  });
  legend.appendChild(legendGrid);
  zone.appendChild(legend);

  // Main two-column layout
  const main = document.createElement('div');
  main.className = 'cb-main';

  // Clues column
  const cluesCol = document.createElement('div');
  cluesCol.className = 'cb-clues';
  const cluesTitle = document.createElement('p');
  cluesTitle.className = 'cb-clues-label';
  cluesTitle.textContent = t('r3clues');
  cluesCol.appendChild(cluesTitle);

  CIPHER_WHEELS.forEach((wheel, i) => {
    const card = document.createElement('div');
    card.className = 'cb-clue-card';
    card.id = `cb-clue-${i}`;
    card.innerHTML = `<span class="cb-clue-num">${wheel.clueLabel[state.lang]}</span><p class="cb-clue-text">${wheel.clue[state.lang]}</p><span class="cb-clue-arrow">→ ${t('r3wheel')} ${i + 1}</span>`;
    cluesCol.appendChild(card);
  });
  main.appendChild(cluesCol);

  // Lock column
  const lockCol = document.createElement('div');
  lockCol.className = 'cb-lock-col';

  const lockCase = document.createElement('div');
  lockCase.className = 'cb-lock-case';

  const lockTop = document.createElement('div');
  lockTop.className = 'cb-lock-top';
  lockTop.innerHTML = `<span class="cb-lock-brand">${t('r3lockBrand')}</span><div class="cb-lock-led" id="cb-led-3"></div>`;
  lockCase.appendChild(lockTop);

  const wheelsRow = document.createElement('div');
  wheelsRow.className = 'cb-wheels';

  CIPHER_WHEELS.forEach((_, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'cb-wheel-wrap';

    const upBtn = document.createElement('button');
    upBtn.className = 'cb-wheel-btn cb-up';
    upBtn.setAttribute('aria-label', `Wheel ${i + 1} up`);
    upBtn.textContent = '▲';
    upBtn.addEventListener('click', () => rotateWheel(i, -1));

    const display = document.createElement('div');
    display.className = 'cb-wheel-display';
    display.id = `cb-wheel-display-${i}`;
    display.innerHTML = `<div class="cb-wheel-glyph" id="cb-glyph-${i}">${CIPHER_SYMBOLS[0].glyph}</div><div class="cb-wheel-sublabel" id="cb-sublabel-${i}">${CIPHER_SYMBOLS[0].label[state.lang]}</div>`;

    const downBtn = document.createElement('button');
    downBtn.className = 'cb-wheel-btn cb-down';
    downBtn.setAttribute('aria-label', `Wheel ${i + 1} down`);
    downBtn.textContent = '▼';
    downBtn.addEventListener('click', () => rotateWheel(i, 1));

    const num = document.createElement('div');
    num.className = 'cb-wheel-num';
    num.textContent = i + 1;

    wrap.appendChild(upBtn);
    wrap.appendChild(display);
    wrap.appendChild(downBtn);
    wrap.appendChild(num);
    wheelsRow.appendChild(wrap);
  });

  lockCase.appendChild(wheelsRow);

  const lockBottom = document.createElement('div');
  lockBottom.className = 'cb-lock-bottom';
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn-submit';
  submitBtn.id = 'cb-submit-3';
  submitBtn.textContent = t('r3unlock');
  submitBtn.addEventListener('click', checkRoom3Cipher);
  const attemptsSpan = document.createElement('span');
  attemptsSpan.className = 'cb-attempt-count';
  attemptsSpan.id = 'cb-attempts-3';
  lockBottom.appendChild(submitBtn);
  lockBottom.appendChild(attemptsSpan);
  lockCase.appendChild(lockBottom);

  lockCol.appendChild(lockCase);
  main.appendChild(lockCol);
  zone.appendChild(main);

  // Clue reveal
  const clueReveal = document.createElement('div');
  clueReveal.className = 'cb-clue-wrap';
  clueReveal.id = 'cb-clue-reveal-3';
  clueReveal.setAttribute('aria-hidden', 'true');
  clueReveal.innerHTML = `
    <p class="cb-clue-reveal-label">${t('r3clueLabel')}</p>
    <div class="cb-clue-word" id="cb-clue-letters-3"></div>
    <p class="cb-clue-reveal-sub">${t('r3clueSub')}</p>
  `;
  zone.appendChild(clueReveal);
}

function rotateWheel(i, delta) {
  if (r3.solved) return;
  r3.dials[i] = (r3.dials[i] + delta + CIPHER_SYMBOLS.length) % CIPHER_SYMBOLS.length;
  const sym = CIPHER_SYMBOLS[r3.dials[i]];
  const g = $(`#cb-glyph-${i}`);
  const s = $(`#cb-sublabel-${i}`);
  const d = $(`#cb-wheel-display-${i}`);
  if (g) g.textContent = sym.glyph;
  if (s) s.textContent = sym.label[state.lang];
  if (d) { d.classList.remove('cb-wheel-spin'); void d.offsetWidth; d.classList.add('cb-wheel-spin'); }
  // Highlight linked clue
  CIPHER_WHEELS.forEach((_, j) => { const c = $(`#cb-clue-${j}`); if (c) c.classList.remove('cb-clue-active'); });
  const active = $(`#cb-clue-${i}`);
  if (active) active.classList.add('cb-clue-active');
}

function checkRoom3Cipher() {
  if (r3.solved) return;
  r3.attempts++;
  const el = $('#cb-attempts-3');
  if (el) el.textContent = `Attempt ${r3.attempts}`;

  const correct = CIPHER_WHEELS.every((w, i) => r3.dials[i] === w.correctIndex);
  if (correct) {
    triggerRoom3Success();
    return;
  }

  CIPHER_WHEELS.forEach((w, i) => {
    const d = $(`#cb-wheel-display-${i}`);
    if (!d) return;
    d.classList.remove('cb-wheel-wrong', 'cb-wheel-correct');
    void d.offsetWidth;
    d.classList.add(r3.dials[i] === w.correctIndex ? 'cb-wheel-correct' : 'cb-wheel-wrong');
    setTimeout(() => d.classList.remove('cb-wheel-wrong', 'cb-wheel-correct'), 900);
  });

  const led = $('#cb-led-3');
  if (led) { led.classList.add('cb-led-fail'); setTimeout(() => led.classList.remove('cb-led-fail'), 900); }

  const wrong = CIPHER_WHEELS.filter((w, i) => r3.dials[i] !== w.correctIndex).length;
  showFeedback(3, 'error', t('r3wrong').replace('{n}', wrong).replace('{s}', wrong > 1 ? 's' : ''));

  const lockCase = document.querySelector('.cb-lock-case');
  shakeInput(lockCase || $('#cb-submit-3'));
  applyTimePenalty(60, 3);
}

function triggerRoom3Success() {
  r3.solved = true;

  const led = $('#cb-led-3');
  if (led) led.classList.add('cb-led-open');

  const lockCase = document.querySelector('.cb-lock-case');
  if (lockCase) lockCase.classList.add('cb-lock-solved');

  CIPHER_WHEELS.forEach((_, i) => {
    const d = $(`#cb-wheel-display-${i}`);
    if (d) d.classList.add('cb-wheel-solved');
    if (d && d.parentElement) {
      const up   = d.parentElement.querySelector('.cb-up');
      const down = d.parentElement.querySelector('.cb-down');
      if (up)   up.disabled   = true;
      if (down) down.disabled = true;
    }
    const c = $(`#cb-clue-${i}`);
    if (c) c.classList.add('cb-clue-solved');
  });

  const submit = $('#cb-submit-3');
  if (submit) { submit.disabled = true; submit.textContent = t('r3unlocked'); submit.classList.add('btn-submit-done'); }

  setTimeout(() => {
    const wrap = $('#cb-clue-reveal-3');
    if (!wrap) return;
    wrap.removeAttribute('aria-hidden');
    wrap.classList.add('visible');
    const lettersEl = $('#cb-clue-letters-3');
    if (!lettersEl) return;
    lettersEl.innerHTML = '';
    const word3 = ROOMS[3].clueWord[state.lang];
    [...word3].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'cb-clue-letter';
      span.textContent = ch;
      span.style.animationDelay = `${300 + i * 160}ms`;
      lettersEl.appendChild(span);
    });
  }, 500);

  showFeedback(3, 'success', t('r3success'));
  setTimeout(() => completeRoom(3), 800);
}

function resetRoom3Puzzle() {
  r3.dials    = [0, 0, 0, 0];
  r3.attempts = 0;
  r3.solved   = false;
  setupRoom3Puzzle();
}
// ═══════════════════════════════════════════════════════════════════
// ROOM 4 — POPE PIUS X
// PUZZLE: Submit-based timeline placement.
// Six reform events sit in a card pool. Students click a card to
// select it, then click a year slot to tentatively place it.
// Cards can be moved freely until SUBMIT SEQUENCE is clicked.
// On submit: correct placements lock green; wrong ones flash red
// and bounce back to the pool for repositioning.
// All six correct → success.  Clue word: EUCHARIST
// ═══════════════════════════════════════════════════════════════════

const PX_EVENTS = [
  { id: 'sartum',   correctYear: 1903, icon: '♪',
    label: { en: 'Tra le Sollecitudini — Sacred Music Reform',
             fr: 'Tra le Sollecitudini — Réforme de la musique sacrée' },
    desc:  { en: 'A landmark instruction restoring Gregorian chant to the liturgy, banning theatrical music from worship.',
             fr: 'Une instruction majeure restaurant le chant grégorien à la liturgie, interdisant la musique théâtrale dans les églises.' } },
  { id: 'codex',    correctYear: 1904, icon: '⚖',
    label: { en: 'Codex Iuris Canonici Commissioned',
             fr: 'Codex Iuris Canonici commandé' },
    desc:  { en: 'Pius X ordered the first unified revision of Church law — a Code completed under his successor in 1917.',
             fr: 'Pie X ordonna la première révision unifiée du droit de l\'Église — un Code achevé sous son successeur en 1917.' } },
  { id: 'frequent', correctYear: 1905, icon: '☩',
    label: { en: 'Sacra Tridentina — Frequent Communion Encouraged',
             fr: 'Sacra Tridentina — La communion fréquente encouragée' },
    desc:  { en: 'A decree urging the faithful to receive Holy Communion frequently — even daily — reversing a culture of excessive restriction.',
             fr: 'Un décret encourageant les fidèles à recevoir la sainte communion fréquemment — même quotidiennement — renversant une culture de restriction excessive.' } },
  { id: 'catechism',correctYear: 1906, icon: '📋',
    label: { en: 'Catechism of Pius X Published',
             fr: 'Catéchisme de Pie X publié' },
    desc:  { en: 'A clear, single plain-language catechism for ordinary Catholics, replacing the patchwork of complex regional texts.',
             fr: 'Un catéchisme clair en langage simple pour les catholiques ordinaires, remplaçant le patchwork de textes régionaux complexes.' } },
  { id: 'modernism',correctYear: 1907, icon: '⚠',
    label: { en: 'Pascendi Dominici Gregis — Modernism Condemned',
             fr: 'Pascendi Dominici Gregis — Le modernisme condamné' },
    desc:  { en: 'An encyclical condemning Modernism as the "synthesis of all heresies," defending doctrinal tradition against rationalist theology.',
             fr: 'Une encyclique condamnant le modernisme comme « la synthèse de toutes les hérésies », défendant la tradition doctrinale contre la théologie rationaliste.' } },
  { id: 'communion',correctYear: 1910, icon: '✝',
    label: { en: 'Quam Singulari — First Communion at Age of Reason',
             fr: 'Quam Singulari — Première communion à l\'âge de raison' },
    desc:  { en: 'Pius X lowered the age of first Holy Communion to ~7 years old, opening the Eucharist to all the faithful from childhood.',
             fr: 'Pie X abaissa l\'âge de la première communion à environ 7 ans, ouvrant l\'Eucharistie à tous les fidèles dès l\'enfance.' } },
];

// Six unique year slots — one event per slot
const PX_SLOTS = [
  { year: 1903, label: '1903' },
  { year: 1904, label: '1904' },
  { year: 1905, label: '1905' },
  { year: 1906, label: '1906' },
  { year: 1907, label: '1907' },
  { year: 1910, label: '1910' },
];

/**
 * r4 state:
 *   selected   — evId of the currently highlighted pool card (null = none)
 *   slotMap    — { year: evId } tentative placements on the rail
 *   locked     — Set of evIds confirmed correct (locked green)
 *   attempts   — submit count
 *   solved     — true when all 6 locked
 */
const r4 = {
  selected: null,
  slotMap:  {},
  locked:   new Set(),
  attempts: 0,
  solved:   false,
};

function setupRoom4Puzzle() {
  r4.selected = null;
  r4.slotMap  = {};
  r4.locked   = new Set();
  r4.attempts = 0;
  r4.solved   = false;

  const zone = $('#puzzle-zone-4');
  zone.innerHTML = '';

  // ── Header ────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'px-header';
  header.innerHTML = `
    <div class="px-title-row">
      <div class="px-papal-seal" aria-hidden="true">✝</div>
      <div>
        <p class="px-directive-label">${t('r4directive')}</p>
        <p class="px-directive-sub">${t('r4sub')}</p>
      </div>
    </div>
  `;
  zone.appendChild(header);

  // ── Main two-column layout ────────────────────────────────────
  const main = document.createElement('div');
  main.className = 'px-main';

  // ── Pool column ───────────────────────────────────────────────
  const pool = document.createElement('div');
  pool.className = 'px-pool';

  const poolLabel = document.createElement('p');
  poolLabel.className = 'px-pool-label';
  poolLabel.textContent = t('r4reforms');
  pool.appendChild(poolLabel);

  const cardsWrap = document.createElement('div');
  cardsWrap.className = 'px-cards';
  cardsWrap.id = 'px-cards-4';
  shuffleArray([...PX_EVENTS]).forEach(ev => cardsWrap.appendChild(buildPxCard(ev)));
  pool.appendChild(cardsWrap);

  // Submit button lives under the pool
  const submitRow = document.createElement('div');
  submitRow.className = 'px-submit-row';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn-submit';
  submitBtn.id = 'px-submit-4';
  submitBtn.textContent = t('r4submit');
  submitBtn.disabled = true;   // enabled when all slots filled
  submitBtn.addEventListener('click', checkRoom4Submission);

  const attemptSpan = document.createElement('span');
  attemptSpan.className = 'px-attempt-count';
  attemptSpan.id = 'px-attempts-4';

  submitRow.appendChild(submitBtn);
  submitRow.appendChild(attemptSpan);
  pool.appendChild(submitRow);

  main.appendChild(pool);

  // ── Rail column ───────────────────────────────────────────────
  const railWrap = document.createElement('div');
  railWrap.className = 'px-rail-wrap';

  const railLabel = document.createElement('p');
  railLabel.className = 'px-rail-label';
  railLabel.textContent = t('r4timeline');
  railWrap.appendChild(railLabel);

  const rail = document.createElement('div');
  rail.className = 'px-rail';
  rail.id = 'px-rail-4';

  PX_SLOTS.forEach(slot => {
    const node = document.createElement('div');
    node.className = 'px-slot';
    node.id = `px-slot-${slot.year}`;
    node.dataset.year = slot.year;
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.setAttribute('aria-label', `Year ${slot.year} — click to place selected card`);

    const yearBadge = document.createElement('div');
    yearBadge.className = 'px-slot-year';
    yearBadge.textContent = slot.label;

    const drop = document.createElement('div');
    drop.className = 'px-slot-drop';
    drop.id = `px-drop-${slot.year}`;

    const hint = document.createElement('span');
    hint.className = 'px-slot-hint';
    hint.textContent = t('r4placeHere');
    drop.appendChild(hint);

    node.appendChild(yearBadge);
    node.appendChild(drop);
    node.addEventListener('click',   () => handlePxSlotClick(slot.year));
    node.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePxSlotClick(slot.year); }
    });
    rail.appendChild(node);
  });

  railWrap.appendChild(rail);

  // Progress
  const progress = document.createElement('div');
  progress.className = 'px-progress';
  progress.innerHTML = `
    <div class="px-progress-bar-wrap"><div class="px-progress-bar" id="px-progress-bar-4"></div></div>
    <span class="px-progress-label"><span id="px-placed-count-4">0</span> / ${PX_EVENTS.length} placed</span>
  `;
  railWrap.appendChild(progress);
  main.appendChild(railWrap);
  zone.appendChild(main);

  // ── Clue reveal ──────────────────────────────────────────────
  const clueWrap = document.createElement('div');
  clueWrap.className = 'px-clue-wrap';
  clueWrap.id = 'px-clue-4';
  clueWrap.setAttribute('aria-hidden', 'true');
  clueWrap.innerHTML = `
    <p class="px-clue-label">${t('r4clueLabel')}</p>
    <div class="px-clue-word" id="px-clue-letters-4"></div>
    <p class="px-clue-sub">${t('r4clueSub')}</p>
  `;
  zone.appendChild(clueWrap);
}

/** Builds a pool card element for one event. */
function buildPxCard(ev) {
  const card = document.createElement('div');
  card.className = 'px-event-card';
  card.id = `px-card-${ev.id}`;
  card.dataset.evid = ev.id;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', ev.label[state.lang]);
  card.innerHTML = `
    <span class="px-card-icon">${ev.icon}</span>
    <div class="px-card-body">
      <span class="px-card-label">${ev.label[state.lang]}</span>
      <span class="px-card-desc">${ev.desc[state.lang]}</span>
    </div>
    <span class="px-card-select-arrow">→</span>
  `;
  card.addEventListener('click',   () => handlePxCardClick(ev.id));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePxCardClick(ev.id); }
  });
  return card;
}

/** Selects / deselects a pool card. */
function handlePxCardClick(evId) {
  if (r4.solved || r4.locked.has(evId)) return;

  // If card is currently on the rail, clicking it returns it to pool
  const currentYear = getPxPlacedYear(evId);
  if (currentYear !== null) {
    returnPxCardToPool(evId, currentYear);
    return;
  }

  if (r4.selected === evId) {
    r4.selected = null;
    clearPxHighlight();
  } else {
    r4.selected = evId;
    applyPxHighlight(evId);
  }
}

/** Returns which year a given evId is currently placed in (or null). */
function getPxPlacedYear(evId) {
  for (const [year, id] of Object.entries(r4.slotMap)) {
    if (id === evId) return parseInt(year);
  }
  return null;
}

/** Moves a card back from a rail slot to the pool. */
function returnPxCardToPool(evId, year) {
  if (r4.locked.has(evId)) return;
  delete r4.slotMap[year];
  r4.selected = null;
  clearPxHighlight();

  // Restore drop zone hint
  const drop = $(`#px-drop-${year}`);
  if (drop) { drop.innerHTML = `<span class="px-slot-hint">${t('r4placeHere')}</span>`; }
  const slot = $(`#px-slot-${year}`);
  if (slot) slot.classList.remove('px-slot-occupied', 'px-slot-correct', 'px-slot-wrong');

  // Show card back in pool
  const card = $(`#px-card-${evId}`);
  if (card) {
    card.style.display = '';
    card.classList.remove('px-card-selected', 'px-card-wrong');
  }
  updatePxSubmitState();
  updatePxProgress();
}

/** Highlights the selected card + all open slots. */
function applyPxHighlight(evId) {
  $$('.px-event-card').forEach(c => c.classList.remove('px-card-selected'));
  $$('.px-slot').forEach(s => s.classList.remove('px-slot-awaiting'));
  const card = $(`#px-card-${evId}`);
  if (card) card.classList.add('px-card-selected');
  $$('.px-slot').forEach(s => {
    const yr = parseInt(s.dataset.year);
    if (!r4.locked.has(r4.slotMap[yr]) && !s.classList.contains('px-slot-locked'))
      s.classList.add('px-slot-awaiting');
  });
}

function clearPxHighlight() {
  $$('.px-event-card').forEach(c => c.classList.remove('px-card-selected'));
  $$('.px-slot').forEach(s => s.classList.remove('px-slot-awaiting'));
}

/** Tentatively places the selected card into a year slot. */
function handlePxSlotClick(year) {
  if (r4.solved) return;

  // If slot is locked (correct), ignore
  const slot = $(`#px-slot-${year}`);
  if (!slot || slot.classList.contains('px-slot-locked')) return;

  // If nothing selected, and slot is occupied, select the card on it
  if (r4.selected === null) {
    const occupant = r4.slotMap[year];
    if (occupant && !r4.locked.has(occupant)) {
      r4.selected = occupant;
      applyPxHighlight(occupant);
    }
    return;
  }

  const evId = r4.selected;
  const ev   = PX_EVENTS.find(e => e.id === evId);
  if (!ev) return;

  // If this card is already on another slot, clear that slot first
  const prevYear = getPxPlacedYear(evId);
  if (prevYear !== null && prevYear !== year) {
    const prevDrop = $(`#px-drop-${prevYear}`);
    if (prevDrop) prevDrop.innerHTML = '<span class="px-slot-hint">\u2190 place here</span>';
    const prevSlot = $(`#px-slot-${prevYear}`);
    if (prevSlot) prevSlot.classList.remove('px-slot-occupied', 'px-slot-wrong');
    delete r4.slotMap[prevYear];
  }

  // If another card is already in this slot, bump it back to pool
  const existing = r4.slotMap[year];
  if (existing && existing !== evId && !r4.locked.has(existing)) {
    const exCard = $(`#px-card-${existing}`);
    if (exCard) exCard.style.display = '';
    delete r4.slotMap[year];
  }

  // Place card into slot
  r4.slotMap[year] = evId;
  r4.selected = null;
  clearPxHighlight();

  // Hide card from pool
  const card = $(`#px-card-${evId}`);
  if (card) card.style.display = 'none';

  // Render chip in drop zone
  const drop = $(`#px-drop-${year}`);
  if (drop) {
    drop.innerHTML = '';
    const chip = document.createElement('div');
    chip.className = 'px-placed-chip px-chip-tentative';
    chip.id = `px-chip-${evId}`;
    chip.innerHTML = `<span class="px-chip-icon">${ev.icon}</span><span class="px-chip-label">${ev.label[state.lang]}</span>`;
    drop.appendChild(chip);
  }

  slot.classList.add('px-slot-occupied');
  slot.classList.remove('px-slot-wrong');

  updatePxSubmitState();
  updatePxProgress();
}

/** Enables the submit button only when all 6 slots are filled. */
function updatePxSubmitState() {
  const filledSlots  = Object.keys(r4.slotMap).length + r4.locked.size;
  const submitBtn    = $('#px-submit-4');
  if (submitBtn) submitBtn.disabled = filledSlots < PX_EVENTS.length;
}

function updatePxProgress() {
  const placed = Object.keys(r4.slotMap).length + r4.locked.size;
  const bar    = $('#px-progress-bar-4');
  const label  = $('#px-placed-count-4');
  if (bar)   bar.style.width = `${Math.round((placed / PX_EVENTS.length) * 100)}%`;
  if (label) label.textContent = placed;
}

/**
 * Batch-validates the current slotMap.
 * Correct entries → lock green.
 * Wrong entries   → flash red, chip bounces back to pool.
 */
function checkRoom4Submission() {
  if (r4.solved) return;
  r4.attempts++;

  const attemptsEl = $('#px-attempts-4');
  if (attemptsEl) attemptsEl.textContent = `Attempt ${r4.attempts}`;

  let wrongCount   = 0;
  let correctCount = 0;

  // Evaluate each tentative placement
  const snapshot = { ...r4.slotMap };

  Object.entries(snapshot).forEach(([yearStr, evId]) => {
    const year  = parseInt(yearStr);
    const ev    = PX_EVENTS.find(e => e.id === evId);
    const slot  = $(`#px-slot-${year}`);
    const chip  = $(`#px-chip-${evId}`);

    if (!ev) return;

    if (ev.correctYear === year) {
      // ── Lock this placement ──────────────────────────────
      r4.locked.add(evId);
      delete r4.slotMap[year];
      correctCount++;

      if (chip) { chip.classList.remove('px-chip-tentative'); chip.classList.add('px-chip-locked'); }
      if (slot) { slot.classList.add('px-slot-locked', 'px-slot-correct'); slot.classList.remove('px-slot-occupied', 'px-slot-wrong'); }
    } else {
      // ── Wrong — animate red, then return to pool ─────────
      wrongCount++;

      if (slot) { slot.classList.add('px-slot-wrong'); slot.classList.remove('px-slot-occupied'); }
      if (chip) { chip.classList.add('px-chip-wrong'); }

      setTimeout(() => {
        delete r4.slotMap[year];
        if (slot) slot.classList.remove('px-slot-wrong', 'px-slot-occupied');

        // Restore slot hint
        const drop = $(`#px-drop-${year}`);
        if (drop) { drop.innerHTML = `<span class="px-slot-hint">${t('r4placeHere')}</span>`; }

        // Return card to pool
        const card = $(`#px-card-${evId}`);
        if (card) { card.style.display = ''; card.classList.remove('px-card-wrong'); }

        updatePxSubmitState();
        updatePxProgress();
      }, 800);
    }
  });

  // Feedback
  if (wrongCount === 0 && correctCount > 0) {
    if (r4.locked.size === PX_EVENTS.length) {
      // All correct — success
      setTimeout(triggerRoom4Success, 600);
    } else {
      showFeedback(4, 'success', t('r4partial').replace('{n}', correctCount).replace('{s}', correctCount > 1 ? 's' : ''));
    }
  } else if (wrongCount > 0) {
    showFeedback(4, 'error', t('r4wrong').replace('{n}', wrongCount).replace('{s}', wrongCount > 1 ? 's' : '') + (correctCount > 0 ? ' ' + t('r4locked').replace('{n}', correctCount) : ''));
    applyTimePenalty(60, 4);
    shakeInput($('#px-submit-4'));
  }

  updatePxSubmitState();
}

function triggerRoom4Success() {
  r4.solved = true;

  const rail = $('#px-rail-4');
  if (rail) rail.classList.add('px-rail-solved');

  const seal = $('.px-papal-seal');
  if (seal) seal.classList.add('px-seal-glow');

  const submitBtn = $('#px-submit-4');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('r4verified'); submitBtn.classList.add('btn-submit-done'); }

  setTimeout(() => {
    const wrap = $('#px-clue-4');
    if (!wrap) return;
    wrap.removeAttribute('aria-hidden');
    wrap.classList.add('visible');
    const lettersEl = $('#px-clue-letters-4');
    if (!lettersEl) return;
    lettersEl.innerHTML = '';
    const word4 = ROOMS[4].clueWord[state.lang];
    [...word4].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'px-clue-letter';
      span.textContent = ch;
      span.style.animationDelay = `${280 + i * 130}ms`;
      lettersEl.appendChild(span);
    });
  }, 500);

  showFeedback(4, 'success', t('r4success'));
  setTimeout(() => completeRoom(4), 900);
}

function resetRoom4Puzzle() {
  r4.selected = null;
  r4.slotMap  = {};
  r4.locked   = new Set();
  r4.attempts = 0;
  r4.solved   = false;
  setupRoom4Puzzle();
}

// ═══════════════════════════════════════════════════════════════════
// ROOM 5 — ST. MAXIMILIAN KOLBE
// PUZZLE: Branching moral decision scenario.
// Players navigate a three-node decision tree set in Auschwitz, 1941.
// Each node presents a dilemma with 2–3 choices. Wrong choices show
// a reflection and reset that node. Choosing the Kolbe-aligned path
// at every node completes the scenario and reveals SACRIFICE.
//
// NODE STRUCTURE:
//   node_1  → the announcement (escape reported, ten must die)
//   node_2  → the moment of choice (step forward or stay silent)
//   node_3  → the final witness (how to face the cell)
//
// Correct path: SPEAK → STEP_FORWARD → PRAY_TOGETHER
// ═══════════════════════════════════════════════════════════════════

const KOLBE_NODES = {
  node_1: {
    id: 'node_1',
    scene:    { en: 'AUSCHWITZ — BLOCK 14 — JULY 1941',    fr: 'AUSCHWITZ — BLOC 14 — JUILLET 1941' },
    sceneIcon: '🏚',
    passage: {
      en: `The summer sun beats on the roll-call square. A whistle cuts the air. Commandant Fritsch steps forward — a prisoner from Block 14 has escaped. His voice is cold as iron:\n\n"Ten men will die in his place. By starvation. In the bunker."\n\nHe begins to walk the rows. You are a priest — Father Maximilian Kolbe — standing among your fellow prisoners. Around you, men lower their eyes, trembling. Fritsch stops. Points. One by one, ten numbers are called.\n\nAmong them: a man named Franciszek Gajowniczek. He cries out — "My wife. My children."`,
      fr: `Le soleil d'été brûle sur la place de l'appel. Un sifflet déchire l'air. Le commandant Fritsch s'avance — un prisonnier du Bloc 14 s'est échappé. Sa voix est froide comme le fer :\n\n« Dix hommes mourront à sa place. Par la famine. Dans le bunker. »\n\nIl commence à parcourir les rangs. Vous êtes un prêtre — le Père Maximilien Kolbe — debout parmi vos compagnons de détention. Autour de vous, des hommes baissent les yeux, tremblants. Fritsch s'arrête. Il pointe du doigt. Un à un, dix numéros sont appelés.\n\nParmi eux : un homme nommé Franciszek Gajowniczek. Il crie — « Ma femme. Mes enfants. »`,
    },
    prompt: { en: 'The condemned man weeps for his family. What do you do?',
              fr: 'L\'homme condamné pleure pour sa famille. Que faites-vous ?' },
    choices: [
      { id: 'stay_silent', icon: '🤐', correct: false,
        label:    { en: 'Stay silent. Drawing attention is dangerous.',
                    fr: 'Rester silencieux. Attirer l\'attention est dangereux.' },
        feedback: { en: 'Silence protects you — but leaves Gajowniczek to die. Kolbe did not act out of self-preservation. He chose to see the man before the risk. Try again.',
                    fr: 'Le silence vous protège — mais laisse Gajowniczek mourir. Kolbe n\'a pas agi par instinct de survie. Il a choisi de voir l\'homme avant le risque. Réessayez.' } },
      { id: 'pray_alone', icon: '🙏', correct: false,
        label:    { en: 'Bow your head and pray quietly for the condemned.',
                    fr: 'Baisser la tête et prier silencieusement pour les condamnés.' },
        feedback: { en: 'Prayer is never wrong — but Kolbe\'s prayer moved him to action, not inward retreat. Faith without works is incomplete. Try again.',
                    fr: 'La prière n\'est jamais mauvaise — mais la prière de Kolbe l\'a poussé à agir, non à se replier sur lui-même. La foi sans les œuvres est incomplète. Réessayez.' } },
      { id: 'speak', icon: '✋', correct: true, nextNode: 'node_2',
        label:    { en: 'Step out of line and ask to speak to the Commandant.',
                    fr: 'Sortir des rangs et demander à parler au commandant.' },
        feedback: '' },
    ],
    correctReflection: {
      en: 'Kolbe stepped out of line — an act that could have cost him his life on the spot. He chose to see a man, not a risk. That courage was the first act of his sacrifice.',
      fr: 'Kolbe sortit des rangs — un acte qui aurait pu lui coûter la vie sur le champ. Il choisit de voir un homme, non un risque. Ce courage fut le premier acte de son sacrifice.',
    },
  },
  node_2: {
    id: 'node_2',
    scene:    { en: 'BEFORE THE COMMANDANT', fr: 'DEVANT LE COMMANDANT' },
    sceneIcon: '⚔',
    passage: {
      en: `Fritsch turns. His eyes narrow at the prisoner who has broken formation — an extraordinary act. Guards raise their rifles.\n\n"What does this Polish pig want?"\n\nFather Kolbe removes his cap and meets the Commandant's gaze without flinching. Every second of silence feels like a year.`,
      fr: `Fritsch se retourne. Ses yeux se plissent sur le prisonnier qui a rompu les rangs — un acte extraordinaire. Les gardes lèvent leurs fusils.\n\n« Que veut ce cochon polonais ? »\n\nLe Père Kolbe retire sa casquette et affronte le regard du commandant sans ciller. Chaque seconde de silence semble durer une année.`,
    },
    prompt: { en: 'You are standing before the Commandant. What do you say?',
              fr: 'Vous vous trouvez devant le commandant. Que dites-vous ?' },
    choices: [
      { id: 'beg_mercy', icon: '🕊', correct: false,
        label:    { en: '"Please — have mercy on all ten. They have done nothing."',
                    fr: '« Je vous en supplie — ayez pitié des dix. Ils n\'ont rien fait. »' },
        feedback: { en: 'A plea for all ten is noble, but Fritsch needs a reason to deviate from his order. Kolbe offered something more specific: a substitution. Try again.',
                    fr: 'Un appel à la pitié pour les dix est noble, mais Fritsch a besoin d\'une raison de dévier de son ordre. Kolbe a offert quelque chose de plus précis : une substitution. Réessayez.' } },
      { id: 'step_forward', icon: '✝', correct: true, nextNode: 'node_3',
        label:    { en: '"I am a Catholic priest. I wish to take the place of this man — he has a wife and children."',
                    fr: '« Je suis un prêtre catholique. Je souhaite prendre la place de cet homme — il a une femme et des enfants. »' },
        feedback: '' },
      { id: 'denounce', icon: '✊', correct: false,
        label:    { en: 'Denounce the punishment as unjust and demand the escaped prisoner be found instead.',
                    fr: 'Dénoncer la punition comme injuste et exiger que le prisonnier évadé soit retrouvé à sa place.' },
        feedback: { en: 'Righteous anger at injustice is understandable — but confrontation without an offering changes nothing and risks more lives. Kolbe\'s genius was to give the Commandant a way out. Try again.',
                    fr: 'La juste colère face à l\'injustice est compréhensible — mais la confrontation sans offre ne change rien et risque de coûter davantage de vies. Réessayez.' } },
    ],
    correctReflection: {
      en: 'Fritsch was speechless. No prisoner had ever done this. Kolbe offered himself calmly, clearly, and without hatred. He gave the Commandant a choice — and Fritsch took it.',
      fr: 'Fritsch fut stupéfait. Aucun prisonnier n\'avait jamais fait cela. Kolbe s\'offrit calmement, clairement, sans haine. Il donna au commandant un choix — et Fritsch l\'accepta.',
    },
  },
  node_3: {
    id: 'node_3',
    scene:    { en: 'STARVATION BUNKER — CELL 18', fr: 'BUNKER D\'AFFAMEMENT — CELLULE 18' },
    sceneIcon: '🕯',
    passage: {
      en: `Fritsch pauses. Something passes across his face — surprise, or perhaps the smallest trace of human discomfort. He waves his hand.\n\n"Accepted."\n\nGajowniczek steps back, weeping. Father Kolbe takes his place in the column of ten. They are marched to the basement bunker — Cell 18. The door closes. There is no food. No water. Only darkness.\n\nThe other nine men begin to despair. The days stretch out. From elsewhere in the prison, guards report something they cannot explain: instead of the screaming and begging they expect, they hear singing.`,
      fr: `Fritsch marque une pause. Quelque chose passe sur son visage — de la surprise, ou peut-être la plus infime trace de malaise humain. Il fait un signe de la main.\n\n« Accepté. »\n\nGajowniczek recule, en pleurs. Le Père Kolbe prend sa place dans la colonne des dix. Ils sont conduits au bunker souterrain — Cellule 18. La porte se ferme. Pas de nourriture. Pas d'eau. Seulement l'obscurité.\n\nLes neuf autres hommes commencent à désespérer. Les jours s'étirent. D'autres endroits de la prison, les gardes signalent quelque chose qu'ils ne peuvent expliquer : au lieu des cris et des supplications qu'ils attendent, ils entendent du chant.`,
    },
    prompt: { en: 'Three weeks pass. Men are dying around you. How do you lead those final days?',
              fr: 'Trois semaines s\'écoulent. Des hommes meurent autour de vous. Comment menez-vous ces derniers jours ?' },
    choices: [
      { id: 'endure_alone', icon: '🧱', correct: false,
        label:    { en: 'Endure in silence. Your suffering is between you and God alone.',
                    fr: 'Endurer en silence. Votre souffrance est entre vous et Dieu seul.' },
        feedback: { en: 'Personal courage is real — but Kolbe turned his suffering outward. He did not just endure for himself. He became a source of strength for those dying beside him. Try again.',
                    fr: 'Le courage personnel est réel — mais Kolbe a tourné sa souffrance vers l\'extérieur. Il n\'a pas seulement enduré pour lui-même. Il est devenu une source de force pour ceux qui mouraient à côté de lui. Réessayez.' } },
      { id: 'despair', icon: '😔', correct: false,
        label:    { en: 'Weep for the life you have given up. The sacrifice feels too great.',
                    fr: 'Pleurer la vie que vous avez abandonnée. Le sacrifice semble trop lourd.' },
        feedback: { en: 'Honesty about suffering is human — but Kolbe\'s witness was precisely that he did not surrender to despair. His peace was what confounded the guards. Try again.',
                    fr: 'L\'honnêteté face à la souffrance est humaine — mais le témoignage de Kolbe était précisément qu\'il n\'a pas cédé au désespoir. Sa paix était ce qui déconcertait les gardes. Réessayez.' } },
      { id: 'pray_together', icon: '🎵', correct: true, nextNode: 'complete',
        label:    { en: 'Lead the others in prayer and hymns — turning the cell into a place of dignity.',
                    fr: 'Conduire les autres dans la prière et les cantiques — transformant la cellule en un lieu de dignité.' },
        feedback: '' },
    ],
    correctReflection: {
      en: 'The guards reported hearing prayers and hymns from Cell 18 for days. Kolbe turned a place of death into a place of worship. He died last, on 14 August 1941 — the eve of the Assumption of Mary.',
      fr: 'Les gardes rapportèrent avoir entendu des prières et des cantiques de la Cellule 18 pendant des jours. Kolbe transforma un lieu de mort en lieu de culte. Il mourut en dernier, le 14 août 1941 — la veille de l\'Assomption de Marie.',
    },
  },
};
const r5 = {
  currentNode:  'node_1',
  choicesMade:  [],        // [{ nodeId, choiceId }]
  solved:       false,
};

function setupRoom5Puzzle() {
  r5.currentNode = 'node_1';
  r5.choicesMade = [];
  r5.solved      = false;

  const zone = $('#puzzle-zone-5');
  zone.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'mk-header';
  header.innerHTML = `
    <div class="mk-header-row">
      <div class="mk-emblem" aria-hidden="true">
        <span class="mk-emblem-cross">✝</span>
        <span class="mk-emblem-star">✦</span>
      </div>
      <div>
        <p class="mk-directive-label">${t('r5directive')}</p>
        <p class="mk-directive-sub">${t('r5sub')}</p>
      </div>
    </div>
    <div class="mk-path-track" id="mk-path-track">
      ${Object.keys(KOLBE_NODES).map((id, i) => `
        <div class="mk-path-node" id="mk-path-${id}">
          <div class="mk-path-dot">${i + 1}</div>
          <span class="mk-path-label">${(state.lang === 'fr' ? ['L\'Annonce','L\'Offre','Le Bunker'] : ['The Announcement','The Offer','The Bunker'])[i]}</span>
        </div>
        ${i < Object.keys(KOLBE_NODES).length - 1 ? '<div class="mk-path-connector" id="mk-connector-' + i + '"></div>' : ''}
      `).join('')}
    </div>
  `;
  zone.appendChild(header);

  // Scene panel — where the narrative and choices render
  const scenePanel = document.createElement('div');
  scenePanel.className = 'mk-scene-panel';
  scenePanel.id = 'mk-scene-5';
  zone.appendChild(scenePanel);

  // Clue reveal
  const clueWrap = document.createElement('div');
  clueWrap.className = 'mk-clue-wrap';
  clueWrap.id = 'mk-clue-5';
  clueWrap.setAttribute('aria-hidden', 'true');
  clueWrap.innerHTML = `
    <p class="mk-clue-label">${t('r5clueLabel')}</p>
    <div class="mk-clue-word" id="mk-clue-letters-5"></div>
    <p class="mk-clue-sub">${t('r5clueSub')}</p>
  `;
  zone.appendChild(clueWrap);

  // Render the first node
  renderKolbeNode('node_1');
}

/** Renders a single story node into the scene panel. */
function renderKolbeNode(nodeId) {
  const node = KOLBE_NODES[nodeId];
  if (!node) return;

  r5.currentNode = nodeId;

  // Update path track
  Object.keys(KOLBE_NODES).forEach((id, i) => {
    const dot = $(`#mk-path-${id}`);
    if (!dot) return;
    dot.classList.remove('mk-path-active', 'mk-path-done');
    const choiceMade = r5.choicesMade.find(c => c.nodeId === id);
    if (choiceMade)      dot.classList.add('mk-path-done');
    else if (id === nodeId) dot.classList.add('mk-path-active');
  });
  // Connectors
  for (let i = 0; i < Object.keys(KOLBE_NODES).length - 1; i++) {
    const conn = $(`#mk-connector-${i}`);
    if (conn) conn.classList.toggle('mk-connector-done', i < r5.choicesMade.length);
  }

  const panel = $('#mk-scene-5');
  if (!panel) return;

  // Build scene HTML
  const sceneEl = document.createElement('div');
  sceneEl.className = 'mk-node mk-node-enter';

  sceneEl.innerHTML = `
    <div class="mk-scene-tag">
      <span class="mk-scene-icon">${node.sceneIcon}</span>
      <span class="mk-scene-label">${node.scene[state.lang]}</span>
    </div>
    <div class="mk-passage" id="mk-passage-${nodeId}"></div>
    <div class="mk-prompt">${node.prompt[state.lang]}</div>
    <div class="mk-choices" id="mk-choices-${nodeId}"></div>
  `;

  panel.innerHTML = '';
  panel.appendChild(sceneEl);

  // Type the passage text for atmosphere
  typeKolbePassage(`mk-passage-${nodeId}`, node.passage[state.lang], () => {
    // Render choices after typing completes
    const choicesEl = $(`#mk-choices-${nodeId}`);
    if (!choicesEl) return;
    // Safety net: clear any buttons from a stale previous render
    choicesEl.innerHTML = '';

    node.choices.forEach((choice, i) => {
      const btn = document.createElement('div');
      btn.className = 'mk-choice';
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.style.animationDelay = `${i * 120}ms`;
      btn.innerHTML = `
        <span class="mk-choice-icon">${choice.icon}</span>
        <span class="mk-choice-text">${choice.label[state.lang]}</span>
        <span class="mk-choice-arrow">›</span>
      `;
      btn.addEventListener('click',   () => handleKolbeChoice(nodeId, choice));
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleKolbeChoice(nodeId, choice); }
      });
      choicesEl.appendChild(btn);
      // Stagger entrance
      requestAnimationFrame(() => btn.classList.add('mk-choice-visible'));
    });
  });
}

/** Cancellation token — incremented each time a new node renders, invalidating any in-flight typing. */
let kolbeTypingGeneration = 0;

/**
 * Types passage text character-by-character into a target element.
 * Uses a generation counter to cancel stale callbacks from previous renders.
 */
function typeKolbePassage(targetId, text, done) {
  // Advance the generation — any in-flight typing from a previous call is now stale
  const myGeneration = ++kolbeTypingGeneration;

  const el = $(`#${targetId}`);
  if (!el) { if (done) done(); return; }
  el.textContent = '';

  const paragraphs = text.split('\n\n');
  let pIndex    = 0;
  let charIndex = 0;
  let currentP  = null;

  function nextParagraph() {
    if (myGeneration !== kolbeTypingGeneration) return; // stale — abort
    if (pIndex >= paragraphs.length) { if (done) done(); return; }
    currentP = document.createElement('p');
    currentP.className = 'mk-para';
    el.appendChild(currentP);
    charIndex = 0;
    typeChar();
  }

  function typeChar() {
    if (myGeneration !== kolbeTypingGeneration) return; // stale — abort
    const para = paragraphs[pIndex];
    if (charIndex < para.length) {
      currentP.textContent += para[charIndex];
      charIndex++;
      setTimeout(typeChar, 12);
    } else {
      pIndex++;
      setTimeout(nextParagraph, 120);
    }
  }

  nextParagraph();
}

/** Processes a choice click. */
function handleKolbeChoice(nodeId, choice) {
  if (r5.solved) return;

  // Disable all choice buttons while processing
  const choicesEl = $(`#mk-choices-${nodeId}`);
  if (choicesEl) choicesEl.querySelectorAll('.mk-choice').forEach(b => b.style.pointerEvents = 'none');

  if (choice.correct) {
    handleKolbeCorrect(nodeId, choice);
  } else {
    handleKolbeWrong(nodeId, choice);
  }
}

/** Handles a wrong choice — show reflection, then re-enable. */
function handleKolbeWrong(nodeId, choice) {
  const panel = $('#mk-scene-5');

  // Append reflection card below choices
  const reflection = document.createElement('div');
  reflection.className = 'mk-reflection mk-reflection-wrong';
  reflection.innerHTML = `
    <span class="mk-reflection-icon">✗</span>
    <div>
      <p class="mk-reflection-title">${t('kolbeMoralReflect')}</p>
      <p class="mk-reflection-text">${choice.feedback[state.lang]}</p>
    </div>
  `;

  const choicesEl = $(`#mk-choices-${nodeId}`);
  if (choicesEl) {
    // Highlight the wrong button
    choicesEl.querySelectorAll('.mk-choice').forEach(b => {
      if (b.querySelector('.mk-choice-text').textContent === choice.label[state.lang]) {
        b.classList.add('mk-choice-wrong');
      }
    });
    choicesEl.after(reflection);
  }

  showFeedback(5, 'error', t('kolbeWrong'));
  applyTimePenalty(60, 5);

  // Re-enable after delay
  setTimeout(() => {
    if (choicesEl) {
      choicesEl.querySelectorAll('.mk-choice').forEach(b => {
        b.style.pointerEvents = '';
        b.classList.remove('mk-choice-wrong');
      });
    }
    // Remove reflection card smoothly
    reflection.classList.add('mk-reflection-fade');
    setTimeout(() => reflection.remove(), 500);
  }, 3000);
}

/** Handles a correct choice — animate, mark path, advance. */
function handleKolbeCorrect(nodeId, choice) {
  r5.choicesMade.push({ nodeId, choiceId: choice.id });

  const choicesEl = $(`#mk-choices-${nodeId}`);
  if (choicesEl) {
    choicesEl.querySelectorAll('.mk-choice').forEach(b => {
      if (b.querySelector('.mk-choice-text').textContent === choice.label[state.lang]) {
        b.classList.add('mk-choice-correct');
      }
    });
  }

  // Show positive reflection
  const reflection = document.createElement('div');
  reflection.className = 'mk-reflection mk-reflection-correct';
  reflection.innerHTML = `
    <span class="mk-reflection-icon">✓</span>
    <div>
      <p class="mk-reflection-title">${t('kolbePath')}</p>
      <p class="mk-reflection-text">${getKolbeCorrectReflection(nodeId)}</p>
    </div>
  `;
  if (choicesEl) choicesEl.after(reflection);

  const pathDot = $(`#mk-path-${nodeId}`);
  if (pathDot) { pathDot.classList.remove('mk-path-active'); pathDot.classList.add('mk-path-done'); }

  showFeedback(5, 'success', t('kolbeCorrected'));

  setTimeout(() => {
    if (choice.nextNode === 'complete') {
      triggerRoom5Success();
    } else {
      renderKolbeNode(choice.nextNode);
    }
  }, 2200);
}

/** Returns a brief positive reflection for each correct node. */
function getKolbeCorrectReflection(nodeId) {
  return KOLBE_NODES[nodeId]?.correctReflection?.[state.lang] || '';
}

/** Full success sequence. */
function triggerRoom5Success() {
  r5.solved = true;

  // Glow the path track
  const track = $('#mk-path-track');
  if (track) track.classList.add('mk-track-solved');

  // Glow the emblem
  const emblem = $('.mk-emblem');
  if (emblem) emblem.classList.add('mk-emblem-glow');

  // Append a final testimony card
  const panel = $('#mk-scene-5');
  if (panel) {
    const testimony = document.createElement('div');
    testimony.className = 'mk-testimony';
    if (state.lang === 'fr') {
      testimony.innerHTML = `
        <div class="mk-testimony-cross" aria-hidden="true">✝</div>
        <p class="mk-testimony-title">PÈRE MAXIMILIEN KOLBE</p>
        <p class="mk-testimony-dates">8 janvier 1894 — 14 août 1941</p>
        <p class="mk-testimony-text">
          Kolbe survécut trois semaines sans nourriture ni eau — plus longtemps que tout autre prisonnier de la Cellule 18.
          Le 14 août, la veille de la Fête de l'Assomption, il fut exécuté par injection létale.
          Il offrit son bras au gardien sans un mot.
        </p>
        <p class="mk-testimony-text">
          Il fut canonisé par le pape Jean-Paul II en 1982. Gajowniczek, l'homme dont il prit la place,
          vécut jusqu'en 1995 — et passa le reste de sa vie à raconter au monde ce qui s'était passé à Auschwitz ce juillet-là.
        </p>
        <p class="mk-testimony-quote">« Il n'y a pas de plus grand amour que de donner sa vie pour ses amis. » — Jean 15:13</p>
      `;
    } else {
      testimony.innerHTML = `
        <div class="mk-testimony-cross" aria-hidden="true">✝</div>
        <p class="mk-testimony-title">FATHER MAXIMILIAN KOLBE</p>
        <p class="mk-testimony-dates">8 January 1894 — 14 August 1941</p>
        <p class="mk-testimony-text">
          Kolbe survived three weeks without food or water — longer than any other prisoner in Cell 18.
          On 14 August, the eve of the Feast of the Assumption, he was executed by lethal injection.
          He offered his arm to the guard without a word.
        </p>
        <p class="mk-testimony-text">
          He was canonised by Pope John Paul II in 1982. Gajowniczek, the man whose place he took,
          lived until 1995 — and spent the rest of his life telling the world what happened in Auschwitz that July.
        </p>
        <p class="mk-testimony-quote">"No one has greater love than this: to lay down one's life for one's friends." — John 15:13</p>
      `;
    }
    panel.appendChild(testimony);
  }

  // Reveal clue word (SACRIFICE / SACRIFICE — same in both languages)
  setTimeout(() => {
    const wrap = $('#mk-clue-5');
    if (!wrap) return;
    wrap.removeAttribute('aria-hidden');
    wrap.classList.add('visible');
    const lettersEl = $('#mk-clue-letters-5');
    if (!lettersEl) return;
    lettersEl.innerHTML = '';
    const word = ROOMS[5].clueWord[state.lang];
    [...word].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'mk-clue-letter';
      span.textContent = ch;
      span.style.animationDelay = `${400 + i * 140}ms`;
      lettersEl.appendChild(span);
    });
  }, 600);

  showFeedback(5, 'success', t('r5success'));
  setTimeout(() => completeRoom(5), 1000);
}

function resetRoom5Puzzle() {
  kolbeTypingGeneration = 0;
  r5.currentNode = 'node_1';
  r5.choicesMade = [];
  r5.solved      = false;
  setupRoom5Puzzle();
}

// ═══════════════════════════════════════════════════════════════════
// ROOM 6 — FINAL VAULT: ST. IGNATIUS OF LOYOLA
// Puzzle zone DOM ID: #puzzle-zone-6
// Complete with: completeRoom(6)  ← triggers victory sequence
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// ROOM 6 — FINAL VAULT: ST. IGNATIUS OF LOYOLA
// PUZZLE: Multi-phase vault unlock sequence.
//
// Phase 1 — Clue Assembly: Six recovered clue words (one per saint
//   room) are displayed one-by-one in an animated reveal sequence.
//   Each word "slots" into a cipher panel as it appears.
//
// Phase 2 — The Question: A final challenge asks students to identify
//   the saint connected to spiritual discipline, education, and the
//   Spiritual Exercises. A text input accepts:
//     IGNATIUS / ST IGNATIUS / IGNATIUS OF LOYOLA
//   (all normalised — case-insensitive, punctuation-tolerant)
//
// Phase 3 — Vault Unlock: Animated archive-door sequence, then
//   completeRoom(6) → triggerVictory()
// ═══════════════════════════════════════════════════════════════════

/** The six clue words in order, one per saint room. */
const VAULT_CLUES = [
  { word: { en: 'KEY',       fr: 'CLÉ' },       saint: { en: 'St. Peter',           fr: 'St. Pierre' },           icon: '🗝️' },
  { word: { en: 'LIGHT',     fr: 'LUMIÈRE' },   saint: { en: 'St. Bernard',         fr: 'St. Bernard' },          icon: '📜' },
  { word: { en: 'POVERTY',   fr: 'PAUVRETÉ' }, saint: { en: 'St. Francis',         fr: 'St. François' },         icon: '🕊️' },
  { word: { en: 'TRUTH',     fr: 'VÉRITÉ' },    saint: { en: 'St. Anthony',         fr: 'St. Antoine' },          icon: '📖' },
  { word: { en: 'EUCHARIST', fr: 'EUCHARISTIE'},saint: { en: 'Pope Pius X',         fr: 'Pape Pie X' },           icon: '✝️' },
  { word: { en: 'SACRIFICE', fr: 'SACRIFICE' }, saint: { en: 'St. Maximilian Kolbe',fr: 'St. Maximilien Kolbe' }, icon: '⭐' },
];

const VAULT_ANSWERS = {
  en: ['ignatius','stignatius','ignatiusofloyola','saintignatius','saintignatiusofloyola','ignatiusloyola'],
  fr: ['ignace','saintignace','ignacedeloyola','saintignacedeloyola','ignacedloyola','ignacedeloyola'],
};

/** Module-level state for Room 6. */
const r6 = {
  phase:        1,    // 1 = clue assembly, 2 = question, 3 = unlocking
  cluesRevealed: 0,
  attempts:     0,
  solved:       false,
};

function setupRoom6Puzzle() {
  r6.phase         = 1;
  r6.cluesRevealed = 0;
  r6.attempts      = 0;
  r6.solved        = false;

  const zone = $('#puzzle-zone-6');
  zone.innerHTML = '';

  // ── Vault header ──────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'ig-header';
  header.innerHTML = `
    <div class="ig-vault-banner" aria-hidden="true">
      <div class="ig-vault-seal">
        <span class="ig-seal-chi">✟</span>
        <span class="ig-seal-ring ig-ring-1"></span>
        <span class="ig-seal-ring ig-ring-2"></span>
        <span class="ig-seal-ring ig-ring-3"></span>
      </div>
      <div class="ig-vault-title-block">
        <p class="ig-vault-sublabel">ARCHIVUM SECRETUM VATICANUM</p>
        <h2 class="ig-vault-title">${state.lang === 'fr' ? 'COFFRE-FORT IGNATIEN' : 'IGNATIAN VAULT'}</h2>
        <p class="ig-vault-classification">${state.lang === 'fr' ? 'CLASSIFICATION : OMÉGA · ACCÈS NÉCESSITE LE CHIFFRE COMPLET' : 'CLASSIFICATION: OMEGA · ACCESS REQUIRES FULL CIPHER'}</p>
      </div>
      <div class="ig-vault-seal">
        <span class="ig-seal-chi">✟</span>
        <span class="ig-seal-ring ig-ring-1"></span>
        <span class="ig-seal-ring ig-ring-2"></span>
        <span class="ig-seal-ring ig-ring-3"></span>
      </div>
    </div>
    <p class="ig-directive-sub">${t('vaultSub')}</p>
  `;
  zone.appendChild(header);

  // ── Phase 1: Cipher assembly panel ───────────────────────────
  const assemblyPanel = document.createElement('div');
  assemblyPanel.className = 'ig-assembly';
  assemblyPanel.id = 'ig-assembly-6';

  const assemblyLabel = document.createElement('p');
  assemblyLabel.className = 'ig-assembly-label';
  assemblyLabel.textContent = t('vaultAssemblyLabel');
  assemblyPanel.appendChild(assemblyLabel);

  const cluesGrid = document.createElement('div');
  cluesGrid.className = 'ig-clues-grid';
  cluesGrid.id = 'ig-clues-grid-6';

  // Pre-render all 6 slots as empty placeholders
  VAULT_CLUES.forEach((clue, i) => {
    const slot = document.createElement('div');
    slot.className = 'ig-clue-slot ig-slot-empty';
    slot.id = `ig-slot-${i}`;
    slot.innerHTML = `
      <div class="ig-slot-icon">${clue.icon}</div>
      <div class="ig-slot-word" id="ig-slot-word-${i}">??????</div>
      <div class="ig-slot-saint">${clue.saint[state.lang]}</div>
    `;
    cluesGrid.appendChild(slot);
  });
  assemblyPanel.appendChild(cluesGrid);

  // Assembly progress bar
  const asmProgress = document.createElement('div');
  asmProgress.className = 'ig-asm-progress';
  asmProgress.innerHTML = `
    <div class="ig-asm-bar-wrap"><div class="ig-asm-bar" id="ig-asm-bar-6"></div></div>
    <span class="ig-asm-label" id="ig-asm-label-6">0 / 6 ${state.lang === 'fr' ? 'fragments récupérés' : 'fragments recovered'}</span>
  `;
  assemblyPanel.appendChild(asmProgress);

  // Begin assembly button
  const beginBtn = document.createElement('button');
  beginBtn.className = 'btn-submit ig-begin-btn';
  beginBtn.id = 'ig-begin-6';
  beginBtn.textContent = t('btnCompile');
  beginBtn.addEventListener('click', startVaultAssembly);
  assemblyPanel.appendChild(beginBtn);

  zone.appendChild(assemblyPanel);

  // ── Phase 2: Final question panel — visible but opacity 0 until assembly completes ──
  const questionPanel = document.createElement('div');
  questionPanel.className = 'ig-question-panel ig-question-waiting';
  questionPanel.id = 'ig-question-6';
  questionPanel.setAttribute('aria-hidden', 'true');
  questionPanel.innerHTML = `
    <div class="ig-question-header">
      <div class="ig-question-icon" aria-hidden="true">⛪</div>
      <div>
        <p class="ig-question-label">${t('vaultAuthRequired')}</p>
        <p class="ig-question-text">${t('vaultAuthSub')}</p>
      </div>
    </div>

    <div class="ig-question-body">
      <div class="ig-question-card">
        <p class="ig-question-q">${t('vaultQ')}</p>
        <p class="ig-question-prompt">${t('vaultPrompt')}</p>
      </div>

      <div class="ig-input-row">
        <input
          type="text"
          class="puzzle-input ig-answer-input"
          id="ig-answer-6"
          placeholder="${t('vaultPlaceholder')}"
          autocomplete="off"
          spellcheck="false"
          aria-label="${t('vaultPrompt')}"
        />
        <button class="btn-submit ig-submit-btn" id="ig-submit-6">${t('btnAuthenticate')}</button>
      </div>
      <span class="ig-attempt-label" id="ig-attempts-6"></span>
    </div>
  `;
  zone.appendChild(questionPanel);

  // ── Phase 3: Vault door animation (hidden initially) ──────────
  const vaultDoor = document.createElement('div');
  vaultDoor.className = 'ig-vault-door';
  vaultDoor.id = 'ig-vault-door-6';
  vaultDoor.setAttribute('aria-hidden', 'true');
  vaultDoor.innerHTML = `
    <div class="ig-door-panel ig-door-left" id="ig-door-left">
      <div class="ig-door-lines"></div>
      <div class="ig-door-handle ig-handle-left">◄</div>
    </div>
    <div class="ig-door-panel ig-door-right" id="ig-door-right">
      <div class="ig-door-lines"></div>
      <div class="ig-door-handle ig-handle-right">►</div>
    </div>
    <div class="ig-door-interior" id="ig-door-interior">
      <div class="ig-interior-glow"></div>
      <span class="ig-interior-cross">✟</span>
      <p class="ig-interior-text">${t('vaultOpen')}</p>
    </div>
  `;
  zone.appendChild(vaultDoor);

  // Wire input
  const input  = $('#ig-answer-6');
  const submit = $('#ig-submit-6');
  if (input)  input.addEventListener('keydown', e => { if (e.key === 'Enter') checkVaultAnswer(); });
  if (submit) submit.addEventListener('click', checkVaultAnswer);
}

/** Animates clue slots revealing one-by-one. */
function startVaultAssembly() {
  const beginBtn = $('#ig-begin-6');
  if (beginBtn) { beginBtn.disabled = true; beginBtn.textContent = 'COMPILING…'; }

  revealNextClue();
}

function revealNextClue() {
  const i = r6.cluesRevealed;
  if (i >= VAULT_CLUES.length) {
    // All revealed — transition to phase 2 after brief pause
    setTimeout(transitionToVaultQuestion, 900);
    return;
  }

  const slot    = $(`#ig-slot-${i}`);
  const wordEl  = $(`#ig-slot-word-${i}`);
  const clue    = VAULT_CLUES[i];

  if (slot)   slot.classList.add('ig-slot-revealing');

  // Scramble effect then reveal
  if (wordEl) {
    let ticks = 0;
    const scrambleChars = '✦⚡∿⚠☩✟◆✚▲◉';
    const scramble = setInterval(() => {
      ticks++;
      wordEl.textContent = clue.word[state.lang].split('').map(() =>
        scrambleChars[Math.floor(Math.random() * scrambleChars.length)]
      ).join('');
      if (ticks >= 8) {
        clearInterval(scramble);
        wordEl.textContent = clue.word[state.lang];
        if (slot) {
          slot.classList.remove('ig-slot-revealing');
          slot.classList.add('ig-slot-revealed');
        }
        r6.cluesRevealed++;

        // Update progress
        const bar   = $('#ig-asm-bar-6');
        const label = $('#ig-asm-label-6');
        if (bar)   bar.style.width = `${Math.round((r6.cluesRevealed / VAULT_CLUES.length) * 100)}%`;
        if (label) label.textContent = `${r6.cluesRevealed} / ${VAULT_CLUES.length} ${state.lang === 'fr' ? 'fragments récupérés' : 'fragments recovered'}`;

        // Reveal next after delay
        setTimeout(revealNextClue, 500);
      }
    }, 80);
  }
}

/** After all clues reveal, transition assembly to collapsed state and reveal question. */
function transitionToVaultQuestion() {
  const assembly = $('#ig-assembly-6');
  const question = $('#ig-question-6');

  // Collapse the assembly panel (keep it visible but minimised)
  if (assembly) assembly.classList.add('ig-assembly-done');

  // Reveal the question panel below (it's already in DOM, just opacity 0)
  setTimeout(() => {
    if (question) {
      question.removeAttribute('aria-hidden');
      question.classList.remove('ig-question-waiting');
      question.classList.add('ig-panel-enter');
    }
    setTimeout(() => {
      const input = $('#ig-answer-6');
      if (input) input.focus();
    }, 500);
  }, 400);

  r6.phase = 2;
}

/** Validates the student's answer against accepted forms of Ignatius. */
function checkVaultAnswer() {
  if (r6.solved) return;

  const input = $('#ig-answer-6');
  if (!input) return;

  const raw        = input.value;
  const normalised = normalizeAnswer(raw);

  if (!normalised) {
    shakeInput(input);
    showFeedback(6, 'error', t('vaultNoEntry'));
    return;
  }

  r6.attempts++;
  const attemptsEl = $('#ig-attempts-6');
  if (attemptsEl) attemptsEl.textContent = `${state.lang === 'fr' ? 'Tentative' : 'Attempt'} ${r6.attempts}`;

  if (VAULT_ANSWERS[state.lang].includes(normalised)) {
    r6.solved = true;
    input.disabled = true;
    const submitBtn = $('#ig-submit-6');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('btnAuthenticate') + ' ✓'; submitBtn.classList.add('btn-submit-done'); }

    showFeedback(6, 'success', t('vaultSuccess'));
    setTimeout(triggerVaultDoorSequence, 800);

  } else {
    shakeInput(input);
    applyTimePenalty(60, 6);
    const clues = [t('vaultWrong1'), t('vaultWrong2'), t('vaultWrong3')];
    showFeedback(6, 'error', clues[Math.min(r6.attempts - 1, clues.length - 1)]);
    input.select();
  }
}

/** The vault door open animation, then final completion. */
function triggerVaultDoorSequence() {
  r6.phase = 3;

  // Hide question panel
  const question = $('#ig-question-6');
  if (question) { question.classList.add('ig-panel-exit'); setTimeout(() => { question.style.display = 'none'; }, 500); }

  // Show vault door
  setTimeout(() => {
    const door = $('#ig-vault-door-6');
    if (door) {
      door.removeAttribute('aria-hidden');
      door.classList.add('ig-door-visible');
    }

    // Sequence: lights flicker → locks disengage → doors open → interior glow
    setTimeout(() => {
      const doorEl = $('#ig-vault-door-6');
      if (doorEl) doorEl.classList.add('ig-door-unlocking');
    }, 600);

    setTimeout(() => {
      const left  = $('#ig-door-left');
      const right = $('#ig-door-right');
      const int   = $('#ig-door-interior');
      if (left)  left.classList.add('ig-door-open-left');
      if (right) right.classList.add('ig-door-open-right');
      setTimeout(() => { if (int) int.classList.add('ig-interior-glow-active'); }, 400);
    }, 1800);

    // Fire completeRoom after door animation settles
    setTimeout(() => {
      completeRoom(6);
    }, 3400);

  }, 600);
}

function resetRoom6Puzzle() {
  r6.phase         = 1;
  r6.cluesRevealed = 0;
  r6.attempts      = 0;
  r6.solved        = false;
  setupRoom6Puzzle();
}

// ─────────────────────────────────────────────────────────────────────
// HELPER UTILITIES (available to all puzzle functions)
// ─────────────────────────────────────────────────────────────────────

/**
 * normalizeAnswer(str) — strip whitespace, lowercase, remove punctuation.
 * Useful for flexible answer matching.
 */
function normalizeAnswer(str) {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * shuffleArray(arr) — Fisher-Yates in-place shuffle.
 * Useful for randomising puzzle elements.
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * buildMultipleChoice(containerId, options, correctIndex, roomIndex)
 * A convenience builder for multiple-choice puzzles.
 * options: array of strings.
 * correctIndex: which option index is correct.
 */
function buildMultipleChoice(containerId, options, correctIndex, roomIndex) {
  const container = $(`#${containerId}`);
  if (!container) return;
  options.forEach((text, i) => {
    const btn = document.createElement('div');
    btn.className = 'puzzle-option';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      if (state.roomsComplete.includes(roomIndex)) return;
      if (i === correctIndex) {
        btn.classList.add('correct');
        completeRoom(roomIndex);
      } else {
        btn.classList.add('wrong');
        showFeedback(roomIndex, 'error', '✗ Incorrect selection. Try again.');
        setTimeout(() => btn.classList.remove('wrong'), 800);
      }
    });
    btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') btn.click(); });
    container.appendChild(btn);
  });
}
