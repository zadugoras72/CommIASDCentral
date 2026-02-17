
import React, { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import AdminPanel from './components/AdminPanel';
import Calendario from './components/Calendario';
import AdminLogin from './components/AdminLogin';

const App: React.FC = () => {
  const { state, updateState } = useAppState();
  const [view, setView] = useState<'admin' | 'volunteer'>('volunteer');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const handleAdminAuth = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setView('admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-check text-white"></i>
            </div>
            <h1 className="font-black text-xl text-slate-800 tracking-tight hidden sm:block">CommsShift</h1>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setView('volunteer')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'volunteer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              VOLUNTARIOS
            </button>
            <button 
              onClick={handleAdminAuth}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ADMIN
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {view === 'admin' ? (
          isAdminAuthenticated ? (
            <AdminPanel 
              state={state} 
              updateState={updateState} 
              onLogout={() => {
                setIsAdminAuthenticated(false);
                setView('volunteer');
              }}
            />
          ) : (
            <AdminLogin 
              correctPin={state.adminPin} 
              onSuccess={() => setIsAdminAuthenticated(true)}
              onCancel={() => setView('volunteer')}
            />
          )
        ) : (
          <Calendario state={state} />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          IASD Central - Departamento de Comunicaciones
        </p>
      </footer>
    </div>
  );
};

export default App;
