import json

from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.pool_config import PoolConfig
from app.schemas.pool_config import PoolConfigUpdate


class CRUDPoolConfig(CRUDBase[PoolConfig, PoolConfigUpdate, PoolConfigUpdate]):
    def get_singleton(self, db: Session) -> PoolConfig:
        config = db.query(PoolConfig).first()
        if not config:
            default_ubicaciones = [
                {"nombre": "Carril 1", "tipo": "carril"},
                {"nombre": "Carril 2", "tipo": "carril"},
                {"nombre": "Carril 3", "tipo": "carril"},
                {"nombre": "Carril 4", "tipo": "carril"},
                {"nombre": "Carril 5", "tipo": "carril"},
                {"nombre": "Carril 6", "tipo": "carril"},
                {"nombre": "Piscina 1", "tipo": "piscina"},
                {"nombre": "Piscina 2", "tipo": "piscina"},
            ]
            config = PoolConfig(
                capacidad_maxima=30,
                ubicaciones=json.dumps(default_ubicaciones),
            )
            db.add(config)
            db.commit()
            db.refresh(config)
        return config


pool_config_crud = CRUDPoolConfig(PoolConfig)
