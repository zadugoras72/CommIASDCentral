
export type Role = 'Consola' | 'Transmisión' | 'Proyección' | 'Medios Digitales' | 'Coordinación';
export type DayOfWeek = 'Miércoles' | 'Sábado Mañana' | 'Sábado Tarde';

export interface VolunteerEvaluation {
  id: string;
  date: string; // ISO string format YYYY-MM-DD
  punctuality: number;
  responsibility: number;
  cleanliness: number;
  total: number;
}

export interface VolunteerScores {
  punctuality: number;
  responsibility: number;
  cleanliness: number;
}

export interface Volunteer {
  id: string;
  name: string;
  roles: Role[];
  availableDays: DayOfWeek[];
  shiftCount: number;
  lastShiftDate?: string;
  evaluations: VolunteerEvaluation[];
  restrictedDates: string[]; // ISO string format YYYY-MM-DD
}

export interface ServiceConfig {
  id: string;
  day: DayOfWeek;
  name: string;
  requiredRoles: Record<Role, number>;
}

export interface WeeklySchedule {
  id: string;
  weekStarting: string;
  assignments: Record<DayOfWeek, Record<Role, string[]>>;
  warnings: string[];
}

export interface AppState {
  volunteers: Volunteer[];
  services: ServiceConfig[];
  schedules: WeeklySchedule[];
  selectedWeek: string;
  adminPin: string;
  config: {
    avoidDoubleBookingPerWeek: boolean;
    avoidConsecutiveWeeks: boolean;
  };
}
