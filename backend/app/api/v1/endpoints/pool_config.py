import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_admin
from app.crud.crud_pool_config import pool_config_crud
from app.db.session import get_db
from app.schemas.pool_config import PoolConfigResponse, PoolConfigUpdate

router = APIRouter(prefix="/pool-config", tags=["pool-config"])


@router.get("/", response_model=PoolConfigResponse)
def get_config(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    config = pool_config_crud.get_singleton(db)
    if config.ubicaciones:
        try:
            config.ubicaciones = json.loads(config.ubicaciones)
        except (json.JSONDecodeError, TypeError):
            config.ubicaciones = None
    return config


@router.put("/", response_model=PoolConfigResponse)
def update_config(
    body: PoolConfigUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    config = pool_config_crud.get_singleton(db)
    update_data = body.model_dump(exclude_unset=True)
    if "ubicaciones" in update_data:
        update_data["ubicaciones"] = json.dumps(update_data["ubicaciones"])
    for field, value in update_data.items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    if config.ubicaciones:
        try:
            config.ubicaciones = json.loads(config.ubicaciones)
        except (json.JSONDecodeError, TypeError):
            config.ubicaciones = None
    return config
