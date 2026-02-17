
import React, { useState, useMemo } from 'react';
import { AppState, Role, DayOfWeek } from '../types';
import { addDays, formatShortDate, getDayOffset, getMonday, isSameWeek, isSameMonth, isSameQuarter } from '../utils/dateUtils';

interface Props {
  state: AppState;
}

type Period = 'week' | 'month' | 'quarter' | 'total';

const Calendario: React.FC<Props> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'ranking'>('week');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [rankingPeriod, setRankingPeriod] = useState<Period>('total');

  const activeSchedule = state.schedules.find(s => s.weekStarting === state.selectedWeek);

  const rankedVolunteers = useMemo(() => {
    const now = new Date();
    return state.volunteers.map(v => {
      let filtered = (v.evaluations || []);
      if (rankingPeriod === 'week') filtered = filtered.filter(e => isSameWeek(new Date(e.date), now));
      else if (rankingPeriod === 'month') filtered = filtered.filter(e => isSameMonth(new Date(e.date), now));
      else if (rankingPeriod === 'quarter') filtered = filtered.filter(e => isSameQuarter(new Date(e.date), now));
      
      const periodPoints = filtered.reduce((acc, curr) => acc + curr.total, 0);
      return { ...v, periodPoints };
    }).sort((a, b) => b.periodPoints - a.periodPoints);
  }, [state.volunteers, rankingPeriod]);

  const volunteerShifts = useMemo(() => {
    if (!selectedVolunteer || !activeSchedule) return [];
    const shifts: any[] = [];
    Object.entries(activeSchedule.assignments).forEach(([day, roles]) => {
      Object.entries(roles).forEach(([role, names]) => {
        if (names.includes(selectedVolunteer)) {
          const date = addDays(new Date(activeSchedule.weekStarting), getDayOffset(day.split(' ')[0]));
          shifts.push({ day, role, date });
        }
      });
    });
    return shifts;
  }, [selectedVolunteer, activeSchedule]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
            {(['week', 'month', 'ranking'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab === 'week' ? 'Semana' : tab === 'month' ? 'Mes' : 'Ranking'}
              </button>
            ))}
          </div>

          {activeTab !== 'ranking' && (
            <select 
              value={selectedVolunteer} 
              onChange={e => setSelectedVolunteer(e.target.value)}
              className="w-full md:w-64 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Buscar por nombre...</option>
              {state.volunteers.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {activeTab === 'ranking' && (
        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {([['week', 'Semana'], ['month', 'Mes'], ['quarter', 'Trimestre'], ['total', 'Total']] as [Period, string][]).map(([p, label]) => (
              <button key={p} onClick={() => setRankingPeriod(p)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${rankingPeriod === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
            {rankedVolunteers.map((v, i) => (
              <div key={v.id} className="flex items-center justify-between p-4 px-8 border-b last:border-0 hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-6">
                  <span className={`text-sm font-black w-6 ${i < 3 ? 'text-indigo-600' : 'text-slate-300'}`}>#{i + 1}</span>
                  <span className="font-bold text-slate-800">{v.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-indigo-600">{v.periodPoints}</span>
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Puntos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'week' && selectedVolunteer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {volunteerShifts.length > 0 ? volunteerShifts.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                  {s.date.getDate()}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">{s.day}</p>
                  <h4 className="text-xl font-black text-slate-800">{s.role}</h4>
                </div>
              </div>
            </div>
          )) : (
            <div className="md:col-span-2 py-20 text-center text-slate-400 font-bold uppercase tracking-widest border-2 border-dashed rounded-3xl">
              Sin turnos asignados para esta semana
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'month' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-slate-200 border rounded-2xl overflow-hidden">
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => <div key={d} className="bg-slate-50 p-2 text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>)}
            {Array.from({ length: 35 }).map((_, i) => {
              const startOfMonth = new Date(new Date(state.selectedWeek).getFullYear(), new Date(state.selectedWeek).getMonth(), 1);
              const firstSun = getMonday(startOfMonth);
              const date = addDays(firstSun, i);
              const isCurr = date.getMonth() === new Date(state.selectedWeek).getMonth();
              return (
                <div key={i} className={`bg-white min-h-[80px] p-2 ${!isCurr ? 'opacity-20' : ''}`}>
                  <span className="text-[10px] font-black text-slate-400">{date.getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;
