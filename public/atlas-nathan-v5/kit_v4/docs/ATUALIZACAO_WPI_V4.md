# WPI v4 — Guia de integração

1. Use `wpi-anterior.png`/`wpi-posterior.png` exclusivamente no WPI; os seis modelos da v3 permanecem inalterados para outros instrumentos.
2. Carregue `schemas/wpi19.json` e exponha **exatamente 19 ids** de seleção, não valores de dor por intensidade.
3. Centralize imagem e paths no **mesmo SVG viewBox** e preserve proporção xMidYMid meet para evitar descolamento ao redimensionar.
4. Com todos os ids desmarcados, nenhum polígono deve aparecer preenchido. Apenas uma seleção ativa gera a área azul.
5. Quando um id é selecionado, grave somente o id (binário) e recalcule 0-19 a partir dos ids únicos.
6. A referência original aprovada pode ser apresentada em materiais explicativos, mas não diretamente como mapa interativo pré-selecionado.
7. Teste visualmente a lateralidade na vista posterior, especialmente cinturas escapulares e quadris, e faça homologação das áreas sobre a imagem do site.
8. Preserve a lógica do WPI e as informações salvas no site. Não migrar dados automaticamente a partir de coordenadas de versões anteriores.

## Limitações

A geometria dos 19 hotspots foi reposicionada manualmente sobre a anatomia aprovada. A verificação de estruturas e contagens é automatizada, mas uma inspeção clínica do desenho ainda é necessária antes de produção.

## Testes verificados em 28/10/2026

- HTML independente carregado via Chromium embutido em página de teste.
- Exatamente 19 polígonos SVG clicáveis no WPI; 19 controles textuais acessíveis.
- 0 regiões selecionadas inicialmente; 2 seleções por lista -> 2/19; clique no polígono -> 1/19.
- 28 alvos permanecem disponíveis no DAS28.
- Sem erros JS durante a simulação testada.
- Acesso a file:/// foi bloqueado pela configuração do navegador de testes; o HTML foi injetado diretamente como documento para validar DOM e eventos.
