# The Stone at the Bottom of the Sea (v3): treatment and style bible

His take: "version 3 - 4min47s" (2026-10-02): "I love the dynamics and the emotional spoken sections". The film is
5:31 with Coprime's prologue and bells. Everything is drawn in code (his call, 2026-10-02: "All Code Rai and visual
composition"). The engine is forked from pdoom-video (Giacomo Magnanini, MIT). Its treatment is the model for this
document's shape: an idea, a style bible, motifs, then one plate per section.

## The idea in one paragraph

Rai is a rai stone who sank on her voyage from Palau and has sat on the seabed for generations. She is still the
richest rock on the island, because everyone agrees she is down there. She tells the film, and she is its only face.
Everything else is told through things and interfaces:
- the raft and the storm;
- the island's memory;
- the trader's steamship;
- modern money's machines;
- **the Ledger**: the national accounts as a glowing board, where a night with a feverish child is a zero.

Running through it is **the ring**. A zero in the ledger is a ring around nothing, and so is a rai stone. The ring
becomes the stone, the hole in her heart, a wedding ring, the pole's socket, and the gold harmonograph she wears.

The film goes down (the prologue sinks her), stays down while the world is explained, and comes up. In the breakdown
every shoulder lifts her, and the final chorus is at dawn on the shore. It ends where Yap still uses the stones: at a
wedding.

## Tone

- Warm and witty, challenging without preaching. The challenge comes from Rai's grin and the Ledger's blink.
- Dynamic like "We've Found Other Agents": a hard cut about every 2 beats in the rapped verses, big changes on
  downbeats, hits on kicks and snares, strong eases (out-expo, back-out slams), holds then snaps.
- The spoken sections (the intro, the bedtime story, the outro) slow everything down: long holds, no cuts, the
  serif voice.
