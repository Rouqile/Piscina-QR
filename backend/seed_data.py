import uuid
from datetime import date, datetime, time, timezone, timedelta

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User
from app.models.member import Member
from app.models.membership import Membership
from app.models.schedule_slot import ScheduleSlot
from app.models.horario import Horario
from app.models.shift_assignment import ShiftAssignment
from app.models.pool_config import PoolConfig
from app.models.academy import Academy
from app.models.age_range import AgeRange


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).first():
        print("La base de datos ya tiene datos. Agregando solo datos nuevos faltantes...")
        existing_academy = db.query(Academy).first()
        if not existing_academy:
            academia_olimpo = Academy(
                id=uuid.uuid4(),
                codigo="OLIMPO-2026",
                nombre="Olimpo",
                num_estudiantes=10,
                color="#a855f7",
            )
            db.add(academia_olimpo)
            print("Academia Olimpo creada.")
        elif not existing_academy.codigo:
            existing_academy.codigo = "OLIMPO-2026"
            print("Codigo asignado a academia existente.")
        if not existing_academy or not existing_academy.color or existing_academy.color == "#a855f7":
            if existing_academy and not existing_academy.color:
                existing_academy.color = "#a855f7"
                print("Color asignado a academia existente.")
        if not db.query(AgeRange).first():
            rango_joven = AgeRange(
                id=uuid.uuid4(), nombre="Joven", edad_min=15, edad_max=20, color="#8b5cf6",
            )
            rango_adulto = AgeRange(
                id=uuid.uuid4(), nombre="Adulto", edad_min=21, edad_max=40, color="#3b82f6",
            )
            rango_mayor = AgeRange(
                id=uuid.uuid4(), nombre="Mayor", edad_min=41, edad_max=80, color="#22c55e",
            )
            db.add_all([rango_joven, rango_adulto, rango_mayor])
            print("Rangos de edad creados.")
        db.commit()
        db.close()
        return

    admin = User(
        id=uuid.uuid4(),
        username="admin",
        email="admin@piscinaqr.com",
        hashed_password=hash_password("admin123"),
        nombre="Administrador",
        rol="admin",
        is_active=True,
    )
    recepcionista = User(
        id=uuid.uuid4(),
        username="recepcion",
        email="recepcion@piscinaqr.com",
        hashed_password=hash_password("recepcion123"),
        nombre="Recepcionista",
        rol="recepcionista",
        is_active=True,
    )
    db.add_all([admin, recepcionista])

    config = PoolConfig(id=uuid.uuid4(), capacidad_maxima=30)
    db.add(config)

    if not db.query(Academy).first():
        academia_olimpo = Academy(
            id=uuid.uuid4(),
            codigo="OLIMPO-2026",
            nombre="Olimpo",
            num_estudiantes=10,
        )
        db.add(academia_olimpo)
        print("Academia Olimpo creada.")

    if not db.query(AgeRange).first():
        rango_joven = AgeRange(
            id=uuid.uuid4(),
            nombre="Joven",
            edad_min=15,
            edad_max=20,
            color="#8b5cf6",
        )
        rango_adulto = AgeRange(
            id=uuid.uuid4(),
            nombre="Adulto",
            edad_min=21,
            edad_max=40,
            color="#3b82f6",
        )
        rango_mayor = AgeRange(
            id=uuid.uuid4(),
            nombre="Mayor",
            edad_min=41,
            edad_max=80,
            color="#22c55e",
        )
        db.add_all([rango_joven, rango_adulto, rango_mayor])
        print("Rangos de edad creados.")

    pepito = Member(
        id=uuid.uuid4(),
        dni="12345678",
        nombre="Pepito",
        apellidos="Pérez",
        email="pepito@example.com",
        telefono="999888777",
        is_active=True,
    )
    db.add(pepito)
    db.flush()

    membership = Membership(
        id=uuid.uuid4(),
        member_id=pepito.id,
        tipo="mensual",
        fecha_inicio=datetime.now(timezone.utc).date(),
        fecha_fin=datetime.now(timezone.utc).date().replace(
            year=datetime.now(timezone.utc).year + 1
        ),
        monto=100.00,
        estado_pago="pagado",
    )
    db.add(membership)
    db.flush()

    for dia in [0, 2, 4]:
        slot = ScheduleSlot(
            id=uuid.uuid4(),
            membership_id=membership.id,
            dia_semana=dia,
            hora_inicio=time(16, 0),
            hora_fin=time(18, 0),
        )
        db.add(slot)

    horario_tarde = Horario(
        id=uuid.uuid4(),
        nombre="Tarde 4-6 PM",
        hora_inicio=time(16, 0),
        hora_fin=time(18, 0),
    )
    db.add(horario_tarde)
    db.flush()

    hoy = date.today()
    fin_anio = hoy.replace(year=hoy.year + 1)
    for dia in [0, 2, 4]:
        assignment = ShiftAssignment(
            id=uuid.uuid4(),
            member_id=pepito.id,
            horario_id=horario_tarde.id,
            dia_semana=dia,
            fecha_inicio=hoy,
            fecha_fin=fin_anio,
        )
        db.add(assignment)

    db.commit()
    db.close()
    print("Seed completado exitosamente.")
    print("Usuario admin: admin / admin123")
    print("Usuario recepcion: recepcion / recepcion123")
    print("Miembro ejemplo: Pepito Pérez (DNI: 12345678)")
    print("  -> Horario: Tarde 4-6 PM (Lun, Mié, Vie) hasta " + str(fin_anio))


if __name__ == "__main__":
    seed()
