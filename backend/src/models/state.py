from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class Phase(str, Enum):
    SETUP = "setup"
    INVESTIGATION = "investigation"
    BROADCAST = "broadcast"
    VOTING = "voting"
    ELIMINATION = "elimination"
    SUMMARY = "summary"
    END = "end"

class BehaviorProfile(BaseModel):
    voting_pattern: str = "passive"
    trust_history: Dict[str, str] = Field(default_factory=dict)
    story_consistency: str = "consistent"

class Player(BaseModel):
    name: str = ""
    age: int = 0
    occupation: str = ""
    trait: str = ""
    secret: str = ""
    is_eliminated: bool = False
    behavior_profile: BehaviorProfile = Field(default_factory=BehaviorProfile)

class NPC(BaseModel):
    id: str
    name: str
    age: int
    occupation: str
    personality: str
    secret: str
    is_infected: bool = False
    is_eliminated: bool = False
    infection_stage: int = 0
    pulse: int = 70
    trust: str = "neutral"
    health: int = 100
    gemini_history: List[Dict[str, Any]] = Field(default_factory=list)

class GameMaster(BaseModel):
    gemini_history: List[Dict[str, Any]] = Field(default_factory=list)
    contradiction_log: List[Dict[str, Any]] = Field(default_factory=list)
    events_fired: List[Dict[str, Any]] = Field(default_factory=list)

class Conversations(BaseModel):
    broadcast: List[Dict[str, Any]] = Field(default_factory=list)
    private: Dict[str, List[Dict[str, Any]]] = Field(default_factory=dict)

class Config(BaseModel):
    infected_count: int = 1
    difficulty: str = "normal"
    round_limit: int = 5
    paranoid_mode: bool = False
    active_npcs: bool = True

class GameState(BaseModel):
    game_id: str
    round: int = 1
    phase: Phase = Phase.SETUP
    config: Config = Field(default_factory=Config)
    player: Player = Field(default_factory=Player)
    npcs: List[NPC] = Field(default_factory=list)
    gamemaster: GameMaster = Field(default_factory=GameMaster)
    conversations: Conversations = Field(default_factory=Conversations)
    safe_house_log: List[Dict[str, Any]] = Field(default_factory=list)
    outcome: Optional[str] = None
