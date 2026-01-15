import React, { useState, useEffect, useRef } from 'react';
// Fix: Removed non-existent EnemyState from imports
import { Character, GameMessage, WorldState, Item, ANIME_TIMELINE, NPCRelationship, User } from '../types';
import { generateNarrative, generateSceneImage } from '../services/geminiService';
import Hub from './Inventory';

interface Props {
  character: Character;
  updateCharacter: (char: Character) => void;
  onPvP: () => void;
  onGameOver: () => void;
}

const StatusBar = ({ value, max, color, label, icon }: any) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const isCritical = percentage < 20;
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className="flex justify-between items-center px-1">
        <span className="text-[7px] font-bungee text-white/40 tracking-widest flex items-center gap-1">
            {icon} {label}
        </span>
        <span className="text-[9px] font-mono text-white/70">{Math.floor(value)}</span>
      </div>
      <div className="h-2 rounded-sm bg-black/80 border border-white/10 overflow-hidden relative p-[1px]">
        <div 
          className={`h-full ${color} transition-all duration-1000 relative ${isCritical ? 'animate-critical' : ''}`} 
          style={{ width: `${percentage}%` }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

const GameInterface: React.FC<Props> = ({ character, updateCharacter, onPvP, onGameOver }) => {
  const [history, setHistory] = useState<GameMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [showBonds, setShowBonds] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(["Falar com recepcionista", "Olhar arredores"]);
  const [shake, setShake] = useState(false);
  
  const users = JSON.parse(localStorage.getItem('jj_users') || '{}');
  const loggedInUser = Object.values(users).find((u: any) => u.character?.name === character.name) as any;
  
  const initialWorld: WorldState = loggedInUser?.worldState || {
      currentArcId: ANIME_TIMELINE[0].id,
      arcProgress: 0,
      currentLocation: "Portão da Escola de Jujutsu",
      canonDivergence: 0,
      notableChanges: [],
      votosVinculativosAtivos: [],
      deathsInCurrentArc: 0,
      npcRelationships: {}
  };

  const [worldState, setWorldState] = useState<WorldState>(initialWorld);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history.length === 0) handleAction("Chegar na Escola de Jujutsu");
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    if (loggedInUser) {
        loggedInUser.worldState = worldState;
        users[loggedInUser.username] = loggedInUser;
        localStorage.setItem('jj_users', JSON.stringify(users));
    }
  }, [history, isThinking, worldState]);

  const handleAction = async (action: string) => {
    if (isThinking) return;
    setIsThinking(true);
    if (action.length > 0 && !action.startsWith("SYSTEM")) {
        setHistory(prev => [...prev, { role: 'player', content: action }]);
    }

    try {
      const response = await generateNarrative(character, history, action, worldState);
      let newChar = { ...character };
      
      if (response.kokusen) {
          setShake(true);
          setTimeout(() => setShake(false), 1000);
      }

      if (response.npcUpdate) {
          setWorldState(prev => {
              const updated = { ...prev.npcRelationships };
              const name = response.npcUpdate.name;
              updated[name] = {
                  ...(updated[name] || { name, affinity: 0, status: "Novo Conhecido", isAlive: true, currentLocation: "Desconhecido", lastInteractionSummary: "" }),
                  affinity: Math.max(0, Math.min(100, (updated[name]?.affinity || 0) + response.npcUpdate.affinityDelta)),
                  status: response.npcUpdate.newStatus || updated[name]?.status,
                  isAlive: response.npcUpdate.isAlive !== undefined ? response.npcUpdate.isAlive : true
              };
              return { ...prev, npcRelationships: updated };
          });
      }

      if (response.actionEvaluation) {
          newChar.currentHp = Math.max(0, Math.min(newChar.stats.forca * 20, newChar.currentHp + (response.hpChange || 0)));
          newChar.currentQi = Math.max(0, Math.min(newChar.stats.energia * 15, newChar.currentQi - (response.actionEvaluation.qiCost || 0)));
          newChar.xp += (response.xpGain || 0);
          
          // Lógica de domínio: +0.5% por ação de sucesso
          if (response.actionEvaluation.status !== 'ERRO') {
            newChar.techniqueMastery = Math.min(100, newChar.techniqueMastery + 0.5);
          }
          
          if (newChar.currentHp <= 0 || response.isFatalBlow) {
              onGameOver();
              return;
          }
      }

      if (response.arcProgressGain) {
          setWorldState(prev => ({ ...prev, arcProgress: Math.min(100, prev.arcProgress + response.arcProgressGain) }));
      }

      // Somente gera imagem se a configuração permitir
      const shouldGenImage = loggedInUser?.settings?.imageGeneration !== false;
      const imageUrl = (shouldGenImage && response.imagePrompt) ? await generateSceneImage(response.imagePrompt) : undefined;
      
      setHistory(prev => [...prev, { 
          role: 'narrator', 
          content: response.narrative, 
          imageUrl, 
          kokusen: response.kokusen,
          consequence: response.butterflyConsequence,
          npcIntervention: response.interventionOccurred,
          sources: response.sources
      }]);
      updateCharacter(newChar);
      if (response.suggestions) setSuggestions(response.suggestions);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'narrator', content: "O fluxo de energia falhou." }]);
    } finally {
      setIsThinking(false);
      setInput('');
    }
  };

  return (
    <div className={`flex flex-col h-screen w-full max-w-6xl mx-auto overflow-hidden relative ${shake ? 'shake' : ''}`}>
      
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none">
          <div className="flex justify-between items-start max-w-4xl mx-auto w-full gap-4">
              <div className="glass-panel p-3 rounded-2xl border border-white/10 w-48 md:w-64 pointer-events-auto shadow-2xl">
                  <div className="flex items-center gap-3 mb-2">
                      <img src={character.profileImageUrl} className="w-10 h-10 rounded-lg border border-purple-500 object-cover" />
                      <div>
                          <div className="text-[10px] font-bungee text-white leading-none mb-0.5">{character.name}</div>
                          <div className="text-[8px] font-mono text-purple-400">LVL {character.level} • {character.grade}</div>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <StatusBar value={character.currentHp} max={character.stats.forca * 20} color="bg-red-500" label="VITALIDADE" icon="❤️" />
                      <StatusBar value={character.currentQi} max={character.stats.energia * 15} color="bg-blue-500" label="ENERGIA" icon="✨" />
                  </div>
              </div>

              <div className="flex flex-col items-end gap-2 pointer-events-auto">
                  <div className="glass-panel px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-lg">
                      <span className="text-[8px] font-bungee text-white/40">ARCO:</span>
                      <span className="text-[9px] font-bungee text-purple-400 truncate max-w-[80px]">
                        {ANIME_TIMELINE.find(a => a.id === worldState.currentArcId)?.name}
                      </span>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setShowBonds(true)} className="p-3 glass-panel rounded-xl border border-white/10 text-lg hover:bg-white/5 active:scale-90 transition-all shadow-lg">👥</button>
                      <button onClick={() => setShowHub(true)} className="p-3 glass-panel rounded-xl border border-white/10 text-lg hover:bg-white/5 active:scale-90 transition-all shadow-lg">⚙️</button>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-44 pb-48 px-4 md:px-12 space-y-10 no-scrollbar" ref={scrollRef}>
          {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'player' ? 'justify-end' : 'justify-start'} animate-message ${msg.kokusen ? 'kokusen-active' : ''}`}>
                  <div className={`max-w-2xl w-full p-8 rounded-[2.5rem] border shadow-2xl ${
                      msg.role === 'player' 
                      ? 'bg-purple-900/10 border-purple-500/30 text-purple-100 font-marker text-2xl text-right' 
                      : 'bg-black/60 border-white/5 text-gray-200 backdrop-blur-md'
                  }`}>
                      {msg.imageUrl && (
                          <div className="relative group mb-6">
                              <img src={msg.imageUrl} className="w-full rounded-3xl border border-white/10 cursor-zoom-in" onClick={() => setExpandedImage(msg.imageUrl!)} />
                          </div>
                      )}
                      
                      {msg.npcIntervention && (
                          <div className="mb-6 p-4 bg-purple-600/20 border border-purple-500/50 rounded-2xl flex items-center gap-4 animate-pulse">
                              <div className="text-2xl">⚡</div>
                              <div className="flex flex-col">
                                  <span className="text-[9px] font-bungee text-purple-400 uppercase">Resgate</span>
                                  <span className="text-sm font-marker text-white">{msg.npcIntervention} chegou!</span>
                              </div>
                          </div>
                      )}

                      <div className="text-xl md:text-2xl leading-relaxed whitespace-pre-wrap font-inter font-medium tracking-tight">
                          {msg.content}
                      </div>

                      {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-6 border-t border-white/10 pt-4">
                              <div className="flex flex-wrap gap-2">
                                  {msg.sources.map((source, sIdx) => (
                                      <a key={sIdx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-400 bg-purple-500/5 border border-purple-500/20 px-2 py-1 rounded-md">
                                          {source.title}
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          ))}
          {isThinking && (
              <div className="flex justify-center py-10">
                  <div className="flex items-center gap-3 glass-panel px-6 py-3 rounded-full border border-purple-500/30">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <span className="text-[9px] font-bungee text-purple-500 tracking-[0.3em] ml-2 uppercase">Narrando...</span>
                  </div>
              </div>
          )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-50 p-4 pb-8 md:p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {suggestions.map((s, idx) => (
                      <button key={idx} onClick={() => handleAction(s)} disabled={isThinking} className="px-5 py-2.5 glass-panel border border-white/5 rounded-full text-[9px] font-bungee text-white/40 hover:text-white hover:border-purple-500 transition-all uppercase whitespace-nowrap active:scale-95">
                          {s}
                      </button>
                  ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); if(input.trim()) handleAction(input); }} className="flex gap-3">
                  <input className="flex-1 glass-panel border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-purple-500 outline-none transition-all font-inter text-lg shadow-2xl" placeholder="Ação..." value={input} onChange={e => setInput(e.target.value)} disabled={isThinking} />
                  <button disabled={isThinking || !input.trim()} className="px-10 bg-white text-black font-bungee rounded-2xl hover:bg-purple-600 hover:text-white transition-all active:scale-95 shadow-xl text-sm">ENVIAR</button>
              </form>
          </div>
      </div>

      {showBonds && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="w-full max-w-2xl glass-panel rounded-[3rem] border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-bungee text-white text-xl uppercase">Vínculos</h3>
                      <button onClick={() => setShowBonds(false)} className="text-3xl text-white/40">×</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-4">
                      {Object.values(worldState.npcRelationships).length === 0 ? (
                          <div className="text-center opacity-20 py-20 font-bungee">Nenhum encontro ainda.</div>
                      ) : (
                          (Object.values(worldState.npcRelationships) as NPCRelationship[]).map((npc, i) => (
                              <div key={i} className="p-6 rounded-3xl border bg-white/5 border-white/5">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="font-marker text-2xl text-white">{npc.name}</span>
                                      <span className="text-[10px] font-bungee text-purple-400">{npc.affinity}%</span>
                                  </div>
                                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500" style={{width: `${npc.affinity}%`}}></div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {showHub && (
        <Hub 
          character={character} 
          worldState={worldState}
          updateCharacter={updateCharacter} 
          onClose={() => setShowHub(false)} 
          onPvP={() => { setShowHub(false); onPvP(); }}
        />
      )}
    </div>
  );
};

export default GameInterface;