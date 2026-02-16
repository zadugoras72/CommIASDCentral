
import React, { useState } from 'react';
import { AppState, Volunteer, DayOfWeek, VolunteerScores, Role, VolunteerEvaluation } from '../types';
import VolunteerForm from './VolunteerForm';
import { generateSchedule } from '../services/scheduler';
import { ALL_ROLES, ALL_DAYS } from '../constants';
import { getMonday, addDays, formatShortDate, getDayOffset } from '../utils/dateUtils';

interface Props {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onLogout: () => void;
}

const AdminView: React.FC<Props> = ({ state, updateState, onLogout }) => {
  const [isAddingVolunteer, setIsAddingVolunteer] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [scoringVolunteer, setScoringVolunteer] = useState<Volunteer | null>(null);
  const [activeTab, setActiveTab] = useState<'volunteers' | 'schedule' | 'month' | 'settings'>('schedule');
  const [newPin, setNewPin] = useState('');
  const [manualEdit, setManualEdit] = useState<{ day: DayOfWeek, role: Role, index: number } | null>(null);
  const [tempScores, setTempScores] = useState<VolunteerScores>({ punctuality: 0, responsibility: 0, cleanliness: 0 });

  const currentSunday = new Date(state.selectedWeek);
  const activeSchedule = state.schedules.find(s => s.weekStarting === state.selectedWeek);

  const handleWeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const sunday = getMonday(date);
    updateState({ selectedWeek: sunday.toISOString() });
  };

  const handleGenerate = () => {
    const newSchedule = generateSchedule(
      state.volunteers,
      state.services,
      state.selectedWeek,
      { avoidDoubleBookingPerWeek: state.config.avoidDoubleBookingPerWeek }
    );
    const otherSchedules = state.schedules.filter(s => s.weekStarting !== state.selectedWeek);
    updateState({ schedules: [...otherSchedules, newSchedule] });
  };

  const handleManualAssignment = (volunteerName: string) => {
    if (!manualEdit || !activeSchedule) return;
    const { day, role, index } = manualEdit;
    const updatedAssignments = { ...activeSchedule.assignments };
    const currentRoles = { ...updatedAssignments[day] };
    const currentNames = [...(currentRoles[role] || [])];
    currentNames[index] = volunteerName;
    currentRoles[role] = currentNames;
    updatedAssignments[day] = currentRoles;
    const updatedSchedules = state.schedules.map(s => s.id === activeSchedule.id ? { ...s, assignments: updatedAssignments } : s);
    updateState({ schedules: updatedSchedules });
    setManualEdit(null);
  };

  const handleSaveVolunteer = (volunteer: Volunteer) => {
    const exists = state.volunteers.find(v => v.id === volunteer.id);
    const newVolunteers = exists 
      ? state.volunteers.map(v => v.id === volunteer.id ? volunteer : v)
      : [...state.volunteers, { ...volunteer, evaluations: [] }];
    updateState({ volunteers: newVolunteers });
    setIsAddingVolunteer(false);
    setEditingVolunteer(null);
  };

  const handleDeleteVolunteer = (id: string) => {
    if(confirm("¿Eliminar voluntario?")) {
      updateState({ volunteers: state.volunteers.filter(v => v.id !== id) });
    }
  };

  const handleApplyScores = () => {
    if (!scoringVolunteer) return;
    const totalPoints = tempScores.punctuality + tempScores.responsibility + tempScores.cleanliness;
    const evaluation: VolunteerEvaluation = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      ...tempScores,
      total: totalPoints
    };
    const updatedVolunteers = state.volunteers.map(v => v.id === scoringVolunteer.id ? { ...v, evaluations: [...(v.evaluations || []), evaluation] } : v);
    updateState({ volunteers: updatedVolunteers });
    setScoringVolunteer(null);
    setTempScores({ punctuality: 0, responsibility: 0, cleanliness: 0 });
  };

  const handleResetScores = () => {
    if(confirm("¿Reiniciar todas las puntuaciones?")) {
      updateState({ volunteers: state.volunteers.map(v => ({ ...v, evaluations: [] })) });
    }
  };

  const getCandidatesForRole = (day: DayOfWeek, role: Role) => {
    const dayName = day.split(' ')[0];
    const serviceDate = addDays(currentSunday, getDayOffset(dayName)).toISOString().split('T')[0];
    return state.volunteers.filter(v => v.roles.includes(role) && v.availableDays.includes(day) && !(v.restrictedDates || []).includes(serviceDate)).sort((a,b) => a.name.localeCompare(b.name));
  };

  const isAssignedInWeek = (name: string) => {
    if (!activeSchedule) return false;
    return Object.values(activeSchedule.assignments).some(dayRoles => Object.values(dayRoles).some(names => names.includes(name)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel Admin</h2>
          <p className="text-slate-400 text-sm">Gestión técnica y humana</p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Semana (Inicia Dom):</label>
            <input type="date" value={currentSunday.toISOString().split('T')[0]} onChange={handleWeekChange} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"/>
          </div>
          <button onClick={handleGenerate} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100"><i className="fas fa-sync-alt mr-2"></i> Generar</button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {(['schedule', 'month', 'volunteers', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 font-black text-[11px] uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {tab === 'schedule' ? 'Semana' : tab === 'month' ? 'Calendario' : tab === 'volunteers' ? 'Equipo' : 'Ajustes'}
          </button>
        ))}
      </div>

      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {activeSchedule ? ALL_DAYS.map(day => {
            const date = addDays(currentSunday, getDayOffset(day.split(' ')[0]));
            return (
              <div key={day} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-black text-slate-700 text-xs uppercase">{day}</span>
                  <span className="text-[10px] bg-white border px-2 py-1 rounded-lg font-black text-slate-400">{formatShortDate(date)}</span>
                </div>
                <div className="p-4 space-y-4">
                  {ALL_ROLES.map(role => (
                    <div key={role} className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{role}</label>
                      {(activeSchedule.assignments[day]?.[role] || []).map((n, i) => (
                        <button key={i} onClick={() => setManualEdit({ day, role, index: i })} className={`w-full text-left text-xs px-3 py-2 rounded-xl border font-bold transition-all ${n === 'SIN ASIGNAR' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-300'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          }) : <div className="md:col-span-3 py-20 text-center text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed rounded-3xl">Sin turnos generados</div>}
        </div>
      )}

      {activeTab === 'volunteers' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Miembros del equipo</h3>
             <button onClick={handleResetScores} className="text-[10px] px-4 py-2 bg-red-50 text-red-500 rounded-xl font-black uppercase hover:bg-red-500 hover:text-white transition-all">Reiniciar Puntos</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.volunteers.map(v => (
              <div key={v.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">{v.name.charAt(0)}</div>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{v.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Pts: {(v.evaluations || []).reduce((a,b) => a + b.total, 0)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setScoringVolunteer(v)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"><i className="fas fa-star text-xs"></i></button>
                    <button onClick={() => setEditingVolunteer(v)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"><i className="fas fa-edit text-xs"></i></button>
                    <button onClick={() => handleDeleteVolunteer(v.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><i className="fas fa-trash text-xs"></i></button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setIsAddingVolunteer(true)} className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-slate-400 font-black text-xs uppercase hover:border-indigo-300 transition-all">+ Nuevo</button>
          </div>
        </div>
      )}

      {activeTab === 'month' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in duration-300">
          <div className="grid grid-cols-7 gap-px bg-slate-100 border rounded-2xl overflow-hidden">
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => <div key={d} className="bg-slate-50 p-2 text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>)}
            {Array.from({ length: 35 }).map((_, i) => {
              const startOfMonth = new Date(currentSunday.getFullYear(), currentSunday.getMonth(), 1);
              const firstSun = getMonday(startOfMonth);
              const date = addDays(firstSun, i);
              const isCurr = date.getMonth() === currentSunday.getMonth();
              const hasShift = state.schedules.some(s => {
                const sun = new Date(s.weekStarting);
                const sat = addDays(sun, 6);
                return date >= sun && date <= sat && Object.values(s.assignments).some(dayRoles => Object.values(dayRoles).some(names => names.length > 0 && names[0] !== 'SIN ASIGNAR'));
              });
              return (
                <div key={i} className={`bg-white min-h-[80px] p-2 ${!isCurr ? 'opacity-20' : ''}`}>
                  <span className="text-[10px] font-black text-slate-400">{date.getDate()}</span>
                  {hasShift && <div className="mt-1 h-1.5 w-1.5 bg-indigo-500 rounded-full mx-auto"></div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-3xl border max-w-sm mx-auto animate-in fade-in duration-300">
          <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">PIN de Acceso</h3>
          <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="Nuevo PIN" maxLength={4} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none mb-4"/>
          <button onClick={() => { updateState({ adminPin: newPin }); setNewPin(''); alert("PIN guardado"); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase">Actualizar</button>
        </div>
      )}

      {manualEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border flex flex-col max-h-[80vh]">
            <h3 className="font-black text-slate-800 mb-4 uppercase text-sm">Asignar {manualEdit.role}</h3>
            <div className="overflow-y-auto space-y-2 pr-1">
              <button onClick={() => handleManualAssignment('SIN ASIGNAR')} className="w-full text-left p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 font-bold text-xs uppercase">Remover</button>
              {getCandidatesForRole(manualEdit.day, manualEdit.role).map(v => (
                <button key={v.id} onClick={() => handleManualAssignment(v.name)} className="w-full text-left p-3 rounded-xl border hover:border-indigo-500 transition-all">
                  <p className="text-xs font-bold text-slate-700">{v.name}</p>
                  {isAssignedInWeek(v.name) && <p className="text-[9px] text-amber-500 font-black uppercase">Ya asignado esta semana</p>}
                </button>
              ))}
            </div>
            <button onClick={() => setManualEdit(null)} className="mt-4 py-2 text-slate-400 font-black text-[10px] uppercase">Cerrar</button>
          </div>
        </div>
      )}

      {scoringVolunteer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border">
            <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Evaluar: {scoringVolunteer.name}</h3>
            <div className="space-y-6">
              {(['punctuality', 'responsibility', 'cleanliness'] as const).map(k => (
                <div key={k}>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">{k === 'punctuality' ? 'Puntualidad' : k === 'responsibility' ? 'Responsabilidad' : 'Aseo'}</label>
                  <input type="range" min="0" max="10" value={tempScores[k]} onChange={e => setTempScores({...tempScores, [k]: parseInt(e.target.value)})} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setScoringVolunteer(null)} className="flex-1 py-3 text-slate-400 font-black text-xs uppercase">Cancelar</button>
                <button onClick={handleApplyScores} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase">Sumar Puntos</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAddingVolunteer || editingVolunteer) && (
        <VolunteerForm onSave={handleSaveVolunteer} onCancel={() => { setIsAddingVolunteer(false); setEditingVolunteer(null); }} initialData={editingVolunteer || undefined} />
      )}
    </div>
  );
};

export default AdminView;
