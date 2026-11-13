# RotaENEM

Aplicação local para apoiar a preparação para o ENEM. O estudante cadastra uma meta, registra simulados e recebe comparação de notas, prioridades e um plano semanal com materiais de estudo.

> **Status:** demonstração local funcional. Cadastro/login, meta, simulados, desempenho, plano semanal e materiais estão integrados. As notas do estudante são registradas no sistema; as referências do ENEM vêm do DuckDB. O dashboard mostra dados da API e horas planejadas, pois o sistema não registra sessões concluídas.

## Componentes

| Componente | Responsabilidade atual |
| --- | --- |
| React, TypeScript e Vite | Autenticação e telas de início, meta, desempenho e plano semanal |
| FastAPI | Autenticação, metas, simulados, prioridades e planos |
| PostgreSQL | Estudantes, credenciais, metas, notas, tópicos e planos |
| DuckDB | Médias de referência do ENEM por ano, estado e área |
| MongoDB | Conteúdos coletados pelo Hop; a API os associa às sessões do plano |
| Apache Hop | Consulta tópicos no PostgreSQL, carrega microdados no DuckDB e busca livros na Open Library para o MongoDB |

O YouTube Data API e Google Books aparecem no desenho inicial do projeto, mas **não fazem parte da carga implementada atualmente**. A coleta atual de materiais usa a Open Library.

## Estrutura

```text
backend/   API FastAPI, schemas/migrations SQL e configuração de bancos
frontend/  aplicação React/Vite
hop/       pipelines e workflow da demonstração
docs/      guias de arquitetura, instalação, API, dados, Hop e demonstração
```

## Rodar localmente

São necessários Python, Node.js/npm, PostgreSQL, MongoDB Community Server e Apache Hop. PostgreSQL pode ser local ou Neon. Configure as conexões e variáveis conforme [`docs/instalacao-local.md`](docs/instalacao-local.md).

1. Configure `backend/.env` a partir de `backend/.env.example`; aplique `backend/database/postgres/schema.sql` e `seed.sql`. Em uma base existente, aplique também a migration do plano semanal descrita no guia de instalação.
2. Prepare o ambiente Python e inicie a API:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   python -m pip install -r backend/requirements.txt
   cd backend
   python -m uvicorn app.main:app --reload
   ```

3. Em outro terminal, instale e inicie o Front-End:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

4. Abra o endereço local informado pelo Vite. A documentação interativa da API fica em `http://127.0.0.1:8000/docs`.
5. Para carregar as bases de demonstração, abra `hop/workflows/wf_demonstracao_local.hwf` no Hop e execute com a configuração `local`.

Os comandos de inicialização detalhados, nomes das conexões Hop, configuração do CSV e migrations estão em [`docs/instalacao-local.md`](docs/instalacao-local.md) e [`docs/apache-hop.md`](docs/apache-hop.md).

## Documentação

- [Arquitetura e fluxo de dados](docs/arquitetura.md)
- [Instalação e configuração local](docs/instalacao-local.md)
- [API e exemplos de JSON](docs/api.md)
- [Modelo de dados e bancos](docs/modelo-dados.md)
- [Pipelines e workflow do Apache Hop](docs/apache-hop.md)
- [Roteiro da demonstração](docs/demonstracao.md)

## Observações

- Os arquivos `backend/.env`, `frontend/.env.local`, o CSV original e o arquivo `.duckdb` são locais e não devem conter segredos no Git.
- O workflow e a carga CSV do Hop contêm caminhos absolutos desta instalação. Consulte o guia do Hop antes de mover o projeto para outra pasta ou computador.
- A API consulta o DuckDB em modo somente leitura. O Hop é responsável pela carga analítica.
- O plano é salvo no PostgreSQL; quando encontra material compatível por área e tópico no MongoDB, grava a referência do conteúdo na sessão.

## Equipe

Equipe: 3 pessoas. Uma divisão possível é dados/Apache Hop, Back-End e Front-End, alinhando previamente o modelo dos dados e o contrato da API.
