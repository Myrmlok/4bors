import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ChevronLeft, Gavel, Tag } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useListLots,
  useListThemes,
  useListGroups,
  getListLotsQueryKey,
  getListGroupsQueryKey,
} from "@workspace/api-client-react";
import type { ListLotsParams } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/format";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "price_asc", label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
  { value: "expiry", label: "По сроку" },
];

export default function CatalogGroup({ liquidation = false }: { liquidation?: boolean }) {
  const params = useParams<{ themeId: string; groupId: string }>();
  const themeId = Number(params.themeId);
  const groupId = Number(params.groupId);
  const [, navigate] = useLocation();

  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const sectionType = liquidation ? "liquidation" : "auction";

  const { data: themes } = useListThemes();
  const theme = themes?.find((t) => t.id === themeId);
  const { data: groups } = useListGroups(themeId, {
    query: { enabled: !!themeId, queryKey: getListGroupsQueryKey(themeId) },
  });
  const group = groups?.find((g) => g.id === groupId);

  const lotsParams: ListLotsParams = { groupId, sectionType, sortBy, page };
  const { data: lotsData, isLoading } = useListLots(lotsParams, {
    query: { queryKey: getListLotsQueryKey(lotsParams) },
  });

  const lots = lotsData?.lots ?? [];
  const total = lotsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AppLayout>
      <section className="relative w-full h-[120px] bg-secondary text-secondary-foreground overflow-hidden shrink-0 flex flex-col justify-center px-8 border-b border-border/10">
        <div className="relative z-10">
          <Link
            href={`/catalog/${themeId}`}
            className="text-xs text-secondary-foreground/60 hover:text-secondary-foreground flex items-center gap-1 mb-1 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> {theme?.name ?? "Тематика"}
          </Link>
          <h1 className="text-2xl font-serif flex items-center gap-3">
            {liquidation ? <Tag className="w-5 h-5 text-primary" /> : <Gavel className="w-5 h-5 text-primary" />}
            {group?.name ?? "Группа"} — {liquidation ? "Ликвидация" : "Аукционы"}
          </h1>
        </div>
      </section>

      <div className="club-frame py-6 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-muted-foreground">{total} лот(ов)</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="text-xs border border-border/60 rounded-sm bg-background px-2 py-1.5 text-foreground"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-64 rounded-sm bg-secondary/20 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {lots.map((lot) => (
              <button
                key={lot.id}
                onClick={() => navigate(`/lots/${lot.id}`)}
                className="text-left border border-border/40 rounded-sm overflow-hidden bg-background hover:ring-1 hover:ring-primary/60 transition-all flex flex-col cursor-pointer"
              >
                <div className="h-40 bg-secondary/40 relative overflow-hidden">
                  {lot.imageUrl ? (
                    <img src={lot.imageUrl} alt={lot.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                      <Gavel className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <h3 className="text-sm font-medium leading-tight line-clamp-2">{lot.title}</h3>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    {lot.format === "fixed" ? (
                      <span className="text-sm font-semibold text-foreground">{formatPrice(lot.price)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Ставки {formatPrice(lot.bidMin)} – {formatPrice(lot.bidMax)}
                      </span>
                    )}
                    {(lot.bidsCount ?? 0) > 0 && (
                      <span className="text-[10px] text-muted-foreground">{lot.bidsCount} став.</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && lots.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            В этом разделе пока нет активных лотов
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs rounded-sm border transition-colors ${
                  p === page
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
