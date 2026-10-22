# RITMA — Plano de Otimização da Experiência do Paciente, Monitoramento Clínico e Resolução de Bugs

Plano abrangente para transformar o RITMA no mais completo diário e dashboard clínico de dor crônica e reumatologia, com foco total na usabilidade do paciente, registro ágil de crises e sintomas, alta legibilidade visual e execução 100% gratuita (sem qualquer custo de nuvem ou API paga).

---

## Decisões Confirmadas e Revisão do Usuário

> [!IMPORTANT]
> **Decisões alinhadas na Etapa 1:**
> - **Custo Zero (100% Free)**: Nenhuma dependência de APIs ou modelos pagos. Todos os recursos inteligentes utilizam o nível gratuito do Gemini (`gemini-3.8-flash` e `gemini-3.1-flash-lite`), APIs nativas do navegador (Web Speech API para ditado sem custo, AudioContext para alarmes e retorno sonoro) e persistência gratuita (Firestore Spark + cache local offline resiliente).
> - **Foco Central no Paciente & Monitoramento de Sintomas**: Reduzir a carga cognitiva e o esforço motor ao preencher o diário (essencial para pacientes em crise de fibromialgia, artrite ou fadiga crônica), com modo de check-in rápido (1 toque), mapa de dor corporal aprimorado com tender points anatômicos precisos, registro inteligente de rigidez matinal, sono e hidratação.
> - **Dashboard Clínico de Alta Legibilidade (Claro & Escuro)**: Design médico refinado seguindo as diretrizes de SaaS/saúde do AI Studio: contraste WCAG AA, tipografia com números tabulares (`tabular-nums`), ausência de poluição visual (disciplina sem cápsulas redundantes), toques mínimos de 44px e transição perfeita entre modo diurno e noturno repousante.

---

## 1. Visão Geral e Conceito Central

### O que a aplicação faz
O **RITMA** é uma plataforma clínica de saúde para acompanhamento e controle de dores crônicas (fibromialgia, espondiloartrites, artrite reumatoide, dor miofascial e síndrome do intestino irritável). Ela conecta o paciente ao seu médico (Dr. Nathan Reumato e equipe multidisciplinar), transformando sensações subjetivas de dor, sono, rigidez e fadiga em dados clínicos estruturados, correlações causais e relatórios objetivos para consulta.

### Público-Alvo e Persona
- **Pacientes com dor crônica e fadiga**: frequentemente enfrentam névoa mental (*fibrofog*), dor nas mãos para digitar em telas pequenas e dias de crise aguda onde preencher questionários extensos é inviável.
- **Reumatologistas e equipe multiprofissional**: necessitam de dados organizados em séries temporais, correlações de gatilhos (sono, estresse, hidratação, alimentação) e questionários padronizados (FIQR, BASDAI, PHQ-9, GAD-7) sem perder tempo de consulta decifrando anotações soltas.

### Valor Principal Entregue
- **Check-in de 1 Minuto no Pior Dia de Crise**: Permite que o paciente registre sua dor e principais fatores mesmo em dias de crise severa sem atrito.
- **Identificação de Padrões e Gatilhos**: O cruzamento de dados revela o que piora ou alivia a dor (ex.: sono reparador e hidratação vs. estresse e ultraprocessados).
- **Relatório Médico em PDF/Resumo Clínico Estruturado**: Preparação imediata para a consulta com o Dr. Nathan, economizando tempo e qualificando a conduta médica.

---

## 2. Experiência do Usuário e Design Visual

### Fluxos Principais do Usuário

1. **Fluxo do Diário Rápido de Sintomas (Quick Check-in)**:
   - Acesso com 1 clique a partir da tela inicial.
   - Escalas analógicas visuais grandes e acessíveis (Dor 0–10, Sono 0–10, Fadiga 0–10, Rigidez Matinal em minutos).
   - Ditado por voz gratuito via microfone do navegador para quem está com dor nas mãos.
   - Salvamento automático com confirmação visual suave e atualização instantânea de séries temporais.

2. **Fluxo do Mapa de Dor Corporal (Homúnculo Interativo)**:
   - Silhueta frontal e dorsal nítida, com seleção de 19 tender points clássicos e articulações periféricas.
   - Indicação de intensidade da dor por região (leve, moderada, intensa).
   - Histórico comparativo (ver mapa de ontem vs. hoje ou evolução dos últimos 7 dias).

3. **Fluxo de Métricas Clínicas & PROMs**:
   - Questionários validados em reumatologia (FIQR, BASDAI, PHQ-9, GAD-7, CSI) com cálculo automático de escores clínicos.
   - Alertas visuais discretos quando há sinais de pico de crise (*flare-up*) com orientações de autocuidado não-medicamentosas.

4. **Fluxo de Hidratação e Hábitos Diários**:
   - Meta hídrica visual clara com incrementos rápidos (+250ml, +500ml).
   - Registro de medicamentos tomados vs. esquecidos, com histórico diário.

