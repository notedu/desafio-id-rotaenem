-- Adiciona prioridade e horário de cada sessão aos planos já existentes.
-- Seguro para executar novamente. Itens antigos recebem horários dentro da semana.

ALTER TABLE plano_item
    ADD COLUMN IF NOT EXISTS prioridade NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE plano_item
    ADD COLUMN IF NOT EXISTS data_sessao DATE;

ALTER TABLE plano_item
    ADD COLUMN IF NOT EXISTS horario_inicio TIME;

WITH itens_agendados AS (
    SELECT
        pi.id,
        ps.semana_inicio + (((ROW_NUMBER() OVER (
            PARTITION BY pi.plano_id ORDER BY pi.id
        ) - 1) % 7)::INTEGER) AS data_sessao,
        (TIME '09:00' + (
            ((ROW_NUMBER() OVER (
                PARTITION BY pi.plano_id ORDER BY pi.id
            ) - 1) / 7)::INTEGER * INTERVAL '90 minutes'
        ))::TIME AS horario_inicio
    FROM plano_item AS pi
    JOIN plano_semanal AS ps ON ps.id = pi.plano_id
    WHERE pi.data_sessao IS NULL OR pi.horario_inicio IS NULL
)
UPDATE plano_item AS pi
SET data_sessao = itens_agendados.data_sessao,
    horario_inicio = itens_agendados.horario_inicio
FROM itens_agendados
WHERE pi.id = itens_agendados.id;

ALTER TABLE plano_item
    ALTER COLUMN data_sessao SET NOT NULL,
    ALTER COLUMN horario_inicio SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plano_item_agenda
    ON plano_item(plano_id, data_sessao, horario_inicio);
