import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const loginMutation = useLogin();

  const [loginStr, setLoginStr] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    loginMutation.mutate({ data: { login: loginStr, password } }, {
      onSuccess: (res) => {
        setToken(res.token);
        setLocation("/");
      },
      onError: () => {
        setErrorMsg("Неверный логин или пароль");
      }
    });
  };

  return (
    <div className="grain min-h-[100dvh] bg-secondary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay pointer-events-none">
        <img src="/images/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
      </div>
      
      <div className="w-full max-w-[430px] z-10">
        <div className="text-center mb-10">
          <p className="club-kicker text-primary mb-4">частное пространство · 4bor</p>
          <h1 className="text-5xl font-serif text-primary tracking-[0.08em] mb-3">4BOR <span className="text-white/60">/ КЛУБ</span></h1>
          <p className="text-sm text-secondary-foreground/60">Вход для дилеров и коллекционеров</p>
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
            disabled={loginMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-3 rounded-sm transition-colors flex justify-center items-center h-12"
          >
            {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Войти"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between text-xs text-white/40">
          <span>Доступ только по приглашениям</span>
          <Link data-testid="link-register-info" href="/catalog" className="text-primary/80 hover:text-primary">О Клубе</Link>
        </div>
      </div>
    </div>
  );
}
