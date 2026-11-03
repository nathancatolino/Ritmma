import React, { useEffect, useMemo, useState } from 'react';
import { Account } from '../types';
import { auth, fetchDoctorProfilesForAdmin, fetchProfessionalReviewsForAdmin, reviewDoctorProfile } from '../firebase';
import { logOutFromFirebase } from '../firebase';

type Review = Record<string, unknown> & { id: string };

interface AdminConsoleProps {
  onClose: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onClose }) => {
  const [profiles, setProfiles] = useState<Account[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selected, setSelected] = useState<Account | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextProfiles, nextReviews] = await Promise.all([
        fetchDoctorProfilesForAdmin(), fetchProfessionalReviewsForAdmin()
      ]);
      nextProfiles.sort((a, b) => Number(a.crm?.status !== 'pending') - Number(b.crm?.status !== 'pending') || a.name.localeCompare(b.name));
      setProfiles(nextProfiles);
      setReviews(nextReviews.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))));
    } catch {
      setError('Não foi possível carregar a fila. Confirme sua permissão de administrador e as regras publicadas no Firebase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const pendingCount = useMemo(() => profiles.filter((profile) => profile.crm?.status === 'pending').length, [profiles]);

  const decide = async (profile: Account, decision: 'verified' | 'failed') => {
    if (decision === 'failed' && !reason.trim()) {
      setError('Informe o motivo da recusa para manter um histórico claro.');
      return;
    }
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await reviewDoctorProfile(profile, decision, reason);
      setNotice(decision === 'verified' ? 'Cadastro aprovado.' : 'Cadastro recusado com o motivo registrado.');
      setSelected(null);
      setReason('');
      await refresh();
    } catch {
      setError('A revisão não foi salva. Confira sua permissão de administrador e tente novamente.');
    } finally {
      setWorking(false);
    }
  };

  const signOut = async () => {
    await logOutFromFirebase();
    onClose();
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 text-slate-800 dark:text-slate-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">RITMA · Administração</p>
            <h1 className="mt-1 text-2xl font-black">Revisão de profissionais</h1>
            <p className="mt-1 text-sm text-slate-500">{pendingCount} cadastro(s) aguardando conferência</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void refresh()} className="rounded-xl border px-4 py-2 text-sm font-semibold">Atualizar</button>
            <button type="button" onClick={signOut} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Sair</button>
          </div>
        </header>

        {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

        <section aria-labelledby="queue-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 id="queue-heading" className="sr-only">Fila de profissionais</h2>
          {loading ? <p className="p-6 text-sm">Carregando cadastros…</p> : profiles.length === 0 ? <p className="p-6 text-sm text-slate-500">Nenhum profissional cadastrado ainda.</p> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {profiles.map((profile) => <li key={profile.id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0">
                  <p className="font-bold">{profile.name}</p>
                  <p className="break-all text-sm text-slate-500">{profile.email} · {profile.specialty || 'Especialidade não informada'}</p>
                  <p className="mt-1 text-xs text-slate-500">{profile.crm?.council || 'Conselho'} {profile.crm?.number} / {profile.crm?.uf} · <span className="font-semibold">{profile.crm?.status === 'verified' ? 'Aprovado' : profile.crm?.status === 'failed' ? 'Recusado' : 'Pendente'}</span></p>
                </div>
                <button type="button" onClick={() => { setSelected(profile); setReason(''); setError(''); }} className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-bold text-teal-800 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:text-teal-300">Revisar</button>
              </li>)}
            </ul>
          )}
        </section>

        <section aria-labelledby="history-heading" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 id="history-heading" className="font-bold">Histórico recente</h2>
          {reviews.length === 0 ? <p className="mt-2 text-sm text-slate-500">As decisões aparecerão aqui.</p> : <ul className="mt-3 space-y-2 text-sm">
            {reviews.slice(0, 10).map((item) => <li key={item.id} className="border-t border-slate-100 pt-2 dark:border-slate-800">
              <span className="font-semibold">{String(item.professionalEmail || item.professionalId)}</span>: {item.decision === 'verified' ? 'aprovado' : 'recusado'}{item.reason ? ` — ${String(item.reason)}` : ''}
            </li>)}
          </ul>}
        </section>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="review-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <h2 id="review-title" className="text-lg font-black">Conferir cadastro</h2>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="font-semibold">Nome</dt><dd>{selected.name}</dd>
            <dt className="font-semibold">E-mail</dt><dd className="break-all">{selected.email}</dd>
            <dt className="font-semibold">Conselho</dt><dd>{selected.crm?.council} {selected.crm?.number} / {selected.crm?.uf}</dd>
            <dt className="font-semibold">Especialidade</dt><dd>{selected.specialty || '—'}</dd>
          </dl>
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Confira o registro diretamente no conselho profissional antes de aprovar. O app não armazena cópias de documentos.</p>
          <label htmlFor="review-reason" className="mt-4 block text-sm font-semibold">Motivo (obrigatório para recusar)</label>
          <textarea id="review-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 text-sm dark:border-slate-700" />
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" disabled={working} onClick={() => setSelected(null)} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button>
            <button type="button" disabled={working || !reason.trim()} onClick={() => void decide(selected, 'failed')} className="rounded-xl border border-rose-600 px-4 py-2 text-sm font-bold text-rose-700 disabled:opacity-50">Recusar</button>
            <button type="button" disabled={working} onClick={() => void decide(selected, 'verified')} className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Aprovar</button>
          </div>
        </section>
      </div>}
      <span className="sr-only">Administrador autenticado: {auth.currentUser?.email}</span>
    </main>
  );
};
