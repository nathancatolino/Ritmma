/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Component: ClinicalPhotoManager (Fotografias Clínicas Opcionais com Compressão Local)
 * Documentação de manifestações visíveis (edema articular, eritema cutâneo, nódulos).
 * 
 * DIRETRIZES DE SEGURANÇA E SUSTENTABILIDADE CLÍNICA:
 * - Compressão estrita no navegador via Canvas (máx 400x400 px, < 30KB) para não exceder limites do Firestore.
 * - Consentimento explícito do paciente antes do registro.
 * - Capacidade de exclusão total a qualquer momento pelo paciente.
 * - Sem chamadas a serviços externos pagos ou custos de armazenamento.
 */

import React, { useState, useRef } from 'react';
import { ClinicalPhotoRecord, ChronosData, Account } from '../types';
import { todayISO, fmtDate } from '../utils';
import {
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Plus,
  CheckCircle2,
  Lock,
  Eye,
  X,
  FileCheck
} from 'lucide-react';
import { Tooltip, InfoTooltip } from './Tooltip';

interface ClinicalPhotoManagerProps {
  data: ChronosData;
  account: Account;
  onUpdateData: (updater: (prev: ChronosData) => void) => void;
  onClose?: () => void;
}

const COMMON_PHOTO_REGIONS = [
  'Joelho Direito',
  'Joelho Esquerdo',
  'Articulações MCF / Dedos da Mão',
  'Punho',
  'Eritema Malar / Face',
  'Tornozelo / Pé',
  'Cotovelo',
  'Pele / Lesão Cutânea Geral',
  'Outra Região'
];

