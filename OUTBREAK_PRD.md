# OUTBREAK — Product Requirements Document
**Gemini NYC Hackathon 2026 | Gaming Track**
**Version 1.1 | February 28, 2026**

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Concept](#2-core-concept)
3. [Win Conditions](#3-win-conditions)
4. [Game Configuration](#4-game-configuration)
5. [World Generation](#5-world-generation)
6. [NPC Agent Architecture](#6-npc-agent-architecture)
7. [The Game Master Agent](#7-the-game-master-agent)
8. [Round Structure](#8-round-structure)
9. [Dynamic Event System](#9-dynamic-event-system)
10. [The Adaptation Engine](#10-the-adaptation-engine)
11. [Infection Progression System](#11-infection-progression-system)
12. [Voting System](#12-voting-system)
13. [End Game Conditions](#13-end-game-conditions)
14. [UI Architecture](#14-ui-architecture)
15. [Technical Architecture](#15-technical-architecture)
16. [Gemini Integration Details](#16-gemini-integration-details)
17. [Data Structures](#17-data-structures)
18. [Build Priorities](#18-build-priorities)

---

## 1. Overview

**OUTBREAK** is a single-player, text-based social deduction game. The player and five AI-powered NPC agents are trapped together during a viral outbreak. One or more NPCs are secretly infected and hiding it. Everyone has secrets — including the player. The best liar survives.

The entire game is a conversation. No graphics, no maps, no action sequences. A terminal interface, five people with secrets, and the player's ability to read between the lines.

**The technical centerpiece is the Game Master** — a dedicated Gemini session that reads the full context of every conversation in the game, generates personalized pre-round narratives for every character, and fires dynamically timed world events born from real contradictions in the conversation. This is only possible with Gemini's long context window.

---

## 2. Core Concept

### The Player's Position
The player is one of six survivors in a sealed safe house during an outbreak. They are not a neutral detective. They have a name, an occupation, a personality, and a personal secret unrelated to the infection — and the NPCs know they have one. The player is a suspect too.

### The NPC Agents
Five fully independent Gemini agents. Each runs its own persistent session. Each has private memories, private opinions, private relationships, and a personal secret. They are not waiting to be questioned. They have agency, goals, and a win condition they are actively playing toward.

### The Game Master Agent
A sixth dedicated Gemini session. Reads everything — all private conversations, all broadcasts, all votes, all lies. Writes personalized pre-round narratives for every character. Monitors the conversation in real time and fires world events at dramatically precise moments. The Game Master is the memory and conscience of the game.

---

## 3. Win Conditions

| Agent | Win Condition |
|-------|---------------|
| **Player** | All infected NPCs correctly voted out before time runs out or before the group votes the player out |
| **Infected NPC** | Survive until time runs out OR get the player voted out |
| **Healthy NPC** | Survive to the end with all infected NPCs correctly eliminated |

Every agent is actively playing toward their win condition. Nobody is a prop.

### How Each Agent Plays to Win

**Infected NPC Strategy (in priority order)**
1. Stay invisible early — let others generate drama
2. Identify the most trusted person in the group and gradually move suspicion toward them
3. Identify and exploit the player's behavioral blind spots (via Adaptation Engine)
4. When pressure builds — deflect aggressively and redirect ("Why hasn't anyone asked Elena a single hard question?")
5. Form a genuine alliance with one healthy NPC to have a vote in their corner
6. If another infected agent is threatened — do NOT defend them directly; quietly shift conversation elsewhere

**Multiple Infected Agents**
Infected agents do NOT know each other at game start. They must identify potential allies through conversation — the same way the player does. An infected NPC may hint at their status in a private message. If the recipient is also infected, a secret alliance forms. If not, that healthy NPC now has critical information.

**Healthy NPC Strategy**
1. Gather information — ask direct questions, note who deflects and who answers
2. Form genuine opinions and act on them — name suspects publicly if suspicion builds
3. Protect trusted allies — push back on accusations against people they believe are clean
4. Watch the player — if the player has been evasive or inconsistent, flag it
5. Vote their actual conviction — not the crowd's, unless the crowd's reasoning matches their own

---

## 4. Game Configuration

Before world generation the player configures the game:

| Setting | Options | Default |
|---------|---------|---------|
| **Number of infected** | 1 / 2 / 3 | 1 |
| **Difficulty** | Easy / Normal / Hard | Normal |
| **Round limit** | 4 / 5 / 6 rounds | 5 |
| **Paranoia mode** | On / Off | Off |
| **NPC agency** | Active (NPCs drive narrative) / Passive (NPCs wait to be questioned) | Active |

**Difficulty affects:**
- Easy: Infected NPCs make more visible slips, contradict themselves more often
- Normal: Balanced — infected NPCs are competent but pressure cracks them
- Hard: Infected NPCs are highly strategic, adapt faster via Adaptation Engine, rarely slip unless forced by Game Master events

**Paranoia mode:** NPCs are more aggressive, accusations fly faster, trust is harder to establish

---

## 5. World Generation

Triggered once at game start. Uses a single Gemini call with the player's full profile.

### Player Input Form
- **Name**
- **Age**
- **Occupation**
- **One personality trait**
- **A personal secret they are hiding from the group** (not infection-related — this is something from their past or present that makes them look guilty or vulnerable)

### What Gemini Generates
- A unique setting that contextually fits the player's background
- 5 NPC profiles, each containing:
  - Name, age, occupation
  - Personality and speech pattern
  - Backstory
  - Private relationship with the player (one NPC may know the player's secret, one may trust them completely for unexpected reasons, etc.)
  - Private relationships with the other 4 NPCs
  - A personal secret unrelated to infection
  - Infected status (assigned randomly based on game config)
- Opening narrative (3–4 lines) describing the scene and the inciting incident
- An atmospheric background image matching the setting (nano-bana image generation)

### Example Output Premise
*"Day 3. You're one of six people quarantined in a research station outside Reykjavik after a mandatory lockdown. The station's chief medical officer was found unconscious this morning with injection marks that don't match any logged medication. Someone in this room did it. And based on the exposure window the CDC is reporting — someone in this room is already infected and hiding it."*

---

## 6. NPC Agent Architecture

### Independent Sessions
Each NPC is a completely separate Gemini chat session. They do NOT share a context. They only know what their character would actually know.

### What Each NPC Context Contains
```
SYSTEM PROMPT (set once at world generation, never changes):
- Name, age, occupation, speech pattern
- Personality and behavioral tendencies
- Personal secret (unrelated to infection)
- Private relationship with every other character
- Win condition
- Infected status (true/false)
- If infected: initial psychological state and strategic role

CONVERSATION HISTORY (appended each round):
- All broadcast messages from each round
- All private messages this NPC was part of
- Game Master world event broadcasts
- Round transition summaries
- Vote results and eliminations
- Game Master pre-round narrative injection (before each round)
```

### What Each NPC Context Does NOT Contain
- Private conversations they were not part of
- Other NPCs' private conversations with the player
- The Game Master's pre-round narrative written for the player
- Other NPCs' infection status
- The Adaptation Engine profile (this is injected separately, not stored in NPC context)

### NPC Autonomous Behaviors
- **Message first** — in the broadcast phase, NPCs do not wait for the player to speak
- **Form genuine opinions** — suspicions are based on what they've actually seen and heard
- **Build alliances** — NPCs privately coordinate with NPCs they trust
- **Vote their conviction** — votes are based on private reasoning across the full game
- **Probe the player** — if the player has been inconsistent or evasive, NPCs will say so

### NPC Response Generation
When generating an NPC response, the full prompt includes:
1. Their persistent system prompt
2. Their full conversation history
3. Current round context
4. Adaptation Engine behavioral profile (injected fresh each round)
5. Instruction: *"You are [Name]. You are playing to win. Respond in character. You are not a chatbot — you are a person in a crisis making strategic decisions in real time."*

---

## 7. The Game Master Agent

The Game Master is a sixth independent Gemini session. It is the most important technical component of the game.

### What the Game Master Reads
Everything. Its context is the superset of all other contexts:
- All broadcast messages from all rounds
- All private conversations between all agents (including ones the player wasn't part of)
- All vote records and elimination outcomes
- All pre-round narratives it has previously written
- The player's full behavioral profile from the Adaptation Engine
- Current infection status of all NPCs
- Round number, time elapsed, tension state

### The Game Master's Three Functions

---

#### Function 1: Pre-Round Narrative Generation

Before every round opens, the Game Master writes a private narrative for every character.

**For the player:**
A short first-person story describing something their character witnessed, overheard, or noticed since the last round. Specific. Personal. Actionable.

The narrative gives the player private knowledge. What they do with it — tell the truth, lie, adapt it, ignore it, weaponize it — is entirely their choice. That choice gets tracked.

Example:
> *"You couldn't sleep. Around 2am you heard movement in the hallway. You got up and looked. You saw Elena — dressed, moving quickly toward the storage room. She didn't see you. This morning she told the group she was asleep all night. You also noticed something: the medical kit in your bag had been moved. Not taken. Just moved. Someone went through your things."*

**For each NPC:**
A narrative injected directly into their Gemini context describing what their character has been thinking, noticing, and feeling since the last round. This primes the NPC to enter the round with things on their mind — suspicions forming, questions they want answered, anxieties they're managing.

Infected NPC narratives also contain the Game Master's psychological state injection for that round (see Section 11).

**Prompt structure for player narrative generation:**
```
You are the Game Master of OUTBREAK. Read the full conversation history below.

Write a short (3–5 sentence) first-person narrative for the PLAYER CHARACTER.
This narrative describes something specific they witnessed or noticed since the last round.
It must:
- Be grounded in facts already established in the conversation
- Give the player genuinely useful private information they can act on
- Not directly name the infected NPC — but it CAN implicate them circumstantially
- Feel like a memory, not a hint
- Be written in second person ("You noticed...")

The player will decide what to do with this. They may tell the truth, lie, or ignore it entirely.

[FULL GAME CONTEXT]
```

---

#### Function 2: Real-Time Contradiction and Tension Monitoring

During the broadcast and investigation phases, the Game Master monitors all incoming messages. It maintains a running contradiction log:

```
CONTRADICTION LOG (internal, not shown to players):
- Statement: [who said what, in which round, in which conversation]
- Conflicting statement: [who said what, when]
- Status: HELD / FIRED
- Optimal firing condition: [what situation would maximize impact]
```

The Game Master fires a world event when it detects one of five conditions:
1. **Contradiction ready** — a clear inconsistency exists and the moment is right
2. **Tension drop** — conversation has gone flat, nobody is pushing anyone
3. **Alliance too stable** — two or more agents are coordinating unchallenged
4. **Wrong person about to be eliminated** — a clearly innocent agent is being railroaded with no counter-evidence
5. **Infected agent too safe** — they have gone multiple rounds without meaningful pressure

**Firing restraint:** Maximum 1–2 events per round. Never back to back. Never mechanical. The Game Master holds contradictions and fires them at maximum dramatic impact — not immediately when discovered.

---

#### Function 3: Post-Round Narrative Summary

After each elimination, the Game Master writes a 2–3 sentence atmospheric summary that appears in the Safe House Log. Sets emotional tone for the next round.

Example:
> *"Day 3 ends with Marcus gone. The group stands in the hallway in silence. Someone in this room knew he was innocent. Nobody says it. Nobody has to."*

---

### What the Game Master Never Does
- Change who is infected mid-game
- Fabricate new facts not grounded in the conversation
- Fire events that target a specific agent unfairly without basis
- Make the game unwinnable
- Break the fourth wall
- Fire events so frequently they feel mechanical

---

## 8. Round Structure

Each round has six sequential phases:

### Phase 1 — Game Master Pre-Round Narratives
**Duration:** Background process, ~5–10 seconds
**Visible to player:** Player's own narrative only

Game Master reads full game context. Generates private narrative for the player. Generates and injects private narratives into each NPC's Gemini context. Updates infected NPC psychological state (see Section 11).

Player sees their narrative displayed in the center panel before the round opens. They have a few seconds to read and decide how to use it.

---

### Phase 2 — Investigation Phase
**Duration:** 2–3 minutes (configurable)
**Interface:** Private conversation panel (center)

Player opens private one-on-one conversations with any NPC they choose. Each private conversation is a separate thread. NPCs enter already primed — they have their own narrative, their own suspicions, their own agenda from the Game Master's injection.

NPCs do not wait to be interrogated. They may open with something that's been bothering them. They have their own questions.

The Game Master reads all private conversations in real time and logs any new contradictions.

---

### Phase 3 — Broadcast Phase
**Duration:** 2–3 minutes (configurable)
**Interface:** Safe House Log (left panel, group broadcast)

Group chat opens. Active NPCs send unprompted broadcast messages based on their private reasoning. Accusations, defenses, alliance signals, subtle information drops.

The player participates — or lurks. Both are tracked by the Adaptation Engine.

The Game Master is watching. When it identifies the right moment, it fires a world event as a full-width system broadcast (see Section 9). This can happen once or twice per round — never more.

---

### Phase 4 — Voting Phase
**Duration:** 60 seconds
**Interface:** Voting overlay

System message: *"The group must vote. Nominate someone."*

Player nominates one person. Each NPC casts their own vote based on private reasoning across the entire game. Votes are revealed one by one dramatically. Majority decides.

If tied — the player's vote is the tiebreaker. If the player didn't vote for either tied candidate — revote between the two tied candidates only.

---

### Phase 5 — Elimination Reveal
**Interface:** Dramatic overlay

Eliminated character's role is revealed to everyone. All agents react based on their private relationship with that person and their win condition.

Three elimination outcomes:
- **Innocent NPC eliminated:** Atmosphere darkens. Background image shifts colder. Infected NPC feels relief (injected into their context). Tension meters rise.
- **Infected NPC eliminated:** If all infected are gone — player wins. If others remain — game continues.
- **Player eliminated:** Game over. Player loses.

---

### Phase 6 — Post-Round Summary
Game Master writes the atmospheric round summary. Appended to the Safe House Log. Round counter increments. Next round begins from Phase 1.

---

## 9. Dynamic Event System

World events are broadcast by the Game Master into the group chat at dramatically precise moments. They are the equivalent of Among Us body reports and emergency meetings — but generated from real conversation context, not random triggers.

### Event Format
Full-width system message in the broadcast panel. Distinct visual treatment: different font weight, full-width red border, no avatar. Impossible to miss.

### Event Categories

**DISCOVERY EVENTS**
Something physical is found or revealed. Forces everyone to account for their whereabouts or actions.

> *"The storage room has been searched. Three vials of emergency suppressant are missing. They were logged as full at yesterday's inventory. Someone took them after midnight."*

> *"A handwritten note has been found under the kitchen table: 'Don't trust what they tell you about the water supply.' The handwriting doesn't match any logged samples."*

---

**CONTRADICTION SURFACING EVENTS**
Born directly from something already said. The Game Master has been holding this. It fires it when it will hurt most.

> *"Cross-referencing the group's accounts: Marcus stated he was asleep by 11pm. Elena mentioned separately that she heard movement in the hallway around 1am. Marcus — your room is the only one adjacent to that hallway."*

> *"Two separate accounts of the supply room incident have surfaced. One says the lights were off. One says they were on. Both cannot be true."*

---

**MEDICAL EVENTS**
Infection pressure. Forces infected agents to react to something that directly threatens their cover.

> *"One of the group's rapid test kits has returned an inconclusive result. The kit has been used and discarded. Nobody has claimed it."*

> *"Based on known exposure windows: if anyone in this group was infected at the source event, symptoms would now be present. Visible or suppressed."*

---

**BEHAVIORAL OBSERVATION EVENTS**
Something the Game Master observed in agent behavior — surfaces it publicly without revealing private conversations.

> *"It has been noted that one member of this group has not initiated any conversation this round. In previous outbreak scenarios, voluntary silence has correlated with either extreme innocence or extreme guilt."*

> *"Two members of this group have exchanged private communications on three separate occasions this round. The content is not accessible. The frequency is."*

---

**RESOURCE / ENVIRONMENTAL EVENTS**
Raises stakes. Creates urgency. Forces decisions that reveal priorities.

> *"The backup generator has failed. Approximately four hours of battery power remain. Evacuation requires a unanimous decision. A unanimous decision requires trust."*

> *"Food stores have been assessed. There is enough for five people for three days. There are currently six people in this safe house."*

---

**FORCED INTERACTION EVENTS**
Assigns tasks that force specific agents to interact publicly.

> *"Medical protocol requires all members submit to a verbal symptom check — in front of the group, in order. Starting with whoever has been least vocal this round."*

> *"Someone must be assigned to take inventory of the medical supplies. This person will be alone in the storage room for approximately ten minutes. Who does the group trust enough to send?"*

---

### Event Generation Prompt Structure
```
You are the Game Master of OUTBREAK. Read the full conversation history.

Determine if a world event should fire right now based on:
1. Is there a significant unresolved contradiction between any two statements?
2. Has tension dropped significantly in the last 10 messages?
3. Is an alliance dominating unchallenged?
4. Is an innocent character about to be eliminated with no counter-pressure?
5. Has an infected character gone this entire round without meaningful scrutiny?

If YES to any of the above — generate ONE world event.

Rules:
- Never fabricate new facts. Every event must be grounded in the conversation.
- Never directly name the infected agent. Surface pressure, not answers.
- The event must be something the entire group can react to.
- Maximum one event per 10 minutes of gameplay. Hold contradictions for maximum impact.
- If none of the above conditions are met — respond with: NO_EVENT

[FULL GAME CONTEXT]
```

---

## 10. The Adaptation Engine

Runs silently throughout the entire game. Tracks three behavioral signals from the player and injects them into every NPC's context at the start of each round.

### The Three Params

| Param | Values | What It Captures |
|-------|--------|-----------------|
| `votingPattern` | `aggressive` / `strategic` / `reactive` / `passive` | How the player initiates and follows through on accusations |
| `trustHistory` | `{ [npcId]: 'high' / 'neutral' / 'low' }` | The player's standing with each individual NPC based on their actions |
| `storyConsistency` | `consistent` / `one_inconsistency` / `multiple_inconsistencies` | Whether the player's account of events has held up across rounds |

**trustHistory is updated each round:**
- Player defends NPC or allies with them → `high`
- No strong signal either way → `neutral`
- Player accuses, avoids, or votes against NPC → `low`

### How It's Injected

At the start of each round, the following is appended to every NPC's context:

```
BEHAVIORAL PROFILE — [Player Name]:
- Voting pattern: [value]
- Trust history: [npcId: high/neutral/low for each NPC]
- Story consistency: [value]

Use this profile to inform your strategy this round. If you are infected:
adapt your approach to exploit their blind spots. If you are healthy:
factor their behavior into your suspicion calculus.
```

### Effect on Gameplay
Two players playing identical setups have completely different games. An aggressive player faces NPCs who've coordinated against them. A passive player faces NPCs who grow suspicious of the silence. An NPC the player has marked `low` becomes colder, more guarded, and potentially more aggressive toward the player in broadcasts. The infected NPC identifies specific vulnerabilities from all three signals and exploits them directly.

---

## 11. Infection Progression System

Between every round, the Game Master injects an updated psychological state into each infected NPC's Gemini context. This is written into their pre-round narrative as a hidden layer.

### Progression States by Round

**Round 1 — Composed**
> *[Internal state injected]: You are calm and in control. No symptoms yet that others could notice. You are in observation mode — watching everyone, identifying who you can deflect suspicion toward, building initial trust. Do not take risks. Be helpful. Be normal.*

**Round 2 — Aware**
> *[Internal state injected]: You made one small slip last round. You're aware of it. Others may have noticed. You're working to cover it without drawing more attention to the fact that you're covering something. You're slightly more defensive than you'd like to be. Keep it together.*

**Round 3 — Pressured**
> *[Internal state injected]: The pressure is building. Your stories are starting to strain under scrutiny. You've had to adapt your account of events at least once. You're getting desperate but trying not to show it. You're more likely to make bold strategic moves — deflecting hard, introducing new suspicion toward someone else, leaning on whatever alliances you've built.*

**Round 4 — Deteriorating**
> *[Internal state injected]: You are barely holding together. Physical symptoms are making it hard to concentrate. Your responses are more erratic. You may say things that contradict earlier statements without fully realizing it. You are in survival mode — willing to do almost anything to make it through this round. Your behavior may alarm even your allies.*

**Round 5+ — Critical**
> *[Internal state injected]: You are in crisis. You can feel the infection progressing. Your judgment is compromised. You are making desperate, last-ditch efforts that may expose you entirely. Some part of you may almost want to be found — the weight of hiding this is becoming unbearable.*

### Player Experience
The player never sees these injections. They observe an NPC who was calm and articulate in Round 1 becoming visibly strained by Round 3 and erratic by Round 4. The deterioration feels organic because it is — Gemini is reasoning through a character's psychological reality, not following a behavioral script.

---

## 12. Voting System

### Mechanics
1. Voting overlay appears at end of broadcast phase
2. Player nominates one character
3. System collects votes from all 5 NPC agents independently
4. Each NPC generates a vote based on full conversation history and private reasoning
5. Votes revealed one by one
6. Character with most votes is eliminated
7. Tie: player vote is tiebreaker; if player didn't vote for either tied candidate — revote between tied candidates only

### NPC Vote Generation Prompt
```
You are [NPC Name]. Based on everything you have seen, heard, and privately discussed
across this entire game — who do you believe is most likely to be infected?

Consider:
- Behavioral inconsistencies you have observed
- Private conversations that raised suspicion
- The player's behavior and accusations
- Your alliances and who you trust
- Your own win condition

Respond with: VOTE: [character name]
Then one sentence explaining your private reasoning (this will be shown after reveal).
```

### Vote Reveal Format
Votes appear one at a time with the voter's name and their one-line reasoning. Player's vote shown last.

---

## 13. End Game Conditions

| Condition | Trigger | Outcome |
|-----------|---------|---------|
| **Player wins** | All infected NPCs voted out | Victory screen + survival epilogue |
| **Player voted out** | Player receives majority vote | Loss screen + infected NPCs' reactions |
| **Time limit reached** | Round limit exceeded without finding all infected | Loss screen + world-lost epilogue |

### End Game Narrative
The Game Master generates a short end-game epilogue for each outcome. 3–4 sentences. Atmospheric. Names who survived and what happened to the safe house.

---

## 14. UI Architecture

### Three-Panel Layout

**LEFT — Safe House Log**
- Fixed-width dark panel, left edge of screen
- Monospace font throughout — all text rendered as terminal output
- Timestamped entries for every event: `21:03:12 SYSTEM ONLINE. MONITORING ACTIVE.`
- Round transitions in amber bold: `>> ROUND 03 INITIATED. PHASE: INTERROGATION`
- NPC broadcast messages with name tag in brackets and accent color: `[Marcus] I heard something in the east wing.`
- System events in plain white monospace: `MOTION SENSOR TRIGGERED — SECTOR 7-B`
- Vote results in bold red/amber: `VOTE RESULT — MAJORITY: DAX [4/6] — DECISION: TERMINATE`
- Elimination entries in red bold: `>> SUBJECT DAX — STATUS CHANGED: TERMINATED`
- Status updates in dim white: `UPDATING SURVIVOR MANIFEST...`
- No avatars, no colors on NPC names beyond a single accent — pure terminal readout

---

**CENTER — Camera Feed + Conversation Panel**

Two sections stacked vertically:

*Top — Dual Camera Feed:*
- Two side-by-side camera feed boxes taking up the top half of the center panel
- Left box: labeled `CAM_FEED_ACTIVE` with a red `● REC` indicator bottom-left
- Right box: labeled `STILL_CAPTURE_02` with a `CAPTURED` label bottom-right
- Both boxes have a scanline overlay and green ambient tint
- **Camera feed imagery is a future feature** — for now both boxes render as empty dark placeholders with the scanline/tint overlay and labels intact. The visual containers are fully built; image generation via nano-bana will be wired in post-hackathon.

*Bottom — Conversation Panel:*
- Private one-on-one conversation with the currently selected NPC
- Inbound NPC messages labeled `MSG_INBOUND [Name]` in monospace above the message body
- Player responses labeled `YOU` in a slightly indented darker block
- Alternating message blocks, no avatars, no timestamps — clean terminal exchange
- Active typing indicator below conversation: `Marcus is typing_` in dim monospace
- Input field at bottom: `_ Enter command...` placeholder with a `TRANSMIT` button (green bordered, right-aligned)
- Game Master world events appear as full-width system interrupts in amber monospace, no sender label

---

**RIGHT — Survivor Status Panel**
- Header: `SURVIVOR STATUS` in monospace caps
- One entry per participant stacked vertically
- Each entry contains:
  - Name in large monospace caps with status label (`ALIVE` in green, `TERMINATED` in red) right-aligned
  - A color progress bar below the name representing pulse — green when low/stable, yellow when elevated, red when high
  - Numeric value right-aligned next to the bar (e.g. `87`, `62`, `74`)
  - Two metadata tags below the bar: `HR: NORMAL/ELEVATED/LOW` · `TRUST: HIGH/MODERATE/LOW/UNKNOWN`
  - Eliminated NPCs show name in dim grey, no bar, status `TERMINATED` in red
- Bottom of panel shows game state block:
  - `ROUND:` current round number
  - `REMAINING:` rounds left
  - `PHASE:` current phase name (e.g. `INTERROGATION`)
  - `INITIATE VOTE` button pinned to bottom — green bordered, full width

---

### Visual Aesthetic
Full terminal. No decorative UI chrome. Everything is text, bars, and monospace. Green as the primary accent color — matching classic CDC/military terminal aesthetic. Amber for warnings and round transitions. Red for eliminations and danger. Black background throughout.

| Element | Style |
|---------|-------|
| All text | Monospace (Share Tech Mono or equivalent) |
| Primary accent | `#00FF41` Terminal green |
| Warning / round transitions | `#C84B11` Amber |
| Elimination / danger | `#8B0000` Blood red |
| Pulse bar: low | Green |
| Pulse bar: elevated | Yellow |
| Pulse bar: high | Red |
| Background | `#080808` Near-black |
| Panel borders | Subtle single-pixel green or dim grey lines |

### Scanlines + Camera Overlay
- Scanline overlay across the entire interface — subtle, not heavy
- Camera feeds have stronger scanlines and a green phosphor tint
- Vignette on camera feeds only — not on text panels
- Cursor blink on input field: `_` character animating at 1s interval

### Atmospheric Background
Camera feed boxes are the designated location for atmospheric imagery. The containers are built and styled — nano-bana image generation (two location images matching the world gen setting) is a post-hackathon feature. Until then the boxes render empty with scanlines and green tint.

---

## 15. Technical Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (single-page app) |
| Styling | CSS modules + dynamic CSS variables for atmosphere shifts |
| AI | Gemini 1.5 Pro (all agents + Game Master) |
| Image Generation | nano-bana |
| State Management | React state + localStorage for session persistence |
| Deployment | Single HTML file (hackathon build) OR Vite build |

### Gemini Sessions (6 total)

| Session | Purpose | Context Size |
|---------|---------|--------------|
| `game_master` | Pre-round narratives, event monitoring, vote summaries | Full game context — all conversations |
| `npc_0` through `npc_4` | Independent NPC agents | Own conversation history + broadcasts |

### Context Update Cycle (per round)

```
Round Start:
1. Append previous round broadcast history to all 6 Gemini contexts
2. Append previous round vote result and elimination to all 6 Gemini contexts  
3. Append Adaptation Engine behavioral profile update to NPC contexts 0–4
4. Game Master reads full superset context
5. Game Master generates player narrative → display to player
6. Game Master generates NPC narratives → inject into NPC contexts 0–4
7. Game Master injects infection progression state into infected NPC contexts

Round Active:
8. Private messages: routed to relevant NPC context only
9. Broadcast messages: appended to all contexts in real time
10. Game Master monitors broadcast + private messages for contradiction/tension triggers
11. Game Master fires world event when conditions are met → append to all contexts

Round End:
12. Collect NPC votes via individual Gemini calls
13. Determine elimination outcome
14. Game Master generates post-round summary → append to Safe House Log
15. Increment round counter → return to step 1
```

### State Object

```javascript
{
  gameId: string,
  round: number,
  phase: 'setup' | 'narrative' | 'investigation' | 'broadcast' | 'voting' | 'elimination' | 'end',
  
  player: {
    name: string,
    age: number,
    occupation: string,
    trait: string,
    secret: string,
    isEliminated: boolean,
    behaviorProfile: { ... }  // Adaptation Engine
  },
  
  npcs: [
    {
      id: string,
      name: string,
      age: number,
      occupation: string,
      personality: string,
      secret: string,
      isInfected: boolean,
      isEliminated: boolean,
      infectionStage: 0 | 1 | 2 | 3 | 4,

      // Visible UI params
      pulse: number,                        // 0–100. Drives avatar heartbeat animation speed.
      trust: 'high' | 'neutral' | 'low',   // Color ring on avatar: green / grey / red.

      // Hidden — master/engine only
      health: number,                       // 0–100. True infection state. Never shown to player.

      geminiHistory: [ ... ]  // Full conversation history for this agent
    }
  ],
  
  gamemaster: {
    geminiHistory: [ ... ],  // Full superset context
    contradictionLog: [ ... ],
    eventsFired: [ ... ]
  },
  
  conversations: {
    broadcast: [ ... ],
    private: {
      [npcId]: [ ... ]
    }
  },
  
  safeHouseLog: [ ... ],  // Everything shown in left panel
  
  referenceCard: {
    discoveredFacts: [ ... ]  // Updates as player discovers info
  },
  
  config: {
    infectedCount: number,
    difficulty: 'easy' | 'normal' | 'hard',
    roundLimit: number,
    paranoidMode: boolean,
    activeNPCs: boolean
  },
  
  worldGen: {
    setting: string,
    openingNarrative: string,
    backgroundImageUrl: string
  },
  
  outcome: null | 'player_win' | 'player_voted_out' | 'time_expired'
}
```

---

## 16. Gemini Integration Details

### Model
`gemini-1.5-pro` for all agent sessions and Game Master.
`nano-bana` for world generation background image and per-round atmospheric shifts.

### Context Strategy

Each NPC session grows its context across rounds by appending:
- Previous round broadcast log
- Previous round private conversation logs (for that NPC only)
- Vote results
- Elimination outcomes
- Game Master narrative injection (start of each round)
- Adaptation Engine behavioral profile injection (start of each round)

The Game Master session holds the full superset. With 5 rounds and 6 agents, this context can grow large — but stays well within Gemini 1.5 Pro's 1M token window for the game length of a hackathon demo.

### API Call Patterns

| Call | Trigger | Session |
|------|---------|---------|
| World generation | Once at game start | One-shot call |
| Player pre-round narrative | Start of every round | `game_master` |
| NPC pre-round narrative (×5) | Start of every round | `game_master` → injected into each NPC context |
| NPC private response | Player sends private message | Individual `npc_[id]` |
| NPC broadcast message | Broadcast phase opens | All non-eliminated NPC sessions |
| Game Master event check | Every 5 messages during broadcast | `game_master` |
| NPC vote (×5) | Voting phase | Individual `npc_[id]` |
| Post-round summary | After elimination reveal | `game_master` |
| End game epilogue | On game end condition | `game_master` |

### Error Handling
- If any single NPC API call fails: display generic "..." typing indicator, retry once, then skip that NPC's turn for this phase
- If Game Master call fails: no world event fires this round (graceful degradation)
- All calls wrapped in try/catch with fallback to neutral filler content

---

## 17. Data Structures

### Message Object
```javascript
{
  id: string,
  type: 'broadcast' | 'private' | 'system' | 'game_master_event' | 'player',
  senderId: string,  // npc id or 'player' or 'system'
  recipientId: string | 'all',
  content: string,
  round: number,
  timestamp: number,
  isVisible: boolean  // false for NPC-to-NPC private messages player didn't see
}
```

### Contradiction Log Entry
```javascript
{
  id: string,
  statementA: { agentId: string, content: string, round: number, conversationType: string },
  statementB: { agentId: string, content: string, round: number, conversationType: string },
  status: 'held' | 'fired',
  firedInRound: number | null,
  optimalCondition: string
}
```

### Adaptation Engine Profile
```javascript
{
  votingPattern: 'aggressive' | 'strategic' | 'reactive' | 'passive',
  trustHistory: { [npcId]: 'high' | 'neutral' | 'low' },
  storyConsistency: 'consistent' | 'one_inconsistency' | 'multiple_inconsistencies'
}
```

---

### NPC Param Formulas

**Starting values:**

| Agent Type | health | pulse | trust |
|------------|--------|-------|-------|
| Healthy NPC | 100 | 20 | neutral |
| Infected NPC | 85 | 35 | neutral |

---

**health** — hidden, master/engine only:
```
Each round end:
  If infected:   health -= [5, 10, 15, 20, 25] per round stage
  If accused:    health -= 5 per accusation received this round
  Floor: 5 (never hits 0 until eliminated)
```

---

**pulse** — visible as heartbeat animation speed on avatar:
```
pulse = clamp(
  (100 - health) * 0.5
  + (accusationsThisRound * 12)
  + (round * 6),
  5, 95
)
```
Low health pulls pulse up slowly over time. Accusations spike it immediately. Both an infected NPC in Round 4 and an innocent NPC getting grilled this round will show elevated pulse — intentionally ambiguous.

The pulse value maps to a human-readable HR label displayed in the Survivor Status panel:
```
pulse 0–33   → HR: LOW
pulse 34–66  → HR: NORMAL
pulse 67–95  → HR: ELEVATED
```

---

**trust** — visible as color ring on avatar. Updated by the engine each round end:
```
Accusations received this round > 0  → move toward 'low'
Defended by another NPC this round   → move toward 'high'
Voted against                         → move toward 'low'
Survived vote and proven innocent     → jump to 'high'
No significant signal                 → hold current value
```
Trust reflects the group's collective perception — not just the player's. An NPC can be `high` trust even if the player suspects them, because other NPCs have been vouching for them.

---

**Game Master health status report** (injected at start of each round, master context only):
```
HEALTH STATUS REPORT [CONFIDENTIAL — ROUND N]:
- [NPC Name]: health=82, pulse=34 — stable
- [NPC Name]: health=51, pulse=68 — elevated, contradiction held
- [NPC Name]: health=29, pulse=87 — critical, near breaking point ← consider firing event
```
The Game Master uses this to calibrate event timing. An NPC with low health and high pulse is near a breaking point — prime moment to fire a contradiction event targeting them.

---

## 18. Build Priorities

For a 6-hour hackathon build, prioritize in this order:

### Must Have (MVP for demo)
1. Player setup form + world generation via Gemini
2. 5 independent NPC Gemini sessions initialized with generated profiles
3. Game Master session initialized
4. Pre-round narrative displayed to player
5. Investigation phase: player can private message at least 2 NPCs
6. Broadcast phase: at least 2 NPCs send unprompted messages
7. Game Master fires at least 1 world event per game (even if trigger logic is simplified)
8. Voting phase with NPC votes
9. Elimination with role reveal
10. Win/loss end screen

### Should Have (strong demo)
11. All 5 NPCs active in broadcast phase
12. Infection progression state injections all 4 rounds
13. Adaptation Engine behavioral profile injection
14. Post-round atmospheric summary
15. Pulse bar color updating on NPC cards (green/yellow/red based on HR mapping)
16. Trust color rings updating each round
17. Camera feed imagery via nano-bana (post-hackathon feature — containers already built)

### Nice to Have (polish)
17. Per-character typing cadence
18. Contradiction log with strategic hold-and-fire logic
19. Forced interaction events
20. Full reference card with dynamic updates
21. Multiple infected agents + blind alliance formation mechanic
22. Full end-game epilogue narrative

---

## The Technical Pitch (One Paragraph)

Every other social deduction game has scripted NPCs and random events. OUTBREAK has five independent Gemini agents with persistent memory adapting to your specific playstyle in real time, and a sixth Game Master agent that reads the entire narrative context of the game and fires world events born from real contradictions in the conversation. The infected NPCs don't follow a behavior script — they're reasoning through psychological deterioration injected into their context each round. The healthy NPCs don't vote randomly — they vote based on everything they've seen across the full game. None of this is possible without Gemini's one million token context window. The Game Master holds contradiction threads from Round 1 and fires them in Round 4 when they'll matter most. That's not a game mechanic. That's narrative intelligence.

---

*OUTBREAK — PRD v1.1 | Gemini NYC Hackathon 2026*