### Identidade Visual e Tema

```
┌────────────────────────────────────────────────────────────────────────┐
│ Paleta de Cores e Hierarquia Visual (60-30-10)                        │
├────────────────────────────────────────────────────────────────────────┤
│ • 60% Fundo Neutro:                                                    │
│   - Tema Claro: #F8FAFC (Slate 50) e #FFFFFF puro para cards           │
│   - Tema Escuro: #0B0F19 (Deep Navy Slate) e #111827 (Gray 900)        │
│ • 30% Estrutura & Tipografia:                                          │
│   - Bordas sutis de 1px (border-slate-200 / border-slate-800)          │
│   - Textos de alta legibilidade (Slate 900 / Slate 100)                │
│ • 10% Acentos Clínicos:                                                │
│   - Primário: Azul Clínico Índigo (#4F46E5 / #6366F1)                  │
│   - Alívio/Normalidade: Verde Esmeralda (#059669)                      │
│   - Alerta de Crise/Dor: Vermelho Suave (#E11D48)                      │
│   - Hidratação: Ciano Claro (#0891B2)                                  │
└────────────────────────────────────────────────────────────────────────┘
```

- **Tipografia**: `Plus Jakarta Sans` para títulos e comandos de ação; `DM Sans` para leitura longa e instruções de saúde; `font-mono tabular-nums` para todas as pontuações de dor, dosagens de remédios, horários e mililitros de água.
- **Disciplina Anti-Slop**:
  - Eliminação de cápsulas redundantes e selos repetitivos. Metadados e datas apresentados em texto limpo com separadores tipográficos (`·`).
  - Sem cartões aninhados dentro de cartões; superfícies com elevação única e divisores sutis.
  - Alvos de toque grandes ($\ge 48\text{px}$) nos botões principais e nas escalas de dor.
  - Títulos sem quebras órfãs (`text-wrap: balance`).

---

## 3. Decisões Técnicas e Trade-Offs

### 1. Inteligência Artificial 100% Gratuita (Free Tier)
- **Decisão**: Utilizar exclusivamente o modelo `gemini-3.8-flash` ou `gemini-3.1-flash-lite` no backend Express (`server.ts`) para análise clínica de correlações e geração de resumos empáticos, sem utilizar modelos da categoria paga (como `gemini-4-argon`, `veo` ou `nano-banana`).
- **Transcrição e Voz**: Utilizar a API nativa do navegador `window.webkitSpeechRecognition` / `SpeechRecognition` no cliente para transcrição por voz instantânea e sem qualquer latência ou cobrança, complementada pelo processamento do Gemini Flash gratuito para estruturação dos dados.

### 2. Persistência Híbrida Offline-First
- **Decisão**: Armazenamento sincronizado entre Firestore (remixed-firestore-database-id) e LocalStorage/IndexedDB.
- **Motivo**: Pacientes em crise ou em viagens frequentemente perdem conexão de internet. Os sintomas registrados jamais podem ser perdidos ou cancelados por falhas de rede.

### 3. Modularização de Componentes e Correção de Bugs
- **Diagnóstico Atual**: O arquivo `PatientView.tsx` possui mais de 4.700 linhas, acumulando lógica de abas, formulários, homúnculo, reprodução de áudio e cálculos estatísticos no mesmo escopo.
- **Solução Planejada**:
  1. Extrair sub-visões independentes (`QuickLogModal`, `HydrationWidget`, `CrisisProtocolView`, `ReportExportModal`).
  2. Corrigir inconsistências de sincronização entre o estado de medicamentos e o diário de sintomas.
  3. Corrigir os alinhamentos e seleções de pontos anatômicos no `BodyPainMap` para evitar sobreposição de cliques.

---

## 4. Arquitetura Técnica e Estratégia de Dados

