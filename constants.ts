
import { Role, DayOfWeek, ServiceConfig } from './types';

export const ALL_ROLES: Role[] = ['Consola', 'Transmisión', 'Proyección', 'Medios Digitales', 'Coordinación'];
export const ALL_DAYS: DayOfWeek[] = ['Miércoles', 'Sábado Mañana', 'Sábado Tarde'];

export const DEFAULT_SERVICES: ServiceConfig[] = [
  {
    id: '1',
    day: 'Miércoles',
    name: 'Servicio de Oración',
    requiredRoles: {
      'Consola': 1,
      'Transmisión': 1,
      'Proyección': 1,
      'Medios Digitales': 1,
      'Coordinación': 1
    }
  },
  {
    id: '2',
    day: 'Sábado Mañana',
    name: 'Academia / Reunión Mañana',
    requiredRoles: {
      'Consola': 1,
      'Transmisión': 1,
      'Proyección': 1,
      'Medios Digitales': 1,
      'Coordinación': 1
    }
  },
  {
    id: '3',
    day: 'Sábado Tarde',
    name: 'Servicio General Tarde',
    requiredRoles: {
      'Consola': 1,
      'Transmisión': 1,
      'Proyección': 1,
      'Medios Digitales': 1,
      'Coordinación': 1
    }
  }
];

export const ROLE_COLORS: Record<Role, string> = {
  'Consola': 'bg-blue-100 text-blue-700 border-blue-200',
  'Transmisión': 'bg-purple-100 text-purple-700 border-purple-200',
  'Proyección': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Medios Digitales': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Coordinación': 'bg-amber-100 text-amber-700 border-amber-200'
};
