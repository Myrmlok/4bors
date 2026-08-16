import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useRegister, useValidateInvite } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Register() {
  const params = useParams();
  const token = params.token || "";
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  
  const { data: inviteInfo, isLoading: isCheckingInvite, error: inviteError } = useValidateInvite(token);
  const registerMutation = useRegister();

  const [loginStr, setLoginStr] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    registerMutation.mutate({ 
      data: { token, login: loginStr, email, password } 
    }, {
      onSuccess: (res) => {
        setToken(res.token);
        setLocation("/");
      },
      onError: () => {
        setErrorMsg("Ошибка при регистрации");
      }
    });
  };

  if (isCheckingInvite) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (inviteError || !inviteInfo) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-white mb-2">Ссылка недействительна</h1>
          <p className="text-white/60 text-sm">Возможно, срок действия приглашения истёк.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay pointer-events-none">
        <img src="/images/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      
      <div className="w-full max-w-[430px] z-10">
        <div className="text-center mb-10">
          <p className="club-kicker text-primary mb-4">приглашение принято</p>
          <h1 className="text-4xl font-serif text-primary tracking-[0.08em] mb-3">ВСТУПИТЬ В КЛУБ</h1>
          <p className="text-sm text-secondary-foreground/60">
            Роль в клубе: <span className="text-primary capitalize">{inviteInfo.role}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Логин"
                value={loginStr}
                onChange={(e) => setLoginStr(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-destructive text-xs text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-3 rounded-sm transition-colors flex justify-center items-center h-12"
          >
            {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Завершить регистрацию"}
          </button>
        </form>
        <p className="mt-7 text-center text-xs text-white/40">Уже участник? <Link href="/login" className="text-primary hover:underline">Войти в Клуб</Link></p>
      </div>
    </div>
  );
}
