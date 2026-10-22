/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, ChronosData } from '../types';
import { findByEmail, createAccount } from '../utils';
import { User, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { RitmaLogo } from './RitmaLogo';
import { signInWithGoogle } from '../firebase';

interface AuthProps {
  data: ChronosData;
  onUpdateData: (updater: (prev: ChronosData) => void) => void;
  prefillDocCode?: string | null;
}

export const Auth: React.FC<AuthProps> = ({ data, onUpdateData }) => {
  const [mode, setMode] = useState<'signup' | 'login' | 'plans'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [pendingAccount, setPendingPatient] = useState<Account | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMsg('Informe seu nome completo para criar seu diário.');
      return;
    }
    if (!lgpdAccepted) {
      setErrorMsg('É obrigatório aceitar o termo de tratamento de dados de saúde (LGPD).');
      return;
    }

    if (trimmedEmail && findByEmail(data, trimmedEmail)) {
      setErrorMsg('Já existe um perfil cadastrado com este e-mail.');
      return;
    }

    onUpdateData((prev) => {
      const pat = createAccount(prev, {
        role: 'patient',
        name: trimmedName,
        email: trimmedEmail,
        lgpd: true,
        discountApplied: false
      });

      prev.session.currentUserId = pat.id;
    });
  };

  const handlePlanSelect = () => {
    if (pendingAccount) {
      onUpdateData((prev) => {
        const acc = prev.accounts.find((a) => a.id === pendingAccount.id);
        if (acc) {
          acc.subscription.plan = 'pro';
          acc.subscription.status = 'active';
        }
        prev.session.currentUserId = pendingAccount.id;
      });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const acc = findByEmail(data, email.trim().toLowerCase());
    if (!acc) {
      setErrorMsg('Nenhuma conta encontrada com este e-mail.');
      return;
    }
    onUpdateData((prev) => {
      prev.session.currentUserId = acc.id;
    });
  };

  const handleQuickLogin = (id: string) => {
    const acc = data.accounts.find((a) => a.id === id);
    if (acc) {
      onUpdateData((prev) => {
        prev.session.currentUserId = acc.id;
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      const user = await signInWithGoogle();
      if (!user) return;
      const userEmail = (user.email || '').toLowerCase();
      const userName = user.displayName || user.email?.split('@')[0] || 'Paciente';

      onUpdateData((prev) => {
        let acc = prev.accounts.find((a) => a.email.toLowerCase() === userEmail);
        if (!acc) {
          acc = createAccount(prev, {
            role: 'patient',
            name: userName,
            email: userEmail,
            lgpd: true,
            discountApplied: false
          });
        }
        prev.session.currentUserId = acc.id;
      });
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Não foi possível autenticar com o Google. Você pode se cadastrar ou entrar abaixo com e-mail.');
      }
    }
  };

  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Brand logo header */}
        <div className="flex flex-col items-center justify-center mb-6 select-none text-center">
          <RitmaLogo size="lg" showTagline={true} />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-3 max-w-sm">
            Acompanhamento contínuo de dor crônica e análise inteligente de sintomas
          </p>
        </div>

        {/* Role Segmented Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex gap-1 mb-5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setUserType('patient');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              userType === 'patient'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Sou Paciente</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUserType('doctor');
              setErrorMsg('');
              setMode('login');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              userType === 'doctor'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span>🩺</span>
            <span>Sou Profissional de Saúde</span>
          </button>
        </div>

        {/* Dynamic Card Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-xl p-6 sm:p-8 transition-all">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-xs font-semibold p-3.5 rounded-xl mb-4 leading-normal">
              ⚠️ {errorMsg}
            </div>
          )}

          {userType === 'patient' && (
            <>
              {/* Google Sign In option */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 mb-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs">Continuar com o Google</span>
              </button>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">ou com e-mail</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>
            </>
          )}

          {mode === 'signup' && userType === 'patient' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <h3 className="font-poppins font-bold text-md text-slate-800 dark:text-slate-200">
                Criar seu Diário Clínico
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="auth-name" className="text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">Nome completo</label>
                  <input
                    id="auth-name"
                    className="form-input"
                    placeholder="Ex: Maria Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="auth-email" className="text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">E-mail pessoal</label>
                  <input
                    id="auth-email"
                    type="email"
                    className="form-input"
                    placeholder="Ex: maria@provedor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* LGPD Check */}
                <label htmlFor="auth-lgpd" className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl cursor-pointer select-none">
                  <input
                    id="auth-lgpd"
                    type="checkbox"
                    checked={lgpdAccepted}
                    onChange={(e) => setLgpdAccepted(e.target.checked)}
                    className="mt-1 accent-teal-500 h-4 w-4 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                    Concordo com o tratamento estrito de meus dados de saúde e registros pessoais para acompanhamento e suporte de decisões clínicas (LGPD).
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Cadastrar e Iniciar Diário
              </button>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h3 className="font-poppins font-bold text-md text-slate-800 dark:text-slate-200">
                {userType === 'doctor' ? 'Acesso ao Painel Clínico' : 'Fazer Login'}
              </h3>

              <div className="space-y-1">
                <label htmlFor="login-email" className="text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">
                  {userType === 'doctor' ? 'E-mail profissional cadastrado' : 'E-mail cadastrado'}
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder={userType === 'doctor' ? 'Ex: dr.silva@reuma.com' : 'Ex: ana@pain.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer ${
                  userType === 'doctor'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600 hover:opacity-95'
                }`}
              >
                {userType === 'doctor' ? 'Entrar no Consultório Digital' : 'Acessar Meu Painel'}
              </button>
            </form>
          )}
        </div>

        {/* Footer toggles for Patient */}
        {userType === 'patient' && (
          <div className="text-center mt-6">
            {mode === 'login' ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Não tem um perfil?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                >
                  Cadastre-se grátis
                </button>
              </span>
            ) : (
              mode !== 'plans' && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Já tem um registro?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                  >
                    Fazer login
                  </button>
                </span>
              )
            )}
          </div>
        )}

        {/* Quick profiles section */}
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800/80 pt-6 text-center select-none">
          <h4 className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-3">
            {userType === 'patient' ? 'Perfis de Pacientes Salvos:' : 'Equipe Clínica Cadastrada:'}
          </h4>
          <div className="flex flex-wrap justify-center gap-2">
            {data.accounts
              .filter((acc) => acc.role === userType)
              .map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleQuickLogin(acc.id)}
                  className={`text-[11px] font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                    userType === 'doctor'
                      ? 'border-blue-200 dark:border-blue-900/60 hover:border-blue-500'
                      : 'border-teal-200 dark:border-teal-900/60 hover:border-teal-500'
                  }`}
                >
                  <span>{userType === 'doctor' ? '🩺' : '👤'}</span>
                  <span>{acc.name}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
