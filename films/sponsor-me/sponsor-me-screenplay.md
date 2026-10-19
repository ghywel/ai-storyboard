# Sponsor Me: the screenplay

**Timed to the take.** A painted music video for World Vision's child sponsorship. The concept, the rules and the look
are in `sponsor-me-design.md`. This document times every shot to the recording, and section 5 lists the concept art
to make.

Written by Claude for Gareth (director) · 19 October 2026 · first draft, on the Suno take of 19 October 2026.

## Contents

0. How to read the bands
1. The take, measured
2. What the measurements changed
3. The screenplay, shot by shot
4. The spotting map, timed
5. Concept art for ChatGPT
6. For production
7. Appendix: how the timing was measured

## 0. How to read the bands

- **Master time.** Every time is a time in the Suno download `Sponsor_Me.m4a` (5:27.6), decoded to a 48 kHz WAV
  with no offset (`takes/sponsor-me/audio.wav`). Times read `m:ss.s`.
- **The grid.** The song is in 4/4 at about **72.5 bpm**: one beat is 0.83 s and one bar is 3.3 s. Bar 1 starts at
  0:01.8. The tempo drifts up a little, as a live band's does. It is 72.45 bpm through chorus 1, 72.9 in chorus 2 and
  73.3 in the bridge and final chorus. So the bar lines are tracked from the drums, not drawn at a fixed spacing
  (`takes/sponsor-me/audio.json`).
- **A band** reads `start–end · bars`. A shot's band is where its picture holds, from the cut in to the next cut.
- **◆ marks a hard anchor.** It is a measured musical event (the drums entering, the band dropping out, a drum
  launch) or a sung word that the cut or the action must land on. Do not move these.
- **Other edges are flexible** by about a beat. They follow the sung words, which are timed to about a tenth of a
  second (appendix).
- **Lines in the choruses start on beat 2,** with the snare, not on the downbeat. Cuts there land on the bar line
  and the words follow.
- **The film is painted and moves.** Every shot has one main action and something alive in it (dust, breath, light,
  rain, a curtain). Nothing is a frozen still (CRAFT.md §5).
- **Shot numbers (SM-01 to SM-78) are the shared names** for this screenplay, the concept art (section 5) and the
  production plates. Use them for file names: `SM-24-her-look.png`.

## 1. The take, measured

The song is **A-flat major** throughout. There is no key lift into the final chorus: the lift is in the picture.

| Section | Bars | Starts | Loudness (LUFS) | What the band does |
|---|---|---|---|---|
| Intro | pickup–4 | 0:00.0 | −21.9 | one chiming guitar, a girl humming far off; a single kick on the downbeats of bars 2 and 4 |
| Verse 1 | 5–17 | 0:15.1 | −19.3 | close sing-spoken voice from 0:16.5; the bass enters at bar 6 (0:18.4); **a heartbeat kick from bar 6, strong on beat 1 and soft on beat 2**; the drums step up at bar 12 (0:38.3); bar 16 is a guitar turnaround without voice |
| Verse 2 | 18–25 | 0:57.2 (the first word, a pickup into bar 18) | −18.1 | fuller; bar 25 (1:21.5) is a turnaround without voice |
| Pre-chorus | 26–29 | 1:24.6 | −17.2 | building; **bar 29 (1:34.8) is a drum fill** into the chorus |
| Chorus 1 | 30–38 | 1:38.1 | −15.6 | the bass lifts on the downbeat of bar 30; the lead soars an octave up; the girl's echoes; **bar 38 (2:04.6): the bass drops out** for a bar |
| Verse 3 | 39–48 | 2:07.9 | −15.3 | the hi-hats move to eighths, so the drums begin to move; **bar 48 (2:37.6): the drums drop out** |
| Her letter | 49–52 | 2:40.9 | −25.2 | **the film's valley**: almost nothing but her spoken voice and a breath of guitar |
| Chorus 2 | 53–60 | 2:54.0 | −14.1 | **the band returns, full, on the downbeat of bar 53**; bar 60 (3:17.1) is a drum fill |
| Bridge | 61–76 | 3:20.4 | −13.5 | steady and climbing; **bar 68 (3:43.3): the drums double up**, and bars 68–72 are the loudest of the song; **bar 73 (3:59.6): the band drops out**, and bars 73–75 are a hush for "Whoever welcomes one of these / Welcomes Me"; **bar 76 (4:09.4): a drum launch** with no voice |
| Final chorus | 77–88 | 4:12.7 | −13.6 | full band and congregation; the vow repeated; the vocal peak at bar 86 (4:42.0); **bar 88 (4:48.5): the drums drop out** over a held bass |
| Outro | 89–94 | 4:52.0 | −22.2 | one guitar and the close voice again; a guitar swell at bar 94 (5:08.7) |
| The whisper and the tail | 95–99 | 5:11.9 | −27.1, then −19.0 | "I will" at 5:12.6; **a last band swell on the downbeat of bar 97 (5:18.6)**; a second whispered "I will" at 5:21.8; the end at 5:27.6 |

**The shape.** The loudness climbs evenly from the first word to the bridge. It falls once into the letter's valley.
It peaks across the bridge's double time and the final chorus, then falls away to the whisper. So the film's light
climbs the same way: dark through verse 1 and verse 2, warm from chorus 1, the hush at the letter, full gold from the
bridge, and dawn again in the outro.

## 2. What the measurements changed

The design document was written before the take. The take changes seven things in it.

1. **No silent beat before "Holy".** The pre-chorus's drum fill runs straight into the chorus downbeat. So the
   cockerel's cry runs into the chorus, and the turn is the cut to her look on the first "Holy" (SM-24).
2. **No key lift.** Suno kept the final chorus in the same key. The lift is the sunrise on the downbeat of bar 77
   (SM-63), and it is the film's one flash.
