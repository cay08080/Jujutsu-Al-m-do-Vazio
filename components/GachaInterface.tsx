
import React, { useState } from 'react';
import { Character, Rarity } from '../types';

interface Props {
  character: Character;
  updateCharacter: (char: Character) => void;
  onClose: () => void;
}

const GachaInterface: React.FC<Props> = ({ character, updateCharacter, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{name: string, rarity: Rarity} | null>(null);

  const pull = () => {
    if (character.spins <= 0 || isSpinning) return;
    
    setIsSpinning(true);
    setResult(null);

    // Simulação de chance (IA poderia arbitrar isso melhor, mas deixamos lógico aqui)
    setTimeout(() => {
        const rand = Math.random() * 100;
        let rarity: Rarity = 'Comum';
        if (rand > 98) rarity = 'Grau Especial';
        else if (rand > 90) rarity = 'Lendário';
        else if (rand > 75) rarity = 'Épico';
        else if (rand > 50) rarity = 'Raro';

        const techniques: Record<Rarity, string[]> = {
            'Comum': ['Corte Simples', 'Reforço de Energia', 'Vigor Amaldiçoado'],
            'Raro': ['Disparo de Sangue', 'Manipulação de Sombras', 'Barreira Básica'],
            'Épico': ['Dez Sombras (Iniciante)', 'Fala Amaldiçoada', 'Técnica de Projeção'],
            'Lendário': ['Ilimitado (Básico)', 'Chamas de Desastre', 'Transfiguração'],
            'Grau Especial': ['Vazio Infinito', 'Santuário Malévolo', 'Rika: O Orbe de Maldição']
        };

        const pool = techniques[rarity];
        const name = pool[Math.floor(Math.random() * pool.length)];

        setResult({ name, rarity });
        setIsSpinning(false);
        updateCharacter({
            ...character,
            spins: character.spins - 1,
            technique: name,
            techniqueDescription: `Técnica de raridade ${rarity} obtida no Gacha.`
        });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="max-w-xl w-full glass-panel p-10 rounded-[3rem] border border-purple-500/30 text-center relative overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-2xl opacity-50 hover:opacity-100 transition-all font-bungee">×</button>
        
        <h2 className="text-4xl font-bungee text-white mb-2">GACHA INATO</h2>
        <p className="text-[10px] text-purple-500 tracking-[0.5em] uppercase mb-10">Tire a sorte no destino amaldiçoado</p>

        <div className="h-64 flex items-center justify-center relative mb-10">
            {isSpinning ? (
                <div className="w-32 h-32 border-8 border-t-purple-500 border-white/5 rounded-full animate-spin"></div>
            ) : result ? (
                <div className="animate-in zoom-in duration-500 text-center">
                    <div className="text-[10px] font-bungee text-purple-400 uppercase mb-2">{result.rarity}</div>
                    <div className="text-5xl font-marker text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">{result.name}</div>
                </div>
            ) : (
                <div className="text-white/20 font-bungee text-8xl opacity-10">?</div>
            )}
        </div>

        <div className="flex flex-col gap-4 items-center">
            <button 
                onClick={pull}
                disabled={isSpinning || character.spins <= 0}
                className="w-full py-6 bg-white text-black font-bungee rounded-2xl hover:bg-purple-600 hover:text-white transition-all shadow-xl disabled:opacity-20"
            >
                SPIN (1 🌀)
            </button>
            <p className="text-[10px] text-gray-500 font-mono">VOCÊ POSSUI {character.spins} SPINS RESTANTES</p>
        </div>
      </div>
    </div>
  );
};

export default GachaInterface;
