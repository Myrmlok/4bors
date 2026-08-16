import { useGetDashboardStats, useGetOnlineCount } from '@workspace/api-client-react';
import { RequireAdmin } from './RequireAdmin';
import { Users, Gavel, FileText, Tag, Activity } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminDashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: online } = useGetOnlineCount();

  const statCards = [
    { label: 'Всего участников', value: stats?.totalUsers ?? '-', icon: Users, link: '/admin/users' },
    { label: 'Сейчас онлайн', value: online?.count ?? '-', icon: Activity },
    { label: 'Активных лотов', value: stats?.activeLots ?? '-', icon: Gavel },
    { label: 'Активных стикеров', value: stats?.activeStickers ?? '-', icon: FileText },
    { label: 'Тематик', value: stats?.totalThemes ?? '-', icon: Tag },
  ];

  return (
    <RequireAdmin>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border/40 bg-card">
          <h1 className="text-2xl font-serif text-foreground mb-1">Панель администратора</h1>
          <p className="text-sm text-muted-foreground">Общая статистика и управление Клубом</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="px-8 pt-4 border-b border-border/40 bg-card/50 flex gap-6">
          <div className="pb-3 border-b-2 border-primary text-sm font-medium text-foreground">Сводка</div>
          <Link href="/admin/users" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Пользователи</Link>
          <Link href="/admin/invites" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Инвайты</Link>
          <Link href="/admin/lots" className="pb-3 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Лоты</Link>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-auto bg-background/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, idx) => {
              const Icon = stat.icon;
              const CardWrapper = stat.link
                ? ({ children, className }: { children: React.ReactNode; className?: string }) => (
                    <Link href={stat.link!} className={className}>{children}</Link>
                  )
                : ({ children, className }: { children: React.ReactNode; className?: string }) => (
                    <div className={className}>{children}</div>
                  );
              return (
                <CardWrapper 
                  key={idx}
                  className={`p-6 border border-border/40 bg-card flex flex-col relative group shadow-sm ${stat.link ? 'hover:bg-black/5 cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
                >
                  <Icon className="w-5 h-5 text-primary mb-4 opacity-80" />
                  <div className="text-4xl font-serif text-foreground mb-2">{stat.value}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                  {stat.link && (
                    <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        Перейти
                      </span>
                    </div>
                  )}
                </CardWrapper>
              );
            })}
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
}
