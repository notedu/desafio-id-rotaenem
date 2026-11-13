"""Configurações carregadas do ambiente e de backend/.env."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Configuração tipada da API; segredos não aparecem em representações."""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: SecretStr | None = None
    mongodb_uri: SecretStr | None = None
    mongodb_database: str = "rotaenem"
    mongodb_collection: str = "conteudos"
    duckdb_path: Path = BACKEND_DIR / "database" / "duckdb" / "enem.duckdb"
    cors_origins: str = "http://localhost:5173"
    jwt_secret_key: SecretStr | None = None
    jwt_access_token_expire_minutes: int = Field(default=60, gt=0, le=1440)

    @property
    def allowed_origins(self) -> list[str]:
        """Converte CORS_ORIGINS, separado por vírgulas, em uma lista."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Mantém uma instância de configuração durante a execução do processo."""
    return Settings()
