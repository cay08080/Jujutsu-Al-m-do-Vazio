
import React, { useState } from 'react';
import { Character, Item, CANON_TECHNIQUES, Rarity, WorldState, ANIME_TIMELINE } from '../types';

interface Props {
  character: Character;
  worldState: WorldState;
  updateCharacter: (char: Character) => void;
  onClose: () => void;
  onPvP: () => void;
}

const Hub: React.FC<Props> = ({ character, worldState, updateCharacter, onClose, onPvP }) => {
  const [activeTab, setActiveTab] = useState<'items' | 'gacha' | 'menu'>('menu');
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{name: string, rarity: Rarity} | null>(null);

  const users = JSON.parse(localStorage.getItem('jj_users') || '{}');
  const loggedInUser = Object.values(users).find((u: any) => u.character?.name === character.name) as any;

  const currentArc = ANIME_TIMELINE.find(a => a.id === worldState.currentArcId);

  const toggleImageGen = () => {
    if (loggedInUser) {
      const currentSettings = loggedInUser.settings || { imageGeneration: true };
      loggedInUser.settings = { ...currentSettings, imageGeneration: !currentSettings.imageGeneration };
      users[loggedInUser.username] = loggedInUser;
      localStorage.setItem('jj_users', JSON.stringify(users));
    }
  };

  const handlePull = () => {
    if (character.spins <= 0 || isSpinning) return;
    setIsSpinning(true);
    setResult(null);

    setTimeout(() => {
        const rand = Math.random() * 100;
        let rarity: Rarity = 'Comum';
        if (rand > 99) rarity = 'Grau Especial';
        else if (rand > 95) rarity = 'Lendário';
        else if (rand > 85) rarity = 'Épico';
        else if (rand > 60) rarity = 'Raro';

        const pool = CANON_TECHNIQUES[rarity];
        const selected = pool[Math.floor(Math.random() * pool.length)];

        setResult({ name: selected.name, rarity });
        setIsSpinning(false);
        updateCharacter({
            ...character,
            spins: character.spins - 1,
            technique: selected.name,
            techniqueDescription: selected.desc,
            techniqueMastery: 5 // Reseta domínio ao trocar técnica
        });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/98 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="max-w-6xl w-full glass-panel rounded-[3rem] border border-white/10 h-[85vh] flex flex-col relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
        
        {/* Header de Navegação */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
            <div className="flex gap-8">
                <button onClick={() => setActiveTab('menu')} className={`text-xl font-bungee transition-all ${activeTab === 'menu' ? 'text-white border-b-2 border-purple-500' : 'text-white/20 hover:text-white/40'}`}>MENU</button>
                <button onClick={() => setActiveTab('items')} className={`text-xl font-bungee transition-all ${activeTab === 'items' ? 'text-white border-b-2 border-purple-500' : 'text-white/20 hover:text-white/40'}`}>MOCHILA</button>
                <button onClick={() => setActiveTab('gacha')} className={`text-xl font-bungee transition-all ${activeTab === 'gacha' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-white/20 hover:text-white/40'}`}>DESPERTAR</button>
            </div>
            <button onClick={onClose} className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-3xl text-white/40 hover:text-white transition-all shadow-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 sm:p-12 no-scrollbar">
            {activeTab === 'menu' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full animate-in zoom-in duration-300">
                    
                    {/* COLUNA 1: STATUS DO FEITICEIRO (Compartilhável) */}
                    <div className="space-y-8">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative glass-panel rounded-[2rem] p-8 border border-white/10 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-2xl border-2 border-purple-500 overflow-hidden shadow-2xl">
                                        <img src={character.profileImageUrl} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-3xl font-marker text-white tracking-tight">{character.name}</h2>
                                        <span className="text-xs font-bungee text-purple-400 uppercase tracking-widest">{character.grade}</span>
                                        <span className="text-[10px] font-mono text-white/40">ID: {loggedInUser?.username?.toUpperCase()}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <span className="text-[8px] font-bungee text-white/30 uppercase block">Nível Atual</span>
                                        <span className="text-2xl font-bungee text-white">{character.level}</span>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <span className="text-[8px] font-bungee text-white/30 uppercase block">Arco Ativo</span>
                                        <span className="text-[10px] font-bungee text-purple-400 truncate block">{currentArc?.name}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-bungee uppercase">
                                        <span className="text-white/40">Domínio da Técnica</span>
                                        <span className="text-purple-400">{Math.floor(character.techniqueMastery)}%</span>
                                    </div>
                                    <div className="h-2 bg-black/60 rounded-full border border-white/5 p-0.5 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-600 to-blue-400 rounded-full transition-all duration-1000" style={{width: `${character.techniqueMastery}%`}}></div>
                                    </div>
                                    <p className="text-[9px] font-mono text-white/20 italic">"{character.techniqueDescription}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button className="text-[10px] font-bungee text-white/30 hover:text-white transition-all underline tracking-widest uppercase">Exportar Ficha de Receptáculo</button>
                        </div>
                    </div>

                    {/* COLUNA 2: CONFIGURAÇÕES E ARENA */}
                    <div className="flex flex-col justify-between">
                        <div className="space-y-10">
                            <div>
                                <h4 className="font-bungee text-white/40 text-xs mb-6 tracking-widest uppercase">Sistema de Imersão</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bungee text-white">Gerar Imagens com IA</span>
                                            <span className="text-[9px] font-mono text-white/40">Ativa visuais cinematográficos durante a aventura.</span>
                                        </div>
                                        <button 
                                          onClick={toggleImageGen}
                                          className={`w-14 h-8 rounded-full p-1 transition-all duration-500 ${loggedInUser?.settings?.imageGeneration !== false ? 'bg-purple-600' : 'bg-white/10'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-500 ${loggedInUser?.settings?.imageGeneration !== false ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bungee text-white/40 text-xs mb-6 tracking-widest uppercase">Equipamentos Ativos</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="aspect-square glass-panel rounded-2xl border border-white/5 flex items-center justify-center opacity-20">
                                            <span className="text-2xl">🔒</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={onPvP}
                            className="w-full py-8 bg-red-600 text-white font-bungee rounded-3xl hover:bg-red-700 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] text-xl tracking-[0.2em]"
                        >
                            ⚔️ IR PARA A ARENA
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'items' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom duration-300">
                    {character.inventory.map((item, i) => (
                        <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex gap-4 items-center group hover:border-purple-500/40 transition-all">
                            <div className="w-16 h-16 bg-black rounded-xl border border-white/5 overflow-hidden">
                                <img src={item.iconUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bungee text-[10px] text-purple-400">{item.name}</h4>
                                <p className="text-[9px] text-white/40 line-clamp-2">{item.description}</p>
                            </div>
                        </div>
                    ))}
                    {character.inventory.length === 0 && (
                        <div className="col-span-full h-64 flex flex-col items-center justify-center opacity-10">
                            <span className="text-6xl mb-4">🌪️</span>
                            <span className="font-bungee text-sm tracking-[0.5em]">VAZIO TOTAL</span>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'gacha' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-12 animate-in zoom-in duration-300">
                    <div className="relative">
                        <div className={`w-56 h-56 rounded-full border-4 border-dashed border-purple-500/20 flex items-center justify-center relative ${isSpinning ? 'animate-spin' : ''}`}>
                            {isSpinning ? (
                                <span className="text-6xl animate-pulse">🌀</span>
                            ) : result ? (
                                <div className="animate-in zoom-in text-center">
                                    <span className="block text-[10px] font-bungee text-purple-500 mb-2">{result.rarity}</span>
                                    <span className="text-3xl font-marker leading-tight text-white">{result.name}</span>
                                </div>
                            ) : (
                                <span className="text-8xl opacity-10 font-bungee">?</span>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-purple-500/5 blur-[100px] rounded-full -z-10"></div>
                    </div>

                    <div className="space-y-6 w-full max-w-sm">
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                          <span className="block text-[8px] font-bungee text-white/20 mb-2 uppercase">Spins Disponíveis</span>
                          <span className="text-4xl font-bungee text-white">{character.spins} <span className="text-purple-500">🌀</span></span>
                        </div>
                        <button 
                            onClick={handlePull}
                            disabled={character.spins <= 0 || isSpinning}
                            className="w-full py-6 bg-white text-black font-bungee rounded-2xl hover:bg-purple-600 hover:text-white transition-all shadow-2xl active:scale-95 text-xl tracking-widest"
                        >
                            {isSpinning ? 'INVOCANDO...' : 'TROCAR TÉCNICA'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Hub;
