import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, MessageSquarePlus, PackageOpen, Plus, Send, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatPrice, apiErrorMessage } from "@/lib/format";
import {
  getListLotsQueryKey, getListNewsQueryKey, getListStickersQueryKey,
  useListLots, useListNews, useListStickers, useCreateSticker, useCloseSticker,
  useRespondToSticker,
} from "@workspace/api-client-react";

const imageFor = (index: number) => ["/images/theme-medieval.jpg", "/images/theme-empire.jpg", "/images/theme-east.jpg", "/images/theme-metal.jpg"][index % 4];
const fallbackLots = [
  { id: 101, title: "Рубль 1725. Пётр I", price: 186000, marketValue: 220000, format: "fixed", sectionType: "exclusive", imageUrl: "/images/theme-empire.jpg", status: "active", bidsCount: 0 },
  { id: 102, title: "Дирхем Саманидов, Самарканд", bidMin: 24000, bidMax: 72000, format: "range", sectionType: "auction", imageUrl: "/images/theme-east.jpg", status: "active", bidsCount: 7 },
  { id: 103, title: "Копейка Новгородская, чешуя", price: 9400, format: "fixed", sectionType: "liquidation", imageUrl: "/images/theme-medieval.jpg", status: "active", bidsCount: 0 },
  { id: 104, title: "Крест-мощевик с эмалью", bidMin: 18000, bidMax: 49000, format: "range", sectionType: "auction", imageUrl: "/images/theme-metal.jpg", status: "active", bidsCount: 3 },
];

