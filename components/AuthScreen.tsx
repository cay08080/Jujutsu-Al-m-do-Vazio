
import React, { useState } from 'react';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    const storedUsers = JSON.parse(localStorage.getItem('jj_users') || '{}');
    
    if (isRegistering) {
      if (storedUsers[username]) {
        alert("Este receptáculo já está ocupado por outra alma.");
        return;
      }
      // Fix: Added missing required pvpStats property to User object
      const newUser: User = { 
        username, 
        password, 
        createdAt: Date.now(),
        pvpStats: {
          points: 1000,
          wins: 0,
          losses: 0,
          rankName: 'Iniciante'
        }
      };
      storedUsers[username] = newUser;
      localStorage.setItem('jj_users', JSON.stringify(storedUsers));
      onLogin(newUser);
    } else {
      const user = storedUsers[username];
      if (user && user.password === password) {
        onLogin(user);
      } else {
        alert("Assinatura de alma incorreta.");
      }
    }
  };

  return (
    <div className="w-full max-w-md glass-panel p-10 rounded-[2.5rem] border border-white/10 animate-in zoom-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bungee text-white mb-2">{isRegistering ? 'FIRMAR CONTRATO' : 'CONEXÃO DE ALMA'}</h2>
        <p className="text-[10px] text-purple-500 font-mono tracking-widest uppercase">Sistema de Login de Receptáculos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
            <label className="text-[9px] font-bungee text-white/40 ml-2">NOME DO USUÁRIO</label>
            <input 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500 transition-all font-mono"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
        </div>
        <div className="space-y-2">
            <label className="text-[9px] font-bungee text-white/40 ml-2">CHAVE AMALDIÇOADA (SENHA)</label>
            <input 
              type="password"
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-purple-500 transition-all font-mono"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
        </div>

        <button className="w-full py-5 bg-white text-black font-bungee rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-xl">
          {isRegistering ? 'CRIAR CONTA' : 'ENTRAR'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-bungee text-white/30 hover:text-white transition-colors">
          {isRegistering ? 'JÁ POSSUO UM CONTRATO' : 'NÃO TENHO CONTRATO (REGISTRAR)'}
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;
