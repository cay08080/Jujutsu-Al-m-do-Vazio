
import React, { useState } from 'react';
import { Character, Origin, CANON_TECHNIQUES, Rarity, Grade } from '../types';
import { generateCharacterProfile } from '../services/geminiService';

interface Props {
  onComplete: (char: Character) => void;
}

const CharacterCreation: React.FC<Props> = ({ onComplete }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [techniqueObtained, setTechniqueObtained] = useState<{name: string, rarity: Rarity} | null>(null);

  const [char, setChar] = useState<Character>({
    name: '',
    origin: 'Humano',
    appearance: '',
    technique: '',
    techniqueDescription: '',
    techniqueMastery: 5, // Começa com 5% de domínio
    grade: 'Grau 4',
    level: 1,
    xp: 0,
    nextLevelXp: 500,
    spins: 5,
    stats: { forca: 10, energia: 10, qi: 10, sorte: 5 },
    currentHp: 200,
    currentQi: 150,
    inventory: [],
    profileImageUrl: ''
  });

  const handleOriginChange = (origin: Origin) => {
    setChar(prev => ({
      ...prev,
      origin,
      stats: origin === 'Maldição' 
        ? { forca: 15, energia: 12, qi: 15, sorte: 3 } 
        : { forca: 10, energia: 10, qi: 10, sorte: 7 }
    }));
  };

  const handleSpin = () => {
    setIsSpinning(true);
    setTechniqueObtained(null);
    
    setTimeout(() => {
      const rand = Math.random() * 100;
      let rarity: Rarity = 'Comum';
      if (rand > 99) rarity = 'Grau Especial';
      else if (rand > 95) rarity = 'Lendário';
      else if (rand > 85) rarity = 'Épico';
      else if (rand > 60) rarity = 'Raro';

      const pool = CANON_TECHNIQUES[rarity];
      const selected = pool[Math.floor(Math.random() * pool.length)];
      
      setTechniqueObtained({ name: selected.name, rarity });
      setChar(prev => ({ 
        ...prev, 
        technique: selected.name, 
        techniqueDescription: selected.desc,
        spins: prev.spins - 1 
      }));
      setIsSpinning(false);
    }, 1500);
  };

  const handleGenerateAvatar = async () => {
    if (!char.name || !char.technique) {
      alert("Você precisa de um NOME e uma TÉCNICA antes de manifestar sua forma.");
      return;
    }
    setIsGenerating(true);
    try {
      const appearancePrompt = char.appearance || "Um feiticeiro estiloso com uniforme de Jujutsu";
      const fullPrompt = `${char.origin === 'Maldição' ? 'Cursed Spirit' : 'Jujutsu Sorcerer'}, ${char.name}, technique: ${char.technique}, ${appearancePrompt}`;
      const url = await generateCharacterProfile(fullPrompt, char.name);
      if (url) {
        setChar(prev => ({ ...prev, profileImageUrl: url }));
      } else {
        alert("A energia falhou ao moldar sua forma. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o Vazio.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel p-8 sm:p-12 rounded-[3rem] border border-white/10 animate-in zoom-in duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
      <h2 className="text-4xl sm:text-6xl font-bungee text-white text-center mb-8 italic">DESPERTAR DO VAZIO</h2>
      
      <div className="space-y-6 mb-12">
        <input 
          className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-2xl font-marker text-purple-400 outline-none focus:border-purple-500 transition-all"
          placeholder="NOME DO RECEPTÁCULO"
          value={char.name}
          onChange={e => setChar({...char, name: e.target.value})}
        />
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleOriginChange('Humano')} className={`p-4 rounded-xl border-2 font-bungee transition-all ${char.origin === 'Humano' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 opacity-40 text-white/50'}`}>FEITICEIRO</button>
          <button onClick={() => handleOriginChange('Maldição')} className={`p-4 rounded-xl border-2 font-bungee transition-all ${char.origin === 'Maldição' ? 'border-red-600 bg-red-600/10 text-white' : 'border-white/5 opacity-40 text-white/50'}`}>MALDIÇÃO</button>
        </div>
      </div>

      <div className="mb-12 p-8 bg-black/40 rounded-[2rem] border border-white/5 text-center relative overflow-hidden">
        <h3 className="font-bungee text-white/40 text-xs mb-4 uppercase tracking-widest">Energia Amaldiçoada</h3>
        {isSpinning ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-t-purple-500 border-white/10 rounded-full animate-spin"></div>
          </div>
        ) : techniqueObtained ? (
          <div className="h-32 flex flex-col items-center justify-center animate-in zoom-in">
            <span className="text-[10px] font-bungee text-purple-500 mb-1">{techniqueObtained.rarity}</span>
            <span className="text-4xl font-marker text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">{techniqueObtained.name}</span>
            <button onClick={handleSpin} disabled={char.spins <= 0} className="mt-4 text-[9px] font-bungee text-white/30 hover:text-white transition-colors underline">TENTAR NOVAMENTE ({char.spins} 🌀)</button>
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center">
            <button onClick={handleSpin} className="px-8 py-4 bg-purple-600 text-white font-bungee rounded-xl hover:scale-105 transition-all shadow-lg shadow-purple-900/40">DESPERTAR TÉCNICA (1 🌀)</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 items-center">
        <div className="space-y-4">
           <textarea 
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl h-40 resize-none focus:border-purple-500 transition-all outline-none text-white text-sm"
              placeholder={char.origin === 'Humano' ? "Descreva seu visual (Uniforme, acessórios...)" : "Descreva sua forma amaldiçoada..."}
              value={char.appearance}
              onChange={e => setChar({...char, appearance: e.target.value})}
           />
           <div className="relative group">
              {!char.technique && (
                <div className="absolute -top-8 left-0 right-0 text-center animate-bounce">
                   <span className="bg-red-500 text-[8px] font-bungee text-white px-2 py-1 rounded">DESPERTE UMA TÉCNICA PRIMEIRO</span>
                </div>
              )}
              <button 
                  type="button"
                  disabled={isGenerating || !char.technique || !char.name}
                  onClick={handleGenerateAvatar}
                  className={`w-full py-4 font-bungee rounded-xl transition-all shadow-lg ${
                    char.technique && char.name 
                    ? 'bg-white text-black hover:bg-purple-500 hover:text-white' 
                    : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                  }`}
              >
                {isGenerating ? 'MOLDANDO ALMA...' : char.profileImageUrl ? 'REFAZER AVATAR' : 'MANIFESTAR FORMA'}
              </button>
           </div>
        </div>
        <div className="aspect-square bg-black/60 rounded-3xl border-2 border-dashed border-white/10 overflow-hidden relative group">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <div className="w-10 h-10 border-2 border-t-purple-500 border-white/10 rounded-full animate-spin mb-4"></div>
              <span className="font-bungee text-[10px] text-purple-500 animate-pulse text-center uppercase tracking-widest">Extraindo <br/> Essência...</span>
            </div>
          ) : char.profileImageUrl ? (
            <img src={char.profileImageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
              <span className="text-8xl mb-4">{char.origin === 'Humano' ? '🎭' : '💀'}</span>
              <span className="font-bungee text-[8px] tracking-[0.4em]">AGUARDANDO MANIFESTAÇÃO</span>
            </div>
          )}
        </div>
      </div>

      <button 
        disabled={!char.profileImageUrl || !char.technique || !char.name}
        onClick={() => {
          const finalChar = {
            ...char,
            currentHp: char.stats.forca * 20,
            currentQi: char.stats.energia * 15,
          };
          onComplete(finalChar);
        }}
        className="w-full py-6 bg-white text-black font-bungee rounded-2xl hover:bg-purple-600 hover:text-white transition-all shadow-2xl disabled:opacity-10 uppercase tracking-widest"
      >
        Entrar na Fenda
      </button>
    </div>
  );
};

export default CharacterCreation;
