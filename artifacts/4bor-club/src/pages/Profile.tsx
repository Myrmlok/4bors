import { Link } from "wouter";
import { User as UserIcon, Gavel, Package, LogOut, Zap } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useListMyBids, useListMyOrders } from "@workspace/api-client-react";
import { formatPrice, formatDate, ROLE_LABELS, LOT_STATUS_LABELS } from "@/lib/format";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: bids, isLoading: bidsLoading } = useListMyBids();
  const { data: orders, isLoading: ordersLoading } = useListMyOrders();

  return (
    <AppLayout>
      <section className="relative w-full h-[100px] bg-secondary text-secondary-foreground shrink-0 flex flex-col justify-center px-8 border-b border-border/10">
        <h1 className="text-2xl font-serif flex items-center gap-3">
          <UserIcon className="w-5 h-5 text-primary" /> Личный кабинет
        </h1>
      </section>

      <div className="club-frame py-6 md:py-8 flex flex-col gap-10">
        {/* User info */}
        <section className="border border-border/40 rounded-sm p-6 bg-background flex items-center justify-between">
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-serif text-xl uppercase">
              {user?.login?.[0] ?? "?"}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-serif truncate">{user?.login}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role} · в Клубе с {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Выйти
          </Button>
        </section>

        {/* Purchases */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" /> История покупок
          </h2>
          {ordersLoading && <div className="h-24 rounded-sm bg-secondary/20 animate-pulse" />}
          {!ordersLoading && (!orders || orders.length === 0) && (
            <p className="text-sm text-muted-foreground py-4">
              Покупок пока нет. <Link href="/catalog" className="text-primary hover:underline">Перейти в каталог</Link>
            </p>
          )}
          {!ordersLoading && orders && orders.length > 0 && (
            <div className="border-y border-border/40 divide-y divide-border/40">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center gap-4 py-3">
                  <div className="w-12 h-12 rounded-sm overflow-hidden bg-secondary/40 border border-border/40 shrink-0 relative">
                    {o.imageUrl ? (
                      <img src={o.imageUrl} alt={o.lotTitle} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <Link href={`/lots/${o.lotId}`} className="flex-1 text-sm font-medium hover:underline underline-offset-2">
                    {o.lotTitle}
                  </Link>
                  <span className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>
                  <span className="text-sm font-semibold w-28 text-right">{formatPrice(o.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bids */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Gavel className="w-4 h-4" /> История ставок
          </h2>
          {bidsLoading && <div className="h-24 rounded-sm bg-secondary/20 animate-pulse" />}
          {!bidsLoading && (!bids || bids.length === 0) && (
            <p className="text-sm text-muted-foreground py-4">Ставок пока нет.</p>
          )}
          {!bidsLoading && bids && bids.length > 0 && (
            <div className="border-y border-border/40 divide-y divide-border/40">
              {bids.map((b) => (
                <div key={b.id} className="flex items-center gap-4 py-3">
                  <Link href={`/lots/${b.lotId}`} className="flex-1 text-sm font-medium hover:underline underline-offset-2">
                    {b.lotTitle}
                  </Link>
                  {b.isBlitz && (
                    <span className="text-[10px] uppercase tracking-widest text-primary flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Блиц
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {LOT_STATUS_LABELS[b.lotStatus] ?? b.lotStatus}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(b.createdAt)}</span>
                  <span className="text-sm font-semibold w-28 text-right">{formatPrice(b.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
