# Integração — Atlas anatômico Nathan v3

**Objetivo:** substituir variações visuais de figuras humanas por **uma única anatomia base detalhada**, agênero e acromática, sem alterar o instrumento clínico, a lógica de persistência nem a fórmula de escore.

## Escopo entregue

- Seis imagens clínicas com fundo transparente, com vista posterior completa corrigida a partir de segunda imagem gerada: corpo anterior/posterior, dorsos das mãos direita/esquerda e dorsos dos pés direito/esquerdo.
- Seis SVGs **híbridos** com PNG embutido, para facilitar o uso em sistemas que preferem `<svg>`. **Não são desenhos integralmente vetoriais.**
- Máscaras vetoriais (`assets/hitmaps`) para permitir marcação livre dentro da silhueta (coordenadas locais em pixels).
- `schemas/wpi19.json`: 19 polígonos anatômicos clicáveis, posicionados nas vistas anteriores/posteriores corretas.
- `schemas/das28.json`: 28 articulações, incluindo as ampliações dorsais das mãos, com estados independentes de `tender` e `swollen` e pontos visuais menores que os alvos de toque.
- `schemas/psa-referencia.json`: orientação visual, **não** um conjunto validado 66/68.
- `demo.html`: protótipo responsivo navegável com exportação de seleções em JSON.
- `src/AnatomyMap.jsx` e `src/AnatomyMap.css`: componente React integrável, sem bibliotecas extras.

## Passos de integração

1. Copie `assets/png/*.png` para a pasta pública do projeto, por exemplo `public/anatomy/`.
2. Inclua `src/AnatomyMap.jsx` e `src/AnatomyMap.css` num projeto React 18+ com importação de JSON habilitada.
3. Mapeie o estado do instrumento atual para o valor do componente: `{pain: [], wpi: [], tender: [], swollen: []}`. O modo `pain` possui objetos `{id,asset,x,y,intensity}`; os demais usam IDs em arrays.
4. Preserve as identificações anatômicas no banco (`id`) e armazene `x,y` somente para marcações livres, com o nome da vista `asset`. **Nunca salve a posição no layout responsivo como dado clínico primário.**
5. No WPI, mostre os 19 identificadores sem duplicar ao trocar de vista; respeite período recordatório e critérios atuais no instrumento original.
6. No DAS28, use o modo `das28` e exponha um seletor `dimension` entre `tender` e `swollen`. Essas contagens devem ser registradas por examinador quando forem usadas como exame articular. **Não calcular DAS28 só com a figura.**
7. Artrite psoriásica: a biblioteca é o ponto de partida visual. Para contar 68/66, é obrigatório definir, revisar e testar o mapa de articulações inteiro; não usar a seleção demonstrativa para gerar número clínico.
8. Integre a recuperação e o envio de dados usando os mecanismos atuais de autenticação e proteção de dados. O protótipo não salva informação persistente e não envia dados ao servidor.
9. Validar interface, lado anatômico (direita/esquerda **do paciente**), acessibilidade, mobile, PDF/impressão e persistência com usuário real antes da publicação.

## Exemplo em React

```jsx
import AnatomyMap from './src/AnatomyMap';

function Registro() {
  const [valores, setValores] = React.useState({ pain: [], wpi: [], tender: [], swollen: [] });
  return <AnatomyMap mode="das28" dimension="tender" value={valores} onChange={setValores} assetBaseUrl="/anatomy" />;
}
```

**Nota técnica:** esse componente é uma referência desacoplada, não um patch no código real do site. É necessário ajustar ao framework, às interfaces e à persistência da aplicação.

## Tokens visuais e invariantes

| Elemento | Token | Regra |
|---|---|---|
| Silhueta | cinza-azulado luminoso | mesmo modelo em todas as telas |
| Contorno anatômico | #8A92A0 | não ocultar referências ósseas/musculares |
| Marcação de dor leve | #F1A034 | acompanhada de texto da intensidade |
| Marcação de dor moderada | #E97A49 | não codificar apenas por cor |
| Marcação de dor intensa | #E64367 | número 0–10 acessível |
| Região WPI | #4E87BE | selecionada/desmarcada, contagem única |
| Articulação dolorosa | #EF8857 | estado independente |
| Articulação edemaciada | #9A75C9 | estado independente |

Geometria bloqueada: proporções, neutralidade de gênero, cor, orientação anatômica e referências de mãos, pés, joelhos, ombros, quadris e coluna. O contorno não deve voltar a ser um boneco abstrato.

## Limitações e validação clínica

Os pontos foram recalibrados sobre as figuras finais e verificados quanto ao posicionamento sobre as silhuetas. A revisão automatizada não substitui a homologação reumatológica das áreas. São necessárias revisão final de anatomia e homologação de cada marcador por médico reumatologista, incluindo confrontação com os formulários em produção. WPI e DAS28 estão com **quantidade e IDs corretos no protótipo**, mas posições das áreas e interação sob toque ainda exigem validação clínica. Há detalhes anatômicos inferidos por geração de imagem, não imagens de atlas anatômico certificado.

Acessibilidade: implementar alternativa em lista/checklist, controle por teclado, foco visível e textos acessíveis. O modo de marcação livre exige alternativa específica para teclado, pois clicar na silhueta não basta.

## Análise do site

O endereço público informado não foi acessível para uma nova inspeção de código nesta entrega. A lista de instrumentos e as diferenças visuais identificadas anteriormente serviram como contexto, mas **não afirmamos auditoria exaustiva**. Não houve alteração no site publicado. Para migração sem retrabalho, o próximo passo operacional é obter o repositório ou exportação do projeto e conferir cada instrumento antes de trocar o componente.

## Atenção à revisão v3

- Em mapas de contagem articular, mãos e pés foram padronizados em **vista dorsal**, em pronação, e não palmar ou plantar.
- As regiões WPI são formas anatômicas sem preenchimento quando desmarcadas; um pequeno indicador mostra que existe uma área de seleção.
- Os 28 marcadores articulares são pontos de 5–7 px com alvo de toque transparente de 14–16 px; o clique identifica a articulação nomeada, não a posição arbitrária.
- Na vista anterior, o lado direito do paciente aparece à esquerda do observador; na vista posterior, à direita do observador.
- O protótipo foi validado estruturalmente; o navegador automatizado no ambiente de execução bloqueou acesso local, portanto **não afirmamos validação visual browser end-to-end**.
