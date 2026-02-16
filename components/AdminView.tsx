
import React, { useState } from 'react';
import { AppState, Volunteer, WeeklySchedule, DayOfWeek, VolunteerScores, Role, VolunteerEvaluation } from '../types';
import VolunteerForm from './VolunteerForm';
import { generateSchedule, exportToCSV } from '../services/scheduler';
import { ALL_ROLES, ALL_DAYS, ROLE_COLORS } from '../constants';
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

  const currentMonday = new Date(state.selectedWeek); // Representa el Domingo de inicio de semana
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
    const currentNames = [...currentRoles[role]];
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
    if(confirm("¿Eliminar voluntario? Se perderá su historial.")) {
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

    const updatedVolunteers = state.volunteers.map(v => {
      if (v.id === scoringVolunteer.id) {
        return {
          ...v,
          evaluations: [...(v.evaluations || []), evaluation]
        };
      }
      return v;
    });

    updateState({ volunteers: updatedVolunteers });
    setScoringVolunteer(null);
    setTempScores({ punctuality: 0, responsibility: 0, cleanliness: 0 });
  };

  const handleResetScores = () => {
    if(confirm("¿Estás seguro de reiniciar todas las puntuaciones? Esta acción borrará el historial de evaluaciones de todos los voluntarios.")) {
      const resetVolunteers = state.volunteers.map(v => ({ ...v, evaluations: [] }));
      updateState({ volunteers: resetVolunteers });
      alert("Puntuaciones reiniciadas correctamente.");
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      updateState({ adminPin: newPin });
      setNewPin('');
      alert("PIN actualizado correctamente.");
    }
  };

  const getCandidatesForRole = (day: DayOfWeek, role: Role) => {
    const dayName = day.split(' ')[0];
    const serviceDate = addDays(currentMonday, getDayOffset(dayName)).toISOString().split('T')[0];
    return state.volunteers.filter(v => 
      v.roles.includes(role) && 
      v.availableDays.includes(day) &&
      !(v.restrictedDates || []).includes(serviceDate)
    ).sort((a,b) => a.name.localeCompare(b.name));
  };

  const isAssignedInWeek = (name: string) => {
    if (!activeSchedule) return false;
    let count = 0;
    Object.values(activeSchedule.assignments).forEach(dayRoles => {
      Object.values(dayRoles).forEach(names => {
        if (names.includes(name)) count++;
      });
    });
    return count > 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión del Equipo</h2>
            <p className="text-slate-400 text-sm font-medium">Asignación inteligente y balanceada</p>
          </div>
          <button onClick={onLogout} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Cerrar sesión">
            <i className="fas fa-power-off"></i>
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 tracking-widest">Semana (Dom-Sab):</label>
            <input type="date" value={currentMonday.toISOString().split('T')[0]} onChange={handleWeekChange} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600"/>
          </div>
          <button onClick={handleGenerate} className="mt-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 font-black text-xs uppercase tracking-widest">
            <i className="fas fa-sync-alt"></i> Generar Turnos
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-2">
        <button className={`px-6 py-4 font-black text-[11px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'schedule' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} onClick={() => setActiveTab('schedule')}>Semana</button>
        <button className={`px-6 py-4 font-black text-[11px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'month' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} onClick={() => setActiveTab('month')}>Mes</button>
        <button className={`px-6 py-4 font-black text-[11px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'volunteers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} onClick={() => setActiveTab('volunteers')}>Equipo ({state.volunteers.length})</button>
        <button className={`px-6 py-4 font-black text-[11px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`} onClick={() => setActiveTab('settings')}>Configuración</button>
      </div>

      {activeTab === 'schedule' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeSchedule ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ALL_DAYS.map(day => {
                const date = addDays(currentMonday, getDayOffset(day.split(' ')[0]));
                const dayAssignments = activeSchedule.assignments[day];
                return (
                  <div key={day} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                      <span className="font-black text-slate-700 text-sm uppercase tracking-wider">{day}</span>
                      <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-lg font-black">{formatShortDate(date)}</span>
                    </div>
                    <div className="p-5 space-y-5 flex-1 bg-white">
                      {ALL_ROLES.map(role => {
                        const names = dayAssignments[role] || [];
                        return (
                          <div key={role} className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between">{role}</label>
                            {names.length > 0 ? names.map((n, i) => (
                              <button key={i} onClick={() => setManualEdit({ day, role, index: i })} className={`w-full text-left text-xs px-3 py-2.5 rounded-xl border font-bold transition-all flex justify-between items-center group/item ${n === 'SIN ASIGNAR' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-white hover:border-indigo-300 hover:ring-4 hover:ring-indigo-500/5'}`}>
                                {n}
                                <i className="fas fa-chevron-right text-[10px] opacity-0 group-hover/item:opacity-100 transform translate-x-1 group-hover/item:translate-x-0 transition-all text-indigo-400"></i>
                              </button>
                            )) : <div className="text-[10px] text-slate-300 italic py-1 px-1">Carga no definida</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fas fa-calendar-plus text-3xl opacity-20"></i></div>
              <p className="text-lg font-bold text-slate-600">No hay turnos para esta semana</p>
            </div>
          )}
        </div>
      )}

      {/* Resto del código se mantiene igual... */}
      {activeTab === 'month' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in duration-300 overflow-hidden">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Calendario de Mes</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentMonday.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
              <div key={d} className="bg-slate-50 p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => {
              const startOfMonth = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), 1);
              const firstSundayOfMonth = getMonday(startOfMonth);
              const date = addDays(firstSundayOfMonth, i);
              const isCurrentMonth = date.getMonth() === currentMonday.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const schedulesForDay = state.schedules.filter(s => {
                const sun = new Date(s.weekStarting);
                const sat = addDays(sun, 6);
                return date >= sun && date <= sat;
              });
              return (
                <div key={i} className={`bg-white min-h-[120px] p-2 relative flex flex-col group transition-all ${!isCurrentMonth ? 'bg-slate-50/50 opacity-20' : 'hover:bg-slate-50'}`}>
                  <span className={`text-xs font-black mb-2 w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                    {date.getDate()}
                  </span>
                  <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 max-h-[80px]">
                    {schedulesForDay.map(s => {
                      const dayKeys = Object.keys(s.assignments) as DayOfWeek[];
                      return dayKeys.map(dayKey => {
                         const dayDate = addDays(new Date(s.weekStarting), getDayOffset(dayKey.split(' ')[0]));
                         if (dayDate.toDateString() === date.toDateString()) {
                            return Object.entries(s.assignments[dayKey]).map(([role, names]) => (
                               names.length > 0 && names[0] !== 'SIN ASIGNAR' && (
                                  <div key={role+names[0]} className="text-[9px] leading-tight p-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold truncate">
                                     {role.charAt(0)}: {names[0]}
                                  </div>
                               )
                            ));
                         }
                         return null;
                      });
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'volunteers' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Miembros del equipo</h3>
             <button onClick={handleResetScores} className="text-[10px] px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">
               <i className="fas fa-trash-alt mr-2"></i> Reiniciar Puntuaciones
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.volunteers.map(v => {
              const totalEvalPoints = (v.evaluations || []).reduce((acc, curr) => acc + curr.total, 0);
              return (
                <div key={v.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group relative hover:shadow-lg transition-all border-b-4 border-b-transparent hover:border-b-indigo-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-black">{v.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm tracking-tight">{v.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acumulado: {totalEvalPoints} pts</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setScoringVolunteer(v)} className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Evaluar"><i className="fas fa-star text-xs"></i></button>
                      <button onClick={() => setEditingVolunteer(v)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><i className="fas fa-edit text-xs"></i></button>
                      <button onClick={() => handleDeleteVolunteer(v.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><i className="fas fa-trash text-xs"></i></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {v.roles.map(r => <span key={r} className="text-[9px] px-2 py-1 rounded-lg bg-slate-50 text-slate-500 font-black border border-slate-100 uppercase tracking-tighter">{r}</span>)}
                    </div>
                  </div>
                </div>
              );
            })}
            <button onClick={() => setIsAddingVolunteer(true)} className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 transition-all group">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-3"><i className="fas fa-plus"></i></div>
              <span className="font-black text-[11px] uppercase tracking-widest">Nuevo Voluntario</span>
            </button>
          </div>
        </div>
      )}

      {manualEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-slate-100 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-tight">Cambiar {manualEdit.role}</h3>
            <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-2">
              <button onClick={() => handleManualAssignment('SIN ASIGNAR')} className="w-full text-left p-4 rounded-2xl border border-red-100 bg-red-50 text-red-600 font-bold text-xs flex justify-between items-center hover:bg-red-100 transition-colors">Remover Asignación <i className="fas fa-user-slash"></i></button>
              {getCandidatesForRole(manualEdit.day, manualEdit.role).map(v => (
                <button key={v.id} onClick={() => handleManualAssignment(v.name)} className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex justify-between items-center group">
                  <div>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">{v.name}</p>
                    {isAssignedInWeek(v.name) && <p className="text-[9px] text-amber-500 font-bold uppercase tracking-tight">Ya tiene turno esta semana</p>}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setManualEdit(null)} className="mt-6 w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {scoringVolunteer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight"><i className="fas fa-star text-amber-500"></i> Evaluar: {scoringVolunteer.name}</h3>
            <div className="space-y-6">
              {[{ key: 'punctuality', label: 'Puntualidad' }, { key: 'responsibility', label: 'Responsabilidad' }, { key: 'cleanliness', label: 'Aseo' }].map(item => (
                <div key={item.key}>
                  <div className="flex justify-between items-center mb-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</label></div>
                  <input type="range" min="0" max="10" step="1" value={tempScores[item.key as keyof VolunteerScores]} onChange={e => setTempScores({ ...tempScores, [item.key]: parseInt(e.target.value) })} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                </div>
              ))}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center"><span className="text-xl font-black text-emerald-600">+{tempScores.punctuality + tempScores.responsibility + tempScores.cleanliness} PUNTOS</span></div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setScoringVolunteer(null)} className="flex-1 px-4 py-3 rounded-2xl text-slate-400 font-bold hover:bg-slate-100 transition-colors uppercase text-[10px] tracking-widest">Cancelar</button>
                <button onClick={handleApplyScores} className="flex-1 px-4 py-3 rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-black uppercase text-[10px] tracking-widest">Sumar Puntos</button>
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
