# RotaENEM

**Plano de estudos inteligente com integração de dados**

O RotaENEM é uma proposta de aplicação para ajudar estudantes que se preparam para o ENEM a decidir o que estudar primeiro. A ideia é combinar resultados de simulados, metas por área e dados de referência do ENEM para apontar prioridades e montar um plano semanal de estudos.

> **Status do projeto:** estrutura inicial em desenvolvimento. O frontend ainda está no scaffold padrão do Vite, e o backend, os bancos de dados e os pipelines de integração ainda precisam ser implementados. Este README descreve a proposta e o plano atual; não representa funcionalidades já concluídas.

## Problema

Quem estuda para o ENEM pode ter dificuldade para identificar quais áreas precisam de mais atenção, acompanhar a evolução em relação à própria meta e comparar seu desempenho com referências nacionais ou estaduais.

## Solução proposta

O estudante informa seu objetivo, registra notas de simulados e recebe uma visão das áreas prioritárias. A aplicação cruza essas informações com dados consolidados do ENEM e com conteúdos de estudo encontrados em fontes externas.

### Funcionalidades previstas para o MVP

- Cadastro de estudante e de meta de curso/nota.
- Registro de notas de simulados nas cinco áreas do ENEM: Matemática, Ciências da Natureza, Ciências Humanas, Linguagens e Redação.
- Comparação do desempenho do estudante com a meta e com médias de referência.
- Ranking de prioridades por área.
- Plano semanal com distribuição de horas e sugestões de conteúdos.

Uma regra inicial de priorização considerada no projeto é:

```text
prioridade = max(nota_alvo - nota_atual, 0) * peso_da_area
```

Essa regra é uma proposta para o MVP e poderá ser ajustada pela equipe.

## Arquitetura planejada

```text
Microdados do ENEM (CSV) ─┐
YouTube Data API ──────────┼─ Apache Hop ──> DuckDB / MongoDB
Google Books API ─────────┘       │
                                  └────────> PostgreSQL (tópicos de estudo)

React ──> API Python (FastAPI) ──> PostgreSQL, MongoDB e DuckDB
```

| Componente | Tecnologia prevista | Responsabilidade |
| --- | --- | --- |
| Interface | React + TypeScript + Vite | Cadastro, simulados, comparativos, prioridades e plano semanal |
| API | Python + FastAPI | Regras de negócio, consultas e geração do plano |
| Banco relacional | PostgreSQL | Estudantes, metas, simulados, tópicos e planos |
| Banco de documentos | MongoDB | Conteúdos coletados e histórico de recomendações |
| Banco analítico | DuckDB | Dados tratados e análises dos microdados do ENEM |
| Integração | Apache Hop | Carga e consolidação de dados de arquivos, bancos e APIs |
| Fontes externas | INEP, YouTube Data API e Google Books API | Referências de desempenho e conteúdos de estudo |

O desenho prevê que o Apache Hop trate os microdados do INEP e colete conteúdos das APIs. O backend consulta os resultados nos bancos e atende o frontend. A implementação poderá ajustar esse fluxo conforme as limitações técnicas e o escopo da equipe.

## Estrutura atual do repositório

```text
.
├── backend/
│   ├── .env.example
│   ├── database/
│   │   ├── duckdb/
│   │   │   ├── db.py
│   │   │   └── schema.sql
│   │   ├── postgres/
│   │   │   ├── check_connection.py
│   │   │   ├── schema.sql
│   │   │   └── seed.sql
│   │   └── mongodb/
│   │       └── conteudos.example.json
│   └── requirements.txt   # Dependências Python iniciais
├── frontend/
│   ├── package.json
│   └── src/                # Aplicação React/Vite inicial
└── README.md
```

O frontend contém atualmente a tela de demonstração padrão do Vite. O backend ainda não possui ponto de entrada, rotas ou configuração de conexão com os bancos. O repositório já contém schemas iniciais para PostgreSQL e DuckDB, além de exemplos de documentos MongoDB em `backend/database/mongodb/conteudos.example.json`. O script `backend/database/duckdb/db.py` cria o arquivo local do DuckDB a partir do schema. Os pipelines do Apache Hop ainda serão adicionados.

## Como executar o frontend

Requisitos: Node.js e npm instalados.

```bash
cd frontend
npm ci
npm run dev
```

O Vite exibirá no terminal o endereço local para abrir no navegador.

## Como preparar o ambiente Python

O arquivo `backend/requirements.txt` lista as dependências iniciais do backend: FastAPI, Psycopg, PyMongo, DuckDB e Pydantic Settings.

Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

Windows PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
```

Ainda não há um comando para iniciar a API: ele será documentado quando o ponto de entrada e as rotas do backend forem criados.

## Verificar a conexão com o Neon

Configure `DATABASE_URL` em `backend/.env` com a URI de conexão do Neon. Com as dependências do backend instaladas, execute na raiz do repositório:

```bash
python backend/database/postgres/check_connection.py
```

O script informa o banco, o usuário conectado, a versão do PostgreSQL e a quantidade de tabelas no schema `public`, sem imprimir a URI ou a senha.

## Bancos, Apache Hop e credenciais

PostgreSQL, MongoDB e Apache Hop são serviços/ferramentas externos ao Python e não são instalados pelo `pip`. O DuckDB possui biblioteca Python, mas também será necessário definir onde ficará o arquivo de banco usado pelo projeto.

O MongoDB será executado localmente durante o desenvolvimento e a demonstração. O MongoDB Community Server é o banco; o Compass é uma interface para visualizá-lo e administrá-lo. A conexão local padrão será `mongodb://localhost:27017/rotaenem`. Cada integrante que executar o projeto em seu computador terá uma instância e dados locais próprios; use `backend/database/mongodb/conteudos.example.json` para carregar os mesmos documentos de exemplo. Na demonstração, o servidor MongoDB, o backend e o frontend devem estar disponíveis no computador que executa a aplicação.

As configurações de conexão e chaves de API deverão ser fornecidas por variáveis de ambiente ou arquivo local não versionado. **Não inclua senhas, tokens ou chaves de API no repositório.** Os nomes das variáveis e os passos de configuração serão definidos junto com a implementação.

## Próximos passos

1. Confirmar o escopo da demonstração e os campos necessários para metas e simulados.
2. Instalar e iniciar o MongoDB Community Server nas máquinas de desenvolvimento e criar a coleção `conteudos`.
3. Criar uma carga pequena de dados para desenvolvimento e validar as consultas analíticas.
4. Implementar a API e acordar o formato das respostas com o frontend.
5. Construir os pipelines e o workflow no Apache Hop.
6. Substituir a tela inicial do Vite pelas telas do RotaENEM.
7. Integrar os componentes e preparar a demonstração funcional.

## Equipe

Equipe: 3 pessoas. A divisão de responsabilidades será definida pelo grupo. Uma divisão possível é dados/Apache Hop, backend e frontend, combinando previamente o modelo dos dados e o contrato da API.
