import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Gavel, Lock, Tag } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

// Static theme images mapped by slug
import { useGetMe, useListThemes, useListGroups, getListGroupsQueryKey, useListNews } from "@workspace/api-client-react";
const THEME_IMAGES: Record<string, string> = {
  "medieval-coins": "/images/theme-medieval.jpg",
  "udely": "/images/theme-udels.jpg",
  "metaloplastika": "/images/theme-metal.jpg",
  "russian-empire": "/images/theme-empire.jpg",
  "vostok": "/images/theme-east.jpg",
};

// Fallback by index
const THEME_IMAGES_FALLBACK = [
  "/images/theme-medieval.jpg",
  "/images/theme-udels.jpg",
  "/images/theme-metal.jpg",
  "/images/theme-empire.jpg",
  "/images/theme-east.jpg",
];

function getThemeImage(slug: string, index: number): string {
  return THEME_IMAGES[slug] ?? THEME_IMAGES_FALLBACK[index] ?? "/images/theme-medieval.jpg";
}

// Fallback news data
const FALLBACK_NEWS = [
  { date: "17.05.2025", title: "Новый раздел «Металлопластика» в каталоге Клуба", img: "/images/theme-metal.jpg" },
  { date: "14.05.2025", title: "Итоги аукциона №12 по средневековым монетам", img: "/images/news-2.jpg" },
  { date: "10.05.2025", title: "Поступление эксклюзивной подборки удельных монет", img: "/images/theme-udels.jpg" },
  { date: "07.05.2025", title: "График работы Клуба в праздничные дни", img: "/images/news-4.jpg" },
];

