import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background/30">
          <ShieldAlert className="w-16 h-16 text-muted-foreground/30 mb-6" strokeWidth={1} />
          <h1 className="text-3xl font-serif text-foreground mb-3">Доступ запрещён</h1>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            Этот раздел является закрытым пространством администраторов Клуба. 
            У вашей учетной записи нет соответствующих прав доступа.
          </p>
        </div>
      </AppLayout>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