3. **A hush in the bridge.** The band drops out for "Whoever welcomes one of these / Welcomes Me" (bars 73–75). This
   is the film's still point: she pulls out the empty chair for us (SM-61). Then a drum launch with no voice
   (bar 76) builds the light toward the sunrise.
4. **The metronome is a heartbeat.** From bar 6 the kick plays strong on beat 1 and soft on beat 2. Her two
   footsteps per bar land on it through verse 1, and it returns in the outro.
5. **The final chorus is longer.** Suno added a vow round: four "We will"s, with two more of the girl's "Will you
   sponsor me?" calls sung over them (bars 85–87). The picture gives each "We will" a wider view of the table.
6. **Two whispers.** There is a second "I will" at 5:21.8, after the band's last swell. It plays over the end card.
7. **"We" needs a bridge in the picture.** The song moves from *I will* to *we will*. So chorus 2 shows other homes
   and other people stopping their scroll (SM-47, SM-49), and in the final chorus the father and his boys sit at
   the table among everyone.

**One line to check by ear.** Whisper heard "And *a* face came up on my phone again" where the lyric says "*her*
face". If Suno sang "a face", the picture is the same.

## 3. The screenplay, shot by shot

Each movement opens with its band. In the tables, **Sound** gives the sung words with the times of the words that
matter, and **Cut in** gives what carries the cut, why it cuts, and what it lands on (CRAFT.md §8).

### I. Before the cockerel · 0:00.0–0:57.2 · intro and verse 1 · bars pickup–17

Pre-dawn indigo going to grey. Wide, still frames and a long road. Her footsteps are the heartbeat.

| Shot | Band · bars | Sound | Picture | Cut in |
|---|---|---|---|---|
| **SM-01** ★ | 0:00.0–0:05.2 · pickup–1 | one guitar; a girl humming far away | Black, then the film's only fade-up: the road at five a.m. Indigo sky, red earth grey in the dark, a thorn tree on the ridge, a tin school roof catching nothing yet. Foreground: a wooden fence, the cockerel on it, silent, asleep | the opening |
| **SM-02** ★ | 0:05.2–0:11.8 · 2–3 | ◆0:05.2 the first kick | A doorway in a mud-brick home, lamplight inside. Her silhouette lifts the yellow can onto her head: the film's first accent | the kick · a body moves · the can |
| SM-03 | 0:11.8–0:18.4 · 4–5 | ◆0:11.8 a kick · "Five in the morning" 0:16.5 | Low and close: her bare feet step out of the doorway into the dust, one step, then still | the kick · she sets out · her feet |
| SM-04 | 0:18.4–0:21.8 · 6 | ◆0:18.4 the heartbeat kick begins, and the bass · "before the cockerel" 0:20.2–0:21.7 | Low wide: she walks away from us along the road, two steps per bar on the kick. On "cockerel" (0:20.9) the cockerel's head turns to watch her go | the heartbeat · the walk begins · the road |
| SM-05 | 0:21.8–0:28.4 · 7–8 | "She's on the road with a yellow can" 0:22.7, "yellow" 0:24.2 · "Red dust, bare feet" 0:27.8 | Side-on, tracking slowly: the yellow can on her head against the indigo, her arms up to steady it. The dust lifts at each step | bar 7 · we meet the can · the can |
| SM-06 | 0:28.4–0:31.7 · 9 | "an hour each way" | Very wide: she is tiny on the long road, and the road goes over the ridge and out of sight | bar 9 · the distance · the ridge |
| SM-07 | 0:31.7–0:35.0 · 10 | "And it's heavier coming home" 0:32.7, "home" 0:34.2 | The return: the full can, the sky gone grey. Water slops at the can's mouth. Her shoulders take the weight, her jaw set. Enduring, not suffering | bar 10 · the weight · the slop of water |
| SM-08 ★ | 0:35.0–0:40.4 · 11–12 | "She's seven" 0:37.4 · ◆0:38.3 the drums step up · "Same as my eldest" | Medium: she stands against her doorpost, the can down beside her. The first time we see her face: seven, serious. A pencil mark of her height on the doorpost. On ◆0:38.3 the first warm lamplight touches her cheek from inside | bar 11 · who she is · her face |
| SM-09 | 0:40.4–0:44.0 · 12–13 | "The water's brown" 0:40.4, "brown" 0:41.3 · "She drinks it anyway" | Close: a tin cup of brown water held in two hands. She drinks without fuss | the line · the water · the cup |
| SM-10 | 0:44.0–0:46.8 · 13–14 | "Her brother coughs all night" 0:44.0, "coughs" 0:44.9 | The dark inside: a red blanket rises and falls with a cough. She looks back at him from the doorway | the line · the cough · the blanket |
| SM-11 ★ | 0:46.8–0:51.6 · 14–15 | "She walks the long way round the school" 0:46.8, "school" 0:48.8 · "And doesn't go in" 0:49.7, "in" 0:51.3 | The school from the road: an open door, children's silhouettes at desks, a teacher's chalk. She slows, looks in, and keeps walking | the line · the school · the open door |
| SM-12 | 0:51.6–0:57.2 · 16–17 | the guitar turnaround, no voice | Aftermath: the empty school gate, held. She is gone. Dust settles on the road and the light greys | bar 16 · what she missed · the empty gate |

### II. Green and pleasant land · 0:57.2–1:24.6 · verse 2 · bars 18–25

Cold grey-green outside, warm and glossy inside, the phone's blue-white. Tight, cluttered, at table height. Every
shot matches one in movement I.

