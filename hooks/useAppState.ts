
import { useState, useEffect } from 'react';
import { AppState } from '../types';
import { DEFAULT_SERVICES } from '../constants';
import { getMonday } from '../utils/dateUtils';

export function useAppState() {
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
        // Sanitizar voluntarios para evitar errores de undefined en producción
        const sanitizedVolunteers = (parsed.volunteers || []).map((v: any) => ({
          ...v,
          evaluations: v.evaluations || [],
          restrictedDates: v.restrictedDates || [],
          shiftCount: v.shiftCount || 0,
          roles: v.roles || [],
          availableDays: v.availableDays || []
        }));

        return {
          ...defaultState,
          ...parsed,
          volunteers: sanitizedVolunteers,
          schedules: parsed.schedules || []
        };
      }
    } catch (e) {
      console.error("Critical error loading state from localStorage:", e);
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('comms_shift_state_v3', JSON.stringify(state));
  }, [state]);

  const updateState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  return { state, updateState };
}
