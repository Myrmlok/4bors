import { Link, useParams } from "wouter";
import { ArrowRight, Gavel, Lock, Tag, ChevronLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListThemes,
  useListGroups,
  getListGroupsQueryKey,
} from "@workspace/api-client-react";

const THEME_IMAGES: Record<string, string> = {
  "medieval-coins": "/images/theme-medieval.jpg",
  "udely": "/images/theme-udels.jpg",
  "metaloplastika": "/images/theme-metal.jpg",
  "russian-empire": "/images/theme-empire.jpg",
  "vostok": "/images/theme-east.jpg",
};

const THEME_IMAGES_FALLBACK = [
  "/images/theme-medieval.jpg",
  "/images/theme-udels.jpg",
  "/images/theme-metal.jpg",
  "/images/theme-empire.jpg",
  "/images/theme-east.jpg",
];

function getThemeImage(slug: string, index: number): string {
  return THEME_IMAGES[slug] ?? THEME_IMAGES_FALLBACK[index % THEME_IMAGES_FALLBACK.length];
}

export default function Catalog() {
  const { data: themes, isLoading } = useListThemes();

  return (
    <AppLayout>
      <section className="relative w-full h-[120px] bg-secondary text-secondary-foreground overflow-hidden shrink-0 flex flex-col justify-center px-8 border-b border-border/10">
        <div className="relative z-10">
          <h1 className="text-3xl font-serif mb-1">Каталог</h1>
          <p className="text-sm text-secondary-foreground/60">Тематики Клуба — выберите раздел</p>
        </div>
      </section>

      <div className="club-frame py-6 md:py-8">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-48 rounded-sm bg-secondary/30 animate-pulse" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(themes ?? []).map((theme, i) => (
            <Link
              key={theme.id}
              href={`/catalog/${theme.id}`}
              className="relative group rounded-sm overflow-hidden flex flex-col h-48 border border-border/40 hover:ring-1 hover:ring-primary/60 transition-all"
            >
              <div className="flex-1 bg-secondary relative overflow-hidden">
                <img
                  src={theme.imageUrl ?? getThemeImage(theme.slug, i)}
                  alt={theme.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity mix-blend-luminosity"
                />
              </div>
              <div className="h-12 bg-secondary border-t border-white/5 flex items-center justify-between px-4">
                <span className="text-sm font-serif text-secondary-foreground">{theme.name}</span>
                <ArrowRight className="w-4 h-4 text-secondary-foreground/50 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {!isLoading && (!themes || themes.length === 0) && (
          <div className="py-16 text-center text-sm text-muted-foreground">Тематики не найдены</div>
        )}
      </div>
    </AppLayout>
  );
}

export function CatalogTheme() {
  const params = useParams<{ themeId: string }>();
  const themeId = Number(params.themeId);

  const { data: themes } = useListThemes();
  const theme = themes?.find((t) => t.id === themeId);

  const { data: groups, isLoading } = useListGroups(themeId, {
    query: { enabled: !!themeId, queryKey: getListGroupsQueryKey(themeId) },
  });

  return (
    <AppLayout>
      <section className="relative w-full h-[120px] bg-secondary text-secondary-foreground overflow-hidden shrink-0 flex flex-col justify-center px-8 border-b border-border/10">
        <div className="relative z-10">
          <Link href="/catalog" className="text-xs text-secondary-foreground/60 hover:text-secondary-foreground flex items-center gap-1 mb-1 transition-colors">
            <ChevronLeft className="w-3 h-3" /> Каталог
          </Link>
          <h1 className="text-3xl font-serif">{theme?.name ?? "Тематика"}</h1>
        </div>
      </section>

      <div className="club-frame py-6 md:py-8">
        <div className="border-y border-border/40 divide-y divide-border/40 overflow-x-auto">
          {isLoading &&
            [1, 2, 3, 4].map((n) => <div key={n} className="h-14 animate-pulse bg-muted/30" />)}

          {!isLoading &&
            (groups ?? []).map((group) => (
              <div key={group.id} className="min-w-[720px] flex hover:bg-black/5 transition-colors group">
                <div className="w-1/4 py-4 px-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/90">{group.name}</span>
                  {group.lotsCount != null && (
                    <span className="text-[10px] text-muted-foreground">{group.lotsCount} лот.</span>
                  )}
                </div>
                <Link
                  href={`/catalog/${themeId}/groups/${group.id}`}
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
                  href={`/catalog/${themeId}/groups/${group.id}/liquidation`}
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

          {!isLoading && (!groups || groups.length === 0) && (
            <div className="py-8 text-center text-sm text-muted-foreground">Группы не найдены</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