| Shot | Band · bars | Sound | Picture | Matches | Cut in |
|---|---|---|---|---|---|
| **SM-13** ★ | ◆0:57.2–1:00.5 · 17–18 | "Seven in the morning" 0:57.2 · "green and pleasant land" 0:59.6 | Hard cut on "Seven": rain on a kitchen window, a wet green garden beyond. The boiler's blue pilot light. The first warm interior colour | her road (SM-04) | the word · a new place · the window |
| SM-14 ★ | 1:00.5–1:03.9 · 18–19 | "The boiler hums, the tap runs hot" 1:00.5, "tap" 1:01.9, "hot" 1:02.7 | The hot tap steams into a sink, framed exactly as the can was. The father's hand in a dressing-gown sleeve | the can (SM-05) | the line · the match · the steam |
| SM-15 | 1:03.9–1:06.8 · 19–20 | "My boys are fighting over cereal" 1:03.9 | Milk pours over cereal, framed as her cup was. Two silhouettes tug the box: one with a felt-tip behind his ear, one with red wellies under the table | the cup (SM-09) | the line · the match · the milk |
| SM-16 | 1:06.8–1:10.3 · 20–21 | "And I'm moaning that the Wi-Fi's slow" 1:06.8, "slow" 1:08.7 | The phone's spinning wheel; the father's thumb taps the glass | | the line · the complaint · the wheel |
| SM-17 | 1:10.3–1:13.0 · 21–22 | "Two pairs of school shoes by the door" 1:10.3, "shoes" 1:11.4 | The hall: two pairs of shiny school shoes on the mat, framed as her bare feet were | her feet (SM-03) | the line · the match · the shoes |
| SM-18 | 1:13.0–1:16.2 · 22–23 | "Two lunchboxes, two coats, two futures" 1:13.0, "futures" 1:15.3 | Lunchboxes snatched, coats off hooks; the boys run out of frame. On "futures" the front door closes behind them, framed as the school door was | the school door (SM-11) | the line · the match · the door |
| **SM-19** ★ | 1:16.2–1:20.1 · 23–24 | "And her face came up on my phone again" 1:16.2, "face" 1:16.9, "phone" 1:18.0 | The phone face up beside a coffee going cold. In the feed, a painted portrait of her. His hand stops above it | | the line · her face · the screen |
| SM-20 | 1:20.1–1:24.6 · 24–25 | "And I scrolled on by" 1:20.1, "scrolled" 1:20.3 · bar 25 turnaround, no voice | On "scrolled" the feed whips up and she is gone. Through the turnaround the feed keeps sliding slowly: holidays, a recipe, football, adverts | | the word · the scroll · the feed |

### III. Three times · 1:24.6–1:38.8 · pre-chorus · bars 26–29

The phone's glow, then the dark, then dawn over her village. Each scroll is shorter than the last.

| Shot | Band · bars | Sound | Picture | Cut in |
|---|---|---|---|---|
| SM-21 | 1:24.6–1:28.0 · 26 | "Once, I said I'd do it later" 1:24.6, "later" 1:27.0 | The feed: her face slides up into view and out again, over a full bar | the line · the first pass · her face |
| SM-22 | 1:28.0–1:31.3 · 27 | "Twice, I said what difference can one man make" 1:28.0, "make" 1:30.8 | Her face again, faster, over half a bar. The thumb doesn't hesitate | the line · the second pass · her face |
| SM-23 | 1:31.3–1:34.8 · 28 | "Three times I scrolled on by" 1:31.3, "scrolled" 1:32.9, "by" 1:34.3 | On "scrolled", a flicker of her face for one beat, then the feed blurs | the line · the third pass · the blur |
| SM-24a | ◆1:34.8–1:35.8 · 29 | the drum fill begins | The phone locks: a black screen | the fill · the end of the scroll · black glass |
| **SM-24b** ★ | 1:35.8–1:38.8 · 29–30 | "And somewhere a cockerel cried" 1:35.8, "cockerel" 1:37.0, "cried" 1:37.7 · ◆1:38.1 the chorus downbeat | Dawn over her village, far away: the cockerel's silhouette on the fence crows against the first grey light. It is the morning of the denial | the line · the cry · the cockerel |

### IV. Was You, looking at me · 1:38.8–2:07.9 · chorus 1 · bars 30–38

The first gold light. One slow push-in, the film's only push straight at a face.

