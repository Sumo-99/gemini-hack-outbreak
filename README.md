# OUTBREAK

A single-player text-based social deduction game powered by Gemini 1.5 Pro.

**Gemini NYC Hackathon 2026 | Gaming Track**

## Overview

You and five AI-powered NPC agents are trapped together during a viral outbreak. One or more NPCs are secretly infected and hiding it. Everyone has secrets — including you. The best liar survives.

The entire game is a conversation. No graphics, no maps, no action sequences. A terminal interface, five people with secrets, and the player's ability to read between the lines.

### Technical Architecture
- **Language**: Python 3.10+
- **Framework**: FastAPI (REST + WebSockets)
- **AI Integration**: Gemini 1.5 Pro (via `google-generativeai`)
- **State Management**: In-Memory with asyncio locking

## Getting Started

### Prerequisites
- Python 3.10 or higher
- A Gemini API Key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend` directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

5. Run the FastAPI development server:
   ```bash
   uvicorn src.main:app --reload
   ```

The backend API will be available at `http://localhost:8000`.

## Game Engine Structure

- **Game Master Session**: Reads the full context of every conversation in the game, generates personalized pre-round narratives, and fires dynamically timed world events.
- **NPC Agent Sessions**: 5 fully independent Gemini sessions with private memories and win conditions.
- **Phase Engine**: Manages the 6 sequential phases of the game loop (Setup, Investigation, Broadcast, Voting, Elimination, Summary).

---
*For a full breakdown of the game mechanics, AI architecture, and Gemini integration strategy, please see `OUTBREAK_PRD.md` and `agents.md`.*
