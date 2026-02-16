
import React, { useState } from 'react';
import { Volunteer, Role, DayOfWeek } from '../types';
import { ALL_ROLES, ALL_DAYS } from '../constants';

interface Props {
  onSave: (volunteer: Volunteer) => void;
  onCancel: () => void;
  initialData?: Volunteer;
}

const VolunteerForm: React.FC<Props> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [roles, setRoles] = useState<Role[]>(initialData?.roles || []);
  const [availableDays, setAvailableDays] = useState<DayOfWeek[]>(initialData?.availableDays || []);
  const [restrictedDates, setRestrictedDates] = useState<string[]>(initialData?.restrictedDates || []);
  const [newRestrictedDate, setNewRestrictedDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || roles.length === 0 || availableDays.length === 0) {
      alert("Por favor completa todos los campos requeridos.");
      return;
    }
    
    // Fix: Corrected property mapping to match Volunteer interface defined in types.ts.
    // Removed 'scores' and 'totalPoints' which are not part of the interface, and added 'evaluations'.
    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name,
      roles,
      availableDays,
      shiftCount: initialData?.shiftCount || 0,
      evaluations: initialData?.evaluations || [],
      restrictedDates,
      lastShiftDate: initialData?.lastShiftDate
    });
  };

  const toggleRole = (role: Role) => {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const toggleDay = (day: DayOfWeek) => {
    setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const addRestrictedDate = () => {
    if (newRestrictedDate && !restrictedDates.includes(newRestrictedDate)) {
      setRestrictedDates(prev => [...prev, newRestrictedDate].sort());
      setNewRestrictedDate('');
    }
  };

  const removeRestrictedDate = (date: string) => {
    setRestrictedDates(prev => prev.filter(d => d !== date));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 overflow-y-auto max-h-[90vh] border border-slate-100">
        <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-user-tag text-indigo-600"></i>
          {initialData ? 'Editar Voluntario' : 'Nuevo Voluntario'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Funciones Disponibles</label>
            <div className="grid grid-cols-1 gap-2">
              {ALL_ROLES.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold border flex items-center justify-between transition-all ${
                    roles.includes(role) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {role}
                  {roles.includes(role) && <i className="fas fa-check-circle"></i>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Bloques Horarios</label>
            <div className="flex flex-col gap-2">
              {ALL_DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold border flex items-center justify-between transition-all ${
                    availableDays.includes(day) ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day}
                  {availableDays.includes(day) && <i className="fas fa-calendar-check"></i>}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Fechas Restringidas (No disponible)</label>
            <div className="flex gap-2 mb-3">
              <input 
                type="date"
                value={newRestrictedDate}
                onChange={e => setNewRestrictedDate(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-500"
              />
              <button 
                type="button"
                onClick={addRestrictedDate}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold"
              >
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {restrictedDates.map(date => (
                <div key={date} className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[10px] font-black flex items-center gap-2">
                  {date}
                  <button type="button" onClick={() => removeRestrictedDate(date)}>
                    <i className="fas fa-times-circle"></i>
                  </button>
                </div>
              ))}
              {restrictedDates.length === 0 && <p className="text-[10px] text-slate-400 italic">Sin restricciones de fecha</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-2xl text-slate-400 font-bold hover:bg-slate-100 transition-colors uppercase text-xs tracking-widest"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all font-bold uppercase text-xs tracking-widest"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VolunteerForm;
