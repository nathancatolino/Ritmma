/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DiagnosisConfig {
  label: string;
  icon: string;
  color: string;
  instruments: string;
  freq: string;
  q?: string;
  desc: string;
  comingSoon?: boolean;
}

export const DX: Record<string, DiagnosisConfig> = {
  fibromialgia: {
    label: 'Fibromialgia (Síndrome Fibromiálgica)',
    icon: 'FM',
    color: 'rose',
    instruments: 'FIQr / CSI-7',
    freq: 'Mensal',
    q: 'fibromialgia',
    desc: 'Dor difusa generalizada, fadiga crônica, sono não reparador e hipersensibilidade.'
  },
  ar: {
    label: 'Artrite Reumatoide',
    icon: 'AR',
    color: 'blue',
    instruments: 'RAPID3 / HAQ-DI',
    freq: 'Quinzenal',
    q: 'ar',
    desc: 'Poliartrite inflamatória periférica, inchaço articular e rigidez matinal prolongada.'
  },
  espondiloartrite: {
    label: 'Espondiloartrite Axial / Espondilite Anquilosante',
    icon: 'EA',
    color: 'violet',
    instruments: 'ASDAS / BASDAI',
    freq: 'Mensal',
    q: 'espondiloartrite',
    desc: 'Dor lombar inflamatória crônica, rigidez na coluna e pelve, entesite e uveíte.'
  },
  psoriasica: {
    label: 'Artrite Psoriásica',
    icon: 'AP',
    color: 'rose',
    instruments: 'PsAID-12 / RAPID3',
    freq: 'Quinzenal',
    q: 'psoriasica',
    desc: 'Dor e inflamação articular associada a placas na pele, alterações nas unhas e dactilite.'
  },
  les: {
    label: 'Lúpus Eritematoso Sistêmico (LES)',
    icon: 'LES',
    color: 'violet',
    instruments: 'Lupus Impact Tracker (LIT)',
    freq: 'Mensal',
    q: 'les',
    desc: 'Doença autoimune multissistêmica com dor articular, erupções cutâneas e fadiga intensa.'
  },
  sjogren: {
    label: 'Síndrome de Sjögren',
    icon: 'SS',
    color: 'blue',
    instruments: 'ESSPRI / ESSDAI',
    freq: 'Quinzenal',
    q: 'sjogren',
    desc: 'Secura persistente em olhos e boca, fadiga crônica de fundo e dores articulares.'
  },
  osteoartrite: {
    label: 'Osteoartrite (Artrose)',
    icon: 'OA',
    color: 'orange',
    instruments: 'WOMAC / KOOS',
    freq: 'Mensal',
    q: 'osteoartrite',
    desc: 'Degradação da cartilagem articular e dor mecânica relacionada a carga e sobrecarga.'
  },
  gota: {
    label: 'Gota e Artropatias Microcristalinas',
    icon: 'GT',
    color: 'rose',
    instruments: 'RAPID3',
    freq: 'Quinzenal',
    desc: 'Crises inflamatórias agudas de dor articular por deposição de cristais de urato.'
  },
  polimialgia: {
    label: 'Polimialgia Reumática',
    icon: 'PMR',
    color: 'amber',
    instruments: 'HAQ-DI',
    freq: 'Mensal',
    desc: 'Dor intensa e rigidez em ombros, pescoço e quadris com resposta a glicocorticoide.'
  },
  esclerose_sistemica: {
    label: 'Esclerose Sistêmica (Esclerodermia)',
    icon: 'ES',
    color: 'indigo',
    instruments: 'SHAQ',
    freq: 'Mensal',
    desc: 'Fenômeno de Raynaud, espessamento da pele e manifestações microvasculares.'
  },
  fadiga_cronica: {
    label: 'Síndrome da Fadiga Crônica (EM/SFC)',
    icon: 'SFC',
    color: 'teal',
    instruments: 'FACIT-Fatigue',
    freq: 'Quinzenal',
    desc: 'Esgotamento físico e mental desproporcional, mal-estar pós-esforço e sono não reparador.'
  },
  hipermobilidade: {
    label: 'Síndrome de Hipermobilidade / Ehlers-Danlos',
    icon: 'SED',
    color: 'sky',
    instruments: 'Beighton / BPI',
    freq: 'Mensal',
    desc: 'Frouxidão ligamentar, instabilidade articular recorrente e dor musculoesquelética difusa.'
  },
  miofascial: {
    label: 'Síndrome Dolorosa Miofascial',
    icon: 'SDM',
    color: 'orange',
    instruments: 'Brief Pain Inventory (BPI)',
    freq: 'Mensal',
    q: 'miofascial',
    desc: 'Tensão muscular crônica localizada com bandas tensas e pontos-gatilho dolorosos.'
  },
  migrainea: {
    label: 'Enxaqueca Crônica e Cefaleias',
    icon: 'MIG',
    color: 'amber',
    instruments: 'HIT-6 / MIDAS',
    freq: 'Semanal',
    q: 'migrainea',
    desc: 'Crises pulsáteis de dor de cabeça, hipersensibilidade à luz, som e náuseas.'
  },
  endometriose: {
    label: 'Dor Pélvica Crônica / Endometriose',
    icon: 'END',
    color: 'rose',
    instruments: 'EHP-5 / EHP-30',
    freq: 'Mensal',
    q: 'endometriose',
    desc: 'Dor pélvica profunda, cólicas menstruais intensas e hipersensibilidade visceral.'
  },
  sii: {
    label: 'Síndrome do Intestino Irritável (SII)',
    icon: 'SII',
    color: 'amber',
    instruments: 'IBS-SSS / IBS-QoL',
    freq: 'Quinzenal',
    q: 'sii',
    desc: 'Desconforto e inchaço abdominal com alteração do ritmo intestinal e eixo cérebro-intestino.'
  }
};

