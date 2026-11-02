import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Search,
  BookOpen,
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Atom,
  RefreshCw,
  Info,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { Tooltip, InfoTooltip } from './Tooltip';

interface ScienceWorkbenchProps {
  initialQuery?: string;
  onSelectMedication?: (medName: string) => void;
  className?: string;
}

export const ScienceWorkbench: React.FC<ScienceWorkbenchProps> = ({
  initialQuery = 'Metotrexato',
  onSelectMedication,
  className = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeSubTab, setActiveSubTab] = useState<'pharmacology' | 'pubmed' | 'trials'>('pharmacology');

  // Loading & Data States
  const [loadingFda, setLoadingFda] = useState(false);
  const [loadingPubchem, setLoadingPubchem] = useState(false);
  const [loadingPubmed, setLoadingPubmed] = useState(false);
  const [loadingTrials, setLoadingTrials] = useState(false);

  const [fdaData, setFdaData] = useState<any>(null);
  const [pubchemData, setPubchemData] = useState<any>(null);
  const [pubmedData, setPubmedData] = useState<any>(null);
  const [trialsData, setTrialsData] = useState<any>(null);

  // Quick-Try Examples
  const quickExamples = [
    { label: 'Metotrexato (MTX)', term: 'Metotrexato', type: 'med' },
    { label: 'Hidroxicloroquina', term: 'Hidroxicloroquina', type: 'med' },
    { label: 'Adalimumabe (Anti-TNF)', term: 'Adalimumabe', type: 'med' },
    { label: 'Pregabalina', term: 'Pregabalina', type: 'med' },
    { label: 'Celecoxibe', term: 'Celecoxibe', type: 'med' },
    { label: 'Tofacitinibe (iJAK)', term: 'Tofacitinibe', type: 'med' },
    { label: 'Artrite Reumatoide', term: 'Rheumatoid Arthritis', type: 'disease' },
    { label: 'Fibromialgia', term: 'Fibromyalgia', type: 'disease' },
    { label: 'Lúpus Eritematoso', term: 'Systemic Lupus Erythematosus', type: 'disease' },
    { label: 'Espondilite Anquilosante', term: 'Ankylosing Spondylitis', type: 'disease' }
  ];

  // Perform search across free endpoints
  const executeSearch = async (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;

    // 1. Fetch FDA & PubChem for pharmacology
    setLoadingFda(true);
    setLoadingPubchem(true);
    setLoadingPubmed(true);
    setLoadingTrials(true);

    try {
      fetch(`/api/science/openfda?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((d) => setFdaData(d))
        .catch((e) => console.error('FDA search error:', e))
        .finally(() => setLoadingFda(false));

      fetch(`/api/science/pubchem?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((d) => setPubchemData(d))
        .catch((e) => console.error('PubChem search error:', e))
        .finally(() => setLoadingPubchem(false));

      fetch(`/api/science/pubmed?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((d) => setPubmedData(d))
        .catch((e) => console.error('PubMed search error:', e))
        .finally(() => setLoadingPubmed(false));

      fetch(`/api/science/clinicaltrials?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((d) => setTrialsData(d))
        .catch((e) => console.error('Trials search error:', e))
        .finally(() => setLoadingTrials(false));
    } catch (err) {
      console.error('Science execution error:', err);
    }
  };

  // Initial load
  useEffect(() => {
    executeSearch(initialQuery);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSelectExample = (exampleTerm: string) => {
    setQuery(exampleTerm);
    executeSearch(exampleTerm);
  };

  const compound = pubchemData?.compound;
  const label = fdaData?.label;
  const topReactions = fdaData?.topReactions || [];
  const articles = pubmedData?.articles || [];
  const studies = trialsData?.studies || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                <FlaskConical className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-poppins font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <span>Portal de Biociências & Farmacologia Clínica</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Consultas diretas e em tempo real em bases científicas e farmacológicas abertas (PubMed, openFDA, PubChem e ClinicalTrials.gov).
                </p>
              </div>
            </div>
          </div>

          {/* Zero Cost Assurance Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-semibold shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>100% Gratuito • Zero Custos</span>
          </div>
        </div>

        {/* Clear Zero-Cost Transparency Pill */}
        <div className="mt-3.5 pt-3 border-t border-blue-100/60 dark:border-slate-800 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="font-bold text-blue-600 dark:text-blue-400">Origem dos Dados:</span>
          <span className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-[10px]">
            NCBI / NLM (U.S. National Library of Medicine)
          </span>
          <span className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-[10px]">
            U.S. FDA openFDA API
          </span>
          <span className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-[10px]">
            PubChem NIH
          </span>
          <span className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-[10px]">
            ClinicalTrials.gov v2
          </span>
        </div>
      </div>

      {/* ── TOP QUICK-TRY EXAMPLE PILL BAR (Science Skill Mandate) ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Atom className="w-3.5 h-3.5 text-blue-500" />
            Exemplos Rápidos de Reumatologia & Dor:
          </span>
          <span className="text-[11px] text-slate-400">Toque em qualquer item para pesquisar</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickExamples.map((ex) => (
            <button
              key={ex.term}
              type="button"
              onClick={() => handleSelectExample(ex.term)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                query.toLowerCase() === ex.term.toLowerCase()
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEARCH INPUT ── */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquise medicamento, princípio ativo ou condição (ex: Metotrexato, Hidroxicloroquina, Artrite)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 font-medium shadow-xs"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>Buscar</span>
        </button>
      </form>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('pharmacology')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'pharmacology'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Farmacologia & Bula Oficial (FDA + PubChem)</span>
          {(loadingFda || loadingPubchem) && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pubmed')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'pubmed'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Literatura & Evidências (NCBI PubMed)</span>
          {loadingPubmed && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('trials')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'trials'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Ensaios Clínicos Abertos (ClinicalTrials.gov)</span>
          {loadingTrials && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
        </button>
      </div>

      {/* ── TAB CONTENT 1: PHARMACOLOGY & FDA/PUBCHEM ── */}
      {activeSubTab === 'pharmacology' && (
        <div className="space-y-6">
          {loadingFda && loadingPubchem ? (
            <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Consultando bases de dados do NIH PubChem e U.S. FDA em tempo real...
              </p>
              <p className="text-xs text-slate-400">Conexão pública sem custos</p>
            </div>
          ) : (
            <>
              {/* Molecule Card (PubChem) */}
              {compound ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          CID: {compound.cid}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-mono">
                          {compound.molecularFormula}
                        </span>
                      </div>
                      <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100 mt-1">
                        Estrutura Molecular & Propriedades Físico-Químicas
                      </h3>
                    </div>

                    <a
                      href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold cursor-pointer"
                    >
                      <span>Ver no PubChem oficial</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 2D Structure Image */}
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      <img
                        src={compound.structureImageUrl}
                        alt={`Estrutura 2D de ${query}`}
                        className="w-48 h-48 object-contain rounded-lg bg-white"
                        loading="lazy"
                      />
                      <span className="text-[10px] text-slate-400 mt-2 font-mono">
                        Renderização 2D oficial PubChem
                      </span>
                    </div>

                    {/* Chemical Properties & Lipinski */}
                    <div className="md:col-span-2 space-y-4">
                      {/* Grid Properties */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-medium">Peso Molecular (MW)</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {compound.molecularWeight.toFixed(2)} Da
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-medium">Lipofilicidade (XLogP)</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {compound.xLogP.toFixed(2)}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-medium">Área Polar (TPSA)</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {compound.tpsa} Å²
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-medium">Doadores Lig. H (HBD)</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {compound.hBondDonorCount}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-medium">Aceptores Lig. H (HBA)</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {compound.hBondAcceptorCount}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-medium">Ligações Rotacionáveis</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {compound.rotatableBonds}
                          </span>
                        </div>
                      </div>

                      {/* Lipinski Rule of 5 Card */}
                      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-850/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                            Biodisponibilidade Oral (Regra dos 5 de Lipinski):
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              compound.lipinski.passes
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {compound.lipinski.passes ? '✓ Conforme (Drug-Like)' : 'Violou Regras de Permeabilidade'}
                          </span>
                        </div>

                        {compound.lipinski.violations.length > 0 ? (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 space-y-0.5">
                            <span className="font-semibold block">Critérios com alerta:</span>
                            {compound.lipinski.violations.map((v: string) => (
                              <div key={v} className="flex items-center gap-1 font-mono text-[10px]">
                                <span>•</span>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Atende a todos os critérios clássicos de peso molecular (&le;500 Da), lipofilicidade (&le;5), doadores (&le;5) e aceptores (&le;10).
                          </p>
                        )}
                      </div>

                      {/* SMILES */}
                      {compound.canonicalSmiles && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            SMILES Canônico:
                          </span>
                          <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded-lg text-[10.5px] font-mono text-slate-700 dark:text-slate-300 break-all select-all border border-slate-200 dark:border-slate-800">
                            {compound.canonicalSmiles}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl text-xs text-slate-500 border border-slate-200 dark:border-slate-800">
                  Nenhuma fórmula química correspondente encontrada diretamente no PubChem para "{query}". Tente o nome em inglês (ex: Methotrexate, Hydroxychloroquine) ou pesquise pela bula abaixo.
                </div>
              )}

              {/* openFDA Package Label & Adverse Events */}
              {label ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                        openFDA Drug Labeling (SPL)
                      </span>
                      <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100">
                        {label.brandName} ({label.genericName})
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        Fabricante / Titular de Registro: {label.manufacturer}
                      </span>
                    </div>

                    <a
                      href="https://open.fda.gov"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold"
                    >
                      <span>openFDA Oficial</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Boxed Warnings if any */}
                  {label.boxedWarnings && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Advertência em Caixa Preta (Boxed Warning)</span>
                      </div>
                      <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-serif">
                        {label.boxedWarnings}...
                      </p>
                    </div>
                  )}

                  {/* Indications */}
                  {label.indications && (
                    <div className="space-y-1">
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                        Indicações Clínicas e Uso Aprovado:
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {label.indications}...
                      </p>
                    </div>
                  )}

                  {/* Top Adverse Events from FAERS */}
                  {topReactions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                          Reações Adversas Mais Frequentes (FAERS / Farmacovigilância FDA):
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Notificações Públicas</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {topReactions.map((r: any) => (
                          <div
                            key={r.term}
                            className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200/60 dark:border-slate-800 text-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate" title={r.term}>
                              {r.term}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {r.count.toLocaleString()} relatos
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* ── TAB CONTENT 2: PUBMED LITERATURE ── */}
      {activeSubTab === 'pubmed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100">
                Evidências Científicas & Ensaios no MEDLINE/PubMed
              </h3>
              <p className="text-xs text-slate-400">
                Artigos indexados pelo National Center for Biotechnology Information (NCBI)
              </p>
            </div>
            {pubmedData?.total > 0 && (
              <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-lg font-mono">
                {pubmedData.total.toLocaleString()} artigos encontrados
              </span>
            )}
          </div>

          {loadingPubmed ? (
            <div className="p-12 text-center space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Buscando artigos no PubMed E-Utilities...
              </p>
            </div>
          ) : articles.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              {articles.map((art: any) => (
                <div key={art.pmid} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                      PMID: {art.pmid}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {art.pubDate} • {art.source}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-snug">
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1"
                    >
                      <span>{art.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    </a>
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {art.authors}
                  </p>

                  {art.doi && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      DOI: {art.doi}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Nenhum artigo encontrado no PubMed para "{query}". Tente utilizar os termos em inglês correspondentes (ex: Rheumatoid arthritis, Methotrexate, Fibromyalgia).
            </div>
          )}
        </div>
      )}

      {/* ── TAB CONTENT 3: CLINICAL TRIALS ── */}
      {activeSubTab === 'trials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-poppins font-bold text-base text-slate-800 dark:text-slate-100">
                Protocolos & Ensaios Clínicos em Recrutamento (ClinicalTrials.gov)
              </h3>
              <p className="text-xs text-slate-400">
                Pesquisa ativa de estudos clínicos humanos em andamento
              </p>
            </div>
          </div>

          {loadingTrials ? (
            <div className="p-12 text-center space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Consultando ClinicalTrials.gov API v2...
              </p>
            </div>
          ) : studies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studies.map((std: any) => (
                <div
                  key={std.nctId}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                        {std.nctId}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                        {std.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-2">
                      {std.briefTitle}
                    </h4>

                    {std.phases?.length > 0 && (
                      <div className="text-[10.5px] text-slate-500">
                        <span className="font-semibold">Fases: </span>
                        <span className="font-mono">{std.phases.join(', ')}</span>
                      </div>
                    )}

                    {std.interventions?.length > 0 && (
                      <div className="text-[10.5px] text-slate-500">
                        <span className="font-semibold">Intervenção: </span>
                        <span>{std.interventions.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <a
                    href={std.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                  >
                    <span>Ver protocolo completo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Nenhum estudo clínico ativo encontrado para "{query}". Tente buscar por nomes em inglês como "Arthritis", "Fibromyalgia", "Pain", "Lupus".
            </div>
          )}
        </div>
      )}
    </div>
  );
};
