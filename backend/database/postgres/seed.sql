-- Dados de referência iniciais do RotaENEM.

INSERT INTO area_conhecimento (sigla, nome)
VALUES
    ('MT',  'Matemática'),
    ('CN',  'Ciências da Natureza'),
    ('CH',  'Ciências Humanas'),
    ('LC',  'Linguagens'),
    ('RED', 'Redação')
ON CONFLICT (sigla) DO NOTHING;

INSERT INTO topico_estudo (area_id, nome, termo_busca)
SELECT a.id, t.nome, t.termo_busca
FROM (
    VALUES
        ('MT',  'Porcentagem e proporção', 'porcentagem e proporção ENEM'),
        ('MT',  'Função quadrática', 'função quadrática ENEM'),
        ('CN',  'Ecologia', 'ecologia ENEM'),
        ('CN',  'Estequiometria', 'estequiometria ENEM'),
        ('CH',  'Brasil República', 'Brasil República ENEM'),
        ('CH',  'Geografia agrária', 'geografia agrária ENEM'),
        ('LC',  'Interpretação de texto', 'interpretação de texto ENEM'),
        ('LC',  'Gêneros textuais', 'gêneros textuais ENEM'),
        ('RED', 'Competências da redação', 'competências redação ENEM'),
        ('RED', 'Repertório sociocultural', 'repertório sociocultural redação ENEM')
) AS t(area_sigla, nome, termo_busca)
JOIN area_conhecimento AS a
    ON a.sigla = t.area_sigla
ON CONFLICT (area_id, nome) DO NOTHING;