export const DIARY = {
  core: [
    ['pain', 'Dor hoje', '0 sem dor · 10 pior dor'],
    ['fatigue', 'Fadiga hoje', '0 sem fadiga · 10 extrema'],
    ['sleep', 'Sono reparador', '0 péssimo · 10 ótimo'],
    ['function', 'Função no dia', '0 quase nada · 10 perto do normal']
  ] as [string, string, string][],

  detailCore: [
    ['worstPain', 'Pico de dor', 'Use quando houve crise/pico diferente', 0, 10],
    ['stiffness', 'Rigidez matinal (min)', 'Tempo até "destravar" de manhã', 0, 240]
  ] as [string, string, string, number, number][],

  stressRanges: [
    ['stressWork', 'Estresse no trabalho', '0 a 10'],
    ['stressFamily', 'Estresse familiar', '0 a 10'],
    ['stressPersonal', 'Estresse pessoal', '0 a 10']
  ] as [string, string, string][],

  moduleQuestions: {
    fibromialgia: [
      ['brainFog', 'Névoa mental (esquecimentos ou dificuldade de concentração)'],
      ['sensibilidade', 'Sensibilidade extrema (a barulhos, luzes fortes ou cheiros)'],
      ['alodinia', 'Alodinia (dor ou desconforto ao toque leve na pele, como roupas ou abraço)'],
      ['formigamento', 'Formigamentos, dormências ou sensação de agulhadas nas mãos/pés'],
      ['dorMovel', 'Dor móvel (dor que parece mudar de lugar ao longo do dia)'],
      ['pernaInquieta', 'Sensação de pernas inquietas ou impulsos de mover as pernas']
    ],
    osteoartrite: [
      ['crepitacao', 'Crepitação (sensação de "areia" ou estalos na articulação afetada)'],
      ['falseio', 'Sensação de falseio (perda de força ou apoio na articulação)'],
      ['travamento', 'Dificuldade de iniciar o movimento ou travamento articular'],
      ['inchacoLocal', 'Inchaço ou calor na articulação afetada'],
      ['limitacaoDobrar', 'Dificuldade para dobrar ou esticar a articulação por completo'],
      ['dorChuva', 'Dor articular que parece piorar quando o tempo muda ou esfria']
    ],
    ar: [
      ['juntasInchadas', 'Múltiplas juntas inchadas e quentes ao mesmo tempo'],
      ['simetria', 'Dor que afeta os mesmos locais dos dois lados do corpo (ex: os dois punhos)'],
      ['pequenasArticulacoes', 'Dor localizada principalmente nas pequenas juntas (dedos das mãos/pés)'],
      ['fraquezaAperto', 'Perda de força para apertar objetos (como abrir garrafa ou segurar copo)'],
      ['flareInflamatorio', 'Crise inflamatória aguda (sensação de "corpo gripado" e juntas muito quentes)'],
      ['nodulosReumaticos', 'Caroços endurecidos sob a pele perto de articulações']
    ],
    espondiloartrite: [
      ['dorNoturna', 'Dor nas costas que acorda você de madrugada ou piora com repouso'],
      ['melhoraMovimento', 'Dor nas costas que melhora visivelmente após caminhar ou se movimentar'],
      ['entesite', 'Dor forte no calcanhar (tendão de Aquiles) ou na sola do pé ao levantar'],
      ['olhoVermelho', 'Olho vermelho, dolorido e com alta sensibilidade à luz (uveíte)'],
      ['dorGluteaAlternante', 'Dor profunda nas nádegas que muda de lado (ora direita, ora esquerda)'],
      ['dedoSalsichaEspondilo', 'Dedo de mão ou pé inteiro inchado (formato de salsicha)']
    ],
    psoriasica: [
      ['pelePiora', 'Manchas vermelhas descamativas na pele (psoríase) mais ativas ou irritadas'],
      ['dactilite', 'Dactilite (dedo da mão ou pé inteiro muito inchado, parecendo salsicha)'],
      ['unhasAlteradas', 'Unhas descascando, com pequenos furos ou descolando'],
      ['entesitePsa', 'Dor/sensibilidade onde os tendões ligam ao osso (ex: calcanhar, cotovelo)'],
      ['axialPsa', 'Dor ou rigidez persistente na coluna ou região do quadril'],
      ['fadigaInflamatoria', 'Sensação de cansaço extremo que não melhora com repouso na cama']
    ],
    les: [
      ['rash', 'Mancha vermelha no rosto (formato de asa de borboleta) após pegar sol'],
      ['fotossensibilidade', 'Irritação na pele, coceira ou mal-estar geral após pegar sol'],
      ['aftas', 'Aftas ou feridas dolorosas na boca ou nariz de cura demorada'],
      ['febre', 'Febre baixa (37,5°C - 38°C) persistente sem sinais de infecção (como gripe)'],
      ['edemaUrina', 'Pés e pernas muito inchados ou urina muito espumosa'],
      ['dorRespirar', 'Pontada dolorosa no peito ou nas costelas ao respirar fundo (serosite)'],
      ['quedaCabelo', 'Queda excessiva de cabelo (tufos ao pentear ou lavar)']
    ],
    sjogren: [
      ['olhoSeco', 'Sensação de areia nos olhos ou necessidade constante de usar colírio'],
      ['bocaSeca', 'Dificuldade para engolir alimentos secos sem tomar líquido junto'],
      ['parotida', 'Inchaço ou dor nas laterais do rosto/pescoço (glândulas salivares)'],
      ['peleSeca', 'Pele excessivamente seca, descamando ou com coceira intensa'],
      ['fadigaSicca', 'Sensação de fadiga profunda acompanhada de boca e olhos secos/irritados'],
      ['tosseSeca', 'Tosse seca irritativa persistente e sem causa aparente']
    ],
    miofascial: [
      ['pontoGatilho', 'Pontos-gatilho (nódulos ou "nós" musculares muito doloridos ao toque)'],
      ['dorIrradiada', 'Dor irradiada (apertar um ponto muscular faz doer outro local do corpo)'],
      ['limitacaoMovimento', 'Sensação de músculo encurtado que impede de esticar ou mexer o membro'],
      ['espasmosMusculares', 'Espasmos, tremores ou contrações musculares involuntárias'],
      ['pesoOmbros', 'Sensação de peso extremo sobre os ombros ou pescoço (tensão muscular)']
    ],
    migrainea: [
      ['pulsatil', 'Dor de cabeça pulsátil ou latejante de um lado só da cabeça'],
      ['fotofobia', 'Sensabilidade extrema à luz (necessidade de ficar no escuro)'],
      ['fonofobia', 'Sensibilidade a ruídos comuns, barulhos ou vozes que aumentam a dor'],
      ['nausea', 'Náusea, enjoo ou intolerância a cheiros fortes (perfumes, comida)'],
      ['aura', 'Enxergar pontos brilhantes, linhas piscando ou embaçamento antes da dor (aura)']
    ],
    endometriose: [
      ['doresMenstruais', 'Cólica menstrual extremamente forte que impede atividades normais'],
      ['dorNaoMenstrual', 'Dor ou pontadas na região da pélvis ("pé da barriga") fora do período menstrual'],
      ['dorRelacao', 'Desconforto ou dor profunda durante ou logo após a relação íntima'],
      ['intestinal', 'Distensão abdominal, gases ou cólica forte ao evacuar no período menstrual'],
      ['dorUrinaria', 'Dor, queimação ou necessidade urgente de urinar durante o período menstrual']
    ],
  } as Record<string, [string, string][]>,

  triggerGroups: [
    ['Sono e recuperação', ['Despertei várias vezes de madrugada', 'Dificuldade para pegar no sono', 'Sono agitado / pesadelos']],
    ['Estresse e rotina', ['Estresse ocupacional', 'Estresse familiar', 'Estresse pessoal', 'Crise emocional', 'Trabalho intenso / hora extra', 'Viagem / mudança de rotina']],
    ['Corpo e saúde', ['Crise de enxaqueca', 'Refluxo / azia / queimação', 'Distensão abdominal / gases']],
    ['Hábitos e tratamento', ['Alimentação inadequada', 'Jejum prolongado', 'Excesso de cafeína', 'Consumo de álcool', 'Mudança de medicação recente']]
  ] as [string, string[]][],

  moods: [
    ['😣', 'Difícil', 1],
    ['🙁', 'Abaixo', 2],
    ['😐', 'Neutro', 3],
    ['🙂', 'Bom', 4],
    ['😄', 'Ótimo', 5]
  ] as [string, string, number][],

  selects: {
    stressContext: ['', 'Ocupacional / trabalho', 'Familiar / cuidado de outros', 'Pessoal / emocional', 'Financeiro / burocrático', 'Misto'],
    workStatus: ['', 'Trabalhei normalmente', 'Trabalhei com adaptação/restrição', 'Afastado(a) por saúde', 'Licença, férias ou folga', 'Não se aplica'],
    activityLoad: ['', 'Repouso maior que habitual', 'Leve', 'Moderada', 'Intensa / exagerei'],
    rescueResponse: ['', 'Sem melhora', 'Melhora pequena', 'Melhora moderada', 'Melhora importante', 'Efeito adverso'],
    exerciseDone: ['', 'Não fiz', 'Sim, planejado', 'Sim, mais intenso que o habitual', 'Fisioterapia / reabilitação'],
    exercisePain: ['', 'Não piorou', 'Piorou durante', 'Piorou horas depois', 'Piorou no dia seguinte', 'Melhorou'],
    cyclePhase: ['', 'Menstruação', 'Folicular', 'Ovulação provável', 'Lútea / TPM', 'Menopausa / perimenopausa', 'Uso hormonal contínuo'],
    cycleSymptoms: ['', 'Sem sintomas relevantes', 'Cólica leve', 'Cólica moderada/intensa', 'Fluxo aumentado', 'Mama dolorida/inchaço', 'Enxaqueca associada'],
    menopauseSymptoms: ['', 'Sem sintomas relevantes', 'Ondas de calor ou suor noturno', 'Sono piorado', 'Secura vaginal/urinária', 'Oscilação de humor/irritabilidade', 'Dor articular ou muscular pior', 'Múltiplos sintomas']
  } as Record<string, string[]>,

  helpTexts: {
    pain: 'Pense na dor mais comum desde o último registro. O objetivo é ver tendência, não exatidão.',
    fatigue: 'Fadiga não é só sono: é cansaço físico/mental desproporcional, corpo pesado, pouca energia.',
    sleep: 'Nota alta = acordar descansado(a). Nota baixa = acordar quebrado(a), sono leve ou interrompido.',
    function: 'Quanto você conseguiu fazer sua vida real (banho, trabalho, casa, caminhar). 10 = perto do normal.',
    stiffness: 'Tempo até o corpo/articulações "destravarem" de manhã. Rigidez prolongada é pista importante.',
    triggers: 'Marque suspeitas, não certezas. O diário mostra associação, não prova de causa.',
    mood: 'Humor e estresse são moduladores da dor: não significam que a dor seja "psicológica".',
    cycle: 'Se menstrua, registre fase/sintomas. No climatério, registre ondas de calor, sono, secura, humor.'
  } as Record<string, string>
};

