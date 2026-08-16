import { useState } from 'react';
import { 
  useListUsers, 
  useUpdateUser, 
  getListUsersQueryKey, 
  User, 
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { RequireAdmin } from './RequireAdmin';
import { Search } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdminUsers() {
  const { data: users = [], isLoading } = useListUsers();
  const queryClient = useQueryClient();
  const updateUser = useUpdateUser();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');

  const filteredUsers = users.filter(u => 
    u.login.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (id: number, newRole: string) => {
    updateUser.mutate({ id, data: { role: newRole } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: 'Роль обновлена', description: 'Права пользователя успешно изменены.' });
      },
      onError: () => {
        toast({ title: 'Ошибка', description: 'Не удалось изменить роль.', variant: 'destructive' });
      }
    });
  };

  const handleUnban = (id: number) => {
    updateUser.mutate({ id, data: { isBanned: false } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: 'Пользователь разбанен', description: 'Доступ восстановлен.' });
      }
    });
  };

  const handleBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    updateUser.mutate({ id: selectedUser.id, data: { isBanned: true, ...(banReason ? { banReason } : {}) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: 'Пользователь забанен', description: 'Доступ к Клубу закрыт.' });
        setBanModalOpen(false);
        setSelectedUser(null);
        setBanReason('');
      }
    });
  };

  const openBanModal = (user: User) => {
    setSelectedUser(user);
    setBanReason('');
    setBanModalOpen(true);
  };

  return (
    <RequireAdmin>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border/40 bg-card">
          <h1 className="text-2xl font-serif text-foreground mb-1">Управление пользователями</h1>
          <p className="text-sm text-muted-foreground">Назначение ролей и контроль доступа</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="px-8 pt-4 border-b border-border/40 bg-card/50 flex gap-6">
          <Link href="/admin" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Сводка</Link>
          <div className="pb-3 border-b-2 border-primary text-sm font-medium text-foreground">Пользователи</div>
          <Link href="/admin/invites" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Инвайты</Link>
          <Link href="/admin/lots" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Лоты</Link>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 flex flex-col min-h-0 bg-background/30">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Поиск по логину или email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border/40 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Найдено: <span className="text-foreground">{filteredUsers.length}</span>
            </div>
          </div>

          <div className="flex-1 border border-border/40 bg-card overflow-auto shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase tracking-widest bg-background/80 sticky top-0 z-10 border-b border-border/40 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 font-medium w-16">ID</th>
                  <th className="px-6 py-4 font-medium">Пользователь</th>
                  <th className="px-6 py-4 font-medium">Дата регистр.</th>
                  <th className="px-6 py-4 font-medium">Роль</th>
                  <th className="px-6 py-4 font-medium">Статус</th>
                  <th className="px-6 py-4 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">Загрузка пользователей</span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-muted-foreground/50 font-serif text-lg mb-1">Ничего не найдено</div>
                      <span className="text-xs text-muted-foreground uppercase tracking-widest">Попробуйте изменить запрос</span>
                    </td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className={`transition-colors hover:bg-black/5 ${u.isBanned ? 'opacity-70 bg-background/50' : ''}`}>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">#{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{u.login}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {format(new Date(u.createdAt), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-transparent border border-border/40 py-1.5 px-3 text-sm focus:outline-none focus:border-primary cursor-pointer hover:border-primary/50 transition-colors"
                        disabled={updateUser.isPending}
                      >
                        <option value="collector">Коллекционер</option>
                        <option value="dealer">Дилер</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {u.isBanned ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-medium uppercase tracking-widest bg-destructive/10 text-destructive border border-destructive/20">
                            Забанен
                          </span>
                          {u.banReason && (
                            <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[180px]" title={u.banReason}>
                              Причина: {u.banReason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[10px] font-medium uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.isBanned ? (
                        <button 
                          onClick={() => handleUnban(u.id)}
                          disabled={updateUser.isPending}
                          className="text-[11px] text-primary hover:text-primary/80 transition-colors uppercase tracking-widest font-medium px-3 py-1.5 border border-primary/30 hover:border-primary/60 rounded-sm"
                        >
                          Разбанить
                        </button>
                      ) : (
                        <button 
                          onClick={() => openBanModal(u)}
                          className="text-[11px] text-destructive hover:text-destructive/80 transition-colors uppercase tracking-widest font-medium px-3 py-1.5 border border-destructive/30 hover:border-destructive/60 rounded-sm"
                        >
                          Бан
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      {banModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/40 shadow-xl w-full max-w-md flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-serif text-foreground mb-2">Блокировка пользователя</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Вы собираетесь закрыть доступ для <strong className="text-foreground">{selectedUser?.login}</strong>. Пожалуйста, укажите причину (опционально).
            </p>
            <form onSubmit={handleBan} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Причина блокировки
                </label>
                <input 
                  type="text"
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  placeholder="Например: Нарушение правил аукциона"
                  className="w-full px-4 py-2.5 bg-background border border-border/40 text-sm focus:outline-none focus:border-destructive transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setBanModalOpen(false)}
                  className="px-5 py-2 text-xs font-medium text-foreground hover:bg-black/5 transition-colors border border-border/40 uppercase tracking-widest"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  disabled={updateUser.isPending}
                  className="px-5 py-2 text-xs font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity border border-destructive uppercase tracking-widest disabled:opacity-50"
                >
                  {updateUser.isPending ? 'Загрузка...' : 'Заблокировать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RequireAdmin>
  );
}
