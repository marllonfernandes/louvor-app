import React, { useState } from 'react';
import {
  AlertCircle,
  Music4,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot';

export function LoginView() {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    error,
    clearError
  } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const isInvite = urlParams.has('inviteToken');

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const switchMode = (newMode: AuthMode) => {
    clearError();
    setLocalError(null);
    setResetSuccess(false);
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setResetSuccess(false);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setLocalError('Informe seu e-mail para recuperar a senha.');
        return;
      }
      setSubmitting(true);
      try {
        await resetPassword(email);
        setResetSuccess(true);
      } catch (err: any) {
        // Erro gerenciado no AuthContext
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'register') {
      if (!email.trim() || !password || !confirmPassword) {
        setLocalError('Preencha todos os campos obrigatórios.');
        return;
      }
      if (password.length < 6) {
        setLocalError('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('As senhas não coincidem.');
        return;
      }
      setSubmitting(true);
      try {
        await registerWithEmail(email, password, name.trim() || undefined);
      } catch (err: any) {
        // Erro gerenciado no AuthContext
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Modo login
    if (!email.trim() || !password) {
      setLocalError('Informe seu e-mail e senha.');
      return;
    }
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      // Erro gerenciado no AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = localError || error;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-y-auto bg-slate-950 font-sans selection:bg-blue-500/30 p-4 sm:p-6">
      
      {/* Background Decorativo com Efeito de Luzes (Gradients + Blur) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse"
          style={{ animationDuration: '12s' }}
        />
        <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] bg-violet-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] my-auto flex flex-col items-center">
        
        {/* Ícone / Logo */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 rounded-full animate-pulse" />
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-3.5 rounded-2xl shadow-2xl">
            <Music4 size={36} className="text-blue-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Textos Principais */}
        <div className="text-center mb-6 space-y-1">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            Louvor App
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Gestão de escalas e repertório.
          </p>
        </div>

        {/* Card Principal (Glassmorphism) */}
        <div className="w-full bg-slate-900/50 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Efeito de brilho na borda superior do card */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          <div className="flex flex-col space-y-5">
            
            {/* Mensagem de Convite */}
            {isInvite ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3.5 flex gap-3.5 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Sparkles size={36} />
                </div>
                <div className="bg-blue-500/20 p-2 rounded-xl shrink-0">
                  <Sparkles size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-300">Você foi convidado!</h3>
                  <p className="text-[11px] text-blue-200/70 mt-0.5 leading-relaxed">
                    Entre com sua conta Google ou crie sua senha abaixo para acessar as escalas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                <ShieldCheck size={15} className="text-emerald-500/80" />
                <span>Acesso seguro para membros da equipe</span>
              </div>
            )}

            {/* Mensagem de Erro */}
            {displayedError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2.5 animate-slide-up">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="text-xs text-red-300 font-medium leading-relaxed">{displayedError}</span>
              </div>
            )}

            {/* Mensagem de Sucesso na Recuperação */}
            {resetSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5 animate-slide-up">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span className="text-xs text-emerald-300 font-medium leading-relaxed">
                  E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada e spam.
                </span>
              </div>
            )}

            {/* Botão de Login Google (Em destaque no topo) */}
            {mode !== 'forgot' && (
              <>
                <div>
                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    className="group relative w-full flex justify-center items-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-all duration-200 transform active:scale-98"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Continuar com o Google</span>
                    <ArrowRight size={15} className="absolute right-4 text-slate-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </button>
                </div>

                {/* Divisor Visual */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-900/90 px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    ou com e-mail
                  </span>
                  <div className="border-t border-slate-800 w-full" />
                </div>
              </>
            )}

            {/* Formulário de E-mail e Senha */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Título do modo de recuperação */}
              {mode === 'forgot' && (
                <div className="text-center pb-1">
                  <div className="inline-flex p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
                    <KeyRound size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-100">Recuperar Senha</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Digite seu e-mail para receber o link de redefinição.
                  </p>
                </div>
              )}

              {/* Campo Nome (Apenas Registro) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Ex: Maria Souza"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Campo E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Campo Senha (Login e Registro) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Esqueceu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Campo Confirmar Senha (Apenas Registro) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Mínimo de 6 caracteres.
                  </p>
                </div>
              )}

              {/* Botão de Envio Principal */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-98"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : mode === 'login' ? (
                  <span>Entrar com E-mail</span>
                ) : mode === 'register' ? (
                  <span>Criar Senha e Acessar</span>
                ) : (
                  <span>Enviar Link de Recuperação</span>
                )}
              </button>
            </form>

            {/* Alternância de Modo (Rodapé do Card) */}
            <div className="pt-2 text-center border-t border-slate-800/60 text-xs text-slate-400">
              {mode === 'login' && (
                <p>
                  Primeiro acesso?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Criar minha senha
                  </button>
                </p>
              )}

              {mode === 'register' && (
                <p>
                  Já possui uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Entrar com e-mail
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <p>
                  Lembrou da senha?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Voltar ao Login
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-[11px] text-center text-slate-600 font-medium max-w-[280px]">
          Acesso restrito a integrantes da equipe de louvor. Solicite um convite ao líder para acessar.
        </p>

      </div>
    </div>
  );
}
