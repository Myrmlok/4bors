import { useState } from 'react';
import {
  useListAdminLots,
  useUpdateLot,
  useDeleteLot,
  getListAdminLotsQueryKey,
  Lot,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { RequireAdmin } from './RequireAdmin';
import { Search } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  sold: 'Продан',
  expired: 'Снят',
  blitzed: 'Блиц',
};

const SECTION_LABELS: Record<string, string> = {
  auction: 'Аукцион',
  exclusive: 'Эксклюзив',
  liquidation: 'Ликвидация',
};

const PAGE_SIZE = 50;

export default function AdminLots() {
  const queryClient = useQueryClient();
  const updateLot = useUpdateLot();
  const deleteLot = useDeleteLot();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [lotToDelete, setLotToDelete] = useState<Lot | null>(null);

  const params = {
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    page,
  };
  const { data: lotsData, isLoading } = useListAdminLots(params, {
    query: { queryKey: getListAdminLotsQueryKey(params) },
  });

  const lots = lotsData?.lots ?? [];
  const total = lotsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filteredLots = lots.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['/api/admin/lots'] });

  const handleStatusChange = (id: number, status: string) => {
    updateLot.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: 'Статус обновлён', description: 'Статус лота успешно изменён.' });
        },
        onError: () => {
          toast({ title: 'Ошибка', description: 'Не удалось изменить статус лота.', variant: 'destructive' });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!lotToDelete) return;
    deleteLot.mutate(
      { id: lotToDelete.id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: 'Лот удалён', description: `«${lotToDelete.title}» удалён из каталога.` });
          setLotToDelete(null);
        },
        onError: () => {
          toast({ title: 'Ошибка', description: 'Не удалось удалить лот.', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <RequireAdmin>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border/40 bg-card">
          <h1 className="text-2xl font-serif text-foreground mb-1">Управление лотами</h1>
          <p className="text-sm text-muted-foreground">Контроль каталога: статусы и удаление лотов</p>
        </div>

        {/* Navigation Tabs */}
        <div className="px-8 pt-4 border-b border-border/40 bg-card/50 flex gap-6">
          <Link href="/admin" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Сводка</Link>
          <Link href="/admin/users" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Пользователи</Link>
          <Link href="/admin/invites" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Инвайты</Link>
          <div className="pb-3 border-b-2 border-primary text-sm font-medium text-foreground">Лоты</div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 flex flex-col min-h-0 bg-background/30">
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по названию лота..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border/40 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-background border border-border/40 py-2 px-3 text-sm focus:outline-none focus:border-primary cursor-pointer hover:border-primary/50 transition-colors"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="sold">Проданные</option>
                <option value="expired">Снятые</option>
                <option value="blitzed">Блиц</option>
              </select>
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Всего: <span className="text-foreground">{total}</span>
            </div>
          </div>

          <div className="flex-1 border border-border/40 bg-card overflow-auto shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase tracking-widest bg-background/80 sticky top-0 z-10 border-b border-border/40 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-medium w-16">ID</th>
                  <th className="px-6 py-4 font-medium">Лот</th>
                  <th className="px-6 py-4 font-medium">Раздел</th>
                  <th className="px-6 py-4 font-medium">Цена</th>
                  <th className="px-6 py-4 font-medium">Создан</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">Загрузка лотов</span>
                    </td>
                  </tr>
                ) : filteredLots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-muted-foreground/50 font-serif text-lg mb-1">Лотов не найдено</div>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">Попробуйте изменить фильтры</span>
                    </td>
                  </tr>
                ) : filteredLots.map((lot) => (
                  <tr key={lot.id} className={`transition-colors hover:bg-black/5 ${lot.status !== 'active' ? 'opacity-70 bg-background/50' : ''}`}>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">#{lot.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground line-clamp-1 max-w-[280px]" title={lot.title}>{lot.title}</div>
                      {lot.bidsCount !== undefined && lot.bidsCount > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">Ставок: {lot.bidsCount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {SECTION_LABELS[lot.sectionType] ?? lot.sectionType}
                    </td>
                    <td className="px-6 py-4 text-xs text-foreground/90 whitespace-nowrap">
                      {lot.price != null ? `${lot.price.toLocaleString('ru-RU')} ₽` : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {format(new Date(lot.createdAt), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={lot.status}
                        onChange={(e) => handleStatusChange(lot.id, e.target.value)}
                        className="bg-transparent border border-border/40 py-1.5 px-3 text-sm focus:outline-none focus:border-primary cursor-pointer hover:border-primary/50 transition-colors"
                        disabled={updateLot.isPending}
                      >
                        <option value="active">{STATUS_LABELS.active}</option>
                        <option value="sold">{STATUS_LABELS.sold}</option>
                        <option value="expired">{STATUS_LABELS.expired}</option>
                        <option value="blitzed">{STATUS_LABELS.blitzed}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setLotToDelete(lot)}
                        className="text-[11px] text-destructive hover:text-destructive/80 transition-colors uppercase tracking-widest font-medium px-3 py-1.5 border border-destructive/30 hover:border-destructive/60 rounded-sm"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-[11px] uppercase tracking-widest font-medium px-3 py-1.5 border border-border/40 hover:border-primary/60 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Назад
              </button>
              <span className="text-xs text-muted-foreground">
                Стр. <span className="text-foreground">{page}</span> из {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-[11px] uppercase tracking-widest font-medium px-3 py-1.5 border border-border/40 hover:border-primary/60 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                Вперёд
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {lotToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/40 shadow-xl w-full max-w-md flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-serif text-foreground mb-2">Удаление лота</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Лот <strong className="text-foreground">«{lotToDelete.title}»</strong> будет удалён безвозвратно вместе со ставками. Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLotToDelete(null)}
                className="px-5 py-2 text-xs font-medium text-foreground hover:bg-black/5 transition-colors border border-border/40 uppercase tracking-widest"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLot.isPending}
                className="px-5 py-2 text-xs font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity border border-destructive uppercase tracking-widest disabled:opacity-50"
              >
                {deleteLot.isPending ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireAdmin>
  );
}