- Rai is never shown hurt (Evil Plan's rule). At most she is sincere: the **soft** face.
- People appear in silhouette or as warm shapes without faces. Rai is the only face. The history (the quarry, the
  voyage, the carrying) is in silhouette against sky and sea, with no costume detail we cannot vouch for.
- Originality: our own designs throughout. No logos or product UIs. Real money appears only as generic forms (a
  press, a transfer, a mining rack).

## Palette ("We've Found Other Agents", measured 2026-10-02; his: "particularly amazing")

| Token | Hex | Use |
|---|---|---|
| ink | `#120d1d` | ground (about half of every frame) |
| deep | `#2f1c59` | panels, the sea's depth |
| pink | `#ff4f9a` | care, the zero, the sung word in tender sections |
| yellow | `#ffd23f` | the sung word (default), sunbursts |
| lime | `#78d63a` | paid money in the Ledger (£ rows) |
| orange | `#ff8a2a` | the island at sunset, fire, the quarry |
| violet | `#c65cf0` | night, the bedtime story |
| coral | `#ff5a5f` | the starfish, warnings |
| periwinkle | `#6f8cff` | the sea, the steamship's iron |
| cyan | `#2fe0ff` | Rai's glow, light from the surface |
| limestone | `#d9cfb8` | Rai and every stone |
| gold | `#f6c453` | the harmonograph, value, the final dawn |

- Neon blooms. Limestone and type stay crisp.
- Each chorus owns one sunburst: cyan (1), pink (2), lime and yellow (3), every colour at once (final).

## Typography

- **Archivo** (heavy and wide) for the hooks and slams.
- **Archivo** (bold) for the karaoke line in the rapped verses, centred low as in "Other Agents".
- **IBM Plex Mono** is the Ledger's and the machines' voice.
- **Cormorant Garamond** italic for the spoken sections only: the intro, the bedtime story, the outro.
- No outlined or haloed type. Typographic punctuation.

## Karaoke rules (pdoom-video's)

- Every lyric line is readable and synced per word. A word appears or highlights at its aligned start and completes
  by its end. Anticipation is allowed: the line shows dim up to 0.4 s early. The highlight never runs ahead of the
  voice.
- Each plate puts the lyric into the picture its own way: slammed, typed into the Ledger, written in bubbles, carved
  in the stone, said in Cormorant.

## Motifs

1. **Rai** (`Rai` in `motifs.ts`):
   - seven faces: smile, wink, grin, wow, soft, fierce, asleep;
   - black sea-hair, barnacles, a starfish clip, a gold harmonograph pendant;
   - her heart-hole glows when someone is cared for;
   - the faces follow the words: grin (hello, verse 1), wink (the twist, "I won't call money a fraud"), soft (the
     woman up the road, the bedtime story), fierce (the final chorus), asleep (the story's last line).
2. **The ring**: the zero, the stone, the hole, the wedding ring, the harmonograph. Particle morphs carry it between
   plates.
3. **The Ledger**: a mono board of rows.
   - Paid work ticks up in lime with a £.
   - Care stays at 0 in pink, and blinks.
   - It returns in verse 2 (the woman), the second pre-chorus (marry the housekeeper: the row drops to 0) and verse 3
     (the rider £14.50, the dad's bowl 0).
   - In verse 4 the care rows light up as Rai names them: no £, a glow.
4. **The pole and the shoulders**: one pole through her heart. The shoulders join on the beat in the breakdown:
   "nobody carries me alone".
5. **The harmonograph** (Coprime's 3:2): glows behind the choruses ("three against two, the shoulders keeping
   time"), is Rai's pendant, and is drawn by the bells at the end.
6. **Rhythm becomes harmony** (the prologue's sound): three rings pulse at 4:5:6 and quicken until the pulses fuse
   into a chord, and into the harmonograph.

## v3's shape (measured, tools/dynamics.py; times in the master)

```
short-term loudness, 2 s per mark (-34 to -8 LUFS):
   ▁▂▄▅▅▅▄▃▂▂▂ ▁▂▃▄▄▄▄▄▄▄▅▅▅▅▅▄▄▄▄▅▅▅▆▅▅▅▅▄▄▄▄▄▄▄▅▅▅▅▅▅▅▅▅▅▅▅▅▆▆▆▆▆▅▄▄▃▃▃▃▃▂▃▃▃▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▅▆▆▆▆▆▆▅▄▄▄▅▅▅▅▅▅▅▅▄▄▃▃▃▄▅▅▅▅▅▅▅▅▅▅▅▅▅▅▆▆▆▆▆▆▆▆▆▆▆▆▄▃▃▂▂▂▃▃▄▅▅▄▄▄▄▄
```

The shape:
- **Two waves:** each verse builds to its chorus (−14.6, then −13.5 LUFS).
- **The bedtime story:** the valley at −21.8, darker (brightness 2.3 kHz). The heart.
- **Verse 3:** the longest and densest section (41 s, 5 onsets a second), into the loudest chorus yet (−12.6).
- **Bridge and breakdown:** a second valley. The breakdown is the darkest section of the song (1.8 kHz), and the
  lift starts there.
- **Final chorus:** the peak plateau (−11.9 max).
- **Close:** the spoken outro (−24.4), then the bells.
- **Key:** every chorus is B-flat minor. Suno did not make the asked-for key lift.

## Plates

Times are the sections' starts in the master (from `audio.json` once analysed). Scenes look lines up by content
through the `Lyrics` API and never hard-code times.

| Plate | Window | What plays | The picture |
|---|---|---|---|
| `voyage` | 0–12.8 | paddles 4:5:6 quickening into the tonic chord | Night sea, the raft and the stone in silhouette, paddlers. Three rings pulse 4:5:6 on the strokes and quicken until they fuse into the harmonograph on the chord. The title. |
| `sinking` | 12.8–29.9 | storm, thunder, the comma pump, under | Lightning, the raft tilts, the stone slides into black water. Follow her down through god rays, spiralling two laps as the pump sinks 43 cents, bubbles, then the dark seabed. |
| `hello` | intro (spoken) | "Hi. You can't see me…" | Dark. Two amber eyes open, her heart-hole glows: Rai. "HI." slams; the rest in Cormorant. |
| `verse1` | verse 1 | the quarry, the voyage, the storm, the twist, her deals, the richest rock | A pop-up storybook in silhouette (the cliff on Palau, the raft, the storm), kinetic type on every word. The twist: the village on the shore pointing at the sea. Her deals as icons (land, a feud settled, a wedding). RICHEST ROCK slams. Grin, wink. |
| `pre1` | pre-chorus 1 | "'Cause I was never really stone…" | Rai's outline breaks into particles of words. WORTH morphs into STORY. |
| `chorus1` | chorus 1 | the hook | Cyan sunburst, Rai on the seabed, the hook big. "Who else is waiting": other stones glow dim in the dark. |
| `trader` | verse 2, first half | the iron hull, stones in bulk, a fraction | A steamship in periwinkle silhouette, its deck stacked with identical discs (copy-pasted, too even). Price tags fall to a fraction. "Value's the crossing": the raft's route drawn on the sea, the risk, the hands. |
| `money` | verse 2, middle | print it, wire it, mine it in code | Money's machines in neon: a press, a transfer, mining racks. Fast cuts. "I won't call money a fraud": the wink. |
| `ledger` | verse 2, end | the woman awake at four; the ledger writes zero | A kitchen window at 4 am, the mother and child in silhouette. The Ledger board: lunchbox, fever, bill. It looks, blinks, and writes 0 in pink. Rai soft. |
| `pre2` | pre-chorus 2 | marry your housekeeper; the wrong kind of time | A ring closes and the row's £ drops to 0. A clock against a meter. |
| `chorus2` | chorus 2 | the hook | Pink sunburst. The mother's zero glows inside Rai's heart-hole. |
| `bedtime` | interlude (spoken) | the bedtime story | A child's room at night, stars at the window, a toy stone by the bed, two silhouettes. Rai small and glowing on the sill. The dialogue in Cormorant. On "Go to sleep" the light dims and Rai falls asleep. |
| `today` | verse 3 | the rider, the dad, the care home, the lifeboat, the midnight coder, the new ledger, money is memory | A fast montage of panels: the rider in the rain (£), the dad at the hob (0), the care home with music notes (0), the lifeboat in the storm (0), code after midnight (0). Then servers in a ring, a stone made of light. "Money is memory": the Ledger as a long scroll. "Who got left out of the room": dim rows. |
| `chorus3` | chorus 3 | the hook | Lime and yellow sunburst, bigger; the zeros start to glow. |
| `debate` | bridge | "some say…" ×5, "and every one of them is carrying the stone" | Five figures with five emblems (a calculator, a torn price tag, a house, a coin, a hammer), each lit as their line comes. The reveal: they hold one pole. |
| `lift` | breakdown | "one pole, every shoulder…" | Dark and building. The pole through her heart, shoulders joining on each beat, and Rai rising off the seabed towards the light. |
| `turn` | verse 4 | not here to torch the bank; a price is a promise; my offer; count a lullaby | Surfacing at dawn, Rai on the shore. The Ledger returns and its care rows light as she names them (a lullaby, a lifeboat crew, a lift to the doctor): a glow, not a £. |
| `finale` | final chorus | the anthem | Island dawn: a great ring of people holding hands around the stone, the other stones with glowing hearts, every neon at once, the harmonograph halo. Fierce. |
| `remember` | outro (spoken) | "On Yap they still bring the stones to weddings…" | Quiet: a wedding under palms in silhouette, the stone with flowers. A last wink. "So remember." in Cormorant. |
| `bells` | the bell outro | major-third bells over a drone | The gold harmonograph draws itself on the bells, then the title and the credits. |

## Credits (the end card)

- Words: Claude, from Knight Commander Gareth's brief.
- Voice and music: Suno.
- Prologue and bells: Coprime.
- Film: drawn in code; engine from pdoom-video by Giacomo Magnanini (MIT).

## Technical conventions

- The master is `takes/v3/audio.wav`; every time in `lyrics.json` and `audio.json` is master time.
- Determinism and the scene API are pdoom-video's (`docs/ENGINE.md` in their repo): a scene is a pure function of
  `f.t`, randomness is seeded, `frameIdx` is used for per-frame flicker.
- The final render is 3840×2160 at 60 fps (his ask), with adaptive motion blur.
