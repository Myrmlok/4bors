import { useState } from 'react';
import { 
  useListInviteLinks, 
  useCreateInviteLink, 
  getListInviteLinksQueryKey,
  InviteLinkInputRole
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { RequireAdmin } from './RequireAdmin';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminInvites() {
  const { data: invites = [], isLoading } = useListInviteLinks();
  const createInvite = useCreateInviteLink();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [role, setRole] = useState<InviteLinkInputRole>('collector');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createInvite.mutate({ data: { role } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInviteLinksQueryKey() });
        toast({ title: 'Инвайт создан', description: 'Ссылка успешно сгенерирована.' });
      },
      onError: () => {
        toast({ title: 'Ошибка', description: 'Не удалось создать инвайт.', variant: 'destructive' });
      }
    });
  };

  const getInviteLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const base = import.meta.env.BASE_URL || '/';
    return `${origin}${base}register/${token}`;
  };

  const copyToClipboard = async (id: number, token: string) => {
    try {
      await navigator.clipboard.writeText(getInviteLink(token));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: 'Скопировано', description: 'Ссылка скопирована в буфер обмена.' });
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось скопировать ссылку.', variant: 'destructive' });
    }
  };

  return (
    <RequireAdmin>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border/40 bg-card">
          <h1 className="text-2xl font-serif text-foreground mb-1">Инвайты</h1>
          <p className="text-sm text-muted-foreground">Генерация пригласительных ссылок для новых участников</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="px-8 pt-4 border-b border-border/40 bg-card/50 flex gap-6">
          <Link href="/admin" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Сводка</Link>
          <Link href="/admin/users" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Пользователи</Link>
          <div className="pb-3 border-b-2 border-primary text-sm font-medium text-foreground">Инвайты</div>
          <Link href="/admin/lots" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Лоты</Link>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 flex flex-col min-h-0 bg-background/30">
          {/* Create form */}
          <div className="mb-8 p-6 bg-card border border-border/40 flex flex-col gap-5 shadow-sm max-w-2xl">
            <div>
              <h2 className="text-sm font-serif uppercase tracking-widest text-foreground mb-1">Новый инвайт</h2>
              <p className="text-xs text-muted-foreground">Выберите роль будущего участника Клуба.</p>
            </div>
            
            <form onSubmit={handleCreate} className="flex gap-4 items-end">
              <div className="flex flex-col gap-2 w-64">
                <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Роль участника
                </label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as InviteLinkInputRole)}
                  className="w-full bg-background border border-border/40 py-2.5 px-3 text-sm focus:outline-none focus:border-primary cursor-pointer transition-colors hover:border-primary/50"
                >
                  <option value="collector">Коллекционер</option>
                  <option value="dealer">Дилер</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={createInvite.isPending}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-medium uppercase tracking-widest hover:opacity-90 transition-opacity border border-primary disabled:opacity-50 flex items-center gap-2"
              >
                {createInvite.isPending ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Сгенерировать</span>
              </button>
            </form>
          </div>

          {/* List */}
          <div className="flex-1 border border-border/40 bg-card overflow-auto shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase tracking-widest bg-background/80 sticky top-0 z-10 border-b border-border/40 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-medium w-16">ID</th>
                  <th className="px-6 py-4 font-medium">Ссылка (Токен)</th>
                  <th className="px-6 py-4 font-medium">Роль</th>
                  <th className="px-6 py-4 font-medium">Создан</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">Загрузка инвайтов</span>
                    </td>
                  </tr>
                ) : invites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-muted-foreground/50 font-serif text-lg mb-1">Список пуст</div>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">Сгенерируйте первый инвайт</span>
                    </td>
                  </tr>
                ) : invites.map(invite => (
                  <tr key={invite.id} className={`transition-colors hover:bg-black/5 ${invite.usedAt ? 'opacity-70 bg-background/50' : ''}`}>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">#{invite.id}</td>
                    <td className="px-6 py-4 font-mono text-xs text-foreground/80 max-w-[200px] truncate" title={getInviteLink(invite.token)}>
                      ...{invite.token.substring(0, 16)}...
                    </td>
                    <td className="px-6 py-4">
                      {invite.role === 'dealer' ? 'Дилер' : invite.role === 'collector' ? 'Коллекционер' : invite.role}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {format(new Date(invite.createdAt), 'dd.MM.yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      {invite.usedAt ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-medium uppercase tracking-widest bg-muted text-muted-foreground border border-muted-foreground/20">
                            Использован
                          </span>
                          <span className="text-[10px] text-muted-foreground/70">
                            {format(new Date(invite.usedAt), 'dd.MM.yyyy')}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-medium uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => copyToClipboard(invite.id, invite.token)}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center border border-border/40 hover:border-primary/50 bg-background rounded-sm"
                        title="Скопировать ссылку"
                      >
                        {copiedId === invite.id ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
}
