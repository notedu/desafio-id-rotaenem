-- Estrutura analítica inicial para dados tratados dos microdados do ENEM.
-- O Apache Hop pode limpar o CSV e carregar as linhas nesta tabela.

CREATE TABLE IF NOT EXISTS enem_notas (
    ano     INTEGER NOT NULL,
    uf      VARCHAR(2),
    nota_cn DOUBLE,
    nota_ch DOUBLE,
    nota_lc DOUBLE,
    nota_mt DOUBLE,
    nota_red DOUBLE
);

-- Médias por ano, estado e área. O backend pode filtrar por ano e UF.
CREATE OR REPLACE VIEW enem_media_uf_area AS
SELECT
    ano,
    uf,
    AVG(nota_cn)  AS media_cn,
    AVG(nota_ch)  AS media_ch,
    AVG(nota_lc)  AS media_lc,
    AVG(nota_mt)  AS media_mt,
    AVG(nota_red) AS media_red
FROM enem_notas
GROUP BY ano, uf;

-- Médias nacionais por ano, para comparação quando não houver UF selecionada.
CREATE OR REPLACE VIEW enem_media_nacional_area AS
SELECT
    ano,
    AVG(nota_cn)  AS media_cn,
    AVG(nota_ch)  AS media_ch,
    AVG(nota_lc)  AS media_lc,
    AVG(nota_mt)  AS media_mt,
    AVG(nota_red) AS media_red
FROM enem_notas
GROUP BY ano;
