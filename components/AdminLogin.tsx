
import React, { useState } from 'react';

interface Props {
  correctPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminLogin: React.FC<Props> = ({ correctPin, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className={`bg-white p-8 rounded-3xl shadow-xl border w-full max-w-sm transition-all duration-300 ${error ? 'border-red-500 shake' : 'border-slate-100'}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-lock text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Acceso Restringido</h2>
          <p className="text-slate-500 text-sm">Introduce el PIN de administrador para continuar.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoFocus
              className="w-full text-center text-3xl tracking-[1em] py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              maxLength={4}
            />
            
            {error && <p className="text-red-500 text-xs font-bold animate-pulse">PIN incorrecto. Inténtalo de nuevo.</p>}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Volver a Voluntarios
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
