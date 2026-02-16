
import { Volunteer, ServiceConfig, WeeklySchedule, Role, DayOfWeek } from '../types';
import { addDays, getDayOffset } from '../utils/dateUtils';

export function generateSchedule(
  volunteers: Volunteer[],
  services: ServiceConfig[],
  weekStarting: string,
  options: { avoidDoubleBookingPerWeek: boolean }
): WeeklySchedule {
  const assignments: any = {};
  const warnings: string[] = [];
  const monday = new Date(weekStarting);
  
  let pool = [...volunteers];
  const weeklyAssignedIds = new Set<string>();

  services.forEach(service => {
    assignments[service.day] = {};
    const serviceAssignedIds = new Set<string>();
    
    // Calcular la fecha exacta de este servicio para verificar restricciones
    const dayName = service.day.split(' ')[0];
    const serviceDate = addDays(monday, getDayOffset(dayName)).toISOString().split('T')[0];

    Object.entries(service.requiredRoles).forEach(([roleName, count]) => {
      const role = roleName as Role;
      assignments[service.day][role] = [];

      for (let i = 0; i < count; i++) {
        let candidates = pool.filter(v => {
          const isAvailableDay = v.availableDays.includes(service.day);
          const hasRole = v.roles.includes(role);
          const notInThisService = !serviceAssignedIds.has(v.id);
          const notRestricted = !(v.restrictedDates || []).includes(serviceDate);
          const notWeeklyDouble = !options.avoidDoubleBookingPerWeek || !weeklyAssignedIds.has(v.id);
          
          return isAvailableDay && hasRole && notInThisService && notRestricted && notWeeklyDouble;
        });

        if (candidates.length === 0) {
          assignments[service.day][role].push("SIN ASIGNAR");
          warnings.push(`Dificultad para cubrir ${role} el ${service.day} (${serviceDate})`);
          continue;
        }

        candidates.sort((a, b) => (a.shiftCount || 0) - (b.shiftCount || 0));

        const selected = candidates[0];
        assignments[service.day][role].push(selected.name);
        serviceAssignedIds.add(selected.id);
        weeklyAssignedIds.add(selected.id);
        
        const volIndex = pool.findIndex(v => v.id === selected.id);
        if (volIndex !== -1) {
          pool[volIndex] = { ...pool[volIndex], shiftCount: (pool[volIndex].shiftCount || 0) + 1 };
        }
      }
    });
  });

  return {
    id: Math.random().toString(36).substr(2, 9),
    weekStarting,
    assignments,
    warnings
  };
}

export function exportToCSV(schedule: WeeklySchedule): string {
  let csv = "Día,Rol,Voluntarios\n";
  Object.entries(schedule.assignments).forEach(([day, roles]) => {
    Object.entries(roles).forEach(([role, names]) => {
      csv += `${day},${role},"${(names as string[]).join(', ')}"\n`;
    });
  });
  return csv;
}
