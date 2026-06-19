from pydantic import BaseModel


class DashboardStats(BaseModel):
    asistencias_hoy: int
    asistencias_semana: int
    asistencias_mes: int
    miembros_activos: int
    aforo_actual: int
    capacidad_maxima: int
