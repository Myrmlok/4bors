import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, User, ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");

  const navItems = [
    { href: "/", label: "Каталог" },
    { href: "/auctions", label: "Аукционы" },
    { href: "/exclusives", label: "Эксклюзивы" },
    { href: "/liquidation", label: "Ликвидация" },
  ];

  return (
    <header className="sticky top-0 z-50 min-h-14 w-full bg-secondary text-secondary-foreground border-b border-white/10 flex items-center px-4 md:px-7">
      <div className="flex items-center h-full mr-4 md:mr-8">
        <Link href="/" className="flex items-center text-lg font-serif font-medium tracking-[0.1em] text-primary">
          <span className="text-secondary-foreground/90 mr-1">4BOR</span> / КЛУБ
        </Link>
      </div>

      <div className="hidden md:block w-[1px] h-4 bg-white/10 mx-2" />

      <nav className="hidden md:flex items-center h-full ml-4 gap-6 text-sm">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`h-full flex items-center border-b-2 px-1 transition-colors ${
                isActive
                  ? "border-primary text-secondary-foreground font-medium"
                  : "border-transparent text-secondary-foreground/60 hover:text-secondary-foreground/80"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto hidden md:flex items-center gap-6 text-sm text-secondary-foreground/80">
        <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) setLocation(`/catalog?search=${encodeURIComponent(query.trim())}`); }} className="flex items-center bg-white/5 border border-white/10 rounded-md px-3 py-1 group-focus-within:border-primary/50 transition-colors w-48">
          <input data-testid="input-global-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск" className="min-w-0 w-full bg-transparent text-xs outline-none placeholder:text-secondary-foreground/40" />
          <button data-testid="button-global-search" type="submit" aria-label="Искать"><Search className="w-4 h-4 ml-auto text-secondary-foreground/40" /></button>
        </form>

        <Link href="/cart" className="flex items-center gap-2 hover:text-secondary-foreground transition-colors">
          <ShoppingCart className="w-4 h-4" />
          <span>Корзина</span>
        </Link>
        
        <Link href="/profile" className="flex items-center gap-2 hover:text-secondary-foreground transition-colors">
          <User className="w-4 h-4" />
          <span>Личный кабинет</span>
        </Link>

        {user?.role === 'dealer' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-primary/40 rounded text-primary text-xs font-medium bg-primary/5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Дилер</span>
          </div>
        )}
      </div>
      <button data-testid="button-mobile-menu" onClick={() => setOpen(!open)} className="md:hidden ml-auto p-2 text-secondary-foreground/80" aria-label="Меню">
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-14 bg-secondary border-b border-white/10 p-4 md:hidden">
          <nav className="grid gap-1">
            {navItems.concat([{ href: "/stickers", label: "Стикеры" }, { href: "/news", label: "Новости" }]).map((item) => (
              <Link data-testid={`link-mobile-${item.href.slice(1) || "home"}`} key={item.href} href={item.href} onClick={() => setOpen(false)} className="px-3 py-3 text-sm text-secondary-foreground/85 border-b border-white/5">
                {item.label}
              </Link>
            ))}
            <div className="flex gap-4 px-3 pt-3">
              <Link href="/cart" onClick={() => setOpen(false)} className="text-sm text-primary">Корзина</Link>
              <Link href="/profile" onClick={() => setOpen(false)} className="text-sm text-primary">Профиль</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
