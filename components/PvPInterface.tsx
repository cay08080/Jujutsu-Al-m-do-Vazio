
import React, { useState, useEffect } from 'react';
import { Character, GameMessage, User } from '../types';
import { arbitratePvP, generateSceneImage } from '../services/geminiService';

interface Props {
  player: Character;
  onExit: () => void;
  updatePlayer: (char: Character) => void;
}

const MiniStatusBar = ({ value, max, color, label }: any) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <div className="flex justify-between items-center text-[7px] font-bungee px-1">
          <span className="text-white/40">{label}</span>
          <span className="text-white/60">{Math.floor(value)} / {Math.floor(max)}</span>
      </div>
      <div className="h-2 bg-black/60 rounded-full border border-white/5 overflow-hidden p-[1px]">
        <div className={`h-full ${color} transition-all duration-700 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const PvPInterface: React.FC<Props> = ({ player, onExit, updatePlayer }) => {
  const [mode, setMode] = useState<'LOBBY' | 'SEARCHING' | 'BATTLE'>('LOBBY');
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<Character | null>(null);
  const [playerAction, setPlayerAction] = useState('');
  const [battleHistory, setBattleHistory] = useState<GameMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [battleImage, setBattleImage] = useState<string | undefined>();
  const [matchTimer, setMatchTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (mode === 'SEARCHING') {
      interval = setInterval(() => {
        setMatchTimer(prev => prev + 1);
        
        // Simulação de busca: Verifica se há algum "outro" jogador disponível no localStorage
        const users = JSON.parse(localStorage.getItem('jj_users') || '{}');
        const others = Object.values(users)
          .map((u: any) => u.character)
          .filter(c => c && c.name !== player.name);

        // Se encontrou alguém e passou um tempo de "matchmaking"
        if (others.length > 0 && Math.random() > 0.95) {
          const opp = others[Math.floor(Math.random() * others.length)];
          setOpponent(opp);
          setMode('BATTLE');
          setBattleHistory([{ role: 'narrator', content: `O destino se cruzou. ${opp.name} (${opp.origin}) surge para o duelo!` }]);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, player.name]);

  useEffect(() => {
    if (matchTimer >= 180) { // 3 minutos
      alert("Busca cancelada: Nenhum feiticeiro ou maldição encontrado no momento.");
      setMode('LOBBY');
      setMatchTimer(0);
    }
  }, [matchTimer]);

  const handleCreateRoom = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCreatedRoomCode(code);
    // Registra a sala no localStorage para simular "online"
    const rooms = JSON.parse(localStorage.getItem('jj_rooms') || '{}');
    rooms[code] = { host: player.name, timestamp: Date.now() };
    localStorage.setItem('jj_rooms', JSON.stringify(rooms));
    
    setMode('SEARCHING');
  };

  const handleJoinRoom = () => {
    const rooms = JSON.parse(localStorage.getItem('jj_rooms') || '{}');
    const room = rooms[roomCode];
    if (room) {
      const users = JSON.parse(localStorage.getItem('jj_users') || '{}');
      const hostUser = Object.values(users).find((u: any) => u.character?.name === room.host) as any;
      if (hostUser && hostUser.character) {
        setOpponent(hostUser.character);
        setMode('BATTLE');
        setBattleHistory([{ role: 'narrator', content: `Invasão confirmada. Você desafiou ${hostUser.character.name}!` }]);
      } else {
        alert("O mestre da sala não foi encontrado.");
      }
    } else {
      alert("Sala privada não encontrada ou código expirado.");
    }
  };

  const handleTurn = async () => {
    if (!playerAction || !opponent || isThinking) return;
    setIsThinking(true);

    try {
      // IA arbitra a ação do oponente baseada na técnica dele
      const oppActions = [
        `Usa sua técnica ${opponent.technique} de forma agressiva`,
        "Tenta um contra-ataque focado em brechas",
        "Concentra energia para um golpe massivo",
        "Tenta desviar e recuperar postura"
      ];
      const randomOppAction = oppActions[Math.floor(Math.random() * oppActions.length)];

      const result = await arbitratePvP(player, opponent, playerAction, randomOppAction);
      
      const newImg = await generateSceneImage(`Combate épico entre ${player.name} e ${opponent.name}: ${result.narrative}`);
      setBattleImage(newImg);

      setBattleHistory(prev => [
        ...prev,
        { role: 'player', content: playerAction },
        { role: 'opponent', content: randomOppAction },
        { role: 'narrator', content: result.narrative, kokusen: result.kokusen }
      ]);

      // Atualiza Player
      const updatedPlayer = {
        ...player,
        currentHp: Math.max(0, player.currentHp - result.p1Damage),
        currentQi: Math.max(0, player.currentQi - result.p1QiCost)
      };
      updatePlayer(updatedPlayer);

      // Atualiza Oponente (Simulado)
      setOpponent(prev => prev ? ({
        ...prev,
        currentHp: Math.max(0, prev.currentHp - result.p2Damage),
        currentQi: Math.max(0, prev.currentQi - (result.p2QiCost || 0))
      }) : null);

      if (updatedPlayer.currentHp <= 0 || (opponent.currentHp - result.p2Damage) <= 0) {
        setTimeout(() => {
          alert(updatedPlayer.currentHp > 0 ? "VITÓRIA! O oponente sucumbiu." : "DERROTA... Sua energia se apagou.");
          onExit();
        }, 1500);
      }

    } catch (e) {
      console.error(e);
      alert("Erro na fenda temporal. O combate foi anulado.");
      onExit();
    } finally {
      setIsThinking(false);
      setPlayerAction('');
    }
  };

  if (mode === 'LOBBY') {
    return (
      <div className="max-w-4xl w-full p-8 md:p-12 glass-panel rounded-[3rem] text-center space-y-10 animate-in zoom-in duration-500">
        <div className="space-y-2">
            <h2 className="text-4xl md:text-6xl font-bungee text-white italic tracking-tighter">ARENA DE EXTERMÍNIO</h2>
            <p className="text-[10px] text-red-500 font-mono tracking-[0.5em] uppercase">Somente jogadores reais. Sem piedade.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setMode('SEARCHING')} className="group relative overflow-hidden p-8 bg-white text-black font-bungee rounded-3xl transition-all hover:scale-105 shadow-2xl active:scale-95">
                <span className="text-3xl block mb-2">⚔️</span>
                <span>PARTIDA ALEATÓRIA</span>
            </button>
            <button onClick={handleCreateRoom} className="group relative overflow-hidden p-8 bg-black/40 text-white font-bungee rounded-3xl border border-white/10 transition-all hover:border-purple-500 active:scale-95">
                <span className="text-3xl block mb-2">🏠</span>
                <span>CRIAR SALA PRIVADA</span>
            </button>
        </div>

        <div className="pt-10 border-t border-white/5 space-y-4">
            <p className="text-[8px] font-bungee text-white/30 uppercase">Entrar em sala privada</p>
            <div className="flex gap-4 max-w-sm mx-auto">
                <input 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-center font-mono text-xl text-white outline-none focus:border-purple-500" 
                  placeholder="CÓDIGO" 
                  maxLength={6}
                  value={roomCode} 
                  onChange={e => setRoomCode(e.target.value)} 
                />
                <button onClick={handleJoinRoom} className="px-8 py-4 bg-purple-600 text-white font-bungee rounded-xl text-xs shadow-lg active:scale-95">JOIN</button>
            </div>
        </div>
        
        <button onClick={onExit} className="text-[10px] font-bungee text-white/20 hover:text-red-500 transition-colors uppercase tracking-[0.3em]">Retirada estratégica</button>
      </div>
    );
  }

  if (mode === 'SEARCHING') {
    return (
      <div className="max-w-md w-full p-12 glass-panel rounded-[3rem] text-center space-y-8">
          <div className="relative">
              <div className="w-24 h-24 border-4 border-dashed border-purple-500 rounded-full animate-spin mx-auto opacity-20"></div>
              <div className="absolute inset-0 flex items-center justify-center text-4xl">🔭</div>
          </div>
          <div className="space-y-2">
            <h3 className="font-bungee text-xl text-white">RASTREANDO RECEPTÁCULOS...</h3>
            {createdRoomCode && (
              <div className="bg-purple-900/20 p-4 rounded-2xl border border-purple-500/30">
                <p className="text-[8px] font-bungee text-purple-400 mb-1">CÓDIGO DA SALA</p>
                <p className="text-3xl font-mono font-bold text-white tracking-widest">{createdRoomCode}</p>
              </div>
            )}
          </div>
          <div className="space-y-1">
              <p className="text-[8px] font-mono text-purple-400 tracking-widest uppercase">TEMPO: {matchTimer}s / 180s</p>
              <p className="text-[7px] text-white/20 italic">A fenda requer um oponente real para se abrir</p>
          </div>
          <button onClick={() => setMode('LOBBY')} className="px-6 py-3 border border-white/5 rounded-xl text-[8px] font-bungee text-white/30 hover:text-white transition-all uppercase">Cancelar Busca</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-6xl mx-auto overflow-hidden p-4">
      {/* HUD DE COMBATE PvP */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Player 1 (You) */}
        <div className="glass-panel p-4 rounded-3xl border border-blue-500/30">
           <div className="flex items-center gap-3 mb-3">
              <img src={player.profileImageUrl} className="w-12 h-12 rounded-xl object-cover border-2 border-blue-500" />
              <div className="text-left">
                <p className="font-bungee text-xs text-white leading-none">{player.name}</p>
                <p className="text-[8px] font-mono text-blue-400">{player.grade}</p>
              </div>
           </div>
           <div className="space-y-2">
             <MiniStatusBar value={player.currentHp} max={player.stats.forca * 20} color="bg-red-500" label="HP" />
             <MiniStatusBar value={player.currentQi} max={player.stats.energia * 15} color="bg-blue-500" label="QI" />
           </div>
        </div>

        {/* Player 2 (Opponent) */}
        <div className="glass-panel p-4 rounded-3xl border border-red-500/30 text-right">
           <div className="flex flex-row-reverse items-center gap-3 mb-3">
              <img src={opponent?.profileImageUrl} className="w-12 h-12 rounded-xl object-cover border-2 border-red-500" />
              <div className="text-right">
                <p className="font-bungee text-xs text-white leading-none">{opponent?.name}</p>
                <p className="text-[8px] font-mono text-red-400">{opponent?.grade}</p>
              </div>
           </div>
           <div className="space-y-2">
             <MiniStatusBar value={opponent?.currentHp || 0} max={(opponent?.stats.forca || 10) * 20} color="bg-red-500" label="HP" />
             <MiniStatusBar value={opponent?.currentQi || 0} max={(opponent?.stats.energia || 10) * 15} color="bg-blue-500" label="QI" />
           </div>
        </div>
      </div>

      {/* FEED DE BATALHA */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 no-scrollbar p-2">
        {battleImage && (
          <img src={battleImage} className="w-full h-48 object-cover rounded-3xl border border-white/10 mb-4 animate-in fade-in" />
        )}
        {battleHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'player' ? 'justify-start' : msg.role === 'opponent' ? 'justify-end' : 'justify-center'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl border text-sm ${
              msg.role === 'narrator' ? 'bg-black/80 border-purple-500/30 text-purple-100 font-inter italic' :
              msg.role === 'player' ? 'bg-blue-900/20 border-blue-500/20 text-blue-100 font-marker' :
              'bg-red-900/20 border-red-500/20 text-red-100 font-marker text-right'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-center p-4">
             <div className="animate-pulse font-bungee text-[10px] text-purple-500">O MESTRE ESTÁ JULGANDO...</div>
          </div>
        )}
      </div>

      {/* INPUT DE AÇÃO */}
      <div className="p-4 bg-black/60 rounded-3xl border border-white/10 shadow-2xl">
        <form onSubmit={e => { e.preventDefault(); handleTurn(); }} className="flex gap-2">
          <input 
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-inter text-lg outline-none focus:border-purple-500" 
            placeholder="Sua ação de combate..." 
            value={playerAction}
            onChange={e => setPlayerAction(e.target.value)}
            disabled={isThinking}
          />
          <button 
            disabled={isThinking || !playerAction.trim()}
            className="px-8 bg-white text-black font-bungee rounded-2xl hover:bg-purple-600 hover:text-white transition-all active:scale-95 disabled:opacity-20"
          >
            ATACAR
          </button>
        </form>
      </div>
    </div>
  );
};

export default PvPInterface;