export default function Home() {
  const { data: user } = useGetMe();
  const { data: themes } = useListThemes();
  const { data: newsData } = useListNews({ page: 1 });

  // Selected theme state — defaults to first theme
  const firstThemeId = themes?.[0]?.id ?? null;
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);

  // Use selectedThemeId if set, else fall back to first theme from API
  const activeThemeId = selectedThemeId ?? firstThemeId;
  const activeTheme = themes?.find((t) => t.id === activeThemeId) ?? themes?.[0];

  const { data: groups, isLoading: groupsLoading } = useListGroups(activeThemeId ?? 1, {
    query: { enabled: !!activeThemeId, queryKey: getListGroupsQueryKey(activeThemeId ?? 1) },
  });

  const handleThemeClick = (id: number) => {
    setSelectedThemeId(id);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "Доброй ночи";
    if (h < 12) return "Доброе утро";
    if (h < 18) return "Добрый день";
    return "Добрый вечер";
  })();

  const displayedNews = newsData && newsData.length > 0 ? newsData : FALLBACK_NEWS;

  return (
    <AppLayout>
      {/* HERO SECTION */}
      <section className="relative w-full h-[140px] bg-secondary text-secondary-foreground overflow-hidden shrink-0 flex flex-col justify-center px-8 border-b border-border/10">
        <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay pointer-events-none">
          <img src="/images/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10">
          <p className="text-xs text-primary/80 mb-1">{greeting}</p>
          <h1 className="text-3xl font-serif mb-1">Добро пожаловать в Клуб</h1>
          <p className="text-sm text-secondary-foreground/60">Закрытое пространство для дилеров и коллекционеров</p>
        </div>
      </section>

      <div className="club-frame py-6 md:py-10 flex flex-col gap-10">
        {/* ТЕМАТИКИ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Тематики</h2>
            <Link href="/catalog" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Смотреть все <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {(themes ?? []).map((theme, i) => {
              const isActive = theme.id === activeThemeId;
              const img = getThemeImage(theme.slug, i);
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeClick(theme.id)}
                  className={`relative group cursor-pointer rounded-sm overflow-hidden flex flex-col h-32 transition-all text-left ${
                    isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:ring-1 hover:ring-primary/40 hover:ring-offset-1 hover:ring-offset-background"
                  }`}
                >
                  <div className="flex-1 bg-secondary relative overflow-hidden">
                    <img
                      src={img}
                      alt={theme.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity mix-blend-luminosity"
                    />
                  </div>
                  <div className="h-8 bg-secondary border-t border-white/5 flex items-center justify-center px-2">
                    <span className="text-[10px] text-secondary-foreground text-center line-clamp-1">{theme.name}</span>
                  </div>
                </button>
              );
            })}

            {/* Fallback skeleton while themes load */}
            {!themes &&
              [1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="rounded-sm overflow-hidden flex flex-col h-32 bg-secondary/30 animate-pulse" />
              ))}
          </div>
        </section>

        {/* ГРУППЫ АКТИВНОЙ ТЕМАТИКИ */}
        <section>
          <h2 className="text-sm font-serif uppercase tracking-widest text-foreground mb-4">
            {activeTheme?.name ?? "Тематика"}
          </h2>

            <div className="border-y border-border/40 divide-y divide-border/40 overflow-x-auto">
            {groupsLoading && (
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="h-14 animate-pulse bg-muted/30" />
              ))
            )}

            {!groupsLoading && (groups ?? []).map((group) => (
              <div key={group.id} className="min-w-[720px] flex hover:bg-black/5 transition-colors group">
                <div className="w-1/4 py-4 px-4 flex items-center">
                  <span className="text-sm font-medium text-foreground/90">{group.name}</span>
                </div>
                <Link
                  href={`/catalog/${activeThemeId}/groups/${group.id}`}
                  className="w-1/4 py-4 px-4 flex items-center justify-between border-l border-border/40 hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-xs text-foreground/80">
                    <Gavel className="w-4 h-4 text-muted-foreground" />
                    <span className="leading-tight">Аукционы от находчиков<br />и коллекционеров</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <div className="w-1/4 py-4 px-4 flex items-center justify-between border-l border-border/40 bg-black/[0.02] cursor-not-allowed">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Эксклюзивы от дилеров</span>
                  </div>
                </div>
                <Link
                  href={`/catalog/${activeThemeId}/groups/${group.id}/liquidation`}
                  className="w-1/4 py-4 px-4 flex items-center justify-between border-l border-border/40 hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-xs text-foreground/80">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span>Ликвидация</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            ))}

            {/* Fallback if no groups and not loading */}
            {!groupsLoading && (!groups || groups.length === 0) && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Группы не найдены
              </div>
            )}
          </div>
        </section>

        {/* SHORTCUTS */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/auctions"
              className="border border-primary bg-background p-4 relative group hover:bg-black/5 transition-colors flex flex-col justify-between h-32 rounded-sm cursor-pointer"
            >
              <h3 className="text-sm font-medium leading-tight pr-10">Аукционы от находчиков и коллекционеров</h3>
              <div className="absolute right-4 top-4 w-10 h-10 rounded-full overflow-hidden border border-border shadow-sm">
                <img src={activeTheme ? getThemeImage(activeTheme.slug, 0) : "/images/theme-medieval.jpg"} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors mt-auto">
                Перейти в каталог <ArrowRight className="w-3 h-3" />
              </span>
            </Link>

            {[
              { id: "02", title: "Эксклюзивы от дилеров" },
              { id: "03", title: "Ликвидация" },
              { id: "04", title: "Архив завершённых аукционов" },
            ].map((shortcut) => (
              <div key={shortcut.id} className="border border-border/40 bg-background/50 p-4 relative flex flex-col h-32 rounded-sm opacity-70">
                <span className="text-xs text-muted-foreground mb-1">{shortcut.id}</span>
                <h3 className="text-sm font-medium text-foreground/80 leading-tight pr-6">{shortcut.title}</h3>
                <div className="absolute right-4 top-4">
                  <Lock className="w-4 h-4 text-muted-foreground/50" />
                </div>
                <span className="text-[10px] text-muted-foreground mt-auto">Раздел закрыт</span>
              </div>
            ))}
          </div>
        </section>

        {/* НОВОСТИ КЛУБА */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Новости клуба</h2>
            <Link href="/news" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Смотреть все <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedNews.slice(0, 4).map((item: any, i: number) => (
              <Link href={`/news/${i}`} key={i} className="flex gap-3 items-start group hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-sm overflow-hidden shrink-0 border border-border shadow-sm">
                  <img src={item.img ?? item.imageUrl ?? "/images/news-2.jpg"} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-[9px] text-muted-foreground tracking-wider">
                    {item.date ?? (item.createdAt ? new Date(item.createdAt).toLocaleDateString("ru-RU") : "")}
                  </span>
                  <h4 className="text-xs font-medium text-foreground/90 leading-tight line-clamp-3 group-hover:underline decoration-border underline-offset-2">
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
