# The Stone at the Bottom of the Sea (v1): "WHAT'S IT WORTH?"

The take: "version 1 - 3min24s", the short script. The film is the Suno take alone, 3:24.4. His word: "go straight into
the music video", so there is no prologue, no title card and no bells. The style and direction are v3's
(`TREATMENT-v3.md`, `SCENE-GUIDE.md` "THE DIRECTION"). How this film differs from v2 is in `VARIANTS.md`.

## The idea in one paragraph

Rai hosts a glittering live variety show from the bottom of the sea, built inside a shipwreck: "WHAT'S IT WORTH?". The
studio has:
- a kelp curtain;
- a giant ring of bulbs behind the stage;
- an LED scoreboard;
- an audience of fish, crabs and other sunken things, who are all, in their way, "waiting";
- a crab on camera and an octopus floor manager with cue cards.

The show's segments tell the story:
- archive reels of her quarrying, voyage and sinking;
- a shopping channel for the deals she still makes;
- the Rich List;
- the audience vote;
- a pitch round for the trader;
- a quick-fire round for modern money;
- an outside broadcast "up the road" to a 4 am kitchen;
- the scoreboard giving the woman her score: 0;
- a dating segment for Pigou's housekeeper;
- a panel debate whose third guest smashes the scoreboard.

In the breakdown the audience comes down to carry the pole, twice: first the creatures, then the whole cast. The stage
elevator lifts the studio out of the sea onto Yap's beach at night for a fireworks finale, with the scoreboard rebuilt
to count in glows. The outro is the show's last segment, a beach wedding. Then the camera pulls back through a TV
screen into the woman's living room. She is asleep on the sofa with her child under one blanket, and the credits roll
on the TV.

## Why this take

v1 is the even, bouncing, showbiz take:
- its pre-chorus is the brightest section of either short take;
- the breakdown's chant is sung twice, building like a march;
- the spoken outro rides over the full band, so the song ends on a party.

A show suits it: segments for the verses, production numbers for the choruses, a studio audience for the chant, and a
curtain call that keeps going.

## Tone

- Satire with a warm heart. The show is the system's way of scoring things, so the joke is the scoreboard, never the
  woman. Rai hosts it, loves it, and turns it.
- Showbiz energy: fourth-wall winks, crash zooms, Team Rocket poses, sparkles. Then one dead-silent beat, "Just
  nothing. Still.", where the show stops.
- Rai is never hurt. The pole through her heart is a stagehand's prop she endures with a comic "ow", and the trapdoor
  is slapstick.
- Rai is the only face. The fish and crabs have dot eyes and no mouths. People are faceless `person()` silhouettes
  that emote.

## Palette weighting

The tokens are v3's. The weighting is a night-time TV studio:
- **ground:** ink and deep (the studio under water);
- **spotlights:** pink, yellow and cyan, crossing on the stage;
- **bulbs and value:** gold (the ring, the sign, the Rich List);
- **paid money:** lime on the scoreboard (`£` rows), and the night-vision feed is lime too;
- **care:** pink;
- **the sea outside the wreck:** periwinkle;
- **the island at the end:** orange fireworks and lanterns.

## Typography and the lyric

- **The lyric is the show's on-screen graphics:** a "lower third", a slanted ink plate with a gold rule and a pink tab.
  It uses Archivo bold, with sung words in yellow and unsung at 62% (pdoom's karaoke rules: per word, never ahead of
  the voice, readable everywhere).
- **Production numbers:** the hook words slam inside the ring of bulbs (Archivo heavy), and the lower third stays for
  the rest of the line.
- **Spoken parts:** Cormorant italic in a closed-caption box, the show's own subtitles.
- **The scoreboard:** dot-matrix LED (its own font, drawn as dots).
- **Machines and archive captions:** IBM Plex Mono.

## Camera and compositor grammar (the nuance)

