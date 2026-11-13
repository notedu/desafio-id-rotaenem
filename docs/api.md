# API RotaENEM

A API está descrita também pelo OpenAPI em `http://127.0.0.1:8000/docs` enquanto o Back-End está ativo. Exceto `/health`, `/health/ready`, cadastro e login, as rotas abaixo exigem:

```http
Authorization: Bearer <access_token>
```

As respostas de erro usam o formato FastAPI (`{"detail": ...}`). `422` representa validação; `401`, credencial/token inválido; `409`, conflito ou pré-requisito; `404`, recurso não cadastrado; `503`, dependência indisponível.

## Saúde

| Método e caminho | Resultado |
| --- | --- |
| `GET /health` | API disponível: `{"status":"ok"}` |
| `GET /health/ready` | Testa a conexão PostgreSQL e retorna `{"status":"ok","database":"connected"}` |

## Cadastro, login e sessão

`POST /auth/register` cria um estudante (`201`). O campo `uf` é opcional.

```json
{
  "nome": "Mariana Lima",
  "email": "mariana@example.com",
  "senha": "MinhaSenhaSegura123!",
  "uf": "SP"
}
```

E-mail já cadastrado retorna `409`; dados inválidos, `422`.

`POST /auth/login` recebe:

```json
{
  "email": "mariana@example.com",
  "senha": "MinhaSenhaSegura123!"
}
```

Retorna `access_token`, `token_type`, `expires_in` e dados públicos do estudante. Credenciais inválidas retornam `401`; segredo JWT ausente retorna `503`.

`GET /auth/me` retorna o estudante associado ao token.

## Meta

`GET /metas/me` consulta a meta do estudante (`404` se não cadastrada). `PUT /metas/me` cria ou substitui a meta atual:

```json
{
  "curso": "Medicina",
  "nota_corte": 720,
  "data_prova": "2030-11-08",
  "areas": [
    { "sigla": "MT", "nota_alvo": 700, "peso": 3 },
    { "sigla": "CN", "nota_alvo": 680, "peso": 2 },
    { "sigla": "CH", "nota_alvo": 670, "peso": 1 },
    { "sigla": "LC", "nota_alvo": 650, "peso": 1 },
    { "sigla": "RED", "nota_alvo": 800, "peso": 1 }
  ]
}
```

O contrato não tem campo de universidade. Os códigos das cinco áreas são obrigatórios e devem aparecer uma única vez: `MT`, `CN`, `CH`, `LC`, `RED`. Notas e nota de corte vão de 0 a 1000; o peso aceita de 0 a 10.

## Simulados

`POST /simulados` registra um simulado (`201`):

```json
{
  "realizado_em": "2026-06-15",
  "descricao": "Simulado geral 01",
  "notas": { "MT": 560, "CN": 590, "CH": 640, "LC": 640, "RED": 780 }
}
```

Todas as cinco áreas são obrigatórias; cada nota vai de 0 a 1000. `GET /simulados?limit=20` lista os simulados mais recentes. O limite aceita de 1 a 100 e, sem parâmetro, é 20.

## Desempenho e prioridades

`GET /desempenho/me` retorna meta atual, resumo do simulado mais recente, médias de referência do ENEM por área, diferenças e ranking de prioridades. A prioridade é calculada pelo ganho necessário até a nota-alvo multiplicado pelo peso da área:

```text
max(nota_alvo - nota_atual, 0) * peso
```

Se ainda não houver meta ou simulado, os dados correspondentes vêm nulos e o ranking pode estar vazio. As referências são lidas do DuckDB; quando ele não está disponível, a resposta indica a referência como indisponível, sem descartar o restante do desempenho.

## Plano semanal

`POST /planos/me/gerar` gera ou substitui o plano daquela semana. É necessário já ter uma meta e ao menos um simulado (`409` caso contrário).

```json
{
  "semana_inicio": "2026-11-16",
  "horas_semanais": 8,
  "dias_disponiveis": ["SEG", "QUA", "SEX"],
  "horario_inicio": "09:00:00"
}
```

- `horas_semanais` é obrigatório: de 0,5 a 40, em incrementos de meia hora.
- `semana_inicio` é opcional e, se informado, deve ser uma segunda-feira. Sem valor, a API usa a segunda-feira da semana atual em `America/Sao_Paulo`.
- `dias_disponiveis` é opcional; o padrão é segunda a sexta. Valores: `SEG`, `TER`, `QUA`, `QUI`, `SEX`, `SAB`, `DOM`, sem duplicatas.
- `horario_inicio` é opcional e tem padrão `09:00:00`; aceita hora cheia ou meia hora.
- São permitidas até 10 horas por dia disponível. Horário que não comporte as sessões antes da meia-noite retorna `422`.

`GET /planos/me` consulta o plano da semana atual. Para outra semana, use `GET /planos/me?semana_inicio=2026-11-16`; data que não seja segunda-feira retorna `422`. Semana sem plano retorna `404`.

As sessões incluem data, hora, área, tópico, prioridade e `conteudo`. Esse campo é `null` quando não há correspondência de material no MongoDB. Quando há material, retorna `id`, `tipo`, `titulo`, `url`, `fonte` e `detalhe`.
