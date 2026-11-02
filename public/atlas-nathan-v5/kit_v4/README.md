# Atlas anatômico padronizado · Nathan v4

**Versão:** 4.0 (28/10/2026) — revisão anatômica para protótipo, não publicada em produção.

Um modelo detalhado, agênero e cromaticamente neutro, aplicado em camadas a diferentes instrumentos reumatológicos. A arte foi extraída da versão aprovada, **não** da versão geométrica simplificada anteriormente rejeitada.

## Início rápido

Abra `demo.html` num navegador com a pasta inteira extraída. Alternativamente, sirva a pasta como arquivos estáticos (`python -m http.server 8080`). Os controles não enviam nem gravam dados do paciente.

## Estrutura

- `assets/arte_original_aprovada.png` — referência-mestre visual.
- `assets/arte_complementar_posterior.png` — origem da vista posterior completa, utilizada para corrigir uma interrupção de membro na arte principal.
- `assets/png/` — 6 figuras independentes com alfa transparente.
- `assets/svg/` — 6 SVGs híbridos com PNG embutido para fidelidade visual; **não são vetor puro**.
- `assets/hitmaps/` — paths SVG vetoriais de silhueta, dimensões e IDs.
- `schemas/` — marcações WPI-19, DAS28-28, dor livre e PsA ilustrativa.
- `src/` — componente React e CSS; JS do protótipo.
- `demo.html` — laboratório de interação sem rede, com pasta de assets.
- `demo_independente.html` — versão com CSS e PNGs embutidos em um único arquivo.
- `docs/` — guia de integração, limites, tokens e brief reproduzível.
- `tools/` — scripts para recriar os assets e dados.
- `tests/` — verificação de consistência dos dados; inspeção visual ainda necessária.

Leia `docs/GUIA_DE_INTEGRACAO.md` antes de incorporar. **Não troque diretamente os sistemas de pontuação e persistência atuais.**

## Revisão v3 (marcadores e orientação)

- Mãos e pés apresentados exclusivamente pelo **dorso**, com postura pronada e unhas visíveis.
- Marcos MCP e IFP/IP do DAS28 recalibrados sobre a nova imagem dorsal. Pontos visuais de 5–7 px com alvos de toque de 14 px.
- 19 regiões WPI com polígonos anatômicos, sem elipses que encubram as estruturas. Lateralidade posterior corrigida.
- O WPI e o DAS28 requerem **homologação anatômica** antes da aplicação clínica; não são usados para cálculo diagnóstico.


## Atualização v4 — WPI aprovado

- A ilustração aprovada está em `assets/wpi_referencia_visual_aprovada.png` **inalterada**.
- `assets/png/wpi-anterior.png` e `wpi-posterior.png`: a mesma anatomia, com o azul da referência neutralizado, para evitar que regiões pareçam selecionadas antes do toque.
- `schemas/wpi19.json`: **19 regiões oficiais**, com lateralidade do paciente e paths independentes.
- `demo.html` e `demo_independente.html`: prévia navegável do WPI com realce azul apenas nas regiões selecionadas e checklist lateral acessível.
- A imagem aprovada é **referência artística**, não uma grade clínica: os segmentos coloridos originais não correspondem 1:1 às 19 regiões oficiais. Por isso foi preservada separadamente e não se usa sua tinta azul como dado de seleção.
- WPI não é DAS28 nem mapa de intensidade e não usa as articulações das mãos/pés; cada instrumento continua independente.
- Corrigido alinhamento em redimensionamento: arte e overlays agora compartilham o mesmo `viewBox` SVG.

**Situação:** pacote funcional de referência e desenvolvimento, ainda dependente de validação e integração ao site. Não houve publicação no domínio.
