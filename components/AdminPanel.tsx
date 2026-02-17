
import React, { useState } from 'react';
import { AppState, Volunteer, DayOfWeek, Role, VolunteerScores } from '../types';
import VolunteerForm from './VolunteerForm';
import { generateSchedule } from '../services/scheduler';
import { ALL_ROLES, ALL_DAYS } from '../constants';
import { getMonday } from '../utils/dateUtils';

interface Props {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onLogout: () => void;
}

const AdminPanel: React.FC<Props> = ({ state, updateState, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'shifts' | 'config'>('shifts');
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [scoringVolunteer, setScoringVolunteer] = useState<Volunteer | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [tempScores, setTempScores] = useState<VolunteerScores>({ punctuality: 0, responsibility: 0, cleanliness: 0 });

  const currentSunday = new Date(state.selectedWeek);

  const handleGenerate = () => {
    const newSchedule = generateSchedule(
      state.volunteers,
      state.services,
      state.selectedWeek,
      { avoidDoubleBookingPerWeek: state.config.avoidDoubleBookingPerWeek }
    );
    const others = state.schedules.filter(s => s.weekStarting !== state.selectedWeek);
    updateState({ schedules: [...others, newSchedule] });
  };

  const handleApplyScores = () => {
    if (!scoringVolunteer) return;
    const total = tempScores.punctuality + tempScores.responsibility + tempScores.cleanliness;
    const evalObj = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString().split('T')[0], ...tempScores, total };
    
    updateState({
      volunteers: state.volunteers.map(v => v.id === scoringVolunteer.id ? { ...v, evaluations: [...(v.evaluations || []), evalObj] } : v)
    });
    setScoringVolunteer(null);
  };

  const handleResetScores = () => {
    if(confirm("¿Reiniciar todas las puntuaciones? Esto borrará el historial.")) {
      updateState({ volunteers: state.volunteers.map(v => ({ ...v, evaluations: [] })) });
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Administración</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Configuración y Control</p>
        </div>
        <button onClick={onLogout} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><i className="fas fa-power-off"></i></button>
      </div>

      <div className="flex gap-2 border-b">
        {(['shifts', 'roster', 'config'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>
            {t === 'shifts' ? 'Turnos' : t === 'roster' ? 'Equipo' : 'Ajustes'}
          </button>
        ))}
      </div>

      {activeTab === 'shifts' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <div className="flex-1">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Semana de inicio (Domingo)</label>
              <input 
                type="date" 
                value={currentSunday.toISOString().split('T')[0]} 
                onChange={e => updateState({ selectedWeek: getMonday(new Date(e.target.value)).toISOString() })}
                className="w-full px-4 py-3 rounded-xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button onClick={handleGenerate} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              Generar Turnos Automáticos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ALL_DAYS.map(day => (
              <div key={day} className="bg-white p-5 rounded-2xl border shadow-sm">
                <h4 className="font-black text-slate-700 uppercase text-xs mb-4 border-b pb-2">{day}</h4>
                <div className="space-y-3">
                  {ALL_ROLES.map(role => (
                    <div key={role}>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{role}</p>
                      <div className="bg-slate-50 p-2 rounded-lg text-xs font-bold text-slate-600 border">
                        {state.schedules.find(s => s.weekStarting === state.selectedWeek)?.assignments[day]?.[role]?.[0] || '---'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button onClick={() => setIsAdding(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest">+ Nuevo Voluntario</button>
            <button onClick={handleResetScores} className="px-6 py-2.5 bg-red-50 text-red-500 rounded-xl font-black text-xs uppercase border border-red-100">Reiniciar Puntos</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.volunteers.map(v => (
              <div key={v.id} className="bg-white p-5 rounded-2xl border shadow-sm group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-slate-800">{v.name}</h4>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setScoringVolunteer(v)} className="text-emerald-500"><i className="fas fa-star text-xs"></i></button>
                    <button onClick={() => setEditingVolunteer(v)} className="text-indigo-500"><i className="fas fa-edit text-xs"></i></button>
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Puntos: {(v.evaluations || []).reduce((a,b) => a + b.total, 0)}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {v.roles.map(r => <span key={r} className="text-[8px] px-2 py-0.5 bg-slate-100 rounded-full font-black text-slate-500 uppercase">{r}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scoringVolunteer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border shadow-2xl">
            <h3 className="font-black text-slate-800 uppercase mb-6">Evaluar a {scoringVolunteer.name}</h3>
            <div className="space-y-6">
              {(['punctuality', 'responsibility', 'cleanliness'] as const).map(k => (
                <div key={k}>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">{k === 'punctuality' ? 'Puntualidad' : k === 'responsibility' ? 'Responsabilidad' : 'Aseo'}</label>
                  <input type="range" min="0" max="10" value={tempScores[k]} onChange={e => setTempScores({...tempScores, [k]: parseInt(e.target.value)})} className="w-full accent-indigo-600"/>
                </div>
              ))}
              <div className="flex gap-2 pt-4">
                <button onClick={() => setScoringVolunteer(null)} className="flex-1 py-3 text-slate-400 font-black text-xs uppercase">Cerrar</button>
                <button onClick={handleApplyScores} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase">Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAdding || editingVolunteer) && (
        <VolunteerForm 
          onSave={v => {
            const exists = state.volunteers.find(x => x.id === v.id);
            updateState({ volunteers: exists ? state.volunteers.map(x => x.id === v.id ? v : x) : [...state.volunteers, v] });
            setIsAdding(false); setEditingVolunteer(null);
          }}
          onCancel={() => { setIsAdding(false); setEditingVolunteer(null); }}
          initialData={editingVolunteer || undefined}
        />
      )}
    </div>
  );
};

export default AdminPanel;
