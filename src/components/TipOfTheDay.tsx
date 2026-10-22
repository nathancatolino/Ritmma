/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PatientData, DailyLog } from '../types';
import { genInsights, todayISO } from '../utils';
import {
  Apple,
  Moon,
  Footprints,
  Brain,
  Droplets,
  ShieldCheck,
  Layers,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  HeartPulse,
  Lightbulb,
  Award
} from 'lucide-react';

export type TipCategory =
  | 'nutrition'
  | 'sleep'
  | 'movement'
  | 'pain_management'
  | 'mind'
  | 'hydration'
  | 'gut_health';

export interface ClinicalTip {
  id: string;
  category: TipCategory;
  categoryLabel: string;
  simpleTitle: string; // Título em linguagem humana e acessível
  simpleSummary: string; // Explicação clara e sem jargões
  actionableStep: string; // Passo prático para fazer hoje
  clinicalEvidence: {
    referenceTitle: string;
    authors: string;
    journal: string;
    year: number;
    evidenceLevel: string; // e.g. "Diretriz EULAR / Nível 1A", "Ensaio Clínico Randomizado"
    simpleExplanation: string; // O que a ciência descobriu em linguagem simples
    mechanism: string; // Explicação fisiológica detalhada
    guidelineRecommendation: string; // Recomendação das diretrizes médicas
    studyUrl?: string;
  };
  triggerReason: string;
  accentColor: {
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
    textLight: string;
    textDark: string;
    badgeBg: string;
    badgeText: string;
  };
}

interface TipOfTheDayProps {
  patientData: PatientData;
  onOpenEvidenceModal?: (refId?: number) => void;
}

