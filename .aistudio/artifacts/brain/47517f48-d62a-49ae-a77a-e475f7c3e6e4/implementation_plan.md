# Reformulação e Reorganização da Navegação e Mapa de Dor

Reorganizar a arquitetura de telas do Painel do Paciente no RITMA: isolar o **Mapa de Dor Diário** em sua aba dedicada e exclusiva, transferir o **RITMMA MAP** e os cards de síntese multidimensional para a aba de **Gráficos & Análises**, e simplificar a **Tela Inicial (Início)** com um resumo clínico limpo e atalhos diretos.

---

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> Decisões alinhadas na etapa de clarificação e incorporadas ao plano:
> - **Aba Dedicada para o Mapa de Dor**: O componente `DailyPainMap` (fluxo em 3 etapas: Áreas, Intensidade, Notas) funcionará como uma tela/aba exclusiva (`bodymap`), eliminando a sobreposição e a repetição de parâmetros na tela inicial.
> - **RITMMA MAP e Sínteses em Gráficos & Análises**: O gráfico multidimensional de correlação e os 3 cards de síntese (*Qualidade do Sono*, *Frequência de Diário* e *Dor & Fadiga 7d*) serão movidos para a aba de `charts`, centralizando toda a telemetria analítica no local correto.
> - **Tela Inicial Focada**: A tela `home` exibirá exclusivamente a saudação personalizada com status do dia, o resumo condensado (*Como estou hoje?* com métricas preenchidas), atalhos rápidos diretos para os módulos e a *Dica do Dia*.

---

## 1. Visão Geral e Nova Arquitetura de Informação

A tela do paciente passa a ter separação de responsabilidades cristalina, sem duplicação de informações ou poluição visual:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BARRA SUPERIOR (HEADER)                         │
│  Logo RITMA │ Indicador de Nuvem │ Notificações (Badge) │ Perfil       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────┐                           ┌────────────────────┐
│      MENU LATERAL     │                           │   BARRA INFERIOR   │
│  (Desktop / Gaveta)   │                           │      (Mobile)      │
└──────────┬────────────┘                           └─────────┬──────────┘
           │                                                  │
           └─────────────────────────┬────────────────────────┘
                                     │
   ┌───────────────────┬─────────────┴───────┬─────────────────┬──────────────────┐
   ▼                   ▼                     ▼                 ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌───────────────────┐
│ 1. INÍCIO    │ │ 2. DIÁRIO    │ │ 3. MAPA DE DOR   │ │ 4. REMÉDIOS  │ │ 5. GRÁFICOS       │
│ • Status dia │ │ • Sono       │ │ • Etapa 1: Áreas │ │ • Horários   │ │ • RITMMA MAP      │
│ • Resumo     │ │ • Fadiga     │ │ • Etapa 2: Nível │ │ • Alarmes    │ │ • Painel Síntese  │
│ • Atalhos    │ │ • Humor      │ │ • Etapa 3: Notas │ │ • Doses      │ │ • Visão 360°      │
│ • Dica do dia│ │ • Rotina     │ │ • Sem repetições │ │ • Adesão     │ │ • Histórico       │
└──────────────┘ └──────────────┘ └──────────────────┘ └──────────────┘ └───────────────────┘
```

---

## 2. Experiência do Usuário e Telas Detalhadas

### A. Tela Inicial (Home) — Rápida e Sem Poluição
- **Banner de Boas-Vindas & Status**: Saudação humanizada com badge de preenchimento de hoje (*Hoje Registrado* ou *Registro Pendente*).
- **Cartão "Como estou hoje?"**: Indicador visual compacto das variáveis do dia (Dor, Fadiga, Sono, Humor) sem controles complexos de edição embutidos.
- **Grade de Atalhos Objetivos ("O que registrar?")**:
  1. **Diário de Sintomas** (Leva para a aba `diary` com sono, fadiga, humor).
  2. **Mapa de Dor** (Leva diretamente para a aba `bodymap` no novo fluxo guiado).
  3. **Medicamentos** (Leva para `medications`).
  4. **Crise SOS** (Abre o fluxo rápido de crises agudas).
- **Dica do Dia**: Card de recomendação clínica baseada em evidências científicas.
- **Tendência dos Últimos 7 vs 30 dias**: Indicador discreto de evolução estável/melhora.

### B. Aba Exclusiva: Mapa de Dor Diário (`bodymap`)
- **Tela 100% Limpa e Focada**: Todo o espaço da tela é dedicado à silhueta corporal e às 3 etapas clínicas.
- **Nenhum Card Duplicado**: Removidos cards de sono, frequência, gráficos dispersos e atalhos redundantes.
- **Fluxo em 3 Etapas**:
  - **Etapa 1 (Áreas)**: Alternância Frente/Costas/Ambas, Toque na silhueta, Repetir dores de ontem, Linha de irradiação anatômica.
  - **Etapa 2 (Intensidade)**: Graduação 0 a 10 com `[-]` e `[+]`, comparativo com ontem (*Melhorou*, *Piorou*, *Sem alteração*).
  - **Etapa 3 (Notas)**: Qualidades da dor (queimação, pontada, etc.), horário de pico e notas clínicas.

### C. Aba de Gráficos & Análises (`charts`)
- **Centralização da Telemetria**:
  - **Sub-aba 1 (RITMMA MAP & Visão 360°)**:
    - O gráfico multidimensional de correlação (`RITMMA MAP`) agora é exibido aqui com suas curvas de tendência.
    - Os 3 cards de síntese (*Qualidade do Sono*, *Frequência de Diário*, *Síntese de Dor & Fadiga*) são posicionados estrategicamente logo abaixo do gráfico.
  - **Sub-abas 2, 3 e 4**: Tendências Clássicas, Matriz de Correlação e Histórico de Logs.

---

## 3. Principais Decisões de Design e UX

- **Zero Sobrecarga Cognitiva**: O paciente não verá gráficos densos ou perguntas sobre sono enquanto tenta apontar uma dor lombar no mapa.
- **Mobile-First Real**: Tanto a tela inicial quanto a aba de mapa de dor respeitam a altura vertical do celular, sem rolagem horizontal ou caixas transbordando.
- **Preservação Total de Dados**: Nenhuma métrica ou dado existente do paciente é perdido; apenas as visualizações são realocadas para seus respectivos contextos funcionais.

---

## 4. Plano de Execução Técnica

1. **Limpeza da Tela Inicial (`PatientView.tsx`)**:
   - Remover os blocos selecionados pelo usuário que estavam poluindo a visualização:
     - Bloco do `RITMMA MAP` na home.
     - Bloco dos 3 cards de síntese (Sono, Frequência, Dor & Fadiga).
     - Atalhos duplicados de rodapé que já existem no menu principal.
   - Ajustar o atalho "Mapa Corporal" da tela inicial para navegar diretamente até a aba `bodymap`.

2. **Isolamento da Aba de Mapa de Dor (`activeTab === 'bodymap'`)**:
   - Renderizar o componente `DailyPainMap` como elemento principal e exclusivo da tela.
   - Garantir cabeçalho contextual limpo com título, descrição e botão de salvar.

3. **Integração no Módulo de Gráficos (`chartsSubTab === 'recharts'`)**:
   - Mover a visualização do `RITMMA MAP` e os 3 cards de síntese para a aba de Gráficos, logo após a visualização analítica.

4. **Verificação de Compilação & Lint**:
   - Executar `lint_applet` e `compile_applet` para assegurar ausência de erros de sintaxe ou referências quebradas.