export const SC = {
  nrs010: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  freq04: ['0 Nunca', '1 Vários dias', '2 Mais da metade', '3 Quase todo dia'],
  dif03: ['0 Sem dificuldade', '1 Com alguma', '2 Com muita', '3 Incapaz'],
  csi04: ['0 Nunca', '1 Raramente', '2 Às vezes', '3 Frequente', '4 Sempre'],
  lit04: ['0 Nunca', '1 Raramente', '2 Às vezes', '3 Frequente', '4 Sempre'],
  ehp04: ['0 Nunca', '1 Raramente', '2 Às vezes', '3 Frequente', '4 Sempre'],
  womac04: ['0 Nenhuma', '1 Leve', '2 Moderada', '3 Intensa', '4 Extrema'],
  hit6: ['Nunca', 'Raramente', 'Às vezes', 'Muitas vezes', 'Sempre'],
  vas100: ['0', '25', '50', '75', '100']
};

export interface Band {
  upTo: number;
  color: string;
  label: string;
}

export interface QuestionnaireItemObject {
  t: string;
  scale: string[];
  vals?: number[];
}

export interface QuestionnaireConfig {
  name: string;
  ref: string;
  max: number;
  min?: number;
  dec: number;
  cutoff?: number;
  scale: string[];
  vals?: number[];
  items: (string | QuestionnaireItemObject)[];
  compute: (v: number[]) => number;
  bands: Band[];
}

