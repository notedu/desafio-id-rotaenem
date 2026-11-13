# Roteiro da demonstração local

Este roteiro mostra a integração dos bancos e do aplicativo no fluxo que foi executado localmente. Nenhuma chamada pelo Insomnia é necessária.

## Antes de apresentar

- PostgreSQL e MongoDB estão disponíveis e as conexões do Hop apontam para os mesmos bancos usados pelo Back-End.
- `backend/.env` contém as conexões PostgreSQL/MongoDB, a chave JWT e o caminho do DuckDB.
- O CSV `backend/data/raw/RESULTADOS_2024.csv` está no caminho configurado na pipeline.
- O schema e o seed PostgreSQL estão aplicados; em uma base antiga, a migration da agenda do plano também está aplicada.
- Back-End e Front-End iniciados em terminais separados.
- Conta, meta, simulado e plano do usuário disponíveis para login. A conta de demonstração não é criada automaticamente pelo workflow.

## Apresentação sugerida

1. **Mostrar o workflow Hop:** abra `hop/workflows/wf_demonstracao_local.hwf`, confira as conexões e execute com run configuration `local`.
2. **Mostrar PostgreSQL:** o primeiro pipeline lista os dez tópicos usados pelas buscas.
3. **Mostrar DuckDB:** o segundo carrega as notas ENEM; no teste da máquina local, foram 9.999 registros gravados após ignorar o cabeçalho das 10.000 linhas lidas.
4. **Mostrar MongoDB:** o terceiro pipeline busca livros da Open Library e grava os documentos em `rotaenem.conteudos`. A execução validada processou 38 linhas de livros.
5. **Entrar no RotaENEM:** autentique a conta existente. O dashboard apresenta meta, notas do simulado, prioridade e sessões do plano; ele informa horas planejadas, não horas concluídas.
6. **Mostrar Plano de estudos:** exiba os materiais associados aos tópicos e abra um link de livro com o botão da sessão.

## Ordem das cargas importa

Se os livros foram carregados depois do último plano salvo, gere novamente o plano pela opção **Ajustar plano**. A API associa materiais às sessões durante a geração e salva a referência do MongoDB no PostgreSQL; ela não preenche retroativamente as referências de um plano antigo.

## Interpretação dos contadores

- A pipeline do CSV tem limite de 10.000 linhas de entrada e o primeiro registro é o cabeçalho, portanto a execução observada gravou 9.999 registros.
- O contador de 38 no log da pipeline MongoDB indica linhas processadas/escritas nessa execução, não o total da coleção após todos os upserts.
- Cada computador possui seu próprio MongoDB local e arquivo DuckDB; os dados não são sincronizados entre máquinas automaticamente.

## Encerramento

Deixe os bancos, o processo da API e o servidor Vite disponíveis durante a demonstração. O workflow do Hop pode ser executado e apresentado separadamente; o Back-End não executa cargas Hop automaticamente.
