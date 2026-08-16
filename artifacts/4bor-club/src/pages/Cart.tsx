import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Trash2, Gavel } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetCart,
  useRemoveFromCart,
  useCheckout,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { formatPrice, apiErrorMessage } from "@/lib/format";

export default function Cart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart();
  const removeFromCart = useRemoveFromCart();
  const checkout = useCheckout();

  const [buyerInfo, setBuyerInfo] = useState("");
  const [orderDone, setOrderDone] = useState<number | null>(null);

  const invalidateCart = () =>
    queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });

  const handleRemove = (id: number, title: string) => {
    removeFromCart.mutate(
      { id },
      {
        onSuccess: () => {
          invalidateCart();
          toast({ title: "Удалено", description: `«${title}» удалён из корзины.` });
        },
        onError: (e) => {
          toast({ title: "Ошибка", description: apiErrorMessage(e, "Не удалось удалить из корзины."), variant: "destructive" });
        },
      }
    );
  };

  const handleCheckout = () => {
    checkout.mutate(
      { data: { buyerInfo: buyerInfo.trim() || (user?.login ?? "") } },
      {
        onSuccess: (res) => {
          invalidateCart();
          setOrderDone(res.orderId);
          setBuyerInfo("");
        },
        onError: (e) => {
          toast({ title: "Ошибка", description: apiErrorMessage(e, "Не удалось оформить заказ."), variant: "destructive" });
        },
      }
    );
  };

  const items = cart?.items ?? [];

  return (
    <AppLayout>
      <section className="relative w-full h-[100px] bg-secondary text-secondary-foreground shrink-0 flex flex-col justify-center px-8 border-b border-border/10">
        <h1 className="text-2xl font-serif flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-primary" /> Корзина
        </h1>
      </section>

      <div className="club-frame py-6 md:py-8">
        {orderDone != null && (
          <div className="border border-primary/40 bg-primary/5 rounded-sm p-6 mb-8 text-center">
            <h2 className="text-lg font-serif mb-1">Заказ №{orderDone} оформлен</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Продавцы свяжутся с вами. История покупок доступна в личном кабинете.
            </p>
            <Link href="/profile" className="text-xs text-primary hover:underline">Перейти в личный кабинет</Link>
          </div>
        )}

        {isLoading && <div className="h-40 rounded-sm bg-secondary/20 animate-pulse" />}

        {!isLoading && items.length === 0 && orderDone == null && (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <Gavel className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Корзина пуста</p>
            <Link href="/catalog" className="text-xs text-primary hover:underline">Перейти в каталог</Link>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 border-y border-border/40 divide-y divide-border/40">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4">
                  <Link href={`/lots/${item.lotId}`} className="w-16 h-16 rounded-sm overflow-hidden bg-secondary/40 border border-border/40 shrink-0 relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                        <Gavel className="w-5 h-5" />
                      </div>
                    )}
                  </Link>
                  <Link href={`/lots/${item.lotId}`} className="flex-1 text-sm font-medium hover:underline underline-offset-2">
                    {item.title}
                  </Link>
                  <span className="text-sm font-semibold">{formatPrice(item.price)}</span>
                  <button
                    onClick={() => handleRemove(item.id, item.title)}
                    disabled={removeFromCart.isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors p-2"
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border border-border/40 rounded-sm p-5 bg-background h-fit">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Оформление</h2>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Лотов</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between text-lg font-serif mb-5">
                <span>Итого</span>
                <span>{formatPrice(cart?.total)}</span>
              </div>
              <label className="text-xs text-muted-foreground mb-1 block">Контактные данные для продавца</label>
              <Textarea
                value={buyerInfo}
                onChange={(e) => setBuyerInfo(e.target.value)}
                placeholder="Телефон, адрес доставки, комментарий…"
                className="mb-4"
              />
              <Button onClick={handleCheckout} disabled={checkout.isPending} className="w-full">
                {checkout.isPending ? "Оформляем…" : "Оформить заказ"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
