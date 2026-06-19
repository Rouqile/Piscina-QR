import uuid
from datetime import date

from pydantic import BaseModel


class ReportFilter(BaseModel):
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    member_id: uuid.UUID | None = None


class AttendanceSummary(BaseModel):
    total_miembros_activos: int
    total_asistencias_en_rango: int
    miembros_con_asistencia: int
    miembros_sin_asistencia: int
    fecha_inicio: str
    fecha_fin: str


class MemberReportRow(BaseModel):
    member_id: uuid.UUID
    dni: str
    nombre: str
    apellidos: str | None
    telefono: str | None
    total_asistencias: int
    fechas_asistio: list[str]


class ReportDetail(BaseModel):
    summary: AttendanceSummary
    detalle: list[MemberReportRow]


class HorarioAsignadoInfo(BaseModel):
    horario_nombre: str
    hora_inicio: str
    hora_fin: str
    dias_semana: list[str]
    fecha_inicio: str
    fecha_fin: str


class AsistenciaRegistro(BaseModel):
    fecha: str
    hora_entrada: str
    observacion: str | None


class MiembroReporteDetalle(BaseModel):
    member_id: uuid.UUID
    dni: str
    nombre: str
    apellidos: str | None
    telefono: str | None
    email: str | None
    is_active: bool
    fecha_nacimiento: str | None
    observaciones_medicas: str | None
    total_asistencias_en_rango: int
    horarios_asignados: list[HorarioAsignadoInfo]
    asistencias: list[AsistenciaRegistro]


class ReporteDetalleAsistencias(BaseModel):
    miembros: list[MiembroReporteDetalle]
    total_asistencias: int
    fecha_inicio: str
    fecha_fin: str


class MiembroReporteSimple(BaseModel):
    member_id: uuid.UUID
    dni: str
    nombre: str
    apellidos: str | None
    email: str | None
    telefono: str | None
    fecha_nacimiento: str | None
    is_active: bool
    observaciones_medicas: str | None
    otras_observaciones: str | None
    created_at: str


class ReporteMiembros(BaseModel):
    total: int
    activos: int
    inactivos: int
    miembros: list[MiembroReporteSimple]
