/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, CrmInfo } from '../types';
import { getCouncilLabel, UFS } from '../utils';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  Phone,
} from 'lucide-react';

interface DoctorVerificationModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
  onSaveVerification: (updatedCrm: CrmInfo, updatedAccountFields: Partial<Account>) => void;
}

export const DoctorVerificationModal: React.FC<DoctorVerificationModalProps> = ({
  account,
  isOpen,
  onClose,
  onSaveVerification
}) => {
  const currentCrm = account.crm;
  const isVerified = currentCrm?.status === 'verified';

  // Form fields
  const [name, setName] = useState(account.name);
  const [specialty, setSpecialty] = useState(account.specialty || 'Reumatologia');
  const [rqe, setRqe] = useState(currentCrm?.rqe || '');
  const [clinicName, setClinicName] = useState(currentCrm?.clinicName || 'Clínica Reumatológica');
  const [crmNumber, setCrmNumber] = useState(currentCrm?.number || '');
  const [crmUf, setCrmUf] = useState(currentCrm?.uf || 'SP');
  const [waNumber, setWaNumber] = useState(account.contact?.whatsapp || '');

  // Document upload state
  const docUploadDate = currentCrm?.submittedAt || new Date().toISOString();
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  if (!isOpen) return null;

  const council = getCouncilLabel(specialty);

  const handleSaveAsPending = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCrm: CrmInfo = currentCrm || {
      number: crmNumber.trim(),
      uf: crmUf.trim().toUpperCase(),
      name: name.trim(),
      status: 'pending',
      verified: false,
      submittedAt: docUploadDate
    };

    onSaveVerification(updatedCrm, {
      name: name.trim(),
      specialty: specialty.trim(),
      contact: { whatsapp: waNumber.trim(), label: 'Secretaria Clínica' }
    });

    setFeedbackMsg({
      text: 'Dados salvos. A aprovação é feita pela administração após conferência do conselho profissional.',
      type: 'info'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isVerified ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'}`}>
              {isVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-poppins font-black text-slate-800 dark:text-slate-100 text-base">
                Conferência Cadastral & Validação Profissional
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Verificação de CRM e envio de documento para liberação de pacientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className={`px-5 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveAsPending} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Status Indicator Banner */}
          <div className={`p-4 rounded-2xl border ${
            isVerified
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300'
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs">
              {isVerified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Cadastro Conferido & Aprovado</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Conferência Interna Pendente</span>
                </>
              )}
            </div>
            <p className="text-[11px] mt-1 leading-relaxed opacity-90">
              {isVerified
                ? `Seu registro profissional (${council} ${currentCrm?.number}/${currentCrm?.uf}) está verificado e ativo. Todos os recursos de vínculo clínico, prontuário e convites estão desbloqueados.`
                : 'Para segurança clínica dos pacientes e conformidade médica, o aceite de novos vínculos e emissão de convites permanecem bloqueados até a conferência do documento profissional.'}
            </p>
          </div>

          {/* Form Fields: Professional details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Nome Completo do Médico</label>
              <input
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Especialidade Principal</label>
              <input
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="font-semibold text-slate-500">Número de Inscrição no {council}</label>
              <input
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={crmNumber}
                onChange={(e) => setCrmNumber(e.target.value)}
                placeholder="Ex: 145892"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">UF</label>
              <select
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={crmUf}
                onChange={(e) => setCrmUf(e.target.value)}
              >
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">RQE (Registro de Qualificação)</label>
              <input
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={rqe}
                onChange={(e) => setRqe(e.target.value)}
                placeholder="Ex: RQE 39218"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Instituição / Clínica</label>
              <input
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Ex: Hospital ou Consultório"
              />
            </div>
          </div>

          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">A aprovação é feita exclusivamente pela administração após consulta ao conselho profissional. Nenhum documento é enviado ou armazenado aqui.</p>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Salvar Dados Cadastrais
            </button>
          </div>


        </form>

      </div>
    </div>
  );
};

export default DoctorVerificationModal;