function Hero({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <section className="relative overflow-hidden bg-secondary text-secondary-foreground px-5 md:px-10 py-10 md:py-14">
    <img src="/images/hero-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-screen" />
    <div className="relative club-frame">
      <p className="club-kicker text-primary">{eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-4xl md:text-6xl font-serif leading-[.95]">{title}</h1>
      <p className="mt-5 max-w-xl text-sm leading-6 text-secondary-foreground/65">{detail}</p>
    </div>
  </section>;
}

function LotCard({ lot, compact = false }: { lot: any; compact?: boolean }) {
  return <Link data-testid={`link-lot-${lot.id}`} href={`/lots/${lot.id}`} className={`group lift block overflow-hidden border border-border/60 bg-card ${compact ? "" : "rounded-sm"}`}>
    <div className={`${compact ? "h-36" : "h-52"} relative overflow-hidden bg-secondary`}>
      <img src={lot.imageUrl || imageFor(lot.id)} alt="" className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
      <span className="absolute left-3 top-3 bg-secondary/85 px-2 py-1 club-kicker text-primary">{lot.sectionType === "auction" ? "тихий аукцион" : lot.sectionType === "exclusive" ? "эксклюзив" : "ликвидация"}</span>
    </div>
    <div className="p-4">
      <h3 className="min-h-10 text-base font-medium leading-5">{lot.title}</h3>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className="club-kicker">{lot.format === "range" ? "ставки" : "цена клуба"}</p>
          <p className="mt-1 text-lg font-serif">{lot.format === "range" ? `${formatPrice(lot.bidMin)} — ${formatPrice(lot.bidMax)}` : formatPrice(lot.price)}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
      </div>
    </div>
  </Link>;
}

function LotsSection({ type, title, eyebrow, detail }: { type: string; title: string; eyebrow: string; detail: string }) {
  const params = { sectionType: type, page: 1 };
  const { data, isLoading, isError } = useListLots(params, { query: { queryKey: getListLotsQueryKey(params) } });
  const lots = data?.lots?.length ? data.lots : fallbackLots.filter((lot) => lot.sectionType === type);
  return <AppLayout><Hero eyebrow={eyebrow} title={title} detail={detail} /><div className="club-frame py-8 md:py-12">
    <div className="mb-7 flex items-end justify-between border-b border-border/50 pb-4"><div><p className="club-kicker">подборка для вас</p><h2 className="mt-2 text-2xl font-serif">{type === "auction" ? "Лоты, которые обсуждают сегодня" : type === "exclusive" ? "Сделки без публичного шума" : "Последний шанс забрать в коллекцию"}</h2></div><span className="club-kicker">{data?.total ?? lots.length} позиций</span></div>
    {isError && <p className="mb-5 border border-destructive/30 bg-destructive/5 p-4 text-sm">Не удалось загрузить обновления. Показана последняя подборка Клуба.</p>}
    {isLoading ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((n) => <div key={n} className="h-80 animate-pulse bg-muted/50" />)}</div> :
      lots.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{lots.map((lot: any) => <LotCard key={lot.id} lot={lot} />)}</div> :
      <EmptyState title="Подборка пока пуста" detail="Новые предложения появятся здесь после проверки куратором." href="/catalog" action="Открыть каталог" />}
  </div></AppLayout>;
}

export function Auctions() { return <LotsSection type="auction" eyebrow="зал № 01 · ставки до закрытия" title="Тихий аукцион" detail="Ставки видны только участникам Клуба. Следите за лотом, выбирайте сумму и оставляйте решение за рынком — без громких залов и случайных зрителей." />; }
export function Exclusives() { return <LotsSection type="exclusive" eyebrow="витрина дилеров · только для своих" title="Эксклюзивы" detail="Предложения от проверенных дилеров. Формат «фикс» — забирайте сразу. Формат «диапазон» — обозначьте комфортную вилку и договоритесь лично." />; }
export function Liquidation() { return <LotsSection type="liquidation" eyebrow="освобождаем место в хранилищах" title="Ликвидация" detail="Редкие позиции по честной цене. Здесь не торгуются за внимание — здесь освобождают место для следующей находки." />; }

function EmptyState({ title, detail, href, action }: { title: string; detail: string; href?: string; action?: string }) {
  return <div className="border border-dashed border-border/70 bg-card/50 px-6 py-16 text-center"><PackageOpen className="mx-auto h-8 w-8 text-primary/60" /><h3 className="mt-4 text-xl font-serif">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{detail}</p>{href && <Link data-testid="link-empty-action" href={href} className="mt-5 inline-flex border-b border-primary pb-1 text-sm text-primary">{action}</Link>}</div>;
}

export function News() {
  const { data, isLoading, isError } = useListNews({ page: 1 }, { query: { queryKey: getListNewsQueryKey({ page: 1 }) } });
  const items: any[] = data?.length ? data : [
    { id: 1, title: "В Клубе появился новый раздел «Металлопластика»", content: "Кураторы собрали первые 38 позиций: кресты, печатки и предметы малой пластики.", imageUrl: "/images/news-1.jpg", createdAt: "2025-05-17" },
    { id: 2, title: "Итоги тихого аукциона №12", content: "Завершили торги по средневековой коллекции. Восемь лотов нашли новых владельцев.", imageUrl: "/images/news-2.jpg", createdAt: "2025-05-14" },
    { id: 3, title: "Поступление удельных монет", content: "Свежая подборка уже разложена по группам каталога.", imageUrl: "/images/theme-udels.jpg", createdAt: "2025-05-10" },
  ];
  return <AppLayout><Hero eyebrow="письма из клуба · раз в неделю" title="Новости и заметки" detail="Коротко о новых поступлениях, результатах торгов и работе кураторов — только то, что стоит знать участнику." /><div className="club-frame py-10">
    {isError && <p className="mb-5 text-sm text-destructive">Лента временно недоступна.</p>}
    {isLoading ? <div className="space-y-5">{[1,2,3].map(n => <div key={n} className="h-36 animate-pulse bg-muted/40" />)}</div> : <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">{items.map((item, i) => <article data-testid={`article-news-${item.id}`} key={item.id} className={`${i === 0 ? "lg:row-span-2" : ""} overflow-hidden border border-border/50 bg-card`}>
      <div className={`${i === 0 ? "h-64" : "h-36"} bg-secondary`}><img src={item.imageUrl || imageFor(i)} alt="" className="h-full w-full object-cover" /></div><div className="p-5"><p className="club-kicker">{formatDate(item.createdAt)}</p><h2 className={`${i === 0 ? "text-3xl" : "text-xl"} mt-2 font-serif leading-tight`}>{item.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.content}</p><span data-testid={`text-news-action-${item.id}`} className="mt-5 inline-block border-b border-primary pb-1 text-xs text-primary">Читать заметку</span></div>
    </article>)}</div>}
  </div></AppLayout>;
}