- **Multi-camera TV:**
  - hard cuts between CAM 1, 2 and 3 on the beat, with a tally light on the crab's camera;
  - crash zooms (a fast punch-in to Rai's face for a wink);
  - the occasional slow crane move over the audience.
- **Archive:** VHS scanlines, chroma bleed, a timecode and the label "ARCHIVE" for the flashbacks.
- **Outside broadcast:** a night-vision green feed with a LIVE bug and a "channel flip" static wipe.
- **The `_post.ts` kit as in v3:**
  - smooth capped shakes on real hits only;
  - punches and colour kicks on the slams;
  - motion blur from the render.
- **Bulb chases** on the hi-hats, spotlights swinging on the downbeats.

## Motifs

1. **Rai the host.** She holds a microphone and has her full acting range: sassy, cheeky, smug, wink, fierce,
   deadpan, joy; chibi pops on the comic beats; lines of force on the slams.
2. **The ring of bulbs.** It is the ring: it stands behind the stage, becomes the 0 on the scoreboard in chorus 2,
   and becomes the fireworks' ring at the finale.
3. **The scoreboard.** The ledger, as an LED board:
   - paid things count in lime with a `£`;
   - care scores 0 in pink;
   - it gets smashed in the bridge;
   - it is rebuilt at the finale with glows instead of numbers.
4. **The audience.** Fish and crabs, plus other sunken things in the seats: an anchor, an old diving helmet, a ship's
   bell, other rai stones with dim hearts, and a child's lunchbox. Who else is waiting.
5. **The pole.** It goes through her heart in the archive demo ("ow"), is carried by the panel in the bridge, and by
   everyone in the breakdown.
6. **The woman.**
   - She first appears as a lunchbox in an audience seat (chorus 1, foreshadowing).
   - She is live in the night-vision feed.
   - Her 0 is in chorus 2.
   - She is in the cast that lifts in the second breakdown.
   - She is asleep on her sofa watching the show at the end.

## The studio (the shared set, `scenes/v1/_studio.ts`)

**The set:**
- a sunken ship's hull for the back wall: ribs, planks and glowing portholes;
- god rays from the surface far above;
- the kelp curtain (opens);
- the sign "WHAT'S IT WORTH?" in chasing bulbs;
- the ring of bulbs;
- footlights;
- the stage of sand and planks;
- three tiers of audience in clam-shell seats;
- anglerfish lamps hanging from the rigging as spotlights;
- the ON AIR light;
- the cue sign (APPLAUSE / OOOH / QUIET / LIFT!);
- the scoreboard.

**The crew:**
- the crab cameraman with a studio camera and a red tally light;
- the octopus floor manager with a headset and cue cards in four arms.

**Clues planted in the set:**
- a rusted ship's nameplate on the wreck (the trader's ship, foreshadowing verse 2);
- a child's lunchbox in seat C7;
- a clock on the wreck stopped at 4:00;
- a coil of rope and a long pole racked in the wings (the breakdown);
- a sliver of moonlight at the surface (the finale's night).

## Plates

Windows are master seconds (beat-floored cuts at each line's first word; `takes/v1/lyrics.json`, `audio.json`). Line
numbers are the aligned lines' `i`.

| Plate | Window | Lines | What plays |
|---|---|---|---|
| `onair` | 0–12.95 | 0–1 + the band's vamp | "Hi. You can't see me." / "That's kind of the whole point." |
| `archive` | 12.95–27.09 | 2–5 | the quarry, the 400 km, the pole, the storm |
| `twist` | 27.09–40.80 | 6–9 | the twist, the island's belief, her deals, the richest rock |
| `vote` | 40.80–54.51 | 10–13 | pre-chorus 1 |
| `number1` | 54.51–75.07 | 14–18 | chorus 1 (the tag twice, then the band) |
| `pitch` | 75.07–88.78 | 19–22 | the trader, bulk, value's the crossing, not how heavy |
| `quickfire` | 88.78–96.07 | 23–24 | print, wire, mine; genius; not a fraud |
| `uptheroad` | 96.07–102.92 | 25–26 | the woman awake at four; the ledger writes zero |
| `dating` | 102.92–116.20 | 27–30 | pre-chorus 2 |
| `number2` | 116.20–129.49 | 31–34 | chorus 2 |
| `panel` | 129.49–143.62 | 35–38 | the bridge |
| `lift` | 143.62–156.48 | 39–46 | the breakdown, twice |
| `festival` | 156.48–186.90 | 47–54 | the final chorus |
| `goodnight` | 186.90–204.37 | 55–57 + credits | the outro |

## The script, shot by shot

Times are the lines' first words. "CAM n" is the camera angle.

### `onair` (0–12.95)

| Time | Shot | The picture | Rai | Clue |
|---|---|---|---|---|
| 0–2.1 | the viewfinder | Black. A studio camera's viewfinder: corner brackets, `REC ●`, a timecode counting `00:00:00:00`, a battery icon, and a small "LENS CAP" warning blinking. The band's first bar. | unseen | the timecode reads the song's own time |
| 2.13 "Hi. You can't see me." | still black | The caption box types the line in Cormorant: closed captions over the black. On "see", a crab claw taps the lens from the outside: tink, a tiny shake. | unseen; her voice | |
| 5.84 "That's kind of the whole point." | POP | On "point" the cap is yanked off: a white flash, two frames. The studio: Rai centre stage in one pink spotlight, mic in hand, the kelp curtain closed behind her, the bulb sign dark. | **smug**, mic to her chin, then a **wink** to the camera on "point" | the scoreboard dark at stage left |
| 6.84–12.95 | the show opens | On the downbeats: the sign lights bulb by bulb, "WHAT'S IT WORTH?"; ON AIR glows red; the octopus flips the cue card to APPLAUSE; the fish audience erupts (bubbles as applause); the anglerfish spots swing; the crane swoops from the audience to the stage. | **joy**, arms **up**; a chibi pop for a bow on the bar before verse 1; sparkles | seat C7's lunchbox is caught in a spotlight sweep |

### `archive` (12.95–27.09): "Previously…"

Rai turns to the studio's big screen, a porthole-framed CRT in the wreck's hull. Cuts alternate on the beat between
the archive (full frame, VHS) and the studio (Rai presenting, pointing at the screen).

| Line | The picture | Rai | Numbers and clues |
|---|---|---|---|
| 2 "They cut me out of a cliff on Palau…" | ARCHIVE. A limestone cliff at sunset, silhouettes cutting with shell tools, chips flying on the hats. Her disc's outline glows in the rock. Cut back on "stubborn crew": Rai with a hand on her hip. | **sassy**, a thumb at the screen | `CREW: 12 · SHELL TOOLS: 40 · DAYS: 300` |
| 3 "four hundred kilometres of open ocean…" | ARCHIVE: a map. Palau to Yap, a dotted route drawing itself, "400 KM", stars over the open sea, a tiny raft crossing. | in the corner as a picture-in-picture, **wow** | the route's dots twinkle on the hats |
| 4 "they lashed me to a raft… a pole through the hole in the heart of me" | STUDIO. The crab stagehand slides a long pole through Rai's heart-hole on "pole through the hole". Rai: "OW" in a chibi pop with a vein mark and a comic star. The audience cue card: OOOH. | **shock**, then **deadpan** to camera, the pole sticking out both sides | THE DARK-HUMOUR BEAT |
| 5 "then a storm came off the reef… the bottom of the sea." | ARCHIVE: lightning, the raft tilts, the stone slides. Then STUDIO: a trapdoor opens under Rai on "bottom": she drops out of frame (speed lines, a whistle-fall) and pops back up through the trapdoor on the downbeat, dusting herself off. | **dizzy** (swirl eyes) as she pops up, then **grin** | the trapdoor's sign: `DO NOT STAND HERE` |

### `twist` (27.09–40.80)

| Line | The picture | Rai | Numbers and clues |
|---|---|---|---|
| 6 "Now here's the twist, and I love this bit: nobody wrote me off," | CAM 2 crash-zooms in. A giant "TWIST!" flip-board spins behind her. On "nobody wrote me off" a stamp slams across the screen: **NOT WRITTEN OFF**. | **scheme**, finger to lips, then **wink** | a shake on the stamp |
| 7 "the whole island said "we know she's down there"…" | The news desk: the studio screen becomes a news bulletin, "BREAKING · YAP". Island silhouettes on the shore at sunset, all pointing down at the sea, emote "!". The ticker crawls with the quoted line. | at the desk, **serious** newsreader face, then a cheeky glance | the ticker says `BELIEF: 100%` |
| 8 "so I still buy land, I still settle a feud, I still make a wedding complete," | The shopping channel: a turntable presents three items on the beat. A deed with a palm plot, two silhouettes shaking hands (a feud settled), a flower garland with a ring. Each gets a red `SOLD` stamp and its price: `1 UNSEEN STONE`. | **grin**, presenting with an open palm; arms **reach** | the ring on the garland echoes the bulb ring |
| 9 "…I haven't been seen in living memory and I'm the richest rock in the street." | THE RICH LIST: a gold podium. #3 a yacht, #2 a gold bar, #1 RAI (spotlight, confetti bubbles). "RICHEST ROCK" slams on the downbeat. | **smug** then **joy**, a Team Rocket pose (arms **up**/**hip**), sparkles, a chibi pop | `NET WORTH: AGREED` |

### `vote` (40.80–54.51): pre-chorus 1, the brightest section

The lights drop to one warm spot. Rai sits on the edge of the stage, legs over, mic in her lap. It is sincere, then
playful.

| Line | The picture | Rai |
|---|---|---|
| 10 "'Cause I was never really stone," | A close-up on Rai. Behind her the dark wreck. Her outline flickers into tiny glowing words, then back. | **soft** |
| 11 "I'm the story that you keep;" | The audience holds up glowing scorecards. They show tiny pictures, not numbers: a raft, a wedding garland, a handshake, a storm. | **smile**, looking out at them |
| 12 "I'm worth exactly what you say," | The applause meter (a big brass needle gauge on the wreck) rises as the audience noise grows (bubbles). | **cheeky**, a hand to her ear |
| 13 "so what are you saying about me?" | She leans to the audience, mic out: a giant "?". The needle wobbles at the top. The octopus holds two cue cards, YES and NO, unsure: sweat drop. | **sassy**, eyebrow up; "?" mark |

### `number1` (54.51–75.07): chorus 1, the first production number

The kelp curtain opens on the downbeat: the ring of bulbs blazes behind Rai, with a cyan sunburst inside it (v3's
chorus 1 colour, as the show's lights).

- **54.82 "I'm the stone at the bottom of the sea,":** the full set, wide. The fish chorus line swims in formation
  across the front. STONE slams inside the ring.
- **57.74 "nobody's seen me but everybody believes;":** CAM 3, low and wide: the audience on its feet, fins up.
  BELIEVES slams.
- **61.18 "if you can count a thing you can't even see,":** Rai in the spot, eyes closed (**soft** → **joy**). The
  scoreboard briefly counts `1, 2, 3…` and shows `?`.
- **64.66 "who else is waiting at the bottom of the sea?" (1st):** the spotlight leaves the stage and sweeps across
  the audience seats, finding who else is waiting:
  - an anchor in a seat;
  - an old diving helmet;
  - a ship's bell;
  - two old rai stones with dim hearts.
- **68.00 the tag again (held to 75):** the spot stops on seat C7: a child's lunchbox, alone. The music rides. The
  bulbs dim to just that seat. Rai, on stage, looks at it (**serious**). The band's tail carries a slow push-in on the
  lunchbox. FORESHADOWING: the woman.

### `pitch` (75.07–88.78): the pitch round

| Line | The picture | Rai | Numbers |
|---|---|---|---|
| 19 "Then a trader sailed in with an iron hull, said "why paddle? I'll bring you a ton"," | The stage's side door is an iron ship's hatch. A silhouette in a captain's cap steps out pushing a crate labelled `1 TON`. A speech bubble: "WHY PADDLE?" | **deadpan**, arms **cross** | the ship's nameplate from the set is on the hatch |
| 20 "he shipped us in bulk and the island said thanks, then priced his at a fraction of one;" | The price-guessing game. A row of identical discs slides on a conveyor (too even, copy-pasted). The audience's paddles flip up all at once: `1/10`. A sad trombone (just a visual "wah-wah" squiggle). The trader slumps, emote sweat. | **smug** | `1/10` |
| 21 "'cause value's the crossing, the risk and the reef, the hands and the hours it cost," | The points board: "WHAT MAKES IT WORTH IT?" Four rows light on the beat. | Rai points along the rows, **determined** | `CROSSING 400 km · RISK ★★★★★ · HANDS 30 · HOURS 6,000` |
| 22 "not how heavy you are and not how you shine, but the voyage, and what could be lost." | Buzzer round. A scale: BZZT ✗ (red). A jeweller's loupe on a shiny disc: BZZT ✗. The raft on a map: DING ✓ (gold), and the board flashes. | **sassy** finger wag on each ✗; **joy** on the ✓ | a hit shake on the DING only |

### `quickfire` (88.78–96.07): the quick-fire round

- **23 "Now you print it, you wire it, you mine it in code,…":** three contestant podiums light in turn, one per
  phrase:
  - a printing press stamping notes;
  - a wire: two phones with a lightning arrow;
  - a mining rack, a server with a tiny pickaxe and blinking lights.
  
  On "a pledge on a screen that you hold up as gold" a phone screen is held up and turns into a gold trophy, with a
  pixel shimmer. Fast cuts every 2 beats.
- **24 "and honestly? Genius. It lets strangers trade. I'm not here to tell you that money's a fraud;":**
  - "GENIUS" lights up in bulbs;
  - two silhouettes from opposite wings meet and swap a parcel for a coin, and both emote a heart;
  - on "not here to tell you money's a fraud", Rai crosses her arms in a big X, **sassy**, then gives the camera a
    **wink**: she's not.

### `uptheroad` (96.07–102.92): the outside broadcast and the nothing

- **25 "but up the road there's a woman awake at four with a fever, a lunchbox, a bill,":**
  - A channel-flip of static to the studio screen, full frame: "LIVE · UP THE ROAD". A night-vision green feed of a
    kitchen.
  - The clock reads 4:00. A woman, in silhouette, holds a feverish child, rocking. A thermometer glows.
  - On "a lunchbox", the lunchbox on the counter, the same one as seat C7's.
  - On "a bill", a bill under a fridge magnet, `£82.40`.
  - The woman's head tilts down to the child's: emote sigh. A teardrop on the child's cheek (the fever).
- **26 "and your ledger looks right at her, blinks, and writes zero. Not minus. Just nothing. Still.":**
  - Cut to the studio scoreboard, the ledger, full frame in dot-matrix: `HER SCORE`.
  - On "looks", the board's dots form a big eye that looks left. On "blinks", it blinks.
  - On "zero", a giant pink **0**.
  - On "Not minus.", a `−` flickers before the 0 and is wiped away.
  - On "Just nothing.", cut wide: the studio, everyone frozen. The fish stop mid-bob and one fish's popcorn drifts
    down. The octopus holds the cue card QUIET.
  - On "Still.", one bubble rises in silence. Rai, centre, has dropped the showbiz: **deadpan** → **angry** (a vein
    mark, steam). No shake: the stillness is the hit.

### `dating` (102.92–116.20): pre-chorus 2, half rap

| Line | The picture | Rai |
|---|---|---|
| 27 "Marry your housekeeper, the income drops:" | The dating segment: a heart-shaped screen slides down. A man in silhouette and the housekeeper (with a mop) meet across it: hearts, wedding bells, confetti. On "drops", the scoreboard's `INCOME £21,400` slides down to `£0` with a slide-whistle squiggle. | the host on a stool, **cheeky** |
| 28 "same floors, same love, same clock, the counting stops;" | Split screen: before and after the wedding. The same room, mop, floor and clock, hand for hand. Only the scoreboard strip under each half differs: `PAID` / `0`. | in the split's gutter, **shrug** |
| 29 "pay a stranger, watch the number climb;" | A stranger with a mop walks in on the beat. The meter climbs with coins raining, ka-ching, `£` in lime. The APPLAUSE card is up. | **deadpan**, slow clap |
| 30 "your meter's measuring the wrong kind of time." | Rai holds up a big alarm clock beside the meter. The meter's dial spins the wrong way. She facepalms, chibi. | **facepalm** (chibi pop) then **determined** |

### `number2` (116.20–129.49): chorus 2

The tender reprise. The house lights go down.
- The audience holds up glowing pink jellyfish like lighters, swaying on the half-time.
- The ring of bulbs, now pink, sits around the scoreboard's 0. The ring IS the zero; it glows.
- The woman's silhouette and her child, small, appear inside the ring, rocking on the beat (the feed's last image as a
  memory).
- STONE and BELIEVES slam in pink.
- On "who else is waiting", the spot finds seat C7 again. This time a fish in the next seat has put its fin over the
  lunchbox: emote heart.

Rai is **soft**, then **fierce** on the last line, standing.

### `panel` (129.49–143.62): the bridge (half time, sung)

The panel show. Three podiums under a "THE BIG DEBATE" sign. Each guest is a silhouette with an emblem on the podium.

| Line | The picture |
|---|---|
| 35 "Some say count her, or she's never seen;" | Podium 1 lights, its emblem a calculator. The guest points at the scoreboard: emote "!". |
| 36 "some say price it and you'll break what it means;" | Podium 2, its emblem a heart with a price tag. On "break" the heart cracks; the guest holds their head. |
| 37 "some say smash the one big scoreboard down," | Podium 3, its emblem a hammer. On "smash" the guest swings and THE SCOREBOARD SHATTERS: dots everywhere, a colour kick, the one big shake of the plate, sparks. |
| 38 "and every one of them is carrying the stone." | The podiums slide away and the camera pulls back. All three guests are holding one long pole on their shoulders, and Rai is on it, through her heart. She waves from the middle. |

Rai's faces: in the corner, **chin** (thinking), **wow** at the smash, **cheeky** wave on the reveal.

### `lift` (143.62–156.48): the breakdown, twice (the chant)

The octopus flips the cue card: LIFT!

- **First chant (143.62–150.05):** the audience comes down from the stands. Fish, crabs and the other sunken things
  (the anchor, the helmet, the old stones) line up under the pole. Each "One pole, every shoulder" adds one shoulder
  per beat; each "lift it" raises the pole a notch.
- **Second chant (150.05–156.48):** the whole cast joins: the trader, the housekeeper couple, the two strangers, the
  three panellists, and the woman with her child on her hip.
  - On "bring it home" the stage elevator lurches: the stage floor rises, bulbs chasing upwards, bubbles streaming
    down.
  - The camera tilts up with it, towards the moonlit surface.
- Rai rides the pole, **determined** → **joy**, fists up, lines of force.

### `festival` (156.48–186.90): the final chorus, key lift

The studio breaks the surface at night onto Yap's beach (`island(… 'night')`, palms, huts, the stone bank). Water
pours off the stage. The whole island watches from the sand with lanterns.

- **47 "I'm the stone at the bottom of the sea,":** the breach. Water sheets off, and the first firework bursts as a
  ring on the downbeat.
- **48 "and I'm worth what you say, so say it for her, and for me:":** Rai points to the woman in the front row.
  **fierce**.
- **49 "count the nights, count the meals, count the care, or don't count,":** the scoreboard rebuilt from bulbs
  (rows light on each "count"):
  - `NIGHTS ★`;
  - `MEALS ★`;
  - `CARE ★`.
  
  Each glows pink, with no `£` and no number.
- **50 "but agree that it's real, 'cause that's what money's about.":** the crowd's lanterns lift together. AGREE
  slams.
- **51 "I'm the stone…":** fireworks in every colour.
- **52 "you lifted me up with a word you agreed;":** speech bubbles pop above the crowd, each with one small word
  (YES, HER, REAL, MUM, THANKS) and a heart.
- **53 "so choose what you honour and honour it loud.":** the applause meter's needle breaks the top. LOUD slams.
- **54 "I'm the stone at the bottom of the sea." (held to 186.9):** a wide shot. The fireworks draw one great ring
  over the bay, and Rai stands in the ring of bulbs with the island around her: **joy** → **love**.

### `goodnight` (186.90–204.37): the outro over the band, and the credits

- **55 "On Yap they still bring the stones to weddings.":** the show's last segment, on the same beach. A wedding
  under the palms: a couple in silhouette, the guests with garlands, and Rai beside them wearing a flower garland.
  The caption box in Cormorant.
- **56 "Not because they're heavy.":** a crab tries to lift Rai: strain, sweat, nothing. She flexes in a chibi pop
  (**smug**).
- **57 "Because everybody remembers.":**
  - The camera pulls back, and the frame becomes a TV screen in a living room at night.
  - The woman is asleep on the sofa with her child under one blanket, both emote zzz.
  - The lunchbox is packed for the morning on the side table.
  - The TV's glow is on them.
  - On the TV, Rai looks out of the screen at them, **soft**, and blows a kiss (heart).
- **199.1–204.37, the credits roll on the TV:** "WHAT'S IT WORTH?" small, then the credits, in Plex Mono on the screen.
  The room stays dim and warm. The last frame is the TV clicking to a shrinking dot, an old CRT switching off. The
  dot is a ring.

## Credits (the end card)

- Words: Claude, from Knight Commander Gareth's brief.
- Voice and music: Suno.
- Film: drawn in code; engine from pdoom-video by Giacomo Magnanini (MIT).

## Technical conventions

- The master is `takes/v1/audio.wav`, the Suno take alone at 48 kHz.
- The timeline is `src/timeline-v1.ts`, chosen by `?take=v1`. The plates are `src/scenes/v1/<id>.ts`, and the shared
  set is `src/scenes/v1/_studio.ts`.
- The final render is 3840×2160 at 60 fps with adaptive motion blur (`render-final.sh`, `TAKE=v1`).
