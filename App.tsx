
import React, { useState, useEffect } from 'react';
import { AppState, Volunteer } from './types';
import { DEFAULT_SERVICES } from './constants';
import AdminView from './components/AdminView';
import VolunteerView from './components/VolunteerView';
import AdminLogin from './components/AdminLogin';
import { getMonday } from './utils/dateUtils';

const App: React.FC = () => {
  const [view, setView] = useState<'admin' | 'volunteer'>('volunteer');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  const [state, setState] = useState<AppState>(() => {
    const defaultState: AppState = {
      volunteers: [],
      services: DEFAULT_SERVICES,
      schedules: [],
      selectedWeek: getMonday(new Date()).toISOString(),
      adminPin: '1234',
      config: {
        avoidDoubleBookingPerWeek: true,
        avoidConsecutiveWeeks: true
      }
    };

    try {
      const saved = localStorage.getItem('comms_shift_state_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migración y Saneamiento: Aseguramos que cada voluntario tenga los arrays necesarios
        const sanitizedVolunteers = (parsed.volunteers || []).map((v: any) => ({
          ...v,
          evaluations: v.evaluations || [],
          restrictedDates: v.restrictedDates || [],
          shiftCount: v.shiftCount || 0
        }));

        return {
          ...defaultState,
          ...parsed,
          volunteers: sanitizedVolunteers,
          schedules: parsed.schedules || []
        };
      }
    } catch (e) {
      console.error("Error cargando estado:", e);
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('comms_shift_state_v3', JSON.stringify(state));
  }, [state]);

  const updateState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const handleAdminRequest = () => {
    setView('admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <i className="fas fa-layer-group text-white text-xl"></i>
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-800 tracking-tight leading-none">CommsShift</h1>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Smart Church Operations</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setView('volunteer')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${view === 'volunteer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Voluntarios
            </button>
            <button 
              onClick={handleAdminRequest}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${view === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <i className="fas fa-lock text-[10px] mr-1"></i> Admin
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {view === 'admin' ? (
          isAdminAuthenticated ? (
            <AdminView 
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
          <VolunteerView state={state} />
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <div className="flex items-center justify-center gap-6">
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Calendario (Inicia Domingo)</span>
          <div className="w-px h-3 bg-slate-200"></div>
          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Balance Inteligente</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
