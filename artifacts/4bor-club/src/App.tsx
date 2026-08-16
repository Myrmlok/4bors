import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminInvites from '@/pages/admin/AdminInvites';
import AdminLots from '@/pages/admin/AdminLots';
import Catalog, { CatalogTheme } from '@/pages/Catalog';
import CatalogGroup from '@/pages/CatalogGroup';
import LotDetail from '@/pages/LotDetail';
import Cart from '@/pages/Cart';
import Profile from '@/pages/Profile';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { Auctions, Exclusives, Liquidation, Stickers, News } from '@/pages/ClubPages';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        
        {/* Auth */}
        <Route path="/login" component={Login} />
        <Route path="/register/:token" component={Register} />
        
        {/* Main Sections */}
        <Route path="/catalog" component={Catalog} />
        <Route path="/catalog/:themeId" component={CatalogTheme} />
        <Route path="/catalog/:themeId/groups/:groupId">
          <CatalogGroup />
        </Route>
        <Route path="/catalog/:themeId/groups/:groupId/liquidation">
          <CatalogGroup liquidation />
        </Route>
        <Route path="/lots/:id" component={LotDetail} />
        <Route path="/auctions" component={Auctions} />
        <Route path="/exclusives" component={Exclusives} />
        <Route path="/liquidation" component={Liquidation} />
        <Route path="/stickers" component={Stickers} />
        <Route path="/cart" component={Cart} />
        <Route path="/profile" component={Profile} />
        <Route path="/news" component={News} />
        
        {/* Admin */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/invites" component={AdminInvites} />
        <Route path="/admin/lots" component={AdminLots} />

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
