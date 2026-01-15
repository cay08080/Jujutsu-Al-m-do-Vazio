
import React, { useState, useEffect } from 'react';
import { GameStage, Character, User, WorldState, ANIME_TIMELINE } from './types';
import CharacterCreation from './components/CharacterCreation';
import GameInterface from './components/GameInterface';
import PvPInterface from './components/PvPInterface';
import AuthScreen from './components/AuthScreen';

const App: React.FC = () => {
  const [stage, setStage] = useState<GameStage>(GameStage.AUTH);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | undefined>();

  const saveUserData = (updatedUser: User) => {
    const storedUsers = JSON.parse(localStorage.getItem('jj_users') || '{}');
    storedUsers[updatedUser.username] = updatedUser;
    localStorage.setItem('jj_users', JSON.stringify(storedUsers));
    setCurrentUser(updatedUser);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.character) {
      setCharacter(user.character);
      setStage(GameStage.PLAYING);
    } else {
      setStage(GameStage.START);
    }
  };

  const handleCharComplete = (char: Character) => {
    if (!currentUser) return;
    const initialWorld: WorldState = {
      currentArcId: ANIME_TIMELINE[0].id,
      arcProgress: 0,
      currentLocation: 'Portão da Escola de Jujutsu - Tokyo',
      canonDivergence: 0,
      notableChanges: [],
      votosVinculativosAtivos: [],
      deathsInCurrentArc: 0,
      npcRelationships: {} // O jogador começa sem conhecer ninguém (Aluno Novo)
    };
    const updatedUser = { ...currentUser, character: char, worldState: initialWorld };
    setCharacter(char);
    saveUserData(updatedUser);
    setStage(GameStage.PLAYING);
  };

  const handleUpdateCharacter = (newChar: Character) => {
    if (!currentUser) return;
    setCharacter(newChar);
    saveUserData({ ...currentUser, character: newChar });
  };

  const handlePermadeath = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, character: undefined, worldState: undefined };
    setCharacter(undefined);
    saveUserData(updatedUser);
    setStage(GameStage.GAMEOVER);
  };

  return (
    <div className="min-h-screen p-0 sm:p-4 flex flex-col items-center justify-center">
      {stage === GameStage.AUTH && <AuthScreen onLogin={handleLogin} />}

      {stage === GameStage.START && (
        <div className="text-center space-y-8 max-w-2xl animate-in fade-in p-4">
          <h1 className="text-5xl sm:text-7xl font-bungee text-white">JUJUTSU <br/> <span className="text-purple-500 text-3xl sm:text-5xl">LINHA DO DESTINO</span></h1>
          <p className="text-sm text-gray-400 font-marker">Receptáculo: <span className="text-white">{currentUser?.username}</span></p>
          <button onClick={() => setStage(GameStage.CHARACTER_CREATION)} className="w-full sm:w-64 py-6 bg-white text-black font-bungee rounded-2xl hover:scale-105 transition-all shadow-xl">INICIAR NOVO CICLO</button>
        </div>
      )}

      {stage === GameStage.CHARACTER_CREATION && <CharacterCreation onComplete={handleCharComplete} />}

      {stage === GameStage.PLAYING && character && (
        <GameInterface 
          character={character} 
          updateCharacter={handleUpdateCharacter} 
          onPvP={() => setStage(GameStage.PVP_BATTLE)} 
          onGameOver={handlePermadeath}
        />
      )}

      {stage === GameStage.PVP_BATTLE && character && (
        <PvPInterface player={character} onExit={() => setStage(GameStage.PLAYING)} updatePlayer={handleUpdateCharacter} />
      )}

      {stage === GameStage.GAMEOVER && (
        <div className="max-w-2xl w-full glass-panel p-16 rounded-[3rem] text-center space-y-10 animate-in zoom-in duration-700 border-2 border-red-600/30">
            <h2 className="text-6xl font-bungee text-red-600 italic">MORTE PERMANENTE</h2>
            <div className="space-y-4">
                <p className="text-xl font-marker text-white/80 italic">"Sua alma foi dispersa entre o vazio e o esquecimento. O contrato foi quebrado."</p>
                <div className="w-24 h-1 bg-red-600 mx-auto rounded-full"></div>
            </div>
            <p className="text-[10px] font-bungee text-white/30 tracking-widest uppercase">Todo o progresso e o personagem foram apagados</p>
            <button onClick={() => setStage(GameStage.START)} className="w-full py-6 bg-white text-black font-bungee rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-2xl">REENCARNAR</button>
        </div>
      )}
    </div>
  );
};

export default App;
