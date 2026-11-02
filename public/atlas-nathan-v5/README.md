# Atlas Nathan v5 — primeira integração funcional

Versão: 2026-11-02 · protótipo de pesquisa e desenvolvimento; **não validado para uso assistencial**.

## Iniciar

Extraia o ZIP preservando todas as pastas e abra `index.html` em um navegador moderno. O atlas 2D e o mapa avançado possuem versões HTML completas e funcionam sem conexão. Se o navegador restringir scripts locais, use um servidor HTTP estático:

```bash
cd atlas-nathan-v5
python -m http.server 8080
```

Abra `http://localhost:8080`.

O módulo 3D usa `three@0.180.0` pela CDN jsDelivr e carrega um arquivo GLB separado. Requer conexão para carregar a biblioteca, mesmo quando o GLB vem do computador. Se a rede estiver indisponível, esse módulo mostra uma explicação, não um manequim geométrico.

## O que foi preservado

`kit_v4/` é uma **cópia byte a byte** do pacote Nathan v4 fornecido, incluindo:

- A arte original aprovada (não foi redesenhada ou substituída).
- As vistas anteriores, posteriores e dorsais de mãos e pés.
- A mesma interface e comportamento de WPI-19, sem mudança nos 19 identificadores nem nos polígonos.
- A contagem DAS28 de 28 estruturas (dor e edema como estados independentes).
- Os esquemas e documentação de origem, sem alteração na lógica ou na pontuação.

## O que há de novo

### Mapa de dor avançado (`mapa_avancado_independente.html`)

- Aproveita **as mesmas imagens e máscaras de silhueta** da v4.
- Quatro modos: ponto, área circular translúcida, linha de irradiação entre duas posições, e localização articular declarada.
- Vistas anterior/posterior, ambas as mãos, ambos os pés; mãos e pés em posição dorsal.
- Zoom, reposicionamento manual dos pontos por arraste, intensidade 0–10, qualidade, duração, frequência, lateralidade, observações, exclusão.
- Persistência apenas no navegador (localStorage) e exportação/importação JSON e resumo TXT.
- A seleção de uma articulação no menu **não** é validação automática da estrutura apontada. As coordenadas da marcação são definidas pelo usuário.
- Regiões circulares são aproximações espaciais; não representam atlas regional validado.

### Visualizador tridimensional (`atlas_3d.html`)

- Visualização de **malhas GLB reais**, livre-rotação, zoom, pan e vistas predefinidas.
- Carrega um GLB local ou tenta acessar o atlas Écorché remoto.
- Marcações pontuais, áreas indicativas e irradiações armazenadas em coordenadas tridimensionais associadas à malha carregada, com exportação JSON independente.
- Não mostra primitivas geométricas como se fossem anatomia. Sem malha ou sem biblioteca externa, o espaço 3D informa a limitação.
- **Não** há superfície cutânea validada, identificação automática de músculos e articulações, camadas de pele, orientação garantida entre modelos GLB nem interconversão confiável das coordenadas entre modelos.

## Limites e próximos passos

1. **Ainda não existe correspondência anatômica bidirecional 2D/3D.** Os registros de WPI/DAS28, mapa livre e 3D têm persistência independente, não são fusionados automaticamente. A integração final exigirá um atlas de landmarks anatômicos e transformação de coordenadas validada.
2. O mapa de dor referida miofascial, sugerido pelo Travell & Simons, **não foi implementado** no pacote v5: precisa de regras estruturadas e revisão de direitos/licença, precisão espacial, validação clínica e representação das áreas sem inferir diagnóstico.
3. O módulo 3D não funciona completamente offline, depende de CDN e/ou arquivo GLB real. Não foi possível testar aqui a importação de um atlas externo com a rede bloqueada.
4. Nenhum módulo está conectado a prontuário. O armazenamento local **não é seguro para dados identificáveis de pacientes**. Integração clínica requer autenticação, trilhas de auditoria, controle de acesso, LGPD, validação dos esquemas e análise de segurança.
5. O kit Nathan v4 original informa necessidade de revisão anatômica dos alvos e polígonos antes de produção. Mantivemos essa ressalva.
6. Testes do conteúdo original preservado: `tests/check_schemas.py` e `tests/test_geometry.py` executados com sucesso (19 WPI, 28 DAS28, posterior lateralidade). Interface do WPI/DAS28 e mapa livre renderizados e testados em Chromium sob HTML embutido. Teste de navegação direta via HTTP/arquivo foi restringido pelas políticas do Chromium deste ambiente.

## Créditos

- Imagens, esquema WPI/DAS28 e apresentação visual do Atlas Nathan v4: arte e projeto fornecidos pelo usuário.
- Écorché: `https://github.com/Charleeh/ecorche`, de terceiros; observar os termos CC BY-SA 4.0 informados pelo projeto original e os créditos aos repositórios de base. O GLB não está distribuído neste ZIP.
- Three.js: https://threejs.org/ (biblioteca carregada externamente).

**Critério de entrega:** identidade visual v4 mantida e mapa 2D funcional; 3D real experimental, não considerado validado.
