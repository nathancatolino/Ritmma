/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AdverseDrugReaction {
  id: string;
  drugKey: string;
  drugName: string;
  drugClass: string;
  reactions: {
    symptomKeywords: string[];
    displayName: string;
    frequency: 'Muito comum (≥10%)' | 'Comum (1-10%)' | 'Incomum (<1%)';
    mechanism: string;
    physicianAdvice: string;
  }[];
}

export interface AdverseReactionMatch {
  reportedSymptom: string;
  drugKey: string;
  drugName: string;
  drugClass: string;
  reactionDisplayName: string;
  frequency: string;
  physicianAdvice: string;
  mechanism: string;
}

export const KNOWN_DRUG_ADVERSE_REACTIONS: AdverseDrugReaction[] = [
  {
    id: 'mtx',
    drugKey: 'metotrexato',
    drugName: 'Metotrexato (MTX)',
    drugClass: 'DMARD Sintético Convencional (Antimetabólito antifolato)',
    reactions: [
      {
        symptomKeywords: ['nausea', 'náusea', 'enjoo', 'enjôo', 'vomito', 'vômito', 'anorexia'],
        displayName: 'Intolerância gastrointestinal / Náusea induzida por MTX',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Efeito antifolato na mucosa gástrica e modulação central de centros eméticos.',
        physicianAdvice: 'Verificar se o ácido fólico (5mg a 10mg/semana) está sendo tomado 24h a 48h após o MTX. Em casos refratários, considerar transição para via parenteral (subcutânea) ou fracionamento da dose.'
      },
      {
        symptomKeywords: ['afta', 'aftas', 'estomatite', 'mucosite', 'boca_seca', 'ferida na boca'],
        displayName: 'Estomatite / Aftas orais por toxicidade de folato',
        frequency: 'Comum (1-10%)',
        mechanism: 'Inibição rápida de turnover das células epiteliais da mucosa oral por esgotamento de folato.',
        physicianAdvice: 'Aumentar a suplementação de ácido fólico diário (exceto no dia do MTX) e reavaliar hemograma completo para descartar neutropenia/citopenia associada.'
      },
      {
        symptomKeywords: ['fadiga', 'cansaço', 'sonolencia', 'letargia', 'ressaca', 'dor_cabeca', 'cefaleia'],
        displayName: 'Síndrome do dia pós-Metotrexato (MTX Fog / Astenia)',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Liberação aguda de adenosina no sistema nervoso central e acúmulo temporário de poliglutamatos.',
        physicianAdvice: 'Informar ao paciente sobre o padrão temporário (24-36h pós-dose). Pode-se antecipar a dose para sexta à noite ou avaliar uso complementar de cafeína / ajuste posológico de folato.'
      },
      {
        symptomKeywords: ['queda_cabelo', 'alopecia', 'cabelo caindo'],
        displayName: 'Eflúvio telógeno / Rarefação capilar reversível',
        frequency: 'Comum (1-10%)',
        mechanism: 'Interrupção transitória da proliferação celular rápida do folículo piloso.',
        physicianAdvice: 'Geralmente discreta e autolimitada. Assegurar reposição otimizada de ácido folínico/fólico e descartar ferropenia ou hipotiroidismo concomitante.'
      },
      {
        symptomKeywords: ['tontura', 'vertigem'],
        displayName: 'Tontura transitória / Disautonomia subclínica',
        frequency: 'Incomum (<1%)',
        mechanism: 'Flutuações tônicas e liberação de adenosina.',
        physicianAdvice: 'Avaliar hidratação e orientar repouso no período posterior à ingestão.'
      }
    ]
  },
  {
    id: 'leflunomida',
    drugKey: 'leflunomida',
    drugName: 'Leflunomida (Arava)',
    drugClass: 'DMARD Sintético Convencional (Inibidor de DHODH)',
    reactions: [
      {
        symptomKeywords: ['diarreia', 'diarréia', 'fezes líquidas', 'evacuação solta', 'dor_abdominal', 'colica'],
        displayName: 'Enteropatia / Diarreia induzida por Leflunomida',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Inibição da síntese de pirimidina na mucosa entérica com desbalanço secretor.',
        physicianAdvice: 'Monitorar perdas hídricas e eletrólitos. Se refratária ou severa, ponderar redução para 10mg/dia ou washout urgente com colestiramina (8g 3x/dia por 11 dias).'
      },
      {
        symptomKeywords: ['hipertensao', 'pressao_alta', 'pico de pressão', 'cefaleia', 'palpitacao'],
        displayName: 'Elevação tensional / Hipertensão reativa',
        frequency: 'Comum (1-10%)',
        mechanism: 'Estímulo simpático central e potencial retenção renal leve de sódio.',
        physicianAdvice: 'Aferir a PA em todas as consultas. Iniciar ou otimizar anti-hipertensivo se a PA sistólica ultrapassar 140 mmHg.'
      },
      {
        symptomKeywords: ['queda_cabelo', 'alopecia'],
        displayName: 'Alopecia difusa reversível',
        frequency: 'Comum (1-10%)',
        mechanism: 'Inibição temporária de precursores de síntese de DNA folicular.',
        physicianAdvice: 'Normalmente se estabiliza após o 3º ao 6º mês de terapia continuada.'
      }
    ]
  },
  {
    id: 'prednisona',
    drugKey: 'prednisona',
    drugName: 'Prednisona / Glicocorticoide',
    drugClass: 'Glicocorticoide Sistêmico',
    reactions: [
      {
        symptomKeywords: ['insonia', 'insônia', 'sono_fragmentado', 'agitacao', 'ansiedade', 'inquietude'],
        displayName: 'Insônia e excitabilidade neuropsiquiátrica',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Supressão da secreção noturna de melatonina e aumento da reatividade glutamatérgica límbica.',
        physicianAdvice: 'Assegurar que a dose seja administrada estritamente em horário matinal único (até 08:00h) respeitando o ritmo circadiano.'
      },
      {
        symptomKeywords: ['azia', 'queimação', 'refluxo', 'epigastralgia', 'gastrite', 'dor_estomago'],
        displayName: 'Gastropatia esteroidal / Dispepsia',
        frequency: 'Comum (1-10%)',
        mechanism: 'Redução da barreira protetora de muco gástrico e bicarbonato; risco potencializado se associado a AINE.',
        physicianAdvice: 'Orientar ingestão com alimentos. Considerar inibidor de bomba de prótons (IBP) se uso contínuo ou história prévia de úlcera péptica.'
      },
      {
        symptomKeywords: ['edema', 'inchaço', 'rosto_inchado', 'ganho_peso', 'fome_excessiva'],
        displayName: 'Retenção hidrossalina / Fácies cushingoide / Aumento de apetite',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Efeito mineralocorticoide residual com reabsorção tubular de sódio e estímulo hipotalâmico de apetite.',
        physicianAdvice: 'Orientar dieta com restrição de sódio e açúcares simples. Programar desmame do corticoide (tapering) tão logo haja remissão clínica.'
      },
      {
        symptomKeywords: ['hipertensao', 'pressao_alta'],
        displayName: 'Hipertensão arterial farmacológica',
        frequency: 'Comum (1-10%)',
        mechanism: 'Aumento da sensibilidade vascular às catecolaminas e expansão de volume extracelular.',
        physicianAdvice: 'Acompanhar PA domiciliar e reduzir a dose do corticoide para a menor dose de manutenção possível.'
      }
    ]
  },
  {
    id: 'hidroxicloroquina',
    drugKey: 'hidroxicloroquina',
    drugName: 'Hidroxicloroquina (Plaquinol)',
    drugClass: 'Antimalárico / DMARD Convencional',
    reactions: [
      {
        symptomKeywords: ['disturbios_visuais', 'visão borrada', 'turva', 'escotomas', 'fotofobia'],
        displayName: 'Alteração visual precoce / Risco de maculopatia',
        frequency: 'Incomum (<1%)',
        mechanism: 'Afinidade de ligação ao epitélio pigmentar da retina por compostos 4-aminoquinolínicos.',
        physicianAdvice: 'Encaminhamento prioritário ao oftalmologista para campo visual computadorizado (10-2) e tomografia de coerência óptica (SD-OCT). Checar se dose real diária está ≤ 5.0 mg/kg de peso corporal.'
      },
      {
        symptomKeywords: ['nausea', 'dor_estomago', 'diarreia'],
        displayName: 'Intolerância dispeptica leve',
        frequency: 'Comum (1-10%)',
        mechanism: 'Irritação de mucosa gastrointestinal.',
        physicianAdvice: 'Administrar junto à principal refeição do dia ou dividir a dose em 200mg 12/12h.'
      }
    ]
  },
  {
    id: 'aine',
    drugKey: 'aine',
    drugName: 'Anti-inflamatórios Não Esteroidais (AINEs)',
    drugClass: 'AINEs (Inibidores de COX-1/COX-2: Ibuprofeno, Cetoprofeno, Celecoxibe, etc.)',
    reactions: [
      {
        symptomKeywords: ['azia', 'epigastralgia', 'dor_estomago', 'queimação', 'refluxo', 'nausea'],
        displayName: 'Gastropatia por AINE / Risco de erosão mucosa',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Inibição da COX-1 gástrica gerando diminuição acentuada de prostaglandinas citoprotetoras PGE2 e PGI2.',
        physicianAdvice: 'Suspender ou restringir o uso de AINE a períodos estritamente pontuais. Associar gastroproteção (IBP) e monitorar hemoglobina.'
      },
      {
        symptomKeywords: ['edema', 'inchaço', 'pernas_inchadas', 'hipertensao', 'pressao_alta'],
        displayName: 'Retenção renal de sódio e descontrole pressórico',
        frequency: 'Comum (1-10%)',
        mechanism: 'Inibição de prostaglandinas vasodilatadoras intrarrenais e redução da taxa de filtração glomerular.',
        physicianAdvice: 'Evitar uso contínuo em pacientes hipertensos, diabéticos ou idosos. Avaliar ureia e creatinina séricas.'
      }
    ]
  },
  {
    id: 'biologicos_anti_tnf',
    drugKey: 'adalimumabe',
    drugName: 'Anti-TNF (Adalimumabe, Etanercepte, etc.)',
    drugClass: 'Agente Imunobiológico Anti-TNF alfa',
    reactions: [
      {
        symptomKeywords: ['sintomas_gripais', 'resfriado', 'febre', 'coriza', 'dor_garganta', 'tosse'],
        displayName: 'Infecção de vias aéreas superiores / Imunossupressão',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Neutralização do fator de necrose tumoral essencial à imunidade mediada por células e granulomas.',
        physicianAdvice: 'Avaliar sinais de alarme infeccioso bacteriano ou fúngico. Recomenda-se pausar a aplicação do imunobiológico durante infecções ativas febris até completa recuperação clínica.'
      },
      {
        symptomKeywords: ['vermelhidao_local', 'dor_local', 'ardencia_injecao', 'coceira_injecao'],
        displayName: 'Reação inflamatória no sítio de injeção subcutânea',
        frequency: 'Comum (1-10%)',
        mechanism: 'Reação de hipersensibilidade tecidual local com liberação de histamina ao veículo/proteína.',
        physicianAdvice: 'Orientar retirar a caneta/seringa da geladeira 20-30 minutos antes da aplicação para atingir temperatura ambiente e alternar rigorosamente os sítios de injeção.'
      },
      {
        symptomKeywords: ['dor_cabeca', 'cefaleia'],
        displayName: 'Cefaleia pós-aplicação',
        frequency: 'Comum (1-10%)',
        mechanism: 'Liberação transitória de citocinas secundárias pós-ligação do anticorpo.',
        physicianAdvice: 'Geralmente transitória (dura 12-24h). Pode-se prescrever analgésico simples preventivo se recorrente.'
      }
    ]
  },
  {
    id: 'duloxetina',
    drugKey: 'duloxetina',
    drugName: 'Duloxetina (Cymbiata, Velija)',
    drugClass: 'Inibidor da Recaptação de Serotonina e Noradrenalina (IRSN)',
    reactions: [
      {
        symptomKeywords: ['nausea', 'enjoo', 'perda_apetite'],
        displayName: 'Náusea adrenérgica/serotoninérgica de introdução',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Estímulo de receptores 5-HT3 no trato gastrintestinal e no centro do vômito.',
        physicianAdvice: 'Informar que atinge pico nos primeiros 7 a 14 dias e regride espontaneamente. Iniciar com 30mg antes de subir para 60mg.'
      },
      {
        symptomKeywords: ['boca_seca', 'secura_bucal', 'sede_excessiva'],
        displayName: 'Xerostomia / Boca seca por ação noradrenérgica',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Ação noradrenérgica periférica diminuindo o fluxo secretor das glândulas salivares.',
        physicianAdvice: 'Orientar ingesta hídrica fracionada, balas cítricas sem açúcar ou saliva artificial se persistente.'
      },
      {
        symptomKeywords: ['sonolencia', 'fadiga_diurna', 'insonia'],
        displayName: 'Alteração no ciclo vigília-sono',
        frequency: 'Comum (1-10%)',
        mechanism: 'Flutuação do tônus monoaminérgico central.',
        physicianAdvice: 'Se causar sonolência, transferir a tomada para a noite. Se induzir insônia, orientar tomada estritamente pela manhã.'
      },
      {
        symptomKeywords: ['tontura', 'sudorese', 'suor_excessivo'],
        displayName: 'Tontura postural e sudorese profusa',
        frequency: 'Comum (1-10%)',
        mechanism: 'Vasoreatividade periférica aumentada por excesso de noradrenalina.',
        physicianAdvice: 'Acompanhar tolerância; não interromper de modo abrupto para evitar sintomas de retirada.'
      }
    ]
  },
  {
    id: 'pregabalina',
    drugKey: 'pregabalina',
    drugName: 'Pregabalina (Lyrica)',
    drugClass: 'Gabapentinoide (Ligante de subunidade alfa-2-delta de canais de cálcio)',
    reactions: [
      {
        symptomKeywords: ['sonolencia', 'letargia', 'sono_excessivo', 'lentidao'],
        displayName: 'Sonolência e sedação dose-dependente',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Redução generalizada da liberação de neurotransmissores excitatórios no SNC.',
        physicianAdvice: 'Concentrar a maior fração da dose (ou toda a dose inicial de 75mg) ao deitar. Titular a cada 5-7 dias para facilitar acomodação.'
      },
      {
        symptomKeywords: ['tontura', 'desequilibrio', 'instabilidade', 'vertigem'],
        displayName: 'Tontura e instabilidade postural',
        frequency: 'Muito comum (≥10%)',
        mechanism: 'Efeito cerebelar e vestibular transitório dos gabapentinoides.',
        physicianAdvice: 'Alerta de prevenção de quedas (especialmente em idosos). Orientar não levantar rapidamente de camas ou cadeiras.'
      },
      {
        symptomKeywords: ['edema', 'inchaço', 'pernas_inchadas', 'ganho_peso'],
        displayName: 'Edema periférico e aumento ponderal',
        frequency: 'Comum (1-10%)',
        mechanism: 'Vasodilatação arteriolar periférica e estímulo de apetite.',
        physicianAdvice: 'Inspecionar maléolos e membros inferiores. Diferenciar de insuficiência cardíaca ou renal.'
      },
      {
        symptomKeywords: ['nevoa_cerebral', 'memoria_ruim', 'esquecimento', 'dificuldade_concentracao'],
        displayName: 'Disfunção cognitiva / Lentificação do pensamento',
        frequency: 'Comum (1-10%)',
        mechanism: 'Inibição tônica de circuitos corticais associativos.',
        physicianAdvice: 'Avaliar se o sintoma é queixa primária da fibromialgia (fibrofog) ou piorou temporalmente após a introdução da pregabalina.'
      }
    ]
  }
];

