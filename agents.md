# OUTBREAK Backend Architecture & Agent Orchestration

## Tech Stack
- **Language**: Python 3.10+
- **Framework**: FastAPI (for REST routes + WebSockets)
- **AI Integration**: `google-generativeai` (Gemini 1.5 Pro)
- **State Management**: In-Memory (Dict/Classes) with Mutexes for concurrency
- **Real-time Comm**: FastAPI WebSockets (`Starlette`)

## Core Pillars & Tasks

### 1. State Management & Concurrency
- [ ] Define Pydantic models for `GameState`, `Phase`, `Player`, `NPC`, and `GameMaster`.
- [ ] Implement an in-memory `GameStore` dictionary keyed by `gameId`.
- [ ] Implement `asyncio.Lock` per game session to prevent race conditions during concurrent broadcast messages and GM contradiction logs.

### 2. Real-Time Communication Layer (WebSockets)
- [ ] Setup FastAPI WebSocket endpoints (`/ws/{gameId}/{clientId}`).
- [ ] Implement a `ConnectionManager` to broadcast events (`new_message`, `gm_event`, `phase_change`, `npc_typing`) to active clients.
- [ ] Route incoming WebSocket actions (`player_message`, `vote`) to the phase event loop.

### 3. LLM Orchestration & Context Management
**Manual Context Building Strategy**
We will NOT use the built-in Gemini SDK chat manager. Everything is stateless from the SDK's perspective. Each generation request will build a strict prompt list:
  1. Base Character Persona/Instructions
  2. Hidden States (Psychological degradation for infected, trust levels)
  3. Formatted chat history relevant ONLY to that specific agent.

**Tasks:**
- [ ] Implement `ContextBuilder` utility to dynamically construct prompts based on the current `GameState`.
- [ ] Implement `GeminiClient` wrapper for API rate limit handling, retries, and fallback text generation.
- [ ] Implement `GameMasterAgent` logic (Pre-round narratives, Contradiction Event checks, Post-round summaries).
- [ ] Implement `NPCAgent` logic (Private chat responses, broadcast messages, voting).

### 4. Phase Engine & Event Loop
- [ ] Setup State Machine for the 6 phases.
- [ ] **Setup Phase**: Generate initial player narrative and NPC profiles.
- [ ] **Investigation Phase**: Handle 1-on-1 private messaging routing.
- [ ] **Broadcast Phase**: Implement randomized `asyncio.sleep` delays for unprompted NPC messages. 
- [ ] **GM Event Trigger**: Hook into every 5th broadcast message to run the `GameMaster.check_for_events()` logic asynchronously.
- [ ] **Voting & Elimination Phase**: Collect player vote, request all 5 NPC votes in parallel, calculate, and transition to Elimination Reveal.
