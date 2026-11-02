# Brief mestre e prompts de referência

Foi utilizado o princípio de **identificadores estáveis, elementos bloqueados e restrições explícitas** das skills `creating-image-schemas` (jawhnycooke) e `image-prompt-creator` (Animalz). Elas são recursos para **documentar e regenerar imagens**, não para validar escalas reumatológicas ou controlar interações.

## Prompt visual mestre

> Medical anatomical illustration for a neutral clinical body-mapping application. Create a matched set of full-body anterior and posterior views, isolated right and left dorsal hand views in pronation with nails visible, right and left dorsal foot views with toenails visible. The human anatomy must be medically legible and detailed: clavicles, acromion, scapulae, cervical/thoracic/lumbar regions, hips, gluteal region, elbows, wrists, knees, ankles, major muscular contours, hands with five correctly proportioned digits, and feet with five toes. Use an androgynous body with no sex characteristics or skin-tone coding, no genital emphasis, no breast features, no hair, no face features. Matte pearl-gray and very light blue-gray surfaces, subtle shading, thin graphite-blue anatomical outlines. Aseptic healthcare illustration, accurate orthographic views, standardized proportions across views, full extremities visible, transparent background. No labels, legend, markers, accessories, gradients, vignette, platform UI, dark background, shadows, or clipping. Appropriate for pain and joint mapping in rheumatology.

## Restrições de iteração

- `anatomy_geometry`: bloqueado entre anterior/posterior.
- `identity`: agênero / sem características sexuais; não atribuir cor de pele.
- `color`: paleta acromática, não utilizar bege/rosa como cor de pele.
- `landmarks`: NÃO remover detalhes musculares/articulares necessários.
- `background`: alfa transparente, sem sombra ou vinheta.
- `interactive_overlay`: não deve aparecer na ilustração base; gerar à parte.
- `left_right`: laterização anatômica, nunca espelhar rótulos sem revisão.
- `geometry_consistency`: base única para todos os instrumentos.

## Quando regenerar

Se qualquer detalhe anatômico for corrigido, mantenha os nomes e identificadores dos assets, mas gere nova revisão maior do atlas e revalide todas as coordenadas de `schemas/*.json` e `assets/hitmaps/*.json` antes de atualizar a produção.