// Normalize text for fuzzy symptom matching
function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Correlates reported symptoms against the patient's continuous or active medications.
 * Returns discreet, physician-only adverse reaction warnings.
 */
export function detectAdverseReactionsInSymptoms(
  reportedSymptoms: string[],
  activeMedications: string[]
): AdverseReactionMatch[] {
  if (!reportedSymptoms || !reportedSymptoms.length || !activeMedications || !activeMedications.length) {
    return [];
  }

  const normalizedMeds = activeMedications.map(m => normalizeText(m));
  const matches: AdverseReactionMatch[] = [];
  const visitedCombos = new Set<string>();

  for (const symptom of reportedSymptoms) {
    const normSymptom = normalizeText(symptom);
    if (!normSymptom) continue;

    for (const drug of KNOWN_DRUG_ADVERSE_REACTIONS) {
      // Check if this patient uses this drug (by key or sub-match)
      const isDrugActive = normalizedMeds.some(m => 
        m.includes(drug.drugKey) || drug.drugKey.includes(m) || m.includes(normalizeText(drug.drugName))
      );

      if (!isDrugActive) continue;

      // Check each known reaction of this drug
      for (const rx of drug.reactions) {
        const matchesKeyword = rx.symptomKeywords.some(keyword => {
          const normKey = normalizeText(keyword);
          return normSymptom.includes(normKey) || normKey.includes(normSymptom);
        });

        if (matchesKeyword) {
          const keyCombo = `${drug.drugKey}_${normSymptom}_${rx.displayName}`;
          if (!visitedCombos.has(keyCombo)) {
            visitedCombos.add(keyCombo);
            matches.push({
              reportedSymptom: symptom,
              drugKey: drug.drugKey,
              drugName: drug.drugName,
              drugClass: drug.drugClass,
              reactionDisplayName: rx.displayName,
              frequency: rx.frequency,
              physicianAdvice: rx.physicianAdvice,
              mechanism: rx.mechanism
            });
          }
        }
      }
    }
  }

  return matches;
}
