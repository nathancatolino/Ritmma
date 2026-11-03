import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Account, ChronosData, ClinicalPhotoRecord } from '../types';
import { fmtDate, todayISO } from '../utils';
import { isGoogleDriveConfigured, uploadPhotoToGoogleDrive } from '../services/googleDrive';
import { fetchAccountFromCloud, fetchLinksForUser } from '../firebase';
import { Camera, ExternalLink, Image as ImageIcon, Plus, ShieldCheck, Trash2, X } from 'lucide-react';

interface ClinicalPhotoManagerProps {
  data: ChronosData;
  account: Account;
  onUpdateData: (updater: (prev: ChronosData) => void) => void;
  onClose?: () => void;
}

const PHOTO_REGIONS = [
  'Joelho Direito', 'Joelho Esquerdo', 'Articulações MCF / Dedos da Mão',
  'Punho', 'Eritema Malar / Face', 'Tornozelo / Pé', 'Cotovelo',
  'Pele / Lesão Cutânea Geral', 'Outra Região'
];

export const ClinicalPhotoManager: React.FC<ClinicalPhotoManagerProps> = ({ data, account }) => {
  const patientData = data.patientData[account.id];
  const photos = patientData?.clinicalPhotos || [];
  const authorizedDoctor = useMemo(() => {
    const link = data.links.find((item) => item.patientId === account.id && item.status === 'authorized');
    return link ? data.accounts.find((item) => item.id === link.doctorId) || null : null;
  }, [account.id, data.accounts, data.links]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [bodyRegion, setBodyRegion] = useState(PHOTO_REGIONS[0]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () => dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]');
    const first = focusable()?.[0];
    first?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        setIsModalOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements?.length) return;
      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isModalOpen, busy]);

  const resetForm = () => {
    setTitle('');
    setBodyRegion(PHOTO_REGIONS[0]);
    setNotes('');
    setFile(null);
    setConsentConfirmed(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setError('');
    setNotice('');
    if (!isGoogleDriveConfigured()) {
      setError('A integração do Drive depende da configuração OAuth do app.');
      return;
    }
    if (!file || !file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('A imagem precisa ter até 15 MB.');
      return;
    }
    if (!consentConfirmed) {
      setError('Confirme que a imagem pode ser armazenada no seu Google Drive.');
      return;
    }

    setBusy(true);
    try {
      const photoTitle = title.trim() || `Registro de ${bodyRegion}`;
      const currentLinks = await fetchLinksForUser(account.id);
      const activeLink = currentLinks.find((link) => link.patientId === account.id && link.status === 'authorized');
      const currentDoctor = activeLink ? await fetchAccountFromCloud(activeLink.doctorId) : null;
      const shareEmail = currentDoctor?.email?.trim() || undefined;
      const uploaded = await uploadPhotoToGoogleDrive({
        file,
        title: photoTitle,
        description: [bodyRegion, notes.trim()].filter(Boolean).join(' — '),
        doctorEmail: shareEmail
      });
      const now = new Date();
      const newPhoto: ClinicalPhotoRecord = {
        id: `photo_${crypto.randomUUID()}`,
        date: todayISO(),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        bodyRegion,
        title: photoTitle,
        driveFileId: uploaded.fileId,
        driveUrl: uploaded.webViewLink,
        sharedWithDoctor: uploaded.sharedWithDoctor,
        consentConfirmed: true,
        notes: notes.trim() || undefined
      };

      onUpdateData((prev) => {
        const pData = prev.patientData[account.id];
        if (pData) pData.clinicalPhotos = [newPhoto, ...(pData.clinicalPhotos || [])].slice(0, 20);
      });
      setNotice(uploaded.sharedWithDoctor
        ? `Foto salva no seu Drive e compartilhada com ${shareEmail} para leitura.`
        : 'Foto salva no seu Drive. O link ficou disponível no seu diário.');
      resetForm();
      setIsModalOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a foto.');
    } finally {
      setBusy(false);
    }
  };

  const removePhotoRecord = (photoId: string) => {
    const remaining = photos.filter((photo) => photo.id !== photoId);
    onUpdateData((prev) => {
      const pData = prev.patientData[account.id];
      if (pData) pData.clinicalPhotos = remaining;
    });
    setNotice('Registro removido do RITMA. Se a imagem também deve ser apagada, remova-a no Google Drive.');
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100">Fotos clínicas</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">As imagens ficam no seu Google Drive; o RITMA guarda apenas o link e a descrição.</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setIsModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
          <Plus aria-hidden="true" className="h-4 w-4" /> Adicionar foto
        </button>
      </header>

      {notice && <p role="status" aria-live="polite" className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200">{notice}</p>}

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <ImageIcon aria-hidden="true" className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-300">Nenhuma foto registrada</p>
          <p className="mt-1 text-xs text-slate-500">Você pode registrar mudanças visíveis e acompanhar a evolução pelo seu Drive.</p>
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">{photo.bodyRegion}</span>
                <h3 className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{photo.title}</h3>
                <p className="mt-1 text-[11px] text-slate-500">{fmtDate(photo.date, 's')} às {photo.time}</p>
                {photo.notes && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{photo.notes}</p>}
                {photo.sharedWithDoctor && <p className="mt-2 text-[11px] text-teal-700 dark:text-teal-300">Compartilhada para leitura com o profissional vinculado.</p>}
                {photo.thumbnailDataUrl && <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">Foto antiga guardada neste dispositivo. Novos registros usam o Google Drive.</p>}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                {photo.driveUrl ? <a href={photo.driveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-200">Abrir no Drive <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a> : <span className="text-[11px] text-slate-400">Arquivo legado sem link do Drive</span>}
                <button type="button" onClick={() => removePhotoRecord(photo.id)} aria-label={`Remover registro ${photo.title} do RITMA`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600 dark:hover:bg-rose-950/40">
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsModalOpen(false); }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="photo-dialog-title" tabIndex={-1} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 id="photo-dialog-title" className="font-poppins text-sm font-black text-slate-800 dark:text-slate-100"><Camera aria-hidden="true" className="mr-2 inline h-5 w-5" />Registrar foto</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Fechar" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X aria-hidden="true" className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4 text-xs">
              {!isGoogleDriveConfigured() && <p role="status" className="rounded-xl bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">A integração está pronta no código, mas precisa do ID de cliente OAuth do Google Drive para habilitar uploads.</p>}
              {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
              <label className="block space-y-1"><span className="font-semibold text-slate-600 dark:text-slate-300">Imagem (máximo 15 MB)</span><input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={(event) => setFile(event.target.files?.[0] || null)} className="block w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700" /></label>
              {file && <p className="text-slate-500">Selecionada: {file.name}</p>}
              <label className="block space-y-1"><span className="font-semibold text-slate-600 dark:text-slate-300">Título</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="form-input" placeholder="Ex.: inchaço no joelho" /></label>
              <label className="block space-y-1"><span className="font-semibold text-slate-600 dark:text-slate-300">Região do corpo</span><select value={bodyRegion} onChange={(event) => setBodyRegion(event.target.value)} className="form-input">{PHOTO_REGIONS.map((region) => <option key={region}>{region}</option>)}</select></label>
              <label className="block space-y-1"><span className="font-semibold text-slate-600 dark:text-slate-300">Descrição</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={3} className="form-input" placeholder="Descreva o que deseja acompanhar." /></label>
              <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-[11px] leading-relaxed text-teal-900 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-100">
                <ShieldCheck aria-hidden="true" className="mr-1 inline h-4 w-4" /> A imagem será salva no seu Google Drive. {authorizedDoctor?.email ? <>Por padrão, será compartilhada com <strong>{authorizedDoctor.email}</strong> somente para leitura, pois este profissional está vinculado à sua conta.</> : 'Ainda não há profissional vinculado; a imagem ficará privada na sua conta Google.'} O RITMA armazenará somente o link, título, região e descrição. O uso do seu espaço segue a cota do Google Drive.
              </div>
              <label className="flex items-start gap-2 text-slate-600 dark:text-slate-300"><input type="checkbox" checked={consentConfirmed} onChange={(event) => setConsentConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-600" /><span>Entendi onde a foto ficará guardada e autorizo o compartilhamento descrito acima.</span></label>
              <button type="button" onClick={handleSave} disabled={busy || !isGoogleDriveConfigured()} className="w-full rounded-xl bg-teal-600 px-4 py-3 font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Enviando para o Drive…' : 'Salvar foto'}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};
