import io
from datetime import date

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.schemas.report import ReportDetail, ReporteDetalleAsistencias, ReporteMiembros
from app.services.import_service import (
    generate_template,
    import_members_from_excel,
)
from app.services.report_service import (
    export_detalle_excel,
    export_detalle_pdf,
    export_excel,
    export_miembros_excel,
    export_miembros_pdf,
    export_pdf,
    get_detalle_asistencias,
    get_encabezado,
    get_report_data,
    get_reporte_miembros,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/attendance", response_model=ReportDetail)
def attendance_report(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    member_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return get_report_data(db, fecha_inicio, fecha_fin, member_id)


@router.get("/attendance-detail", response_model=ReporteDetalleAsistencias)
def attendance_detail_report(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    member_id: str | None = Query(None),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return get_detalle_asistencias(db, fecha_inicio, fecha_fin, member_id, is_active)


@router.get("/members", response_model=ReporteMiembros)
def members_report(
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return get_reporte_miembros(db, is_active)


@router.get("/export-excel")
def export_excel_report(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    member_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    data = get_report_data(db, fecha_inicio, fecha_fin, member_id)
    enc = get_encabezado(db)
    buf = export_excel(data, enc)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=reporte_asistencias_{date.today().isoformat()}.xlsx"
        },
    )


@router.get("/export-pdf")
def export_pdf_report(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    member_id: str | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    data = get_report_data(db, fecha_inicio, fecha_fin, member_id)
    enc = get_encabezado(db)
    buf = export_pdf(data, enc)
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=reporte_asistencias_{date.today().isoformat()}.pdf"
        },
    )


@router.get("/export-detalle-excel")
def export_detalle_excel_report(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    member_id: str | None = Query(None),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    data = get_detalle_asistencias(db, fecha_inicio, fecha_fin, member_id, is_active)
    enc = get_encabezado(db)
    buf = export_detalle_excel(data, enc)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=detalle_asistencias_{date.today().isoformat()}.xlsx"},
    )


@router.get("/export-detalle-pdf")
def export_detalle_pdf_report(
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    member_id: str | None = Query(None),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    data = get_detalle_asistencias(db, fecha_inicio, fecha_fin, member_id, is_active)
    enc = get_encabezado(db)
    buf = export_detalle_pdf(data, enc)
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=detalle_asistencias_{date.today().isoformat()}.pdf"},
    )


@router.get("/export-miembros-excel")
def export_miembros_excel_report(
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    data = get_reporte_miembros(db, is_active)
    enc = get_encabezado(db)
    buf = export_miembros_excel(data, enc)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=miembros_{date.today().isoformat()}.xlsx"},
    )


@router.get("/export-miembros-pdf")
def export_miembros_pdf_report(
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    data = get_reporte_miembros(db, is_active)
    enc = get_encabezado(db)
    buf = export_miembros_pdf(data, enc)
    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=miembros_{date.today().isoformat()}.pdf"},
    )


@router.get("/importar/plantilla")
def descargar_plantilla(
    _=Depends(require_admin),
):
    buf = generate_template()
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=plantilla_miembros.xlsx"
        },
    )


@router.post("/importar/subir", status_code=status.HTTP_200_OK)
def importar_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    contents = file.file.read()
    buf = io.BytesIO(contents)
    result = import_members_from_excel(buf, db)
    return result
