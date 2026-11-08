# Playtest kit: 3–5 kids aged 7–9

This kit is for a grown-up running short playtests. The game text has not been tested with real children yet. It was rewritten for 7–9 readers, but only kids playing it will show whether it works.

## Before you start

- Get a parent's or guardian's permission. Do not record faces or names. Write "Kid A", "Kid B" and so on.
- Use one computer with a mouse and speakers. Run `npm run dev` and open the home page.
- Leave **How old are you?** on **Cadet (7–9)** and keep Pip turned on.
- Plan 20–30 minutes per kid, with at most 2 chapters each. Stop early if they get bored or upset. That tells you something too.
- Spread the chapters across kids so each one gets played by at least 2 of them.

## How to run a session

1. Say: "This is a game about being an astronaut. I'm testing the game, not you. You can't get anything wrong."
2. Let them play. **Do not help** unless they have been stuck for 60 seconds. If you have to help, write down what you said.
3. Ask them to "think out loud": "Tell me what you're trying to do."
4. Afterwards, ask the comprehension questions for that chapter (below), then the 3 smiley questions.

## Observation sheet (one per kid per chapter)

| Time | What happened | Stuck? (sec) | Read Pip? | Clicked 🔊? | Quote |
|---|---|---|---|---|---|
| | | | | | |

Mark these when they happen:

- [ ] Skipped a dialog without reading it
- [ ] Asked "what does ___ mean?" (write the word)
- [ ] Read Pip's tip, or looked at Pip
- [ ] Used the 🔊 Read button
- [ ] Got lost walking (did not know where to go)
- [ ] Hit a time or power fail state
- [ ] Smiled, laughed, or said "cool"
- [ ] Wanted to stop

## Comprehension questions (ask after the chapter)

A kid "gets it" when they can say the idea in their own words. Exact words don't matter.

| Chapter | Question | Good answer sounds like |
|---|---|---|
| 01 Orbit | Why did you turn off the antenna power before fixing it? | So it's safe / you don't get shocked |
| 01 Orbit | Why go slow when docking? | So you don't crash into the station |
| 02 Storm | Why did you clean the solar panels? | Dust blocks the sunlight, so they make less power |
| 02 Storm | What happened to the sunlight when the storm came? | It got dark / less power |
| 03 Rover | Why keep battery for the trip home? | So you don't get stuck far away |
| 03 Rover | Why take a wide photo and a close photo? | To see the whole place and the small details |
| Sun storm (safe room) | Why put water bags around the room? | Water blocks the radiation |
| Greenhouse | What do plants need to grow? | Light and water |
| Earth delay | Why not just wait for Earth to tell you what to do? | Messages take a long time, so you have to make a plan yourself |
| Moon sunlight | Where did you put the solar panel, and why? | Where the sun reaches / not in the shadow |
| Moon dust | Why keep Moon dust out of the base? | It's sharp / sticky / bad to breathe |
| Moon relay | How did the message get over the hill? | The relay on the hill passed it along |
| Base boss (30 days) | Why test the mushroom before eating it? | It might be bad for you |

## Smiley questions (point to a face: 😀 🙂 😐 🙁)

1. How fun was it?
2. How easy was it to know what to do next?
3. Would you play the next chapter?

## What to change afterwards

| If you see… | Change this |
|---|---|
| Kids run out of time or power in most runs | Give more time or power in `CADET_TUNING` in `simulation/difficulty.js` (for example storm `prepSeconds`, rover `drainScale`). |
| Kids win without thinking | Make the Cadet values a bit tighter, a little at a time. |
| A word gets asked about by 2+ kids | Swap it for a simpler word in that chapter's text and dialogue files. |
| Kids ignore Pip | Make the tip shorter, or check that it matches the step (`companion-tips.js`). `test/kid-data.test.js` checks that every objective has a tip. |
| Kids get lost walking | Make the marker bigger or brighter for that step. |
| Wrong comprehension answers for a chapter | Rewrite that chapter's "Think about it" and debrief text. Then test it again with a new kid. |

Rule of thumb: change one thing at a time, and test the change with at least 2 more kids.