export const ClinicalPhotoManager: React.FC<ClinicalPhotoManagerProps> = ({
  data,
  account,
  onUpdateData,
  onClose
}) => {
  const patientData = data.patientData[account.id] || {
    diagnoses: {},
    gender: account.gender || null,
    hormoneRelevant: false,
    baseline: null,
    periodicMetrics: [],
    flareAlerts: [],
    dailyLogs: [],
    clinicalPhotos: []
  };

  const photos: ClinicalPhotoRecord[] = patientData.clinicalPhotos || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhotoForView, setSelectedPhotoForView] = useState<ClinicalPhotoRecord | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [bodyRegion, setBodyRegion] = useState(COMMON_PHOTO_REGIONS[0]);
  const [notes, setNotes] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image on client canvas to < 30KB
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.65 quality (yields ~ 20-30 KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
          setImagePreview(compressedDataUrl);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        setIsCompressing(false);
        setErrorMsg('Não foi possível ler o arquivo de imagem.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = () => {
    if (!consentConfirmed) {
      setErrorMsg('É necessário confirmar o termo de consentimento para salvar imagens clínicas.');
      return;
    }
    if (!imagePreview) {
      setErrorMsg('Selecione ou capture uma foto da manifestação visual.');
      return;
    }

    const newPhoto: ClinicalPhotoRecord = {
      id: `photo_${Date.now()}`,
      date: todayISO(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      bodyRegion,
      title: title.trim() || `Registro de ${bodyRegion}`,
      thumbnailDataUrl: imagePreview,
      consentConfirmed: true,
      notes: notes.trim() || undefined
    };

    onUpdateData((prev) => {
      const pData = prev.patientData[account.id];
      if (!pData) return;
      if (!pData.clinicalPhotos) pData.clinicalPhotos = [];
      // Keep only up to 4 most recent photos to guarantee safety
      pData.clinicalPhotos = [newPhoto, ...pData.clinicalPhotos].slice(0, 4);
    });

    setIsModalOpen(false);
    setImagePreview(null);
    setTitle('');
    setNotes('');
    setConsentConfirmed(false);
  };

  const handleDeletePhoto = (id: string) => {
    if (!confirm('Deseja excluir permanentemente esta fotografia clínica?')) return;
    onUpdateData((prev) => {
      const pData = prev.patientData[account.id];
      if (!pData || !pData.clinicalPhotos) return;
      pData.clinicalPhotos = pData.clinicalPhotos.filter((p) => p.id !== id);
    });
    if (selectedPhotoForView?.id === id) {
      setSelectedPhotoForView(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-poppins font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-500" />
              Documentação Fotográfica Clínica
              <InfoTooltip
                title="Registro Fotográfico Seguro"
                content="Permite documentar visualmente sinais clínicos objetivos (inchaço em juntas, placas cutâneas, dactilite ou lesões) com compressão local no aparelho para avaliação na consulta médica."
              />
            </h2>
            <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] rounded-full uppercase tracking-wider">
              Segura & Comprimida
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Anexe imagens de manifestações visíveis (edema de articulações, lesões de pele ou eritemas) para mostrar ao seu reumatologista na consulta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Voltar
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setImagePreview(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Foto Clínica
          </button>
        </div>
      </div>

      {/* Security & Sustainability Notice */}
      <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
        <Lock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-indigo-900 dark:text-indigo-300 block font-bold">
            Privacidade e Segurança Garantida (Zero Custos de Servidor)
          </strong>
          <p className="text-slate-600 dark:text-slate-400">
            As fotografias são automaticamente otimizadas no seu próprio navegador para miniaturas médicas ultracompactas (&lt; 30 KB). Elas são protegidas sob seu controle e podem ser removidas com 1 toque a qualquer momento.
          </p>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="space-y-3">
        <h3 className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-200">
          Galeria de Registros Clínicos ({photos.length} de máx 4)
        </h3>

        {photos.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Nenhuma fotografia anexada no momento
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              Quando houver inchaço articular visível ou lesão cutânea, tire uma foto para registrar a evolução temporal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setSelectedPhotoForView(photo)}>
                  <img
                    src={photo.thumbnailDataUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                    {photo.bodyRegion}
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <strong className="text-xs text-slate-800 dark:text-slate-100 block leading-tight">
                        {photo.title}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {fmtDate(photo.date, 's')} às {photo.time}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                      title="Excluir foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {photo.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      "{photo.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL TO ADD PHOTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            
            <div className="p-5 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-indigo-200" />
                <h3 className="font-poppins font-black text-sm text-white">
                  Anexar Fotografia de Manifestação Clínica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-100 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Photo Input Area */}
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative aspect-video max-h-52 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/80 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                    >
                      Trocar Foto
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-950 cursor-pointer transition-all"
                  >
                    <Camera className="w-8 h-8 text-indigo-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {isCompressing ? 'Otimizando imagem...' : 'Tirar Foto ou Selecionar Imagem'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Compressão médica automática para segurança e rapidez
                    </span>
                  </button>
                )}
              </div>

              {/* Body Region Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Região Anatômica Afetada</label>
                <select
                  value={bodyRegion}
                  onChange={(e) => setBodyRegion(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {COMMON_PHOTO_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Title & Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Título / Descrição Curta</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Edema articular matinal evidente"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">Observações Clínicas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Calor local ao toque, dificuldade para fechar o punho..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-2.5 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 accent-indigo-600"
                />
                <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-normal">
                  <strong>Consentimento Clínico:</strong> Autorizo o armazenamento desta imagem para fins exclusivos de documentação sintomática e acompanhamento de saúde. Posso excluí-la quando desejar.
                </span>
              </label>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-500 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={!consentConfirmed || !imagePreview || isCompressing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer"
              >
                Salvar Imagem
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULL PREVIEW MODAL */}
      {selectedPhotoForView && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedPhotoForView(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <strong className="text-sm block">{selectedPhotoForView.title}</strong>
                <span className="text-xs text-slate-400">{selectedPhotoForView.bodyRegion} · {fmtDate(selectedPhotoForView.date, 's')}</span>
              </div>
              <button onClick={() => setSelectedPhotoForView(null)} className="p-1 text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img src={selectedPhotoForView.thumbnailDataUrl} alt={selectedPhotoForView.title} className="max-h-80 object-contain" />
            </div>
            {selectedPhotoForView.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{selectedPhotoForView.notes}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
