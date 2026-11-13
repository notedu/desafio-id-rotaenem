# Apache Hop: pipelines e workflow

O workflow `hop/workflows/wf_demonstracao_local.hwf` encadeia três pipelines com a configuração de execução `local`. Uma rota de falha aborta o workflow se alguma pipeline falhar.

## Conexões esperadas

| Nome | Destino |
| --- | --- |
| `NeonDB_RotaENEM` | PostgreSQL com áreas e tópicos cadastrados |
| `DuckDB_RotaENEM` | Arquivo `backend/database/duckdb/enem.duckdb` |
| `MongoDB_RotaENEM` | Banco `rotaenem`, coleção `conteudos` |

O MongoDB indicado no Hop deve ser o mesmo configurado em `backend/.env`. Verifique as três conexões na interface do Hop antes de executar.

## Sequência do workflow

1. **Validar tópicos no PostgreSQL — `pl_00_teste_neon.hpl`:** consulta os dez tópicos cadastrados e os imprime no log.
2. **Carregar amostra ENEM no DuckDB — `pl_01_carga_enem.hpl`:** lê até 10.000 linhas de `RESULTADOS_2024.csv`, seleciona as notas/UF/ano, substitui os registros de `enem_notas` e grava o resultado.
3. **Carregar livros no MongoDB — `pl_02_livros_para_mongodb.hpl`:** consulta tópicos no PostgreSQL, faz uma busca HTTP na Open Library para cada termo, normaliza os livros retornados e grava na coleção `conteudos`.
4. **Sucesso:** executado somente se as três etapas terminarem sem erro. Em falha, o workflow segue para `Falha na carga` e aborta.

## Detalhes da carga MongoDB

- A API de busca usada é a Open Library; a resposta é normalizada pelo campo `docs`.
- `topico_id` e `key` são campos de correspondência do upsert.
- Os demais campos são atualizados com `$set`.
- A pipeline não limpa a coleção MongoDB, preservando outros documentos.
- Campos de saída incluem área, tópico, termo de busca, chave Open Library, título e ano de publicação.

## Dados e caminhos locais

O limite de 10.000 linhas está configurado na entrada de arquivo da `pl_01_carga_enem.hpl`. No CSV usado na demonstração, 10.000 linhas lidas resultaram em 9.999 gravações (o cabeçalho foi ignorado). A carga observada em 13/11/2026 processou 38 linhas de livros no destino MongoDB; isso é a contagem da execução, não necessariamente a quantidade total de documentos da coleção.

Os arquivos Hop desta cópia contêm caminhos absolutos sob `/home/noteedu/Projetos/Projetos Github/desafio-id-rotaenem/`, inclusive para o CSV e para as pipelines chamadas pelo workflow. Se mover o repositório, atualize os caminhos nos arquivos `.hwf`/`.hpl` pela interface do Hop ou ajuste a configuração para os caminhos da nova máquina.

As buscas da Open Library precisam de acesso à Internet durante a execução. O workflow não depende do Insomnia: a execução e os contadores das transformações são apresentados no log do Hop.
