import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Gavel, ShoppingCart, Zap, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetLot,
  usePurchaseLot,
  useAddToCart,
  usePlaceBid,
  getGetLotQueryKey,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { formatPrice, formatDate, apiErrorMessage, LOT_STATUS_LABELS } from "@/lib/format";

export default function LotDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lot, isLoading, error } = useGetLot(id, {
    query: { enabled: !!id, queryKey: getGetLotQueryKey(id) },
  });

  const [bidAmount, setBidAmount] = useState("");

  const purchaseLot = usePurchaseLot();
  const addToCart = useAddToCart();
  const placeBid = usePlaceBid();

  const invalidateLot = () =>
    queryClient.invalidateQueries({ queryKey: getGetLotQueryKey(id) });

  const handleBuy = () => {
    purchaseLot.mutate(
      { id, data: { buyerInfo: user?.login ?? "" } },
      {
        onSuccess: () => {
          invalidateLot();
          toast({ title: "Покупка оформлена", description: "Лот приобретён. Детали — в личном кабинете." });
        },
        onError: (e) => {
          toast({ title: "Ошибка", description: apiErrorMessage(e, "Не удалось оформить покупку."), variant: "destructive" });
        },
      }
    );
  };

  const handleAddToCart = () => {
    addToCart.mutate(
      { data: { lotId: id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Добавлено в корзину", description: "Лот добавлен в корзину." });
        },
        onError: (e) => {
          toast({ title: "Ошибка", description: apiErrorMessage(e, "Не удалось добавить в корзину."), variant: "destructive" });
        },
      }
    );
  };

  const handleBid = () => {
    const amount = Number(bidAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Ошибка", description: "Укажите сумму ставки.", variant: "destructive" });
      return;
    }
    placeBid.mutate(
      { id, data: { amount } },
      {
        onSuccess: (bid) => {
          invalidateLot();
          setBidAmount("");
          toast({
            title: bid.isBlitz ? "БЛИЦ! Лот ваш" : "Ставка принята",
            description: bid.isBlitz
              ? "Вы выкупили лот по максимальной цене."
              : `Ваша ставка ${formatPrice(bid.amount)} зарегистрирована.`,
          });
        },
        onError: (e) => {
          toast({ title: "Ошибка", description: apiErrorMessage(e, "Не удалось сделать ставку."), variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="h-96 rounded-sm bg-secondary/20 animate-pulse" />
        </div>
      </AppLayout>
    );
  }

  if (error || !lot) {
    return (
      <AppLayout>
        <div className="p-8 flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-sm text-muted-foreground">Лот не найден или недоступен</p>
          <Link href="/catalog" className="text-xs text-primary hover:underline">Вернуться в каталог</Link>
        </div>
      </AppLayout>
    );
  }

  const isActive = lot.status === "active";
  const isFixed = lot.format === "fixed";
  const canBid = user?.role !== "collector";
  const attrs: Array<[string, string]> = [];
  if (lot.isRestored != null) attrs.push(["Реставрация", lot.isRestored ? "Да" : "Нет"]);
  if (lot.hasBell != null) attrs.push(["Колокольчик", lot.hasBell ? "Есть" : "Нет"]);
  if (lot.hasDefects != null) attrs.push(["Дефекты", lot.hasDefects ? "Есть" : "Нет"]);
  if (lot.weight != null) attrs.push(["Вес", `${lot.weight} г`]);

  return (
    <AppLayout>
      <section className="relative w-full h-[100px] bg-secondary text-secondary-foreground shrink-0 flex flex-col justify-center px-8 border-b border-border/10">
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : navigate("/catalog")}
          className="text-xs text-secondary-foreground/60 hover:text-secondary-foreground flex items-center gap-1 mb-1 transition-colors w-fit"
        >
          <ChevronLeft className="w-3 h-3" /> Назад
        </button>
        <h1 className="text-2xl font-serif line-clamp-1">{lot.title}</h1>
      </section>

      <div className="club-frame py-6 md:py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Image */}
        <div className="lg:col-span-3">
          <div className="aspect-[4/3] bg-secondary/40 rounded-sm overflow-hidden relative border border-border/40">
            {lot.imageUrl ? (
              <img src={lot.imageUrl} alt={lot.title} className="absolute inset-0 w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                <Gavel className="w-16 h-16" />
              </div>
            )}
          </div>

          {lot.description && (
            <div className="mt-6">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Описание</h2>
              <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{lot.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="border border-border/40 rounded-sm p-5 bg-background">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm ${
                isActive ? "bg-primary/10 text-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {LOT_STATUS_LABELS[lot.status] ?? lot.status}
              </span>
              {lot.expiresAt && (
                <span className="text-[10px] text-muted-foreground">до {formatDate(lot.expiresAt)}</span>
              )}
            </div>

            {isFixed ? (
              <>
                <p className="text-xs text-muted-foreground mb-1">Фиксированная цена</p>
                <p className="text-3xl font-serif mb-5">{formatPrice(lot.price)}</p>
                {isActive ? (
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleBuy} disabled={purchaseLot.isPending} className="w-full">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {purchaseLot.isPending ? "Оформляем…" : "Купить сейчас"}
                    </Button>
                    <Button variant="outline" onClick={handleAddToCart} disabled={addToCart.isPending} className="w-full">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {addToCart.isPending ? "Добавляем…" : "В корзину"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Лот больше не доступен для покупки.</p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1">Аукцион — диапазон ставок</p>
                <p className="text-xl font-serif mb-1">
                  {formatPrice(lot.bidMin)} – {formatPrice(lot.bidMax)}
                </p>
                <p className="text-[10px] text-muted-foreground mb-4 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" /> Ставка по максимуму — БЛИЦ (моментальный выкуп)
                </p>
                {(lot.bidsCount ?? 0) > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">Ставок: {lot.bidsCount}</p>
                )}
                {isActive && canBid && (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      placeholder={`Сумма от ${lot.bidMin ?? 0} до ${lot.bidMax ?? "∞"}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <Button onClick={handleBid} disabled={placeBid.isPending} className="w-full">
                      <Gavel className="w-4 h-4 mr-2" />
                      {placeBid.isPending ? "Отправляем…" : "Сделать ставку"}
                    </Button>
                  </div>
                )}
                {isActive && !canBid && (
                  <p className="text-sm text-muted-foreground">Коллекционеры не могут делать ставки.</p>
                )}
                {!isActive && (
                  <p className="text-sm text-muted-foreground">Приём ставок завершён.</p>
                )}
              </>
            )}
          </div>

          {(attrs.length > 0 || lot.marketValue != null) && (
            <div className="border border-border/40 rounded-sm p-5 bg-background">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Характеристики</h2>
              <div className="divide-y divide-border/30">
                {lot.marketValue != null && (
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">Рыночная оценка</span>
                    <span>{formatPrice(lot.marketValue)}</span>
                  </div>
                )}
                {attrs.map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
