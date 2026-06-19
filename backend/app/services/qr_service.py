import io

import qrcode

from app.crud.crud_member import member_crud
from sqlalchemy.orm import Session


def generate_qr(dni: str, codigo_unico: str | None = None) -> io.BytesIO:
    content = dni
    if codigo_unico:
        content = dni + codigo_unico
    qr = qrcode.make(content)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    buf.seek(0)
    return buf