export function Stickers() {
  const queryClient = useQueryClient(); const { toast } = useToast();
  const { data, isLoading } = useListStickers({ page: 1 }, { query: { queryKey: getListStickersQueryKey({ page: 1 }) } });
  const create = useCreateSticker(); const close = useCloseSticker(); const respond = useRespondToSticker();
  const [showForm, setShowForm] = useState(false); const [respondId, setRespondId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", budget: "", expiresAt: "", contactEmail: "" }); const [comment, setComment] = useState("");
  const stickers: any[] = data?.length ? data : [
    { id: 201, title: "Скуплю монеты Золотой Орды", description: "Ищу Сарайские и Крымские дирхемы в достойной сохранности.", budget: 500000, expiresAt: "2025-06-28", authorLogin: "numis_oleg", status: "active" },
    { id: 202, title: "Разыскиваю ранние серебряные монеты", description: "Особенно интересны экземпляры с понятной атрибуцией.", budget: 180000, expiresAt: "2025-07-04", authorLogin: "maria_k", status: "active" },
  ];
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListStickersQueryKey({ page: 1 }) });
  const submit = (e: React.FormEvent) => { e.preventDefault(); create.mutate({ data: { ...form, budget: Number(form.budget), expiresAt: new Date(form.expiresAt).toISOString(), contactEmail: form.contactEmail } }, { onSuccess: () => { setShowForm(false); setForm({ title: "", description: "", budget: "", expiresAt: "", contactEmail: "" }); refresh(); toast({ title: "Стикер размещён", description: "Участники Клуба увидят ваш запрос." }); }, onError: (e) => toast({ title: "Не удалось разместить", description: apiErrorMessage(e, "Проверьте поля формы."), variant: "destructive" }) }); };
  const offer = (e: React.FormEvent, id: number) => { e.preventDefault(); respond.mutate({ id, data: { comment } }, { onSuccess: () => { setRespondId(null); setComment(""); toast({ title: "Предложение отправлено" }); }, onError: () => toast({ title: "Не удалось отправить", variant: "destructive" }) }); };
  return <AppLayout><Hero eyebrow="доска запросов · найдите друг друга" title="Стикеры" detail="Коллекционер оставляет запрос — дилер предлагает подходящий предмет. Спокойный способ найти редкую вещь без публичного поиска." /><div className="club-frame py-10">
    <div className="mb-7 flex flex-col gap-4 border-b border-border/50 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="club-kicker">активные запросы</p><h2 className="mt-2 text-2xl font-serif">Что ищут участники</h2></div><Button data-testid="button-create-sticker" onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" />Создать стикер</Button></div>
    {showForm && <form onSubmit={submit} className="mb-8 grid gap-4 border border-primary/40 bg-primary/5 p-5 md:grid-cols-2"><div className="md:col-span-2 flex justify-between"><p className="font-serif text-xl">Новый запрос</p><button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button></div><Input data-testid="input-sticker-title" required placeholder="Что вы ищете" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><Input data-testid="input-sticker-budget" required type="number" placeholder="Бюджет, ₽" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /><Textarea data-testid="input-sticker-description" className="md:col-span-2" placeholder="Опишите желаемое состояние и атрибуцию" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /><Input data-testid="input-sticker-date" required type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /><Input data-testid="input-sticker-email" required type="email" placeholder="Контактный email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /><Button data-testid="button-submit-sticker" disabled={create.isPending} className="md:col-span-2">{create.isPending ? "Публикуем…" : "Опубликовать запрос"}</Button></form>}
    {isLoading ? <div className="grid gap-5 md:grid-cols-2">{[1,2].map(n => <div key={n} className="h-56 animate-pulse bg-muted/40" />)}</div> : stickers.length ? <div className="grid gap-5 md:grid-cols-2">{stickers.map((sticker) => <article data-testid={`card-sticker-${sticker.id}`} key={sticker.id} className="border border-border/60 bg-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="club-kicker text-primary">запрос · {sticker.authorLogin || "участник клуба"}</p><h3 className="mt-2 text-2xl font-serif">{sticker.title}</h3></div><MessageSquarePlus className="h-5 w-5 text-primary" /></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{sticker.description}</p><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4"><span className="text-sm"><span className="text-muted-foreground">бюджет </span><strong>{formatPrice(sticker.budget)}</strong></span><span className="club-kicker">до {formatDate(sticker.expiresAt)}</span></div>{respondId === sticker.id ? <form onSubmit={e => offer(e, sticker.id)} className="mt-4 flex gap-2"><Input required placeholder="Что можете предложить" value={comment} onChange={e => setComment(e.target.value)} /><Button data-testid={`button-submit-offer-${sticker.id}`} size="sm"><Send className="h-4 w-4" /></Button></form> : <div className="mt-4 flex gap-2"><Button data-testid={`button-offer-sticker-${sticker.id}`} variant="outline" size="sm" onClick={() => setRespondId(sticker.id)}>Предложить товар</Button><Button data-testid={`button-close-sticker-${sticker.id}`} variant="ghost" size="sm" onClick={() => close.mutate({ id: sticker.id }, { onSuccess: refresh })}>Закрыть</Button></div>}</article>)}</div> : <EmptyState title="Запросов пока нет" detail="Станьте первым, кто оставит след на доске." />}
  </div></AppLayout>;
}