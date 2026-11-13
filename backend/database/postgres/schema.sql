-- Schema inicial do RotaENEM para PostgreSQL/Neon.
-- Rode em uma base de desenvolvimento. IF NOT EXISTS permite repetir a criação
-- inicial, mas não modifica tabelas existentes caso o schema seja alterado.

CREATE TABLE IF NOT EXISTS area_conhecimento (
    id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sigla    VARCHAR(3) NOT NULL UNIQUE,
    nome     VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS estudante (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    email      VARCHAR(254) NOT NULL UNIQUE,
    uf         CHAR(2),
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT estudante_uf_valida
        CHECK (uf IS NULL OR uf ~ '^[A-Z]{2}$')
);

CREATE TABLE IF NOT EXISTS credencial_estudante (
    estudante_id INTEGER PRIMARY KEY
        REFERENCES estudante(id) ON DELETE CASCADE,
    senha_hash   TEXT NOT NULL,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topico_estudo (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    area_id     INTEGER NOT NULL REFERENCES area_conhecimento(id),
    nome        VARCHAR(100) NOT NULL,
    termo_busca VARCHAR(160) NOT NULL,
    CONSTRAINT topico_area_nome_unico UNIQUE (area_id, nome)
);

CREATE TABLE IF NOT EXISTS meta (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estudante_id INTEGER NOT NULL REFERENCES estudante(id) ON DELETE CASCADE,
    curso        VARCHAR(100) NOT NULL,
    nota_corte   NUMERIC(6,2),
    data_prova   DATE,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT meta_nota_corte_valida
        CHECK (nota_corte IS NULL OR nota_corte BETWEEN 0 AND 1000)
);

CREATE TABLE IF NOT EXISTS meta_area (
    meta_id   INTEGER NOT NULL REFERENCES meta(id) ON DELETE CASCADE,
    area_id   INTEGER NOT NULL REFERENCES area_conhecimento(id),
    nota_alvo NUMERIC(6,2) NOT NULL,
    peso      NUMERIC(4,2) NOT NULL DEFAULT 1,
    PRIMARY KEY (meta_id, area_id),
    CONSTRAINT meta_area_nota_valida
        CHECK (nota_alvo BETWEEN 0 AND 1000),
    CONSTRAINT meta_area_peso_valido
        CHECK (peso >= 0)
);

CREATE TABLE IF NOT EXISTS simulado (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estudante_id INTEGER NOT NULL REFERENCES estudante(id) ON DELETE CASCADE,
    realizado_em DATE NOT NULL,
    descricao    VARCHAR(150),
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nota_simulado (
    simulado_id INTEGER NOT NULL REFERENCES simulado(id) ON DELETE CASCADE,
    area_id     INTEGER NOT NULL REFERENCES area_conhecimento(id),
    nota        NUMERIC(6,2) NOT NULL,
    PRIMARY KEY (simulado_id, area_id),
    CONSTRAINT nota_simulado_valida
        CHECK (nota BETWEEN 0 AND 1000)
);

CREATE TABLE IF NOT EXISTS plano_semanal (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estudante_id  INTEGER NOT NULL REFERENCES estudante(id) ON DELETE CASCADE,
    semana_inicio DATE NOT NULL,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT plano_estudante_semana_unica
        UNIQUE (estudante_id, semana_inicio)
);

CREATE TABLE IF NOT EXISTS plano_item (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plano_id     INTEGER NOT NULL REFERENCES plano_semanal(id) ON DELETE CASCADE,
    area_id      INTEGER NOT NULL REFERENCES area_conhecimento(id),
    topico_id    INTEGER REFERENCES topico_estudo(id) ON DELETE SET NULL,
    horas        NUMERIC(4,1) NOT NULL,
    prioridade   NUMERIC(12,2) NOT NULL DEFAULT 0,
    conteudo_ref TEXT,
    data_sessao  DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    CONSTRAINT plano_item_horas_validas
        CHECK (horas > 0)
);

CREATE INDEX IF NOT EXISTS idx_topico_estudo_area
    ON topico_estudo(area_id);

CREATE INDEX IF NOT EXISTS idx_meta_estudante
    ON meta(estudante_id);

CREATE INDEX IF NOT EXISTS idx_simulado_estudante_data
    ON simulado(estudante_id, realizado_em DESC);

CREATE INDEX IF NOT EXISTS idx_plano_item_plano
    ON plano_item(plano_id);

CREATE INDEX IF NOT EXISTS idx_plano_item_agenda
    ON plano_item(plano_id, data_sessao, horario_inicio);
