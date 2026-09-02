import React from 'react';
import { AlertCircle, Music4, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LoginView() {
  const { loginWithGoogle, error } = useAuth();
  
  const urlParams = new URLSearchParams(window.location.search);
  const isInvite = urlParams.has('inviteToken');

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 font-sans selection:bg-blue-500/30">
      
      {/* Background Decorativo com Efeito de Luzes (Gradients + Blur) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] bg-violet-600/10 rounded-full blur-[100px] mix-blend-screen" />
        {/* Overlay de textura granulada sutil */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6 py-12 flex flex-col items-center">
        
        {/* Ícone / Logo */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 rounded-full animate-pulse" />
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl">
            <Music4 size={40} className="text-blue-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Textos Principais */}
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            Louvor App
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Gestão de escalas e repertório.
          </p>
        </div>

        {/* Card Principal (Glassmorphism) */}
        <div className="w-full bg-slate-900/40 backdrop-blur-2xl border border-slate-800/60 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
          
          {/* Efeito de brilho na borda superior do card */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          <div className="flex flex-col space-y-6">
            
            {/* Mensagem de Convite */}
            {isInvite ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Sparkles size={40} />
                </div>
                <div className="bg-blue-500/20 p-2 rounded-xl shrink-0">
                  <Sparkles size={20} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-300">Você foi convidado!</h3>
                  <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
                    Faça login abaixo para conectar sua conta e acessar as escalas da sua equipe.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <ShieldCheck size={16} className="text-emerald-500/70" />
                <span>Acesso seguro para membros convidados</span>
              </div>
            )}

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex items-start gap-3 animate-slide-up">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                <span className="text-xs text-red-300 font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Botão de Login Google */}
            <div className="pt-2">
              <button
                onClick={loginWithGoogle}
                className="group relative w-full flex justify-center items-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-50 text-slate-900 rounded-xl font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-all duration-300 transform active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar com o Google
                <ArrowRight size={16} className="absolute right-4 text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </button>
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-[11px] text-center text-slate-600 font-medium max-w-[280px]">
          Acesso restrito a integrantes da equipe de louvor. Solicite um convite ao líder para acessar.
        </p>

      </div>
    </div>
  );
}
