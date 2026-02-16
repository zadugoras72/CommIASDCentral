
export function getMonday(d: Date) {
  // Ahora configurado para retornar el DOMINGO anterior o actual
  const date = new Date(d);
  const day = date.getDay(); // 0 (Dom) a 6 (Sab)
  const diff = date.getDate() - day; 
  const sunday = new Date(date.setDate(diff));
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

export function addDays(date: string | Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatShortDate(date: Date) {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function getDayOffset(day: string): number {
  // Ajustado para semana iniciando en Domingo (0)
  switch (day) {
    case 'Domingo': return 0;
    case 'Lunes': return 1;
    case 'Martes': return 2;
    case 'Miércoles': return 3;
    case 'Jueves': return 4;
    case 'Viernes': return 5;
    case 'Sábado': return 6;
    default: return 0;
  }
}

export function getMonthWeeks(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const weeks = [];
  let current = getMonday(start);
  
  while (current <= end) {
    weeks.push(new Date(current));
    current = addDays(current, 7);
  }
  return weeks;
}

export function isSameWeek(date1: Date, date2: Date) {
  const s1 = getMonday(date1);
  const s2 = getMonday(date2);
  return s1.toDateString() === s2.toDateString();
}

export function isSameMonth(date1: Date, date2: Date) {
  return date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
}

export function getQuarter(date: Date) {
  return Math.floor(date.getMonth() / 3);
}

export function isSameQuarter(date1: Date, date2: Date) {
  return getQuarter(date1) === getQuarter(date2) && date1.getFullYear() === date2.getFullYear();
}