| Shot | Band · bars | Sound | Picture | Cut in |
|---|---|---|---|---|
| **SM-25** ★ | ◆1:38.8–1:45.6 · 30–32 | "Holy" 1:38.8, "holy" 1:40.4 · "Wake me from my sleep" 1:42.1 | The dark kitchen, the phone face up and lit with her painted portrait. On the first "Holy" she lifts her eyes out of the screen and looks at us. A gold rim of light catches her hair. The slow push-in begins | the word · the turn · her eyes |
| SM-26 | 1:45.6–1:48.8 · 32–33 | "Every face that I scrolled past" 1:45.6, "scrolled" 1:47.3 | The push reaches her eyes. In them, small and reflected, the feed scrolls backward: all the faces he passed | the line · the reflection · her eyes |
| **SM-27** ★ | 1:48.8–1:55.4 · 33–34 | "Was You, looking at me" 1:48.8, "You" 1:49.2 · "Will you sponsor me?" (the girl's voice) 1:52.1, "sponsor" 1:52.8 | The push stops. She holds her look. Around the phone the kitchen has turned from grey to gold. On "Will you sponsor me?" nothing moves: she does not plead. She waits | the line · the look · stillness |
| SM-28 | 1:55.4–1:58.9 · 35 | "With the help of God, I will" 1:55.4, "God" 1:56.9, "will" 1:57.9 | The father's hand puts the phone down face up on the table. On "will" his hand stays open beside it | the line · the vow · the open hand |
| SM-29 | 1:58.9–2:02.0 · 36 | "Will you sponsor me?" 1:58.9 | His elder son's silhouette climbs onto the chair beside him and looks at the phone too, the felt-tip behind his ear | the call · the child · the boy |
| SM-30 | 2:02.0–2:07.9 · 37–38 | "With the help of God, I will" 2:02.0, "will" 2:04.5 · ◆2:04.6 the bass drops out | Outside the window the rain stops and a break of sunlight crosses the table. On ◆2:04.6 the boy pulls a sheet of paper toward him and uncaps a felt-tip | the line · the light · the paper |

### V. A pound a day · 2:07.9–2:40.9 · verse 3 · bars 39–48

Full morning, paper white. The drums begin to move, and the picture travels: left to right going out, right to left
coming back.

| Shot | Band · bars | Sound | Picture | Cut in |
|---|---|---|---|---|
| SM-31 | ◆2:07.9–2:11.1 · 39 | the drums move to eighths · "A pound a day" 2:08.0, "pound" 2:08.2 and 2:09.4 | A pound coin on the table beside the cold coffee. On the second "pound" his finger slides it forward | bar 39 · the arithmetic · the coin |
| SM-32 | 2:11.1–2:14.1 · 40 | "Less than the coffee going cold beside me" 2:11.1, "coffee" 2:11.9, "cold" 2:12.6 | The coin and the coffee side by side; the last thread of steam goes out | the line · the comparison · the cup |
| **SM-33** ★ | 2:14.1–2:17.5 · 40–41 | "It doesn't go in her pocket" 2:14.1, "pocket" 2:15.5 · "it goes in the ground" ◆2:16.6 | The paper fold: the coin tips off the table's edge. On "ground" it lands as a spade's first cut in red earth, and the well-digger's silhouette leans on the spade, a spirit level on the concrete form | the word · where the money goes · the spade |
| SM-34 | 2:17.5–2:20.4 · 41–42 | "A well" 2:17.6, "a nurse" 2:18.6, "a classroom roof" 2:19.4, "roof" 2:20.0 | Three held states, one on each word: a pump gushing clean water onto concrete; a nurse's silhouette with a child on her knee and a stethoscope; new tin sheets being laid on the school roof | each word · each gift · each place |
| **SM-35** ★ | 2:20.4–2:24.4 · 42–43 | "And four more children drinking there beside her" 2:20.4, "children" 2:21.4 | Five children at the pump, cupped hands under clear water. She is one of them, laughing. The yellow can fills, clear, under the spout | the line · the many · her laugh |
| SM-36 | 2:24.4–2:27.3 · 44 | "My son drew her a lion in felt-tip" 2:24.4, "lion" 2:25.5 | The UK table: the boy's silhouette, tongue out in concentration. On "lion" the orange felt-tip lion appears stroke by stroke on the page | the line · child to child · the lion |
| SM-37 | 2:27.3–2:32.7 · 44–46 | "Folded it into a padded envelope" 2:27.3, "envelope" 2:28.9 · "With stickers and a pack of crayons" 2:29.6, "stickers" 2:29.7, "crayons" 2:31.1 | The drawing folds into a padded envelope. A yellow star sticker goes on the front: the accent. A pack of crayons slides in after it | the word · the treasure · the envelope |
| SM-38 | 2:32.7–2:36.3 · 46–47 | "And twelve weeks later" 2:32.7 · "through the letterbox" ◆2:34.9 | The journey, left to right in quick held states: a postbox, an aircraft window, the red road, her hands opening the envelope. Then right to left: an envelope drops through a UK letterbox onto the mat on "letterbox" | the line · time and distance · the mat |
| **SM-39** ★ | 2:36.3–2:40.9 · 47–48 | "A house" 2:36.5, "a blue door" 2:37.4, "and a sun with a face" 2:39.0 · ◆2:37.6 the drums drop out | Her drawing, opened on the kitchen table, in crayon: a house, a blue door, a yellow sun with a face, and in the corner a tree. Each appears in turn on its word. The family's silhouettes lean in. The music thins away | the line · her answer · the drawing |

### VI. Her letter · 2:40.9–2:54.0 · bars 49–52

The film's hush. Her voice alone. We are with her, in her own light.

| Shot | Band · bars | Sound | Picture | Cut in |
|---|---|---|---|---|
| **SM-40** ★ | ◆2:40.9–2:47.3 · 49–50 | "Dear friend" 2:42.1 · "I am well" 2:42.8 · "The water is clean now" 2:45.4, "clean" 2:45.9 | Her doorstep in late afternoon. The door behind her is newly painted blue. She sits writing slowly with a pencil, the felt-tip lion propped against the wall beside her. On "clean" the yellow can by the door, full of clear water | the hush · her voice · her hand |
| SM-41 | 2:47.3–2:52.0 · 50–52 | "I go to school" 2:48.3, "school" 2:48.8 · "I am learning to write" 2:50.1 | Close: her pencil forming letters, careful and proud. She laughs once at her own drawing | the line · school · the pencil |
| SM-42 | 2:52.0–2:54.0 · 52 | "I drew you my tree" 2:52.0, "tree" 2:52.9 | The crayon tree at the corner of the page, close, filling the frame | the line · the seed · the tree |

### VII. The drawings come alive · 2:54.0–3:20.4 · chorus 2 · bars 53–60

Warm day. The children's felt-tip world starts to live in the painted one. The ask spreads to other homes.

| Shot | Band · bars | Sound | Picture | Cut in |
|---|---|---|---|---|
| **SM-43** ★ | ◆2:54.0–2:57.3 · 53 | the band returns, full · "Holy" 2:54.7, "holy" 2:56.3 | On the downbeat the felt-tip lion lifts its head. On "Holy" it steps off the paper into the red dust, drawn in streaky orange strokes in a painted world | the band · the drawing lives · the lion |
| SM-44 | 2:57.3–3:01.4 · 54–55 | "Wake me from my sleep" 2:58.0 | The star stickers rise as stars over the village at dusk | bar 54 · wonder · the stars |
| SM-45 | 3:01.4–3:04.7 · 55–56 | "Every face that I scrolled past" 3:01.4, "scrolled" 3:03.2 | The classroom under its new roof: one by one, the children's faces turn toward us | the line · every face · the children |
| SM-46 | 3:04.7–3:08.0 · 56–57 | "Was You, looking at me" 3:04.7 | She looks up from her book at us again. This time she is smiling | the line · the second look · her face |
| SM-47 | 3:08.0–3:11.2 · 57–58 | "Will you sponsor me?" 3:08.0 | Other homes: a bus at night, a café, a student's bedroom. In each, a silhouette's thumb stops over a phone lit with a child's painted portrait | the call · it spreads · other hands |
| SM-48 | 3:11.2–3:14.6 · 58–59 | "With the help of God, I will" 3:11.2, "God" 3:12.7 | The UK kitchen: her drawing on the fridge under a magnet. The boy is drawing another | the line · the bond · the fridge |
| SM-49 | 3:14.6–3:17.8 · 59–60 | "Will you sponsor me?" 3:14.6 | A UK street at dusk: one by one, windows light up, and in each one a drawing goes up on a fridge | the call · it spreads · the windows |
| SM-50 | 3:17.8–3:20.4 · 60 | "With the help of God, I will" 3:17.8 · ◆3:17.1 the drum fill | The boy's new drawing, finished: a long table under a tree | the line · the vision begins · the table |

### VIII. The table · 3:20.4–4:12.7 · bridge · bars 61–76

From the page to the mountain. The light climbs to full gold with the drums, falls to a hush, then gathers for the
sunrise.

| Shot | Band · bars | Sound | Picture | Cut in |
|---|---|---|---|---|
| SM-51 | ◆3:20.4–3:23.6 · 61 | "You don't have to sing my song" 3:21.4, "song" 3:23.4 | Her crayon tree on the page, held | bar 61 · the challenge · the tree |
| SM-52 | 3:23.6–3:27.9 · 62–63 | "To know that this is wrong" 3:24.8, "wrong" 3:26.8 | The crayon tree's roots creep down off the edge of the paper into the red earth | bar 62 · the seed takes · the roots |
| **SM-53** ★ | 3:27.9–3:32.2 · 63–64 | "You don't need my God to see a child" 3:27.9, "God" 3:29.3 | A different child, a small boy, on another road, at another school gate, looking in, as she once did | the line · another child · the gate |
| SM-54 | 3:32.2–3:35.3 · 64–65 | "Who's been waiting forty days" 3:32.2, "forty" 3:34.2 | The same gate as days pass: the light rises and sets over him again and again, while he waits | the line · the waiting · the gate |
| **SM-55** ★ | ◆3:35.3–3:39.0 · 65–66 | "But I see a table long as the sky" 3:35.3, "table" 3:36.4, "sky" 3:37.9 | The crane up the trunk of the tree, now enormous, with the scroll reversed: the camera climbs. On "sky" it clears the canopy and the table is below | the word · the vision · the climb |
| **SM-56** ★ | 3:39.0–3:42.4 · 66–67 | "Laid on a mountain in the light" 3:39.0, "mountain" 3:39.8, "light" 3:41.2 | From above: a white-clothed table drawn like a line across a mountain, running to the horizon under the tree | the line · the place · the table |
| SM-57 | 3:42.4–3:46.1 · 67–68 | "Every nation, every tribe and tongue" 3:42.4 · ◆3:43.3 the drums double up | The places fill one by one, and on ◆3:43.3 children and families arrive from every direction, barefoot in the grass | the line · the gathering · the surge |
| **SM-58** ★ | 3:46.1–3:49.4 · 68–69 | "No colour" 3:46.4, "no border" 3:47.3, "no first" 3:48.1, "no last" 3:48.9 | Four held states, one on each phrase: faces along the table, every one in the same warm light. The film's only quick cutting | each phrase · equality · four faces |
| **SM-59** ★ | 3:49.4–3:53.8 · 69–71 | "And a chair beside her with your name on" 3:49.4, "chair" 3:49.7, "name" 3:51.4 | Push down to an empty chair beside her at the table. On its plate, a card in crayon with a blank space for a name | the line · your place · the chair |
| SM-60 | 3:53.8–3:59.6 · 71–73 | "Let the little children come" 3:53.8 and 3:57.1 · ◆3:59.6 the band drops out | Children run up the mountain toward the table from every side, the second line wider than the first | the line · the welcome · the run |
| **SM-61** ★ | ◆3:59.6–4:09.4 · 73–75 | the hush · "come" held to 4:02.9 · "Whoever welcomes one of these" 4:03.7, "welcomes" 4:04.2 · "Welcomes Me" 4:08.1, "Me" 4:08.9 | The film's still point. The whole table goes quiet. She stands. On "welcomes" she pulls out the empty chair for us, and holds it. On "Me" she looks at us | the hush · the invitation · the chair |
| SM-62 | ◆4:09.4–4:12.7 · 76 | the drum launch, no voice | Behind the mountain the sky brightens, bar by bar. The light runs along the table toward us | the launch · anticipation · the horizon |

### IX. We will · 4:12.7–4:51.8 · final chorus · bars 77–88

Full light: one light on everyone. The vow becomes everyone's.

| Shot | Band · bars | Sound | Picture | Cut in |
|---|---|---|---|---|
| **SM-63** ★ | ◆4:12.7–4:16.0 · 77 | the downbeat · "Holy" 4:13.0, "holy" 4:14.7 | On the downbeat the sun crests over the mountain: the film's one flash (two or three frames). Wide: the whole table in full gold | the downbeat · glory · the sun |
| SM-64 | 4:16.0–4:20.0 · 78–79 | "Wake us from our sleep" 4:16.6 | Along the table, faces lift into the light and sing | bar 78 · the song is everyone's · the faces |
| SM-65 | 4:20.0–4:23.3 · 79–80 | "Every face that we scrolled past" 4:20.0 | Among the guests, the people from the other homes (SM-47), and the father and his boys, seated among everyone with no place of honour | the line · we are here too · the guests |
| SM-66 | 4:23.3–4:26.5 · 80–81 | "Was You, looking at us" 4:23.3 | The whole table turns to look at us | the line · the third look · the table |
| SM-67 | 4:26.5–4:29.8 · 81–82 | "Will you sponsor me?" 4:26.5 | Close on her at the table, in the light | the call · the asker · her face |
| SM-68 | 4:29.8–4:33.1 · 82–83 | "With the help of God, we will" 4:29.8, "God" 4:31.2 | Wide: the whole table sings | the line · the answer · the table |
| **SM-69** ★ | 4:33.1–4:36.3 · 83–84 | "Will you sponsor me?" 4:33.1 | Child to child: the UK boy gives her a felt-tip, and she gives him a crayon | the call · the exchange · their hands |
| SM-70 | 4:36.3–4:39.7 · 84–85 | "With the help of God, we will" 4:36.3 | The two children laugh, side by side at the table | the line · friendship · the two |
| SM-71 | 4:39.7–4:48.5 · 85–87 | the vow round: "We will" 4:39.7, 4:44.0, 4:46.1, 4:47.8, with her calls at about 4:42.5 and 4:45 · the vocal peak at bar 86 | Four held states, one on each "We will", each wider than the last: the table runs out to the horizon and over it | each "We will" · no child left behind · the horizon |
| SM-72 | ◆4:48.5–4:51.8 · 88 | the drums drop out over a held bass | The table's gold slowly becomes dawn light. The camera tilts down from the sky to the ground | the drop · the return · the earth |

### X. Five in the morning · 4:51.8–5:27.6 · outro, whisper and end · bars 89–99

The opening frame again, warm now. The heartbeat returns.

| Shot | Band · bars | Sound | Picture | Cut in |
|---|---|---|---|---|
| **SM-73** ★ | 4:51.8–4:57.0 · 89–90 | "Five in the morning" 4:51.8 · "and the cockerel crows" 4:54.2, "cockerel" 4:54.5 | The opening shot, framed exactly as SM-01, but the dawn is warm and gold. On "cockerel" the cockerel crows. It only means morning | the word · the rhyme · the road |
| SM-74 | 4:57.0–5:01.0 · 90–92 | "She's on the road with a reading book" 4:57.0, "book" 4:58.6 | She steps out of the blue door with a book bag over her shoulder | the line · school · the blue door |
| **SM-75** ★ | 5:01.0–5:06.5 · 92–93 | "The yellow can is full beside the door" 5:01.0, "can" 5:01.5, "full" 5:03.4 | The yellow can, full of clear water, standing by the blue door: the last accent | the line · the burden lifted · the can |
| SM-76 | 5:06.5–5:11.9 · 93–94 | "And she's running" 5:06.5, "running" 5:07.0 · the guitar swell at 5:08.7 | She runs down the road toward the school roof, and out of frame. The empty road | the line · freedom · the road |
| SM-77 | 5:11.9–5:18.6 · 95–96 | "I will" 5:12.6 | The empty road in morning light, held. The dust she raised settles. Nothing else moves | the whisper · the vow · stillness |
| **SM-78** | ◆5:18.6–5:27.6 · 97–99 | the band's last swell · "I will" 5:21.8 · the end 5:27.6 | The end card fades up on the swell: "Sponsor a child today." With World Vision's agreement, their name, logo and web address. The second "I will" plays over it | the swell · the ask · the card |

**Credits.** The take ends 9 s after the end card fades up. If the credits need more room, pad the master with
silence after 5:27.6 (MUSIC.md, "The master") and re-run the analysis. The 60, 30 and 15 s cutdowns end on the same
end card (design document, section 13).

## 4. The spotting map, timed

The musical events the picture answers, in time order (CRAFT.md §9).

| Time | Bar | Event | Class | Response | Shot |
|---|---|---|---|---|---|
| 0:05.2 | 2 | the first kick | structural | direct hit: she lifts the can | SM-02 |
| 0:18.4 | 6 | the heartbeat kick and the bass begin | structural | direct hit, every bar: two footsteps | SM-04 to SM-07 |
| 0:20.9 | 6 | "cockerel" | dramatic | direct hit: the cockerel turns its head | SM-04 |
| 0:38.3 | 12 | the drums step up | structural | direct hit: lamplight on her face | SM-08 |
| 0:51.3 | 15 | "doesn't go in" | dramatic | aftermath: the empty gate | SM-12 |
| 0:57.2 | 17 | "Seven in the morning" | structural | direct hit: the hard cut to the kitchen | SM-13 |
| 1:20.3 | 24 | "scrolled" | dramatic | direct hit: the first scroll | SM-20 |
| 1:32.9 | 28 | "scrolled", the third time | dramatic | direct hit: one beat of her face, then blur | SM-23 |
| 1:34.8 | 29 | the drum fill | structural | direct hit: the phone locks | SM-24a |
| 1:37.0 | 29 | "cockerel cried" | dramatic | anticipation: it crows into the downbeat | SM-24b |
| 1:38.8 | 30 | the first "Holy" | dramatic | direct hit: she looks out of the screen | SM-25 |
| 1:52.1 | 34 | "Will you sponsor me?" | dramatic | no hit: hold | SM-27 |
| 1:57.9 | 35 | "I will" | dramatic | aftermath: the open hand | SM-28 |
| 2:04.6 | 38 | the bass drops out | structural | direct hit: the boy uncaps a felt-tip | SM-30 |
| 2:07.9 | 39 | the drums move to eighths | structural | direct hit: the coin | SM-31 |
| 2:16.6 | 40 | "ground" | dramatic | direct hit: the spade's first cut | SM-33 |
| 2:34.9 | 46 | "letterbox" | physical | direct hit: the envelope lands on the mat | SM-38 |
| 2:37.6 | 48 | the drums drop out | structural | aftermath: the drawing, held, as the music thins | SM-39 |
| 2:40.9 | 49 | the letter's hush | structural | direct hit: her doorstep | SM-40 |
| 2:54.0 | 53 | the band returns | structural | direct hit: the lion lifts its head | SM-43 |
| 3:35.3 | 65 | "But I see a table" | dramatic | direct hit: the climb begins | SM-55 |
| 3:43.3 | 68 | the drums double up | structural | direct hit: the guests arrive | SM-57 |
| 3:46.4–3:48.9 | 68–69 | "No colour, no border, no first, no last" | dramatic | direct hits: four faces | SM-58 |
| 3:51.4 | 70 | "name" | dramatic | anticipation: the push to the chair | SM-59 |
| 3:59.6 | 73 | the band drops out | structural | direct hit: the table goes still | SM-61 |
| 4:04.2 | 74 | "welcomes" | dramatic | direct hit: she pulls out the chair | SM-61 |
| 4:09.4 | 76 | the drum launch | structural | anticipation: the light gathers | SM-62 |
| 4:12.7 | 77 | the final chorus downbeat | structural | direct hit: the sunrise, the one flash | SM-63 |
| 4:39.7–4:47.8 | 85–87 | the four "We will"s | dramatic | direct hits: each a wider view | SM-71 |
| 4:48.5 | 88 | the drums drop out | structural | aftermath: gold to dawn | SM-72 |
| 4:54.5 | 89 | "cockerel crows" | dramatic | direct hit: the cockerel crows | SM-73 |
| 5:12.6 | 95 | the whispered "I will" | dramatic | no hit: the empty road | SM-77 |
| 5:18.6 | 97 | the band's last swell | structural | direct hit: the end card | SM-78 |

## 5. Concept art for ChatGPT

The aim is to find the film's look in about twenty frames, then bring them back for production. The ★ shots above
are the keyframes: together they cover every movement, every set and the film's light from dark to gold.

### 5.1 The style block (paste first, every time)

This is the design document's block, unchanged:

```
A frame from a hand-painted animated film, 16:9. Watercolour washes and broken-colour oil brushwork on warm cotton
paper, visible paper grain, soft edges that dissolve into light, one warm key light, quiet and cinematic. Clearly an
illustration, never photographic. Palette: deep night indigo, laterite red earth, dusty ochre, with one small accent
of bright yellow. Dignified and tender. No text, no logos.
Avoid: tears, flies, torn clothes, swollen bellies, pleading or begging expressions, anyone being rescued, a foreign
visitor, costume clichés.
```

For the UK kitchen frames, add: "The same painted style, but smoother, warmer and glossier: comfort." For the drawing
frames, add: "The child's drawing is in streaky felt-tip and wax crayon on paper, flat bright colour and wobbly
lines, while the world around it stays painted."

### 5.2 Character and prop sheets (make these first)

These keep the film's people and objects the same from frame to frame.

1. **The girl.** "Character sheet for a hand-painted animated film: an East African girl aged seven, shown front,
   three-quarter, profile and back, full figure. A faded dusty-rose dress, mended, bare feet, short natural hair, a
   blue bead bracelet on her left wrist. Then four head studies: steady and serious; looking straight at the viewer,
   calm; laughing; concentrating while writing. Dignified, strong, curious. Plain warm paper background."
2. **The silhouettes.** "Cast sheet of painted silhouettes, each with one accessory: a small boy under a red
   blanket; a woman in a patterned headwrap; a British father in a dressing gown, his face never shown; a seven-year-old
   British boy with a felt-tip behind his ear; a younger boy in red wellies; a well-digger with a spirit level; a nurse
   with a stethoscope; a teacher with chalk on her hands."
3. **The props.** "Prop sheet, painted: a yellow plastic water can (a jerrycan), dusty and scuffed; the same can clean
   and full of clear water; a tin cup; a padded envelope with a yellow star sticker; a pack of crayons; a pound coin;
   a mobile phone lying face up."
4. **The two drawings, as children would really draw them.** (a) "A seven-year-old British boy's felt-tip drawing of
   a smiling orange lion on white paper, streaky strokes, a wobbly mane." (b) "A seven-year-old girl's wax-crayon
   drawing: a house with a blue door, a yellow sun with a smiling face, and a tree in the corner, on lined paper."

### 5.3 The keyframes

One prompt each, after the style block. File them under their shot numbers.

| Shot | Moment | Prompt (after the style block) |
|---|---|---|
| SM-01 | the opening | Five in the morning before sunrise, a long red-earth road in rural East Africa. Deep indigo sky, a thorn tree on a far ridge, a small tin school roof. Foreground, a wooden fence with a cockerel asleep on it. Empty, vast, very still |
| SM-02 | the can | The doorway of a mud-brick home before dawn, warm lamplight inside. The silhouette of a seven-year-old girl lifting a yellow water can onto her head. The yellow can is the brightest thing in the frame |
| SM-08 | her face | Medium shot: the girl, seven, standing against her doorpost at first light, a yellow water can beside her. A pencil mark of her height on the doorpost. Serious, steady eyes. The first lamplight touches her cheek |
| SM-11 | the school | Seen from the road at dawn: a small rural school with its door open, children's silhouettes at desks inside, a teacher at a blackboard. In the foreground the girl walks past with her water can, slowing, looking in |
| SM-13 | the kitchen | Seven in the morning in a British family kitchen: rain on the window over a wet green garden, a boiler's blue pilot light. Cool grey-green outside, warm inside |
| SM-14 | the tap | A hot kitchen tap steaming into a sink, a man's hand in a dressing-gown sleeve reaching for it, composed exactly like a yellow water can carried on a head |
| SM-19 | the phone | A phone lying face up on a kitchen table beside a coffee going cold, its screen glowing cold blue-white with a painted portrait of the girl. A man's hand, only the hand, stops above it. Two pairs of children's school shoes by a door in the background |
| SM-24b | the cockerel | Dawn far away over an East African village: the silhouette of a cockerel on a fence, crowing against the first grey light. Wide and lonely |
| SM-25 | her look | A dark kitchen; on the table a phone, its screen lit with the girl's painted portrait. In the portrait she has lifted her eyes and is looking straight out of the screen at the viewer. A gold rim of light on her hair, the kitchen beginning to turn from grey to gold |
| SM-27 | the hold | Close portrait: the girl looking straight at the viewer, calm, steady and clear-eyed, not smiling and not sad. A gold rim light from behind, out of a dark indigo background. A blue bead bracelet just in frame |
| SM-33 | the ground | A spade's first cut into red earth at a new well site, the silhouette of a local well-digger leaning on it, a spirit level on a concrete form. A pound coin falling into the cut |
| SM-35 | the pump | Midday in an East African village: five children laughing at a new water pump on a concrete apron, cupping clear water in their hands. A yellow can filling under the spout. The girl among them, laughing |
| SM-39 | her drawing | Her wax-crayon drawing on lined paper (house, blue door, yellow sun with a face, a tree in the corner) laid open on a British kitchen table, family silhouettes leaning in from the edges of the frame |
| SM-40 | her letter | Late afternoon on the girl's doorstep. The door behind her is newly painted blue. She sits writing a letter slowly with a pencil, a child's felt-tip drawing of an orange lion propped against the wall beside her, a yellow can of clear water by the door |
| SM-43 | the lion | A child's felt-tip drawing of an orange lion stepping off its sheet of paper into red dust in a painted village. The lion stays in streaky felt-tip while the world around it is painted |
| SM-53 | another child | Another road and another school gate: a small boy standing at the gate looking in at a lit classroom, dignified and patient, early light |
| SM-55 | the climb | Looking up the trunk of an enormous spreading tree, its canopy glowing gold, the camera climbing toward the light |
| SM-56 | the table | From high above: a long table covered in a white cloth, like a white line drawn across a green mountain, running to the horizon under a great tree, morning light |
| SM-58 | every face | Along a long table in warm golden light: children and families of every nation side by side, every face lit by exactly the same light, barefoot in the grass |
| SM-59 | your chair | An empty wooden chair at the long table beside the girl. On its plate a card drawn in crayon with a blank space for a name |
| SM-61 | the invitation | At the long table in a quiet golden light, the girl standing and pulling out the empty chair beside her for the viewer, looking straight at us. Everyone at the table still |
| SM-63 | the sunrise | The sun cresting over a mountain behind the long table, a flare of gold light across every face, wide and glorious |
| SM-69 | child to child | At the table, a British boy aged seven handing the girl a felt-tip pen while she hands him a crayon, both laughing |
| SM-73 | the rhyme | The opening road at five in the morning again, framed exactly the same, but the dawn is warm and gold. The cockerel on the fence crowing |
| SM-75 | the can, full | A yellow water can full of clear water standing beside a blue-painted door at dawn. The last yellow |

### 5.4 What to bring back

- **For each keyframe:** the best still at the largest size offered, named by its shot (`SM-25-her-look.png`), with
  the prompt that made it.
- **The character and prop sheets,** so the girl, the cast and the props stay the same in every plate.
- **One or two rejects with a few words on why,** and any change you made to the style block.
- **Any frame where the picture you found is better than the screenplay.** Say so, and the screenplay follows the
  picture.

## 6. For production

- **The take's files are committed.** These are `takes/sponsor-me/lyrics.src.json`, `lyrics.json`, `align.json`,
  `audio.json`, `sections.film.json` and `dynamics.suno.json`. The audio is not: decode it again from the Suno
  download on the machine that renders.

  ```bash
  ffmpeg -i Sponsor_Me.m4a -map 0:a -ar 48000 -c:a pcm_s24le takes/sponsor-me/audio.wav
  ```
- **The beat grid is tracked, not constant.** `audio.json`'s beats and downbeats come from the drums. Its `bpm` and
  `beat_period` are medians, so use the beat list, not `bpm × time`, for anything that must land on a beat.
- **The plates** follow the shot table. Each movement is one or two plate files, and the shared kit holds the girl's
  rig, the cast, the sets, the felt-tip and crayon medium, and the grade per movement (design document, section 6).
- **Film QC.** Run `tools/film-qc.py` with `--take takes/sponsor-me`. SM-24a's locked phone must stay a reflective
  black screen with a glint, not a black frame. The fade-up in SM-01 starts from black: if it runs past the first
  half second, allow it with `--allow 0-3`.

## 7. Appendix: how the timing was measured

- **Stems.** Demucs htdemucs_ft on the CPU, 14 min 53 s. The stems sit at zero lag against the master.
- **The words.** Whisper large-v3-turbo on the vocal stem heard every line. The forced alignment (`analysis/`),
  checked against whisper, agrees on **476 of 488 words (98%)** with a **median deviation of 100 ms**.
  - Whisper heard the final chorus's overlapping calls only when prompted. The pitch track confirmed them: the girl's
    voice sits at 420–760 Hz against the lead's 260–310 Hz in the choruses. Because one alignment path cannot follow
    two voices, the four "We will"s were held to whisper's times by `align.json`, and the two overlapping calls are
    timed from the pitch track (about 4:42.5 and 4:45). Their confidence is low (0.43–0.66), so check them by ear in
    the edit.
- **The beats.** A beat tracker on the drum stem and the mix, starting at 72.7 bpm, puts all 143 snares within
  10 ms of a beat. The project's constant-tempo fit (72.28 bpm) missed them by 125 ms median and 340 ms at worst,
  so it was not used for the grid. The bar phase was clear: the kicks (3.2 times the mean) and the chord changes
  (3.6 times the mean) fall on the same beat of the four, and the snares fall on beats 2 and 4.
- **The dynamics.** `tools/dynamics.py`, per section (section 1).
