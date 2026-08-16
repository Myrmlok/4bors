import { useEffect, useState } from "react";
import { Users, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import {
  useGetOnlineCount,
  useListActivity,
  useListStickers,
  getGetOnlineCountQueryKey,
  getListActivityQueryKey,
  getListStickersQueryKey,
} from "@workspace/api-client-react";

export function Sidebar() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const moscowTime = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit'
      }).format(now);
      setTime(`Москва — ${moscowTime}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: onlineData } = useGetOnlineCount({ query: { refetchInterval: 10000, queryKey: getGetOnlineCountQueryKey() } });
  const { data: activities } = useListActivity({ query: { refetchInterval: 15000, queryKey: getListActivityQueryKey() } });
  const { data: stickersData } = useListStickers({ page: 1 }, { query: { refetchInterval: 30000, queryKey: getListStickersQueryKey({ page: 1 }) } });

  return (
    <aside className="hidden xl:flex w-80 shrink-0 bg-card/70 min-h-screen border-l border-border/50 py-8 px-6 flex-col gap-10">
      
      {/* СЕЙЧАС В КЛУБЕ */}
      <section>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Сейчас в клубе</h3>
        <div className="flex items-center gap-3 relative">
          <Users className="w-5 h-5 text-muted-foreground/80" />
          <span className="text-2xl font-serif text-foreground">{onlineData?.count || 24}</span>
          <span className="text-sm text-foreground/80">участника онлайн</span>
          <div className="absolute top-1 left-4 w-2 h-2 bg-green-500 rounded-full border border-card" />
        </div>
      </section>

      {/* ПОСЛЕДНЯЯ АКТИВНОСТЬ */}
      <section>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Последняя активность</h3>
        <div className="flex flex-col gap-4">
          {(activities || []).slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-border overflow-hidden shrink-0">
                {/* Minimal placeholder for activity icon */}
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">
                  4B
                </div>
              </div>
              <div className="flex-1 leading-tight">
                <p className="text-xs text-foreground/90">{activity.description}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{activity.timeAgo}</span>
            </div>
          ))}
          {/* Fallback dummy data if no API data */}
          {(!activities || activities.length === 0) && (
            <>
              {[
                { text: "Новый лот в разделе «Средневековые монеты»", time: "5 мин назад" },
                { text: "Завершён аукцион «Дирхем. Саманиды»", time: "18 мин назад" },
                { text: "Пополнение в разделе «Эксклюзивы»", time: "47 мин назад" },
                { text: "Новый участник в Клубе", time: "1 ч назад" },
                { text: "Сообщение в поддержку", time: "1 ч назад" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center border border-border/50">
                    <div className="w-4 h-4 rounded-full bg-primary/10" />
                  </div>
                  <div className="flex-1 leading-tight">
                    <p className="text-xs text-foreground/90">{item.text}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* ВРЕМЯ */}
      <section>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Время</h3>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-foreground/90">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{time || "Москва — 17:39"}</span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-6">только Москва</span>
        </div>
      </section>

      {/* СТИКЕРЫ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Стикеры</h3>
          <Link href="/stickers" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            Смотреть все <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {((stickersData && stickersData.length > 0 ? stickersData : null) || [
            { id: 1, text: "Скуплю монеты Золотой Орды...", budget: 500000, img: "/images/theme-empire.jpg" },
            { id: 2, text: "Куплю дирхемы Аббасидского халифата...", budget: 300000, img: "/images/theme-east.jpg" },
            { id: 3, text: "Разыскиваю редкие данги Ильханата...", budget: 200000, img: "/images/theme-medieval.jpg" },
            { id: 4, text: "Ищу ранние серебряные монеты...", budget: 150000, img: "/images/theme-udels.jpg" },
          ]).slice(0, 4).map((sticker: any, i: number) => (
            <div key={sticker.id || i} className="border border-border/60 bg-background/50 rounded-sm p-3 flex flex-col items-center text-center gap-2 relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-background shadow-sm mt-1">
                <img src={sticker.img || sticker.imageUrl || "/images/theme-medieval.jpg"} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-[10px] leading-tight text-foreground/90 line-clamp-3 h-9">
                {sticker.text || sticker.title}
              </p>
              <div className="w-full h-[1px] bg-border/40 my-1" />
              <p className="text-[9px] text-muted-foreground w-full">Бюджет: от {sticker.budget.toLocaleString('ru-RU')} ₽</p>
              <Link href="/stickers" data-testid={`link-offer-sticker-${sticker.id || i}`} className="w-full mt-1 border border-primary/30 text-primary text-[10px] py-1.5 rounded-sm hover:bg-primary/5 transition-colors active:scale-[0.98]">
                Предложить
              </Link>
            </div>
          ))}
        </div>
      </section>
      
    </aside>
  );
}
