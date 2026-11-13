# Instalação e configuração local

Este guia prepara a demonstração no computador local. PostgreSQL, MongoDB Community Server e Apache Hop são instalados/iniciados separadamente; `pip` e `npm` instalam somente as dependências da aplicação.

## Pré-requisitos

- Python compatível com as dependências em `backend/requirements.txt`.
- Node.js e npm compatíveis com `frontend/package-lock.json`.
- Um PostgreSQL disponível (local ou Neon).
- MongoDB Community Server disponível para o Back-End e o Hop.
- Apache Hop com drivers/plugins de PostgreSQL, DuckDB e MongoDB.
- CSV de resultados do ENEM disponível no caminho esperado pela pipeline de carga.

## 1. Banco PostgreSQL

Use um banco PostgreSQL de desenvolvimento. Execute, nessa ordem, o conteúdo de:

1. `backend/database/postgres/schema.sql`
2. `backend/database/postgres/seed.sql`

O primeiro cria as tabelas. O segundo cadastra as cinco áreas e dez tópicos usados pela demonstração. Para uma base que já tinha o schema anterior ao plano com agenda, aplique uma vez `backend/database/postgres/migrations/001_plano_semanal_agenda.sql`. Não é necessário aplicar essa migration depois de executar o schema atual numa base nova.

## 2. MongoDB

Inicie o MongoDB Community Server. A configuração exemplo usa `mongodb://localhost:27017`, banco `rotaenem` e coleção `conteudos`. A URI, o banco e a coleção do Back-End devem apontar para a mesma instância de MongoDB configurada na conexão `MongoDB_RotaENEM` do Hop.

O arquivo `backend/database/mongodb/conteudos.example.json` é apenas um pequeno exemplo de estrutura; a carga demonstrativa de livros é feita pelo Hop.

## 3. DuckDB e microdados

O arquivo padrão da API é `backend/database/duckdb/enem.duckdb`. Depois de criar o ambiente Python e instalar as dependências na seção seguinte, crie o banco e suas tabelas/views iniciais a partir da raiz:

```bash
source .venv/bin/activate
python backend/database/duckdb/db.py
```

A API espera as views `enem_media_uf_area` e `enem_media_nacional_area`, definidas em `backend/database/duckdb/schema.sql`.

Coloque o CSV utilizado pelo Hop em `backend/data/raw/RESULTADOS_2024.csv`. Essa pasta e o arquivo DuckDB são dados locais e ignorados pelo Git. A pipeline `pl_01_carga_enem.hpl` contém o caminho desta instalação; veja [`apache-hop.md`](apache-hop.md) antes de mover o projeto.

## 4. Configuração e dependências do Back-End

Crie `backend/.env` copiando `backend/.env.example` e preencha os valores locais:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST/BASE?sslmode=require
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=rotaenem
MONGODB_COLLECTION=conteudos
DUCKDB_PATH=database/duckdb/enem.duckdb
CORS_ORIGINS=http://localhost:5173
JWT_SECRET_KEY=chave-aleatoria-privada
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Gere a chave JWT localmente, sem compartilhá-la ou adicioná-la ao Git:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Na raiz do projeto, crie o ambiente e instale as dependências:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

Para conferir a conexão PostgreSQL sem imprimir a URI:

```bash
python backend/database/postgres/check_connection.py
```

## 5. Configuração e dependências do Front-End

O valor padrão da API é `http://127.0.0.1:8000`. Se necessário, copie `frontend/.env.example` para `frontend/.env.local` e ajuste `VITE_API_BASE_URL`.

```bash
cd frontend
npm ci
```

## 6. Conexões no Apache Hop

Configure conexões com estes nomes, que são referenciados nas pipelines:

| Nome no Hop | Tipo | Destino esperado |
| --- | --- | --- |
| `NeonDB_RotaENEM` | PostgreSQL | Mesma base Postgres preenchida em `DATABASE_URL` |
| `DuckDB_RotaENEM` | DuckDB | `backend/database/duckdb/enem.duckdb` |
| `MongoDB_RotaENEM` | MongoDB | Mesma instância, banco e coleção configurados no Back-End |

Confirme cada conexão pelo botão de teste do Hop. Detalhes do workflow e das cargas estão em [`apache-hop.md`](apache-hop.md).

## 7. Iniciar os processos

Use terminais separados e mantenha-os abertos.

Back-End, na raiz do projeto com o ambiente `.venv` ativado:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

Front-End, em outro terminal:

```bash
cd frontend
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`. A API tem `/health`, `/health/ready` e documentação em `/docs`.

## Verificação visual da demonstração

Depois que o workflow Hop carregar os tópicos, os dados analíticos e os livros, entre no Front-End. Cadastre ou use uma conta, uma meta e ao menos um simulado. O plano precisa ser gerado depois da carga MongoDB para associar os livros às sessões. O fluxo está descrito em [`demonstracao.md`](demonstracao.md).
