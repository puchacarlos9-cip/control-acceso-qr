export type RolUsuario = 'super_admin' | 'admin' | 'guardia';
export type TurnoGuardia = 'Matutino' | 'Vespertino' | 'Nocturno' | 'Turno General';
export type EstadoPago = 'Pagado' | 'Pendiente';
export type EstadoAptoMedico = 'Apto' | 'Pendiente' | 'Vencido';
export type MetodoAcceso = 'QR' | 'Cédula';
export type EstadoIngreso = 'Permitido' | 'Denegado';

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  password?: string;
  rol: RolUsuario;
  turno?: TurnoGuardia;
  fecha_registro?: string;
}

export interface Estudiante {
  id: string;
  nombre: string;
  apellidos: string;
  cedula: string;
  estado_pago: EstadoPago;
  qr_uuid: string;
  fecha_registro?: string;
  curso?: string; // Mantener retrocompatibilidad o Disciplina
  disciplina?: string;
  categoria?: string;
  entrenador?: string;
  apto_medico?: EstadoAptoMedico;
  contacto_emergencia?: string;
}

export interface AccesoLog {
  id: string;
  nombre_estudiante: string;
  cedula: string;
  guardia_responsable: string;
  fecha_hora: string;
  estado_ingreso: EstadoIngreso;
  metodo: MetodoAcceso;
  motivo?: string;
  disciplina?: string;
  zona_acceso?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