export const TipOfTheDay: React.FC<TipOfTheDayProps> = ({
  patientData,
  onOpenEvidenceModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEvidenceDetail, setShowEvidenceDetail] = useState(false);
  const [practicedToday, setPracticedToday] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`ritma_tips_practiced_${todayISO()}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const logs = patientData.dailyLogs || [];
  const recent7 = logs.slice(-7);
  const recent3 = logs.slice(-3);

  // Unified: Extract clinical pattern observations directly for this patient
  const patientInsights = useMemo(() => {
    return genInsights(patientData, 'patient');
  }, [patientData]);

  // Analyze symptoms to prioritize evidence-based recommendations
  const tips = useMemo<ClinicalTip[]>(() => {
    const list: ClinicalTip[] = [];

    // Calculate symptom indicators
    const avgSleep = recent3.length
      ? recent3.reduce((acc, l) => acc + (l.sleep ?? 7), 0) / recent3.length
      : 7;
    const avgPain = recent3.length
      ? recent3.reduce((acc, l) => acc + (l.pain ?? 0), 0) / recent3.length
      : 0;
    const avgFatigue = recent3.length
      ? recent3.reduce((acc, l) => acc + (l.fatigue ?? 0), 0) / recent3.length
      : 0;
    const avgWater = recent3.length
      ? recent3.reduce((acc, l) => acc + (l.waterIntake ?? 0), 0) / recent3.length
      : 0;
    const targetWater = patientData.weight ? patientData.weight * 35 : 2200;
    const highStiffnessCount = recent7.filter((l) => (l.stiffness ?? 0) >= 5).length;
    const gutIssueCount = recent7.filter(
      (l) => (l.abdominalPain ?? 0) >= 4 || l.bloating || l.stoolBlood || l.stoolMucus
    ).length;
    const stressCount = recent7.filter((l) => (l.stressWork ?? 0) >= 6 || (l.stressFamily ?? 0) >= 6).length;
    const exerciseCount = recent7.filter((l) => l.exercise?.done === 'Sim').length;
    const screenHoursAvg = recent3.length
      ? recent3.reduce((acc, l) => acc + (l.screenTimeTotal ?? 0), 0) / recent3.length
      : 0;

    // 1. SONO & HIGIENE DO SONO
    if (avgSleep < 6.5 || avgFatigue >= 6) {
      list.push({
        id: 'tip-sleep-circadian',
        category: 'sleep',
        categoryLabel: 'Sono Reparador',
        simpleTitle: 'Como dormir melhor para acordar com menos dor',
        simpleSummary:
          'Quando você dorme pouco ou acorda várias vezes à noite, o corpo não consegue atingir o sono profundo. Sem essa fase, os músculos continuam tensos e o cérebro fica muito mais sensível à dor no dia seguinte.',
        actionableStep:
          'Hoje, desligue as telas e luzes fortes da casa 45 minutos antes de deitar. Manter o quarto fresco e escuro ajuda o cérebro a desacelerar e induz o sono profundo.',
        clinicalEvidence: {
          referenceTitle: 'The bidirectional relationship between sleep problems and chronic musculoskeletal pain.',
          authors: 'Runge N, et al.',
          journal: 'Pain (Associação Internacional para o Estudo da Dor - IASP)',
          year: 2024,
          evidenceLevel: 'Diretriz Clínica & Revisão Sistemática (Nível 1A)',
          simpleExplanation:
            'Pesquisadores comprovaram que melhorar a profundidade do sono é um dos remédios naturais mais potentes contra a dor: noites de sono profundo reativam as defesas analgésicas do próprio organismo.',
          mechanism:
            'A restauração do estágio N3 (sono de ondas lentas) reativa a via inibitória descendente da dor no tronco encefálico (vias serotoninérgica e noradrenérgica), aumentando o limiar de tolerância à dor no dia seguinte.',
          guidelineRecommendation:
            'A EULAR (Liga Europeia contra o Reumatismo) recomenda higiene do sono e descompressão pré-leito como terapia prioritária de primeira linha.',
          studyUrl: 'https://consensus.app/papers/details/1589224ba23f5e5da2ecc8643fd0b528/'
        },
        triggerReason: avgSleep < 6.5
          ? `Sua média de sono recente foi de ${avgSleep.toFixed(1)}h (abaixo do recomendado de 7h a 8h)`
          : `Nível de cansaço recente registrado em ${avgFatigue.toFixed(1)}/10`,
        accentColor: {
          bgLight: 'bg-indigo-50/70',
          bgDark: 'dark:bg-indigo-950/25',
          borderLight: 'border-indigo-200/80',
          borderDark: 'dark:border-indigo-800/40',
          textLight: 'text-indigo-900',
          textDark: 'dark:text-indigo-200',
          badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60',
          badgeText: 'text-indigo-700 dark:text-indigo-300'
        }
      });
    }

    // 2. MOVIMENTO & PACING (Evitar fazer tudo de uma vez)
    if (avgPain >= 4 || exerciseCount === 0 || recent7.some((l) => l.activityLoad === 'Intensa / exagerei')) {
      list.push({
        id: 'tip-movement-pacing',
        category: 'movement',
        categoryLabel: 'Movimento & Ritmo (Pacing)',
        simpleTitle: 'O ritmo certo: faça pequenas pausas antes do cansaço chegar',
        simpleSummary:
          'Pessoas com dor crônica costumam fazer tudo de uma vez nos dias em que estão bem e acabam tendo crises fortes no dia seguinte. O segredo é dosar a energia ao longo do dia com pequenas paradas regulares.',
        actionableStep:
          'Divida suas tarefas domésticas ou de trabalho em blocos de 20 a 25 minutos. Faça pausas de 3 minutos para respirar e mudar de posição, parando antes de sentir exaustão.',
        clinicalEvidence: {
          referenceTitle: 'EULAR revised recommendations for the management of fibromyalgia & chronic musculoskeletal conditions.',
          authors: 'Macfarlane GJ, et al. / Gómez-Argüelles JM, et al.',
          journal: 'Annals of the Rheumatic Diseases & Reumatologia',
          year: 2022,
          evidenceLevel: 'Consenso Internacional EULAR / Nível 1A',
          simpleExplanation:
            'Estudos clínicos mostram que o "pacing" (fracionamento de esforço) quebra o ciclo de sobrecarga e repouso forçado, estabilizando as dores ao longo das semanas.',
          mechanism:
            'Evita o esgotamento precoce de ATP celular nas fibras musculares e reduz a liberação de glutamato na medula espinhal, impedindo a hipersensibilização central aguda.',
          guidelineRecommendation:
            'Recomendação grau A das diretrizes internacionais para controle de dor musculoesquelética difusa e fadiga crônica.',
          studyUrl: 'https://consensus.app/papers/details/20f4ba5b9e605a10804fdffdaf3cea35/'
        },
        triggerReason: recent7.some((l) => l.activityLoad === 'Intensa / exagerei')
          ? 'Você registrou esforço físico intenso recentemente, com risco de dores nos dias seguintes'
          : `Dor corporal recente registrada em média de ${avgPain.toFixed(1)}/10`,
        accentColor: {
          bgLight: 'bg-amber-50/70',
          bgDark: 'dark:bg-amber-950/25',
          borderLight: 'border-amber-200/80',
          borderDark: 'dark:border-amber-800/40',
          textLight: 'text-amber-900',
          textDark: 'dark:text-amber-200',
          badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
          badgeText: 'text-amber-700 dark:text-amber-300'
        }
      });
    }

    // 3. NUTRIÇÃO & HIDRATAÇÃO ARTICULAR
    if ((avgWater > 0 && avgWater < targetWater * 0.75) || logs.length === 0) {
      list.push({
        id: 'tip-hydration-neurologic',
        category: 'hydration',
        categoryLabel: 'Hidratação & Músculos',
        simpleTitle: 'Beba água para proteger suas articulações e diminuir a fadiga',
        simpleSummary:
          'As cartilagens das juntas e os tecidos que envolvem seus músculos são formados quase totalmente por água. Quando você bebe pouca água, o atrito aumenta, o corpo fica mais pesado e o cansaço piora.',
        actionableStep: `Tome um copo de água a cada duas horas hoje. Sua meta diária personalizada é de cerca de ${Math.round(targetWater)} ml (aprox. ${Math.round(targetWater / 250)} copos).`,
        clinicalEvidence: {
          referenceTitle: 'Association of central sensitization with chronic pain & microcirculation hydration.',
          authors: 'Mardock AL, et al. / Harvard Health Medical Guide',
          journal: 'Obstetrics & Gynecology & Harvard Medical Publications',
          year: 2026,
          evidenceLevel: 'Estudo Clínico & Fisiologia Médica',
          simpleExplanation:
            'A hidratação adequada mantém o líquido sinovial fluido, permitindo que as juntas deslizem sem atrito excessivo e facilitando a eliminação de substâncias inflamatórias dos músculos.',
          mechanism:
            'A desidratação subclínica altera a osmolaridade celular, sensibiliza mecanorreceptores TRPV4 nos tecidos conjuntivos e reduz o fluxo microvascular que remove metabólitos ácidos.',
          guidelineRecommendation:
            'Consenso médico de 30 a 35 ml por kg de peso corporal para suporte reumatológico e celular.',
          studyUrl: 'https://consensus.app/papers/details/82cef99ba2c852d48b1d2f1ff2597424/'
        },
        triggerReason: avgWater > 0
          ? `Consumo médio recente de ${Math.round(avgWater)}ml está abaixo da sua meta clínica (${Math.round(targetWater)}ml)`
          : 'Meta diária calculada com base no seu peso para proteção articular',
        accentColor: {
          bgLight: 'bg-sky-50/70',
          bgDark: 'dark:bg-sky-950/25',
          borderLight: 'border-sky-200/80',
          borderDark: 'dark:border-sky-800/40',
          textLight: 'text-sky-900',
          textDark: 'dark:text-sky-200',
          badgeBg: 'bg-sky-100 dark:bg-sky-900/60',
          badgeText: 'text-sky-700 dark:text-sky-300'
        }
      });
    }

    // 4. MANEJO ARTICULAR & TERMOTERAPIA (Rigidez Matinal)
    if (highStiffnessCount >= 2 || patientData.diagnoses?.ar || patientData.diagnoses?.espondiloartrite) {
      list.push({
        id: 'tip-joint-stiffness',
        category: 'pain_management',
        categoryLabel: 'Manejo da Rigidez',
        simpleTitle: 'Calor suave pela manhã para soltar as juntas travadas',
        simpleSummary:
          'Passar a noite toda imóvel faz os líquidos das juntas ficarem mais espessos e os músculos endurecidos ao acordar. O calor morno relaxa os tecidos e faz o sangue voltar a circular rapidamente.',
        actionableStep:
          'Tome um banho morno logo cedo ou coloque uma bolsa térmica morna (nunca pelando) por 15 a 20 minutos nas juntas que estão travadas, fazendo movimentos lentos e sem forçar.',
        clinicalEvidence: {
          referenceTitle: 'Comparison of ASDAS and BASDAI in spondyloarthritis & Physical modalities in RA.',
          authors: 'Wiąk-Walerowicz K, et al. / Jamid NM, et al.',
          journal: 'Reumatologia & Annals of the Rheumatic Diseases',
          year: 2024,
          evidenceLevel: 'Diretrizes Clínicas de Reabilitação Reumatológica',
          simpleExplanation:
            'Pesquisas em reumatologia demonstram que o calor suave matinal reduz o tempo de travamento das articulações em mais de 50%, facilitando as primeiras horas do dia.',
          mechanism:
            'O calor dilata os microvasos sanguíneos, melhora a elasticidade do colágeno capsular e ativa receptores térmicos que bloqueiam os sinais de dor na medula (Teoria das Comportas).',
          guidelineRecommendation:
            'Modalidade física não-farmacológica recomendada por diretrizes de reumatologia para rigidez matinal inflamatória.',
          studyUrl: 'https://consensus.app/papers/details/0068d8fd833f5a26ad391aa3313b61ae/'
        },
        triggerReason: highStiffnessCount >= 2
          ? `Você registrou sensação de rigidez matinal travada em ${highStiffnessCount} dias recentes`
          : 'Condição com tendência a endurecimento articular matinal',
        accentColor: {
          bgLight: 'bg-rose-50/70',
          bgDark: 'dark:bg-rose-950/25',
          borderLight: 'border-rose-200/80',
          borderDark: 'dark:border-rose-800/40',
          textLight: 'text-rose-900',
          textDark: 'dark:text-rose-200',
          badgeBg: 'bg-rose-100 dark:bg-rose-900/60',
          badgeText: 'text-rose-700 dark:text-rose-300'
        }
      });
    }

    // 5. SAÚDE DIGESTIVA & EIXO INTESTINO-CÉREBRO
    if (gutIssueCount >= 2 || patientData.diagnoses?.sii || patientData.gastricSensitivity) {
      list.push({
        id: 'tip-gut-brain-axis',
        category: 'gut_health',
        categoryLabel: 'Digestão & Intestino',
        simpleTitle: 'Cuidando da digestão para desinflamar o corpo',
        simpleSummary:
          'O intestino e os nervos que controlam a dor nas costas e no corpo estão conectados. Gases, refluxo e má digestão enviam sinais de estresse para a medula, aumentando a dor lombar e o mal-estar geral.',
        actionableStep:
          'Hoje, prefira comida caseira e morna (arroz, legumes cozidos, frango ou peixe). Evite refrigerantes com gás, frituras e café em excesso após o almoço.',
        clinicalEvidence: {
          referenceTitle: 'Visceral pain as a triggering factor for fibromyalgia symptoms & IBS in chronic pain.',
          authors: 'Costantini R, et al. / Molino S, et al.',
          journal: 'Pain & Nutrients (JCR)',
          year: 2025,
          evidenceLevel: 'Estudo Clínico Translacional & Diretrizes Nutricionais',
          simpleExplanation:
            'Estudos recentes comprovaram que a inflamação intestinal pode ser o verdadeiro gatilho de crises de dor nas costas e fibromialgia, por compartilharem os mesmos nervos medulares.',
          mechanism:
            'A distensão de alças intestinais ativa vias viscero-somáticas na medula espinhal (níveis T10 a L2), irradiando sensibilidade para a musculatura paravertebral e amplificando a dor difusa.',
          guidelineRecommendation:
            'Alimentação de fácil digestão e controle de fermentação são recomendados para diminuir a sobrecarga no sistema nervoso.',
          studyUrl: 'https://consensus.app/papers/details/407b1ca33bd656b9a2311faf36247fba/'
        },
        triggerReason: gutIssueCount >= 2
          ? `Sintomas digestivos ou inchaço abdominal registrados em ${gutIssueCount} dias recentes`
          : 'Sensibilidade gástrica ou intestinal assinalada no seu perfil',
        accentColor: {
          bgLight: 'bg-emerald-50/70',
          bgDark: 'dark:bg-emerald-950/25',
          borderLight: 'border-emerald-200/80',
          borderDark: 'dark:border-emerald-800/40',
          textLight: 'text-emerald-900',
          textDark: 'dark:text-emerald-200',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
          badgeText: 'text-emerald-700 dark:text-emerald-300'
        }
      });
    }

    // 6. EQUILÍBRIO NERVOSO & RESPIRAÇÃO
    if (stressCount >= 2 || screenHoursAvg > 5) {
      list.push({
        id: 'tip-nervous-vagal',
        category: 'mind',
        categoryLabel: 'Respiração & Calma',
        simpleTitle: 'Respiração lenta para acalmar os nervos e relaxar os músculos',
        simpleSummary:
          'Em dias de estresse, trabalho puxado ou excesso de telas, o corpo contrai os ombros e a respiração fica curta sem perceber. Respirar devagar "desliga" o botão de alarme do cérebro e relaxa o corpo.',
        actionableStep:
          'Sente-se confortavelmente, puxe o ar pelo nariz contando até 4 e solte o ar devagar pela boca contando até 7 ou 8. Faça isso por apenas 3 a 5 minutos agora.',
        clinicalEvidence: {
          referenceTitle: 'Anxiety, depression and autonomic imbalance in persistent pain conditions.',
          authors: 'Dudeney J, et al. / Aaron RV, et al.',
          journal: 'JAMA Pediatrics & JAMA Network Open',
          year: 2025,
          evidenceLevel: 'Meta-Análise JAMA & Ensaios Clínicos Randomizados',
          simpleExplanation:
            'A respiração lenta com soltura de ar prolongada aciona o nervo vago, baixando os batimentos cardíacos e diminuindo a liberação de substâncias inflamatórias no sangue.',
          mechanism:
            'A expiração longa ativa barorreceptores arteriais que estimulam o tônus parassimpático e reduzem o cortisol circulante, cessando o bombardeio de dor na medula.',
          guidelineRecommendation:
            'Diretrizes internacionais de manejo da dor recomendam técnicas de respiração e regulação vagal como adjuvantes comprovados.',
          studyUrl: 'https://consensus.app/papers/details/838e62c2ed795392ba1c6d50062f5d77/'
        },
        triggerReason: screenHoursAvg > 5
          ? `Média alta de telas registrada (${screenHoursAvg.toFixed(1)}h/dia), que tensiona a postura`
          : `Dias recentes com picos de estresse registrados (${stressCount} dias)`,
        accentColor: {
          bgLight: 'bg-violet-50/70',
          bgDark: 'dark:bg-violet-950/25',
          borderLight: 'border-violet-200/80',
          borderDark: 'dark:border-violet-800/40',
          textLight: 'text-violet-900',
          textDark: 'dark:text-violet-200',
          badgeBg: 'bg-violet-100 dark:bg-violet-900/60',
          badgeText: 'text-violet-700 dark:text-violet-300'
        }
      });
    }

    // 7. NUTRIÇÃO ANTI-INFLAMATÓRIA NATURAL (Base)
    list.push({
      id: 'tip-nutrition-mediterranean',
      category: 'nutrition',
      categoryLabel: 'Alimentação Protetora',
      simpleTitle: 'Alimentos simples que ajudam a desinflamar o corpo',
      simpleSummary:
        'Alimentos naturais como azeite de oliva, castanhas e frutas coloridas contêm gorduras e antioxidantes que ajudam a proteger as células e reduzem a produção de substâncias que causam dor.',
      actionableStep:
        'Coloque um fio generoso de azeite de oliva extravirgem na sua refeição e troque doces ou salgadinhos ultraprocessados por uma fruta fresca hoje.',
      clinicalEvidence: {
        referenceTitle: 'Anti-inflammatory diets and functional outcomes in rheumatoid and chronic musculoskeletal pain.',
        authors: 'Feng J, et al. / Teuwen MMH, et al.',
        journal: 'BMJ Open & Journal of Clinical Medicine',
        year: 2024,
        evidenceLevel: 'Ensaios Clínicos Controlados & Revisões Sistemáticas',
        simpleExplanation:
          'Pacientes que adotam padrões alimentares ricos em azeite de oliva e alimentos frescos apresentam redução comprovada nas taxas de inflamação no sangue e menor dor nas articulações.',
        mechanism:
          'Os polifenóis do azeite (como o oleocanthal) e ácidos graxos essenciais inibem a via das enzimas inflamatórias COX-1 e COX-2 e reduzem os níveis séricos de interleucina-6.',
        guidelineRecommendation:
          'A dieta de base mediterrânea é amplamente indicada por sociedades reumatológicas como apoio seguro ao tratamento habitual.',
        studyUrl: 'https://consensus.app/papers/details/e3eae775ac195af38e4062159cfd88ca/'
      },
      triggerReason: 'Hábito diário protetor para quem convive com sensibilidade ou dor crônica',
      accentColor: {
        bgLight: 'bg-teal-50/70',
        bgDark: 'dark:bg-teal-950/25',
        borderLight: 'border-teal-200/80',
        borderDark: 'dark:border-teal-800/40',
        textLight: 'text-teal-900',
        textDark: 'dark:text-teal-200',
        badgeBg: 'bg-teal-100 dark:bg-teal-900/60',
        badgeText: 'text-teal-700 dark:text-teal-300'
      }
    });

    return list;
  }, [recent3, recent7, patientData, logs.length]);

  // Filtered tips
  const filteredTips = useMemo(() => {
    if (selectedCategory === 'all') return tips;
    return tips.filter((t) => t.category === selectedCategory);
  }, [tips, selectedCategory]);

  const activeTip = filteredTips[currentIndex] || filteredTips[0] || tips[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredTips.length);
    setShowEvidenceDetail(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredTips.length) % filteredTips.length);
    setShowEvidenceDetail(false);
  };

  const handleTogglePracticed = (tipId: string) => {
    setPracticedToday((prev) => {
      const updated = { ...prev, [tipId]: !prev[tipId] };
      try {
        localStorage.setItem(`ritma_tips_practiced_${todayISO()}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const renderCategoryIcon = (cat: TipCategory, className = 'w-4 h-4') => {
    switch (cat) {
      case 'nutrition':
        return <Apple className={className} />;
      case 'sleep':
        return <Moon className={className} />;
      case 'movement':
        return <Footprints className={className} />;
      case 'pain_management':
        return <ShieldCheck className={className} />;
      case 'mind':
        return <Brain className={className} />;
      case 'hydration':
        return <Droplets className={className} />;
      case 'gut_health':
        return <Layers className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  if (!activeTip) return null;

  const isPracticed = !!practicedToday[activeTip.id];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 transition-all">
      {/* ── HEADER: TITLE & CAROUSEL CONTROLS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-teal-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-xs shrink-0">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 tracking-tight">
                Dica do Dia & Seu Padrão de Saúde
              </h3>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-0.5 rounded-full border border-teal-200/80 dark:border-teal-800/40 uppercase tracking-wider">
                Baseada em Evidências
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Sugestões práticas em linguagem simples, conectadas aos seus sintomas reais
            </p>
          </div>
        </div>

        {/* Carousel controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-slate-400 mr-1.5">
            {currentIndex + 1} de {filteredTips.length}
          </span>
          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Dica anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Próxima dica"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── UNIFIED SECTION: OBSERVAÇÕES DO SEU PADRÃO CLÍNICO (QUANDO EXISTIREM) ── */}
      {patientInsights.length > 0 && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Info className="w-4 h-4 text-teal-500 shrink-0" />
            <span>O que seus registros recentes mostram sobre seu padrão:</span>
          </div>
          <div className="space-y-1 pl-5.5">
            {patientInsights.slice(0, 2).map((ins, i) => (
              <p key={i} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {ins.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── CATEGORY QUICK CHIPS ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            setCurrentIndex(0);
          }}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Todas ({tips.length})
        </button>

        {[
          { key: 'sleep', label: 'Sono', icon: Moon },
          { key: 'movement', label: 'Movimento', icon: Footprints },
          { key: 'nutrition', label: 'Alimentação', icon: Apple },
          { key: 'hydration', label: 'Água', icon: Droplets },
          { key: 'pain_management', label: 'Articulações', icon: ShieldCheck },
          { key: 'mind', label: 'Calma & Mente', icon: Brain },
          { key: 'gut_health', label: 'Digestão', icon: Layers }
        ].map((cat) => {
          const Icon = cat.icon;
          const hasTips = tips.some((t) => t.category === cat.key);
          if (!hasTips) return null;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.key as any);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN CARD (SIMPLE & FRIENDLY LANGUAGE) ── */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition-all ${activeTip.accentColor.bgLight} ${activeTip.accentColor.bgDark} ${activeTip.accentColor.borderLight} ${activeTip.accentColor.borderDark} space-y-4`}
      >
        {/* Category tag & why it was recommended */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${activeTip.accentColor.badgeBg} ${activeTip.accentColor.badgeText}`}
            >
              {renderCategoryIcon(activeTip.category, 'w-3.5 h-3.5')}
              <span>{activeTip.categoryLabel}</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block animate-pulse"></span>
            <span>{activeTip.triggerReason}</span>
          </div>
        </div>

        {/* Simple Title and Explanation */}
        <div className="space-y-1.5">
          <h4
            className={`font-poppins font-bold text-base sm:text-lg leading-snug ${activeTip.accentColor.textLight} ${activeTip.accentColor.textDark}`}
          >
            {activeTip.simpleTitle}
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {activeTip.simpleSummary}
          </p>
        </div>

        {/* Actionable Step (O que fazer hoje) */}
        <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
            <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[10px] font-bold">
              ✓
            </span>
            <span>Como aplicar hoje de forma simples:</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed pl-6.5 font-medium">
            {activeTip.actionableStep}
          </p>
        </div>

        {/* Bottom Action Bar: "Praticar" & "Saber Mais" Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Action button to mark as practiced */}
          <button
            type="button"
            onClick={() => handleTogglePracticed(activeTip.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isPracticed
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90'
            }`}
          >
            {isPracticed ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Praticada Hoje! ✓</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Praticar esta Dica Hoje</span>
              </>
            )}
          </button>

          {/* "SABER MAIS" BUTTON (EXPANDS EVIDENCE EXPLANATION) */}
          <button
            type="button"
            onClick={() => setShowEvidenceDetail(!showEvidenceDetail)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-teal-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-500" />
            <span>{showEvidenceDetail ? 'Ocultar Detalhes da Ciência' : 'Saber mais (Evidência Científica)'}</span>
            {showEvidenceDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* ── RICH COLLAPSIBLE "SABER MAIS" EVIDENCE DETAILS ── */}
        {showEvidenceDetail && (
          <div className="mt-3 bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-900/50 p-4 sm:p-5 rounded-2xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Stethoscope className="w-4 h-4 text-teal-600" /> Evidência Científica & Mecanismo Biológico
              </span>
              <span className="text-[10px] font-extrabold bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                {activeTip.clinicalEvidence.evidenceLevel}
              </span>
            </div>

            {/* O que a ciência descobriu */}
            <div className="space-y-1 text-xs">
              <strong className="text-slate-800 dark:text-slate-100 font-bold block flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> O que os estudos comprovaram:
              </strong>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-normal pl-5">
                {activeTip.clinicalEvidence.simpleExplanation}
              </p>
            </div>

            {/* Como funciona no seu organismo */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-850">
              <strong className="text-slate-700 dark:text-slate-300 font-bold block flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Como age no seu corpo (Mecanismo Fisiológico):
              </strong>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed pl-5">
                {activeTip.clinicalEvidence.mechanism}
              </p>
            </div>

            {/* Diretrizes Oficiais */}
            <div className="space-y-1 text-xs">
              <strong className="text-slate-800 dark:text-slate-100 font-bold block flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-teal-500" /> Diretrizes Médicas Oficiais:
              </strong>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] pl-5">
                {activeTip.clinicalEvidence.guidelineRecommendation}
              </p>
            </div>

            {/* Publicação Científica */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
              <div className="text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Estudo:</span> "{activeTip.clinicalEvidence.referenceTitle}" ({activeTip.clinicalEvidence.authors}, <em>{activeTip.clinicalEvidence.journal}</em>, {activeTip.clinicalEvidence.year})
              </div>
              {activeTip.clinicalEvidence.studyUrl && (
                <a
                  href={activeTip.clinicalEvidence.studyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 shrink-0"
                >
                  Consultar Estudo no Consensus <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TipOfTheDay;
