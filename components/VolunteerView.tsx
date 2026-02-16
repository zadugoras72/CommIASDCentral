
import React, { useState, useMemo } from 'react';
import { AppState, Role, DayOfWeek, Volunteer } from '../types';
import { ROLE_COLORS } from '../constants';
import { addDays, formatShortDate, getDayOffset, getMonday, isSameWeek, isSameMonth, isSameQuarter } from '../utils/dateUtils';

interface Props {
  state: AppState;
}

type Period = 'week' | 'month' | 'quarter' | 'total';

const VolunteerView: React.FC<Props> = ({ state }) => {
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'ranking'>('week');
  const [rankingPeriod, setRankingPeriod] = useState<Period>('total');
  
  const activeSchedule = state.schedules.find(s => s.weekStarting === state.selectedWeek);

  const volunteerShifts = useMemo(() => {
    if (!selectedVolunteer || !activeSchedule) return [];
    const shifts: { day: DayOfWeek; role: Role; date: Date }[] = [];
    Object.entries(activeSchedule.assignments).forEach(([day, roles]) => {
      Object.entries(roles).forEach(([role, names]) => {
        if (names.includes(selectedVolunteer)) {
          const sunday = new Date(activeSchedule.weekStarting);
          const date = addDays(sunday, getDayOffset(day.split(' ')[0]));
          shifts.push({ day: day as DayOfWeek, role: role as Role, date });
        }
      });
    });
    return shifts;
  }, [selectedVolunteer, activeSchedule]);

  const monthlyShifts = useMemo(() => {
    if (!selectedVolunteer) return [];
    const allMonthly: { date: Date; role: Role; day: DayOfWeek }[] = [];
    state.schedules.forEach(s => {
      Object.entries(s.assignments).forEach(([day, roles]) => {
        Object.entries(roles).forEach(([role, names]) => {
          if (names.includes(selectedVolunteer)) {
            const date = addDays(new Date(s.weekStarting), getDayOffset(day.split(' ')[0]));
            allMonthly.push({ date, role: role as Role, day: day as DayOfWeek });
          }
        });
      });
    });
    return allMonthly;
  }, [selectedVolunteer, state.schedules]);

  // Ranking logic with period filtering
  const rankedVolunteers = useMemo(() => {
    const now = new Date();
    
    return state.volunteers.map(v => {
      let filteredEvaluations = v.evaluations || [];
      
      if (rankingPeriod === 'week') {
        filteredEvaluations = filteredEvaluations.filter(e => isSameWeek(new Date(e.date), now));
      } else if (rankingPeriod === 'month') {
        filteredEvaluations = filteredEvaluations.filter(e => isSameMonth(new Date(e.date), now));
      } else if (rankingPeriod === 'quarter') {
        filteredEvaluations = filteredEvaluations.filter(e => isSameQuarter(new Date(e.date), now));
      }
      
      const periodPoints = filteredEvaluations.reduce((acc, curr) => acc + curr.total, 0);
      return { ...v, periodPoints };
    }).sort((a, b) => b.periodPoints - a.periodPoints);
  }, [state.volunteers, rankingPeriod]);

  const top10 = rankedVolunteers.slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel de Voluntarios</h2>
          <p className="text-slate-500">Consulta turnos y ranking de excelencia</p>
        </div>
        <div className="flex flex-col items-center gap-6">
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 w-full max-w-sm">
            <button onClick={() => setActiveTab('week')} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Semana</button>
            <button onClick={() => setActiveTab('month')} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mes</button>
            <button onClick={() => setActiveTab('ranking')} className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ranking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Ranking</button>
          </div>
          {(activeTab === 'week' || activeTab === 'month') && (
            <select value={selectedVolunteer} onChange={e => setSelectedVolunteer(e.target.value)} className="w-full max-w-sm px-6 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-slate-50 font-bold transition-all text-slate-700">
              <option value="">-- Selecciona tu nombre --</option>
              {state.volunteers.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {activeTab === 'ranking' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-center gap-2">
              {([['week', 'Semana'], ['month', 'Mes'], ['quarter', 'Trimestre'], ['total', 'Total']] as [Period, string][]).map(([p, label]) => (
                <button key={p} onClick={() => setRankingPeriod(p)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${rankingPeriod === p ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}>
                  {label}
                </button>
              ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
              {top10[1] && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center order-2 md:order-1 h-fit transform md:scale-95">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl font-black mb-4 border-2 border-slate-200">2</div>
                  <h4 className="font-bold text-slate-800 text-center">{top10[1].name}</h4>
                  <p className="text-indigo-600 font-black text-sm">{top10[1].periodPoints} pts</p>
                </div>
              )}
              {top10[0] && (
                <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-2xl shadow-indigo-200 flex flex-col items-center order-1 md:order-2 z-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl text-white"><i className="fas fa-crown"></i></div>
                  <div className="w-20 h-20 rounded-[1.5rem] bg-amber-400 flex items-center justify-center text-white text-3xl font-black mb-4 shadow-xl border-4 border-amber-300">1</div>
                  <h4 className="font-black text-white text-xl text-center mb-1">{top10[0].name}</h4>
                  <div className="mt-4 px-4 py-1 bg-white/20 rounded-full text-white font-black text-lg">{top10[0].periodPoints} PTS</div>
                </div>
              )}
              {top10[2] && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center order-3 h-fit transform md:scale-90">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-2xl font-black mb-4 border-2 border-amber-50">3</div>
                  <h4 className="font-bold text-slate-800 text-center">{top10[2].name}</h4>
                  <p className="text-indigo-600 font-black text-sm">{top10[2].periodPoints} pts</p>
                </div>
              )}
           </div>

           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Ranking {rankingPeriod === 'week' ? 'Semanal' : rankingPeriod === 'month' ? 'Mensual' : rankingPeriod === 'quarter' ? 'Trimestral' : 'General'}</h3>
             </div>
             <div className="divide-y divide-slate-50">
               {rankedVolunteers.map((v, i) => (
                 <div key={v.id} className="flex items-center justify-between p-4 px-8 hover:bg-slate-50 transition-all group">
                   <div className="flex items-center gap-6">
                     <span className={`text-sm font-black w-8 ${i < 3 ? 'text-indigo-600' : 'text-slate-300'}`}>#{i + 1}</span>
                     <div>
                       <h5 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{v.name}</h5>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-lg font-black text-slate-800">{v.periodPoints}</div>
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Puntos</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      ) : (
        <>
          {selectedVolunteer && activeTab === 'week' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {volunteerShifts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {volunteerShifts.map((shift, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center font-bold shadow-lg shadow-indigo-100">
                          <span className="text-[10px] leading-none opacity-80 uppercase">{shift.date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                          <span className="text-lg leading-none">{shift.date.getDate()}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{shift.day}</p>
                          <h4 className="text-xl font-bold text-slate-800">{shift.role}</h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-1">Sin turnos esta semana</h3>
                </div>
              )}
            </div>
          )}
          {selectedVolunteer && activeTab === 'month' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in duration-500 overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => <div key={d} className="bg-slate-50 p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>)}
                {Array.from({ length: 35 }).map((_, i) => {
                  const baseDate = new Date(state.selectedWeek);
                  const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
                  const firstSunday = getMonday(startOfMonth);
                  const date = addDays(firstSunday, i);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isCurrentMonth = date.getMonth() === baseDate.getMonth();
                  const shift = monthlyShifts.find(s => s.date.toDateString() === date.toDateString());
                  return (
                    <div key={i} className={`bg-white min-h-[100px] p-2 flex flex-col items-center ${!isCurrentMonth ? 'opacity-20 bg-slate-50' : ''}`}>
                      <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg mb-2 ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300'}`}>{date.getDate()}</span>
                      {shift && <div className="w-full px-1 py-2 rounded-lg bg-indigo-600 text-white text-[8px] font-black text-center uppercase tracking-tighter shadow-sm">{shift.role}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VolunteerView;
