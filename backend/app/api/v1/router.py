from fastapi import APIRouter

from app.api.v1.endpoints import (
    academies,
    age_ranges,
    attendances,
    auth,
    checkin,
    dashboard,
    horarios,
    members,
    memberships,
    pool_config,
    reports,
    schedule_slots,
    shift_assignments,
    users,
)

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(academies.router)
router.include_router(age_ranges.router)
router.include_router(members.router)
router.include_router(memberships.router)
router.include_router(schedule_slots.router)
router.include_router(horarios.router)
router.include_router(shift_assignments.router)
router.include_router(attendances.router)
router.include_router(checkin.router)
router.include_router(dashboard.router)
router.include_router(pool_config.router)
router.include_router(reports.router)
router.include_router(users.router)
