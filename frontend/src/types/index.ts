export interface UserMe {
  id: string;
  username: string;
  email: string;
  nombre: string;
  rol: "admin" | "recepcionista";
}

export interface Member {
  id: string;
  dni: string;
  codigo_unico: string | null;
  nombre: string;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  rango_edad_id: string | null;
  observaciones_medicas: string | null;
  otras_observaciones: string | null;
  foto_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Academy {
  id: string;
  codigo: string;
  nombre: string;
  num_estudiantes: number;
  color: string;
  created_at: string;
}

export interface AgeRange {
  id: string;
  nombre: string;
  edad_min: number;
  edad_max: number;
  color: string;
  created_at: string;
}

export interface Membership {
  id: string;
  member_id: string;
  tipo: "mensual" | "trimestral" | "puntual";
  fecha_inicio: string;
  fecha_fin: string;
  monto: number;
  estado_pago: "pagado" | "pendiente" | "vencido";
  created_at: string;
}

export interface ScheduleSlot {
  id: string;
  membership_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  member_id: string | null;
  academy_id: string | null;
  tipo: string;
  member_dni?: string | null;
  member_nombre?: string;
  member_apellidos?: string | null;
  fecha: string;
  hora_entrada: string;
  ubicacion: string | null;
  observacion: string | null;
  registrado_por: string;
  created_at: string;
}

export interface CheckinInfo {
  member_id: string | null;
  academy_id: string | null;
  tipo: "member" | "academy";
  dni: string | null;
  nombre: string;
  tiene_horario_hoy: boolean;
  horario_hoy: string | null;
  aforo_actual: number;
  capacidad_maxima: number;
  puede_entrar: boolean;
  ya_entro: boolean;
  inactivo?: boolean;
  sin_horario_advertencia?: boolean;
}

export interface DashboardStats {
  asistencias_hoy: number;
  asistencias_semana: number;
  asistencias_mes: number;
  miembros_activos: number;
  aforo_actual: number;
  capacidad_maxima: number;
  ubicaciones?: { nombre: string; tipo: string; ocupado: boolean; miembro: { member_id: string; nombre: string } | null }[];
}
