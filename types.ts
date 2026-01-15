
export enum GameStage {
  AUTH = 'AUTH',
  START = 'START',
  CHARACTER_CREATION = 'CHARACTER_CREATION',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  GACHA = 'GACHA',
  PVP_BATTLE = 'PVP_BATTLE'
}

export type Grade = 
  | 'Grau 4' 
  | 'Semi-Grau 3' 
  | 'Grau 3' 
  | 'Semi-Grau 2' 
  | 'Grau 2' 
  | 'Semi-Grau 1' 
  | 'Grau 1' 
  | 'Grau Especial';

export type Rarity = 'Comum' | 'Raro' | 'Épico' | 'Lendário' | 'Grau Especial';
export type Slot = 'Arma' | 'Vestimenta' | 'Amuleto';
export type Origin = 'Humano' | 'Maldição';

export interface NPCRelationship {
  name: string;
  affinity: number;
  status: string;
  isAlive: boolean;
  currentLocation: string;
  lastInteractionSummary: string;
}

export interface User {
  username: string;
  password?: string;
  character?: Character;
  worldState?: WorldState;
  settings?: {
    imageGeneration: boolean;
  };
  pvpStats: {
    points: number;
    wins: number;
    losses: number;
    rankName: string;
  };
  createdAt: number;
}

export interface ArcDefinition {
  id: string;
  name: string;
  description: string;
  milestones: string[];
}

export const ANIME_TIMELINE: ArcDefinition[] = [
  { 
    id: 'intro', 
    name: 'O Início do Fim', 
    description: 'A descoberta da energia amaldiçoada.',
    milestones: ['Despertar', 'Primeiro Extermínio']
  },
  { 
    id: 'shibuya',
    name: 'Incidente em Shibuya',
    description: 'O caos absoluto em Tokyo.',
    milestones: ['Selamento de Gojo', 'Massacre de Sukuna']
  }
];

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  slot: Slot;
  bonus: { forca?: number; energia?: number; qi?: number; sorte?: number; };
  iconUrl?: string;
}

export interface ActionEvaluation {
  status: 'ACERTO' | 'ERRO' | 'CRÍTICO';
  damageDealt: number;
  qiCost: number;
}

export interface WorldState {
  currentArcId: string;
  arcProgress: number; 
  currentLocation: string;
  canonDivergence: number; 
  notableChanges: string[]; 
  votosVinculativosAtivos: string[];
  deathsInCurrentArc: number;
  npcRelationships: Record<string, NPCRelationship>;
}

export interface Character {
  name: string;
  origin: Origin;
  appearance: string;
  technique: string;
  techniqueDescription: string;
  techniqueMastery: number;
  grade: Grade;
  level: number;
  xp: number;
  nextLevelXp: number;
  spins: number;
  profileImageUrl?: string;
  stats: { forca: number; energia: number; qi: number; sorte: number; };
  currentHp: number;
  currentQi: number;
  inventory: Item[];
}

export interface GameMessage {
  role: 'narrator' | 'player' | 'opponent';
  content: string;
  imageUrl?: string;
  actionEvaluation?: ActionEvaluation;
  kokusen?: boolean;
  xpGain?: number;
  sources?: { title: string; uri: string; }[];
  consequence?: string;
  npcIntervention?: string;
}

export const CANON_GRADES: Grade[] = ['Grau 4', 'Semi-Grau 3', 'Grau 3', 'Semi-Grau 2', 'Grau 2', 'Semi-Grau 1', 'Grau 1', 'Grau Especial'];

export const CANON_TECHNIQUES: Record<Rarity, { name: string, desc: string }[]> = {
  'Comum': [{ name: 'Corte Simples', desc: 'Barreira defensiva.' }, { name: 'Reforço', desc: 'Energia pura.' }],
  'Raro': [{ name: 'Manipulação de Sangue', desc: 'Kamo Style.' }, { name: 'Fala Amaldiçoada', desc: 'Inumaki Style.' }],
  'Épico': [{ name: 'Boogie Woogie', desc: 'Todo Style.' }, { name: 'Ratio', desc: 'Nanami Style.' }],
  'Lendário': [{ name: 'Dez Sombras', desc: 'Fushiguro Style.' }, { name: 'Star Rage', desc: 'Yuki Style.' }],
  'Grau Especial': [{ name: 'Ilimitado', desc: 'Gojo Style.' }, { name: 'Santuário', desc: 'Sukuna Style.' }]
};
