from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal

# Common Literals
PhaseLiteral = Literal['setup', 'narrative', 'investigation', 'broadcast', 'voting', 'elimination', 'end']
TrustLevel = Literal['high', 'neutral', 'low']
VotingPattern = Literal['aggressive', 'strategic', 'reactive', 'passive']
StoryConsistency = Literal['consistent', 'one_inconsistency', 'multiple_inconsistencies']
HeartRateLevel = Literal['NORMAL', 'ELEVATED', 'LOW']
OutcomeLiteral = Literal['player_win', 'player_voted_out', 'time_expired']

class BehaviorProfile(BaseModel):
    votingPattern: VotingPattern = 'passive'
    trustHistory: Dict[str, TrustLevel] = {} # npcId -> TrustLevel
    storyConsistency: StoryConsistency = 'consistent'

class Player(BaseModel):
    id: str = "player"
    name: str
    age: int
    occupation: str
    trait: str
    secret: str
    isEliminated: bool = False
    behaviorProfile: BehaviorProfile = Field(default_factory=BehaviorProfile)

class NPC(BaseModel):
    id: str
    name: str
    age: int
    occupation: str
    personality: str
    secret: str
    isInfected: bool
    isEliminated: bool = False
    infectionStage: int = 0  # 0 to 4
    
    # Visible UI Params
    pulse: int = 20          # 0-100 heartbeat animation speed
    trust: TrustLevel = 'neutral'
    
    # Hidden engine param
    health: int = 100        # 0-100 true infection state
    
    # Session state
    geminiHistory: List[Dict] = Field(default_factory=list)

class StatementRecord(BaseModel):
    agentId: str
    content: str
    round: int
    conversationType: str

class Contradiction(BaseModel):
    id: str
    statementA: StatementRecord
    statementB: StatementRecord
    status: Literal['held', 'fired'] = 'held'
    firedInRound: Optional[int] = None
    optimalCondition: str

class GameMasterState(BaseModel):
    geminiHistory: List[Dict] = Field(default_factory=list)
    contradictionLog: List[Contradiction] = Field(default_factory=list)
    eventsFired: List[str] = Field(default_factory=list)

class Message(BaseModel):
    id: str
    type: Literal['broadcast', 'private', 'system', 'game_master_event', 'player']
    senderId: str      # 'player', 'system', or npc id
    recipientId: str   # 'all' or npc id
    content: str
    round: int
    timestamp: float
    isVisible: bool

class Conversations(BaseModel):
    broadcast: List[Message] = Field(default_factory=list)
    private: Dict[str, List[Message]] = Field(default_factory=dict) # npcId -> List[Message]

class ReferenceCard(BaseModel):
    discoveredFacts: List[str] = Field(default_factory=list)

class GameConfig(BaseModel):
    infectedCount: int = 1
    difficulty: Literal['easy', 'normal', 'hard'] = 'normal'
    roundLimit: int = 5
    paranoidMode: bool = False
    activeNPCs: bool = True

class WorldGenState(BaseModel):
    setting: str
    openingNarrative: str
    backgroundImageUrl: str = ""

class GameState(BaseModel):
    gameId: str
    round: int = 0
    phase: PhaseLiteral = 'setup'
    
    player: Player
    npcs: List[NPC]
    gamemaster: GameMasterState = Field(default_factory=GameMasterState)
    
    conversations: Conversations = Field(default_factory=Conversations)
    safeHouseLog: List[Message] = Field(default_factory=list)
    referenceCard: ReferenceCard = Field(default_factory=ReferenceCard)
    
    config: GameConfig = Field(default_factory=GameConfig)
    worldGen: Optional[WorldGenState] = None
    outcome: Optional[OutcomeLiteral] = None
