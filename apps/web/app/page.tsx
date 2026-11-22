'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        showError('Invalid credentials or system offline.');
      }
    } catch (err) {
      showError('Connection to AI Core failed.');
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const quickLogin = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#07110F', fontFamily: 'Inter, sans-serif' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(92, 255, 138, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(92, 255, 138, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(92, 255, 138, 0.05) 0%, transparent 70%)' }}></div>
      
      {/* Error Toast */}
      {error && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded border" style={{ backgroundColor: '#FF3B4E', borderColor: '#FF6B5B', color: '#E8F5F0', animation: 'slideDown 0.3s ease-out' }}>
          {error}
        </div>
      )}

      {/* Logo Area */}
      <div className="z-10 flex flex-col items-center mb-8 animate-fade-in-up">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4 drop-shadow-[0_0_15px_rgba(92,255,138,0.5)]">
          <path d="M32 2L60 18V46L32 62L4 46V18L32 2Z" stroke="#5CFF8A" strokeWidth="2" fill="rgba(92,255,138,0.1)"/>
          <circle cx="32" cy="32" r="8" fill="#5CFF8A" />
        </svg>
        <h1 className="text-4xl font-bold tracking-wider mb-2">
          <span style={{ color: '#5CFF8A' }}>AgroSentinel</span>
          <span className="text-white ml-2">AI</span>
        </h1>
        <p className="uppercase tracking-[0.3em] text-xs" style={{ color: '#8BA89E' }}>Predict the outbreak before it spreads</p>
      </div>

      {/* Main Card */}
      <div className="z-10 p-8 rounded-xl border backdrop-blur-md w-full max-w-[420px] animate-fade-in-up" style={{ backgroundColor: '#10211E', borderColor: 'rgba(92, 255, 138, 0.1)', animationDelay: '0.1s', animationFillMode: 'both' }}>
        <h2 className="uppercase tracking-widest text-sm mb-4 text-center" style={{ color: '#8BA89E' }}>System Access</h2>
        <div className="h-[1px] w-full mb-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(92,255,138,0.5), transparent)' }}></div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="OPERATIVE EMAIL" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded outline-none transition-all duration-300"
            style={{ backgroundColor: '#0D1917', color: '#E8F5F0', border: '1px solid rgba(92,255,138,0.2)', caretColor: '#5CFF8A' }}
            onFocus={(e) => e.target.style.borderColor = '#5CFF8A'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(92,255,138,0.2)'}
            required
          />
          <input 
            type="password" 
            placeholder="ACCESS CODE" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded outline-none transition-all duration-300"
            style={{ backgroundColor: '#0D1917', color: '#E8F5F0', border: '1px solid rgba(92,255,138,0.2)', caretColor: '#5CFF8A' }}
            onFocus={(e) => e.target.style.borderColor = '#5CFF8A'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(92,255,138,0.2)'}
            required
          />
          <button 
            type="submit" 
            className="w-full py-3 mt-2 rounded font-bold uppercase tracking-wider transition-all duration-300 hover:brightness-110 shadow-[0_0_15px_rgba(92,255,138,0.3)] hover:shadow-[0_0_25px_rgba(92,255,138,0.6)]"
            style={{ backgroundColor: '#5CFF8A', color: '#07110F' }}
          >
            Authenticate
          </button>
        </form>

        <div className="h-[1px] w-full my-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(92,255,138,0.2), transparent)' }}></div>

        <div className="flex gap-4 mb-6">
          <button 
            type="button"
            onClick={() => quickLogin('farmer@demo.agrosentinel.ai', 'farmer123')}
            className="flex-1 py-2 text-xs border rounded transition-colors hover:bg-opacity-10 hover:bg-[#5CFF8A]"
            style={{ borderColor: '#5CFF8A', color: '#5CFF8A' }}
          >
            FARMER ACCESS
          </button>
          <button 
            type="button"
            onClick={() => quickLogin('officer@demo.agrosentinel.ai', 'officer123')}
            className="flex-1 py-2 text-xs border rounded transition-colors hover:bg-opacity-10 hover:bg-[#38D9FF]"
            style={{ borderColor: '#38D9FF', color: '#38D9FF' }}
          >
            OFFICER DASHBOARD
          </button>
        </div>

        <div className="text-center text-xs opacity-70" style={{ color: '#8BA89E', fontFamily: 'JetBrains Mono, monospace' }}>
          <p>Farmer: farmer@demo.agrosentinel.ai / farmer123</p>
          <p>Officer: officer@demo.agrosentinel.ai / officer123</p>
        </div>
      </div>

      {/* Footer Status */}
      <div className="absolute bottom-6 flex gap-6 text-[10px] uppercase tracking-widest z-10" style={{ color: '#8BA89E', fontFamily: 'JetBrains Mono, monospace' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#5CFF8A' }}></span>
          AI CORE ONLINE
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#38D9FF' }}></span>
          DATA SYNC LIVE
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#5CFF8A' }}></span>
          SATELLITE READY
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}} />
    </div>
  );
}