const BAND3 = (a: number, b: number, max: number, la: string, lb: string, lc: string): Band[] => [
  { upTo: a, color: '#10b981', label: la },
  { upTo: b, color: '#f59e0b', label: lb },
  { upTo: max, color: '#f43f5e', label: lc }
];

const PSAID_W = [0.176, 0.145, 0.116, 0.116, 0.116, 0.086, 0.085, 0.046, 0.046, 0.038, 0.015, 0.015];

const sum = (a: number[]) => a.reduce((x, y) => x + (y || 0), 0);
const mean = (a: number[]) => a.length ? sum(a) / a.length : 0;

export const QS: Record<string, QuestionnaireConfig> = {
  fibromialgia: {
    name: 'Acompanhamento de Sintomas da Fibromialgia',
    ref: 'Bennett RM, et al. The Revised FIQ (FIQR). Arthritis Res Ther. 2009.',
    max: 100,
    dec: 0,
    scale: SC.nrs010,
    items: [
      'Escovar ou pentear o cabelo',
      'Caminhar continuamente por 20 minutos',
      'Preparar uma refeição',
      'Aspirar, esfregar o chão ou varrer',
      'Levantar e carregar uma sacola de compras cheia',
      'Subir um lance de escadas',
      'Trocar a roupa de cama',
      'Ficar sentado(a) em uma cadeira por 45 minutos',
      'Fazer compras no supermercado',
      'A fibromialgia me impediu de alcançar meus objetivos da semana',
      'Senti que não consegui controlar minha fibromialgia',
      'Dor',
      'Energia (cansaço / falta de energia)',
      'Rigidez muscular',
      'Qualidade do sono',
      'Depressão',
      'Memória / concentração (fibrofog)',
      'Ansiedade',
      'Sensibilidade ao toque',
      'Equilíbrio',
      'Sensibilidade a barulhos, luzes, cheiros ou frio'
    ],
    compute: (v: number[]) => {
      return sum(v.slice(0, 9)) / 3 + sum(v.slice(9, 11)) + sum(v.slice(11, 21)) / 2;
    },
    bands: BAND3(38, 58, 100, 'Leve', 'Moderado', 'Grave')
  },
  ar: {
    name: 'Mobilidade & Dor da Artrite Reumatoide',
    ref: 'Pincus T, et al. RAPID3. J Rheumatol. 2008.',
    max: 30,
    dec: 1,
    scale: SC.dif03,
    items: [
      'Vestir-se, incluindo amarrar cadarços e abotoar',
      'Levantar-se de uma cadeira sem apoio dos braços',
      'Comer, incluindo cortar alimentos e segurar o copo',
      'Caminhar em terreno plano ao ar livre',
      'Tomar banho e secar-se',
      'Dobrar-se e pegar um objeto no chão',
      'Abrir torneiras ou girar maçanetas',
      'Subir cinco ou mais degraus',
      'Fazer compras (carregar sacolas, usar dinheiro)',
      'Atividades de lazer ou esportes que você gostava',
      { t: 'Intensidade da sua dor nas últimas semanas (0 a 10)', scale: SC.nrs010 },
      { t: 'No geral, como está sua saúde por causa da artrite? (0 muito bem a 10 muito mal)', scale: SC.nrs010 }
    ],
    compute: (v: number[]) => {
      return mean(v.slice(0, 10)) * 10 / 3 + v[10] + v[11];
    },
    bands: [
      { upTo: 3, color: '#10b981', label: 'Remissão' },
      { upTo: 6, color: '#0d9488', label: 'Baixa' },
      { upTo: 12, color: '#f59e0b', label: 'Moderada' },
      { upTo: 30, color: '#f43f5e', label: 'Alta' }
    ]
  },
  espondiloartrite: {
    name: 'Rigidez & Dor da Espondiloartrite',
    ref: 'Garrett S, et al. BASDAI. J Rheumatol. 1994.',
    max: 10,
    dec: 1,
    scale: SC.nrs010,
    items: [
      'Fadiga ou cansaço geral',
      'Dor no pescoço, costas ou quadril',
      'Dor ou inchaço em outras articulações',
      'Desconforto em áreas sensíveis ao toque',
      'Intensidade da rigidez ao acordar de manhã',
      'Duração da rigidez matinal (0 nenhuma, 10 duas horas ou mais)'
    ],
    compute: (v: number[]) => {
      return (v[0] + v[1] + v[2] + v[3] + (v[4] + v[5]) / 2) / 5;
    },
    bands: [
      { upTo: 3.9, color: '#10b981', label: 'Sob controle' },
      { upTo: 10, color: '#f43f5e', label: 'Ativa (4 ou mais)' }
    ]
  },
  sjogren: {
    name: 'Nível de Secura & Fadiga (Sjögren)',
    ref: 'Seror R, et al. ESSPRI. Ann Rheum Dis. 2011.',
    max: 10,
    dec: 1,
    scale: SC.nrs010,
    items: [
      'Secura (boca, olhos, pele, outras) nas últimas 2 semanas',
      'Fadiga (física e mental)',
      'Dor (articulações ou músculos)'
    ],
    compute: (v: number[]) => {
      return mean(v);
    },
    bands: [
      { upTo: 4.9, color: '#10b981', label: 'Aceitável' },
      { upTo: 10, color: '#f43f5e', label: 'Alto (5 ou mais)' }
    ]
  },
  psoriasica: {
    name: 'Impacto Diário da Artrite Psoriásica',
    ref: 'Gossec L, et al. PsAID. Ann Rheum Dis. 2014.',
    max: 10,
    dec: 1,
    scale: SC.nrs010,
    items: [
      'Dor',
      'Fadiga ou cansaço',
      'Problemas de pele (psoríase)',
      'Capacidade de trabalhar ou de lazer',
      'Capacidade funcional (atividades físicas diárias)',
      'Desconforto físico geral (rigidez, inchaço, sensibilidade)',
      'Qualidade do sono',
      'Capacidade de lidar e se adaptar à doença',
      'Ansiedade, medo ou preocupação',
      'Vergonha ou constrangimento',
      'Participação em atividades sociais',
      'Tristeza ou depressão'
    ],
    compute: (v: number[]) => {
      let s = 0;
      for (let i = 0; i < 12; i++) s += v[i] * PSAID_W[i];
      return s;
    },
    bands: [
      { upTo: 4, color: '#10b981', label: 'Aceitável (PASS)' },
      { upTo: 6, color: '#f59e0b', label: 'Moderado' },
      { upTo: 10, color: '#f43f5e', label: 'Alto' }
    ]
  },
  les: {
    name: 'Qualidade de Vida no Lúpus',
    ref: 'Jolly M, et al. Lupus Impact Tracker. Arthritis Care Res. 2014.',
    max: 40,
    dec: 0,
    scale: SC.lit04,
    items: [
      'O lúpus limitou suas atividades físicas (caminhar, subir escadas, carregar objetos)?',
      'Sentiu dor ou desconforto nas articulações ou músculos por causa do lúpus?',
      'Sentiu fadiga ou cansaço intenso que interferiu nas atividades?',
      'O lúpus afetou a qualidade do seu sono?',
      'Sentiu-se emocionalmente abalado(a) (ansioso, deprimido, irritado) por causa do lúpus?',
      'Teve dificuldades de concentração, memória ou raciocínio ("névoa do lúpus")?',
      'O lúpus interferiu em trabalhar, estudar ou tarefas domésticas?',
      'O lúpus limitou sua participação social, familiar ou de lazer?',
      'Precisou de ajuda de outras pessoas para atividades que costuma fazer sozinho(a)?',
      'De forma geral, o lúpus afetou negativamente sua qualidade de vida?'
    ],
    compute: (v: number[]) => sum(v),
    bands: BAND3(13, 26, 40, 'Baixo', 'Moderado', 'Alto')
  },
  osteoartrite: {
    name: 'Mobilidade de Joelho & Quadril (Osteoartrite)',
    ref: 'Bellamy N, et al. WOMAC. J Rheumatol. 1988.',
    max: 96,
    dec: 0,
    scale: SC.womac04,
    items: [
      'Dor ao caminhar em superfície plana',
      'Dor ao subir ou descer escadas',
      'Dor à noite, ao deitar ou dormir',
      'Dor ao sentar ou deitar em repouso',
      'Dor ao permanecer em pé',
      'Rigidez ao acordar pela manhã',
      'Rigidez mais tarde, após ficar parado(a)',
      'Dificuldade para descer escadas',
      'Dificuldade para subir escadas',
      'Dificuldade para levantar após ficar sentado(a)',
      'Dificuldade para permanecer em pé',
      'Dificuldade para se inclinar em direção ao chão',
      'Dificuldade para caminhar em superfície plana',
      'Dificuldade para entrar ou sair do carro',
      'Dificuldade para fazer compras',
      'Dificuldade para calçar meias',
      'Dificuldade para levantar da cama',
      'Dificuldade para tirar meias',
      'Dificuldade para permanecer deitado(a) confortável',
      'Dificuldade para entrar ou sair do banho',
      'Dificuldade para permanecer sentado(a)',
      'Dificuldade para levantar do vaso sanitário',
      'Dificuldade em tarefas domésticas pesadas',
      'Dificuldade em tarefas domésticas leves'
    ],
    compute: (v: number[]) => sum(v),
    bands: BAND3(32, 64, 96, 'Leve', 'Moderada', 'Intensa')
  },
  miofascial: {
    name: 'Intensidade da Dor Corporal (Miofascial)',
    ref: 'Cleeland CS, Ryan KM. Brief Pain Inventory. Ann Acad Med Singapore. 1994.',
    max: 10,
    dec: 1,
    scale: SC.nrs010,
    items: [
      'Pior dor nas últimas 24 horas',
      'Menor dor nas últimas 24 horas',
      'Dor em média nas últimas 24 horas',
      'Dor agora'
    ],
    compute: (v: number[]) => mean(v),
    bands: [
      { upTo: 4, color: '#10b981', label: 'Leve' },
      { upTo: 6, color: '#f59e0b', label: 'Moderada' },
      { upTo: 10, color: '#f43f5e', label: 'Intensa' }
    ]
  },
  migrainea: {
    name: 'Impacto Diário da Enxaqueca',
    ref: 'Kosinski M, et al. HIT-6. Qual Life Res. 2003.',
    max: 78,
    min: 36,
    dec: 0,
    scale: SC.hit6,
    vals: [6, 8, 10, 11, 13],
    items: [
      'Quando tem dor de cabeça, com que frequência a dor é forte?',
      'Com que frequência a dor de cabeça limita suas atividades diárias (trabalho, escola, casa, social)?',
      'Quando tem dor de cabeça, com que frequência você deseja se deitar?',
      'Nas últimas 4 semanas, com que frequência se sentiu cansado(a) demais para trabalhar por causa da dor de cabeça?',
      'Nas últimas 4 semanas, com que frequência se sentiu farto(a) ou irritado(a) por causa da dor de cabeça?',
      'Nas últimas 4 semanas, com que frequência a dor de cabeça limitou sua concentração?'
    ],
    compute: (v: number[]) => sum(v),
    bands: [
      { upTo: 49, color: '#10b981', label: 'Pouco ou nenhum' },
      { upTo: 55, color: '#0d9488', label: 'Algum' },
      { upTo: 59, color: '#f59e0b', label: 'Substancial' },
      { upTo: 78, color: '#f43f5e', label: 'Severo' }
    ]
  },
  sii: {
    name: 'Desconforto Intestinal (SII)',
    ref: 'Francis CY, et al. IBS-SSS. Aliment Pharmacol Ther. 1997.',
    max: 500,
    dec: 0,
    scale: SC.vas100,
    vals: [0, 25, 50, 75, 100],
    items: [
      'Quão intensa foi sua dor abdominal?',
      'Em quantos dos últimos 10 dias você teve dor abdominal? (cada dia conta como 10)',
      'Quão intensa foi a distensão ou inchaço abdominal?',
      'Quão insatisfeito(a) está com seu hábito intestinal?',
      'Quanto a SII interferiu na sua vida em geral?'
    ],
    compute: (v: number[]) => sum(v),
    bands: [
      { upTo: 75, color: '#10b981', label: 'Remissão' },
      { upTo: 175, color: '#0d9488', label: 'Leve' },
      { upTo: 300, color: '#f59e0b', label: 'Moderada' },
      { upTo: 500, color: '#f43f5e', label: 'Grave' }
    ]
  },
  endometriose: {
    name: 'Impacto Diário da Endometriose',
    ref: 'Jones G, et al. EHP-30 / EHP-5. Qual Life Res. 2004.',
    max: 100,
    dec: 0,
    scale: SC.ehp04,
    items: [
      'A dor da endometriose afetou suas atividades habituais (casa, trabalho, lazer)?',
      'Sentiu-se incapaz de lidar com os sintomas da endometriose?',
      'Sentiu-se deprimida ou para baixo por causa da endometriose?',
      'Sentiu que não recebeu apoio suficiente das pessoas próximas?',
      'A endometriose afetou a forma como você se vê (autoimagem)?'
    ],
    compute: (v: number[]) => mean(v) * 25,
    bands: BAND3(33, 66, 100, 'Baixo', 'Moderado', 'Alto')
  },
  PHQ9: {
    name: 'Humor & Disposição',
    ref: 'Kroenke K, et al. PHQ-9. J Gen Intern Med. 2001.',
    max: 27,
    dec: 0,
    scale: SC.freq04,
    items: [
      'Pouco interesse ou prazer em fazer as coisas',
      'Sentir-se para baixo, deprimido(a) ou sem esperança',
      'Dificuldade para dormir ou dormir demais',
      'Sentir-se cansado(a) ou com pouca energia',
      'Pouco apetite ou comer demais',
      'Sentir-se mal consigo mesmo(a) ou um fracasso',
      'Dificuldade de concentração',
      'Lentidão ou agitação perceptível por outros',
      'Pensamentos de que seria melhor estar morto(a) ou se machucar'
    ],
    compute: (v: number[]) => sum(v),
    bands: [
      { upTo: 4, color: '#10b981', label: 'Estável / Normal' },
      { upTo: 9, color: '#0d9488', label: 'Flutuação Leve' },
      { upTo: 14, color: '#f59e0b', label: 'Flutuação Moderada' },
      { upTo: 19, color: '#f97316', label: 'Atenção Necessária' },
      { upTo: 27, color: '#f43f5e', label: 'Sinal de Alerta / Severe' }
    ]
  },
  GAD7: {
    name: 'Nível de Ansiedade',
    ref: 'Spitzer RL, et al. GAD-7. Arch Intern Med. 2006.',
    max: 21,
    dec: 0,
    scale: SC.freq04,
    items: [
      'Nervoso(a), ansioso(a) ou no limite',
      'Não conseguir parar ou controlar preocupações',
      'Preocupar-se demais com diferentes coisas',
      'Dificuldade para relaxar',
      'Tão inquieto(a) que custa ficar parado(a)',
      'Facilmente aborrecido(a) ou irritado(a)',
      'Medo como se algo terrível fosse acontecer'
    ],
    compute: (v: number[]) => sum(v),
    bands: [
      { upTo: 4, color: '#10b981', label: 'Estável / Calmo' },
      { upTo: 9, color: '#0d9488', label: 'Ansiedade Leve' },
      { upTo: 14, color: '#f59e0b', label: 'Ansiedade Moderada' },
      { upTo: 21, color: '#f43f5e', label: 'Ansiedade Severa' }
    ]
  },
  CSI7: {
    name: 'Sensibilidade Corporal Geral',
    ref: 'Neblett R, et al. CSI short form. J Pain. 2026.',
    max: 28,
    cutoff: 20,
    dec: 0,
    scale: SC.csi04,
    items: [
      'Sinto dor em muitas partes do corpo',
      'Tenho dores de cabeça frequentes',
      'Meus sintomas físicos me angustiam muito',
      'Sou sensível à luz intensa',
      'Acordo cansado(a)',
      'Sou sensível a odores fortes',
      'Tenho dificuldade de concentração'
    ],
    compute: (v: number[]) => sum(v),
    bands: [
      { upTo: 20, color: '#10b981', label: 'Sensibilidade Normal' },
      { upTo: 28, color: '#f43f5e', label: 'Sensibilidade Amplificada' }
    ]
  }
};