### Diagrama do Sistema e Fluxo de Dados

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITETURA DA APLICAÇÃO                             │
└────────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────────────┐
   │                            CLIENTE (REACT SPA)                           │
   │                                                                          │
   │  ┌─────────────────────────┐  ┌──────────────────────────────────────┐   │
   │  │   Navegação do Paciente │  │           Módulos Clínicos           │   │
   │  │  • TopBar Acessível     │  │  • Diário de Sintomas (Dor/Sono)     │   │
   │  │  • Alternador Dark/Light│  │  • Mapa de Dor Corporal (Homúnculo)  │   │
   │  │  • Bottom Bar (Mobile)  │  │  • Gestão de Medicação & Lembretes   │   │
   │  │  • Seletor de Perfil    │  │  • Hidratação e Hábitos Diários      │   │
   │  └───────────┬─────────────┘  │  • Painel de Tendências e PROMs      │   │
   │              │                └──────────────────┬───────────────────┘   │
   │              └─────────────────┬─────────────────┘                       │
   │                                ▼                                         │
   │              ┌───────────────────────────────────┐                       │
   │              │   Gerenciador de Estado do App    │                       │
   │              │  (Sincronização Local + Firestore)│                       │
   │              └─────────────────┬─────────────────┘                       │
   └────────────────────────────────┼─────────────────────────────────────────┘
                                    │ Requisições HTTP (/api/*)
                                    ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │                          SERVIDOR NODE / EXPRESS                         │
   │                                                                          │
   │  ┌───────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
   │  │ POST /api/gemini/     │  │ POST /api/gemini/   │  │ Servidor de     │ │
   │  │ analyze-correlations  │  │ voice-checkin       │  │ Assets Estáticos│ │
   │  │ (Gemini 3.8 Flash)    │  │ (Gemini 3.8 Flash)  │  │ e Vite dev      │ │
   │  └───────────┬───────────┘  └──────────┬──────────┘  └─────────────────┘ │
   └──────────────┼─────────────────────────┼─────────────────────────────────┘
                  ▼                         ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │              GOOGLE AI STUDIO / GEMINI FREE TIER API                     │
   │          (Processamento server-side seguro, sem custo)                   │
   └──────────────────────────────────────────────────────────────────────────┘
```

### Entidades de Dados Principais

```typescript
// Registro Diário do Paciente (DailyLog)
interface DailyLog {
  date: string;               // YYYY-MM-DD
  pain: number;               // 0 a 10 (EVA)
  worstPain?: number;         // Pico máximo no dia
  morningStiffnessMinutes?: number; // Duração da rigidez em minutos
  fatigue: number;            // 0 a 10
  sleepQuality: number;       // 0 a 10
  sleepHours?: number;        // Horas dormidas
  mood: 1 | 2 | 3 | 4 | 5;    // Estado emocional
  waterIntakeMl: number;      // Consumo hídrico
  tenderPointsSelected?: string[]; // IDs das regiões com dor ativa
  medicationsTaken?: { [medId: string]: 'taken' | 'forgotten' | 'skipped' };
  triggers?: string[];        // Estresse, clima frio, esforço, etc.
  notes?: string;             // Observações livres ou ditadas
}
```

---

## 5. Fases de Execução do Plano

1. **Fase 1: Correção de Bugs e Estabilização**:
   - Ajustar rotas do backend em `server.ts` para o modelo gratuito estável `gemini-3.8-flash`.
   - Corrigir referências e sincronização de dados no `PatientView` e `PatientDiary`.
   - Sanar pequenas inconsistências de tipos e alertas no mapa de dor.

2. **Fase 2: Nova Interface e Experiência do Paciente**:
   - Modernizar o visual para o padrão clínico de alta legibilidade com suporte robusto a tema claro e escuro.
   - Implementar o componente de **Registro Rápido de 1 Minuto** na página inicial do paciente.
   - Aperfeiçoar o **Mapa Corporal de Dor** com controles táteis maiores e alternância frente/verso simplificada.

3. **Fase 3: Monitoramento Clínico e Inteligência Livre de Custos**:
   - Otimizar a análise de correlação entre sintomas e hábitos sem cobranças de API.
   - Adicionar resumo de consulta para o Dr. Nathan Reumato com exportação pronta para impressão/PDF.
   - Teste final de compilação, validação de lint e verificação de usabilidade.

---

## 6. Histórico de Entregas Recentes

### ✅ Registro Visual de Dor na Silhueta Humana & Histórico Integrado na Tela Principal
- **Silhueta Anatômica Interativa (Frente e Costas)**:
  - Homúnculo vetorial SVG de alta precisão clínica com zonas anatômicas facilmente selecionáveis (cabeça, cervical, ombros E/D, tórax, abdômen, cotovelos, punhos/mãos, coluna torácica, lombar, glúteos, quadris, coxas, joelhos, canelas/panturrilhas e pés).
  - Alvos de toque acessíveis ($\ge 44\text{px}$) com visual feedback por código de cores: sem dor (cinza neutro), leve (âmbar 1-3), moderada (laranja 4-6) e intensa (rosa/vermelho 7-10 com animação de pulso).
  - Seletor de intensidade imediato de 1 toque (0 a 10) e tags de sensações clínicas (queimação, pontada, peso, latejante, choque, rigidez).
- **Integração Direta no Histórico de Dor da Tela Principal**:
  - Incorporado diretamente no painel principal do paciente (`activeTab === 'home'`), logo abaixo da evolução multidimensional do RITMMA MAP e síntese de dor/fadiga.
  - Seletor cronológico e scrubber interativo dos últimos 14 dias: permite navegar em qualquer dia passado para ver a distribuição anatômica da dor naquele momento e identificar migrações ou tender points.
  - Ranking de *Hotspots* longitudinais dos últimos 30 dias: identifica automaticamente as 5 regiões corporais mais acometidas com frequência e média de intensidade.
  - Atalho rápido do Mapa Corporal na tela inicial com scroll suave diretamente para a silhueta interativa.
  - Eliminação de `window.confirm`/`window.alert` com confirmações e feedbacks suaves embutidos na interface.