export const REFERENCES: [number, string, string, string, number, string][] = [
  [1, 'Leroux A, et al.', 'Statistical modeling of acute and chronic pain patient-reported outcomes from ecological momentary assessment.', 'Pain', 2024, 'https://consensus.app/papers/details/a7800b7a9d3e56a7853ac9fce7181254/'],
  [2, 'Pagé MG, et al.', 'An ecological momentary assessment study of pain intensity variability in chronic pain.', 'J Pain', 2022, 'https://consensus.app/papers/details/cb048d46da13596d95ac543f50a4d80b/'],
  [3, 'Stone AA, et al.', 'High-resolution field approaches for assessing pain: ecological momentary assessment.', 'Pain', 2020, 'https://consensus.app/papers/details/d539877f01115ed1822dbe1ca3d6cbc5/'],
  [4, 'Negrón JB, et al.', 'Patient-reported outcome measures for fibromyalgia: a review.', 'Ann Rheum Dis', 2018, 'https://consensus.app/papers/details/9556a762bcdb549bbb0da7a681804d24/'],
  [5, 'Döhmen A, et al.', 'Are OMERACT recommendations followed in clinical trials on fibromyalgia?', 'Qual Life Res', 2022, 'https://consensus.app/papers/details/5b0186908e47575a9ff82a589909c01e/'],
  [6, 'Hays RD, et al.', 'PROMIS-29 v2.0 profile physical and mental health summary scores.', 'Qual Life Res', 2018, 'https://consensus.app/papers/details/dad44ba2a4945bf0acfe5c95480bc07d/'],
  [7, 'Bartley EJ, et al.', 'Pain and fatigue variability patterns distinguish subgroups of fibromyalgia patients.', 'J Pain', 2017, 'https://consensus.app/papers/details/1f8321c086875c648c4f7ce381e30634/'],
  [8, 'Gómez-Argüelles JM, et al.', 'Characterizing fibromyalgia flares: a prospective observational study.', 'Reumatologia', 2022, 'https://consensus.app/papers/details/20f4ba5b9e605a10804fdffdaf3cea35/'],
  [9, 'Nada MAF, et al.', 'Medication overuse headache from a tertiary headache center: real-world insights.', 'J Headache Pain', 2026, 'https://consensus.app/papers/details/259cfc4338445046b5febf69fe80a607/'],
  [10, 'Ashina S, et al.', 'Medication overuse headache.', 'Nat Rev Dis Primers', 2023, 'https://consensus.app/papers/details/a61f895483ba5f67a55db04f50a53242/'],
  [11, 'Vetvik KG, et al.', 'Menstrual migraine: a distinct disorder needing greater recognition.', 'Lancet Neurol', 2021, 'https://consensus.app/papers/details/61bf50c6ce335d09a78a6db9ff5ecbd2/'],
  [12, 'Raffaelli B, et al.', 'Menstrual migraine is caused by estrogen withdrawal: revisiting the evidence.', 'J Headache Pain', 2023, 'https://consensus.app/papers/details/01c040ef7ce85d3dbc6f11bf73efd792/'],
  [13, 'van Casteren DS, et al.', 'Comparing perimenstrual and nonperimenstrual migraine attacks using an e-diary.', 'Neurology', 2021, 'https://consensus.app/papers/details/0ea846f184975fae8df6da9d60e66278/'],
  [14, 'Runge N, et al.', 'The bidirectional relationship between sleep problems and chronic musculoskeletal pain.', 'Pain', 2024, 'https://consensus.app/papers/details/1589224ba23f5e5da2ecc8643fd0b528/'],
  [15, 'Santos M, et al.', 'The bidirectional association between chronic musculoskeletal pain and sleep-related problems.', 'Rheumatology', 2023, 'https://consensus.app/papers/details/22940de1b6b55d579bb2a53f37e83e42/'],
  [16, 'Andersen ML, et al.', 'Sleep disturbance and pain: a tale of two common problems.', 'Chest', 2018, 'https://consensus.app/papers/details/620d9fec5c565e1fb37734ea2e8ee516/'],
  [17, 'Neblett R, et al.', 'Is the Central Sensitization Inventory associated with quantitative sensory testing?', 'Neurosci Biobehav Rev', 2024, 'https://consensus.app/papers/details/9cbab8ba1dbc5962b98e93b2f2e445d3/'],
  [18, 'Neblett R, et al.', 'Development of a Central Sensitization Inventory short form using data from 23 countries.', 'J Pain', 2026, 'https://consensus.app/papers/details/92bef2c3560b57aeb0f5020d8ccc760c/'],
  [19, 'Guler MA, et al.', 'The important role of central sensitization in chronic musculoskeletal pain in rheumatic diseases.', 'Clin Rheumatol', 2019, 'https://consensus.app/papers/details/32f70d0986e751ce9c2607ef78ef4408/'],
  [20, 'Bourdel N, et al.', 'Systematic review of quality of life measures in patients with endometriosis.', 'PLoS One', 2019, 'https://consensus.app/papers/details/bf8dfa49c73d512d83ca6ffd71870f7b/'],
  [21, 'Aubry G, et al.', 'Measuring health-related quality of life in endometriosis: EHP-5 vs EQ-5D.', 'Hum Reprod', 2017, 'https://consensus.app/papers/details/753149d053045d239ca0af56a7488a51/'],
  [22, 'Ceccaroni M, et al.', 'Conservative management of bowel endometriosis.', 'J Clin Med', 2024, 'https://consensus.app/papers/details/2b319645677b5835be8bcda36b300c66/'],
  [23, 'Molino S, et al.', 'Improving IBS symptoms and quality of life.', 'Nutrients', 2025, 'https://consensus.app/papers/details/27d4f9bb276b5cb99a12d294c1a3812c/'],
  [24, 'Simrén M, et al.', 'Cumulative effects of psychologic distress, visceral hypersensitivity, and abnormal transit in IBS.', 'Gastroenterology', 2019, 'https://consensus.app/papers/details/84340e53943551a39018f800c238731f/'],
  [25, 'Dudeney J, et al.', 'Anxiety and depression in youth with chronic pain.', 'JAMA Pediatr', 2024, 'https://consensus.app/papers/details/4ad887fed8225284a96f191faa7753d6/'],
  [26, 'Aaron RV, et al.', 'Prevalence of depression and anxiety among adults with chronic pain.', 'JAMA Netw Open', 2025, 'https://consensus.app/papers/details/838e62c2ed795392ba1c6d50062f5d77/'],
  [27, 'Fagerlund AJ, et al.', 'Blame it on the weather? Fibromyalgia, humidity, temperature and barometric pressure.', 'PLoS One', 2019, 'https://consensus.app/papers/details/463bdcff6c005b24904ecd8cbfb75f82/'],
  [28, 'Yung T, et al.', 'Do changes in the weather influence joint pain in children with JIA?', 'J Rheumatol', 2025, 'https://consensus.app/papers/details/4d82248de92f5990b619de97b7f342ff/'],
  [29, 'Ziadé N, et al.', 'Prospective correlational time-series analysis of weather and air pollution on joint pain.', 'Clin Rheumatol', 2021, 'https://consensus.app/papers/details/6cf465dc3eee5a5fb6061d3f3b7d4920/'],
  [30, 'Jamid NM, et al.', 'Evaluation of RAPID3 and HAQ-DI compared to DAS28.', 'Ann Rheum Dis', 2017, 'https://consensus.app/papers/details/49e68c1082ef56f487bc95eb4a4f2932/'],
  [31, 'Eow LH, et al.', 'Myra touch for disease activity evaluation in rheumatoid arthritis.', 'Ann Rheum Dis', 2021, 'https://consensus.app/papers/details/6fd040f2929d536887b5778b3a7d688c/'],
  [32, 'Twigg S, et al.', 'Patient-reported outcomes as predictors of change in early rheumatoid arthritis.', 'J Rheumatol', 2017, 'https://consensus.app/papers/details/8f81b1dc57555e44a22faebe3c9e7212/'],
  [33, 'Teuwen MMH, et al.', 'The extent and nature of functional limitations according to HAQ-DI in RA.', 'J Clin Med', 2024, 'https://consensus.app/papers/details/deba5d4679bd5ae994ae32a3f3629f20/'],
  [34, 'Feng J, et al.', 'Correlation between disease activity and quality of life in rheumatoid arthritis.', 'BMJ Open', 2024, 'https://consensus.app/papers/details/e3eae775ac195af38e4062159cfd88ca/'],
  [35, 'Wiąk-Walerowicz K, et al.', 'Comparison of ASDAS and BASDAI in axial spondyloarthritis.', 'Reumatologia', 2024, 'https://consensus.app/papers/details/0068d8fd833f5a26ad391aa3313b61ae/'],
  [36, 'Chan A.', 'Assessing disease activity in axial spondyloarthritis: BASDAI vs ASDAS.', 'J Rheumatol', 2025, 'https://consensus.app/papers/details/b89541d2e35358dcbdfb3baaa6038fbc/'],
  [37, 'Kumthekar A, et al.', 'How to monitor disease activity of axial spondyloarthritis in clinical practice.', 'Curr Rheumatol Rep', 2024, 'https://consensus.app/papers/details/e1b38b505318552295d05d2d6ab97a3f/'],
  [38, 'Mosca M, et al.', 'How do patients with newly diagnosed SLE present?', 'Arthritis Rheumatol', 2018, 'https://consensus.app/papers/details/d766f945e8dc5c6e9286ac419f863eb6/'],
  [39, 'Adamichou C, et al.', 'Lupus or not? SLE Risk Probability Index (SLERPI).', 'Ann Rheum Dis', 2021, 'https://consensus.app/papers/details/7d41d608107b5d06bf2925286163c77a/'],
  [40, 'Seror R, et al.', 'Outcome measures in primary Sjögren syndrome.', 'Arthritis Care Res', 2020, 'https://consensus.app/papers/details/c27b9c82ea235a2f87c2a5bdeea7e3da/'],
  [41, 'Nam E, et al.', 'ESSPRI and glandular dysfunction in Sjögren syndrome.', 'Ann Rheum Dis', 2023, 'https://consensus.app/papers/details/d671953c759e530ab112adee5256305d/'],
  [42, 'Silva MDC, et al.', 'Minimal important change and difference for knee osteoarthritis outcome tools.', 'BMJ Open', 2023, 'https://consensus.app/papers/details/19ce185a29fb5efba3cbfd391d5f4192/'],
  [43, 'Neuprez A, et al.', 'Total joint replacement improves pain and quality of life up to 5 years.', 'Clin Rheumatol', 2019, 'https://consensus.app/papers/details/a157c867b1b859ae8e0a4a0674b053a9/'],
  [44, 'Mo L, et al.', 'Exercise therapy for knee osteoarthritis: a network meta-analysis.', 'Orthop J Sports Med', 2023, 'https://consensus.app/papers/details/dd85a7e23ad75b1984f19db8bc2fc6c0/'],
  [45, 'Song K, et al.', 'Evaluating PROMs in psoriatic arthritis disease activity.', 'Rheumatology', 2023, 'https://consensus.app/papers/details/4d3be2dc1e9a5eaf910f6a29f928acb7/'],
  [46, 'Gossec L, et al.', 'Association between PsAID-9 and disease activity in bimekizumab-treated PsA.', 'Ann Rheum Dis', 2020, 'https://consensus.app/papers/details/2c1df4028d0058568f7c58e7376d4190/'],
  [47, 'Hum RM, et al.', 'PsAID-12 can replace other PROMs in psoriatic arthritis monitoring.', 'Rheumatology', 2024, 'https://consensus.app/papers/details/9bafd3c951b5594d87db82466081c75e/'],
  [48, 'Lajeunesse M, et al.', 'Trigger point injection for myofascial pain syndrome of the low back.', 'Ann Emerg Med', 2025, 'https://consensus.app/papers/details/5aad746368185b53887cf2ab81db0ce3/'],
  [49, 'Lara-Palomo IC, et al.', 'Electrical dry needling vs non-invasive intervention in chronic low back pain.', 'Clin Rehabil', 2023, 'https://consensus.app/papers/details/f9ab06eed135509c9466ae553bed0b49/'],
  [50, 'Sánchez-Romero EA, et al.', 'Prevalence of myofascial trigger points in knee osteoarthritis.', 'J Clin Med', 2020, 'https://consensus.app/papers/details/c5443544635a52888ccb1df5229306ec/'],
  [51, 'Cabero-Pérez JA, et al.', 'Persistent physical symptoms and psychosomatic profiling in fibromyalgia.', 'J Clin Med', 2026, 'https://consensus.app/papers/details/b6dc7313517a512eb037991f2a90f775/'],
  [52, 'Barjandi G, et al.', 'Comorbid conditions in TMD myalgia and myofascial pain compared to fibromyalgia.', 'J Clin Med', 2021, 'https://consensus.app/papers/details/5d867405b8e85058b0b610e0544bd093/'],
  [53, 'Shiha MG, et al.', 'Physical and psychological comorbidities associated with IBS.', 'Aliment Pharmacol Ther', 2021, 'https://consensus.app/papers/details/7f83e7a1044154cf8d099502199f7cbf/'],
  [54, 'Li H, et al.', 'Progression trajectories of chronic overlapping pain conditions.', 'Pain', 2025, 'https://consensus.app/papers/details/df62e1536caf5c1a9ef97d7f859dee3a/'],
  [55, 'Costantini R, et al.', 'Visceral pain as a triggering factor for fibromyalgia symptoms in comorbid patients.', 'Pain', 2017, 'https://consensus.app/papers/details/407b1ca33bd656b9a2311faf36247fba/'],
  [56, 'Mardock AL, et al.', 'Association of central sensitization with chronic pain in endometriosis.', 'Obstet Gynecol', 2026, 'https://consensus.app/papers/details/82cef99ba2c852d48b1d2f1ff2597424/']
];
