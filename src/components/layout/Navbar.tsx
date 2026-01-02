// ============================================================================
// COMPONENTE: NAVBAR
// ============================================================================

import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  Settings,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { IMAGES } from '@/lib/constants';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
    { icon: Map, label: t('nav.map'), path: '/map' },
    { icon: TrendingUp, label: t('nav.timeSeries'), path: '/time-series' },
    { icon: FileText, label: t('nav.reports'), path: '/reports' },
    { icon: AlertTriangle, label: t('nav.alerts'), path: '/alerts' },
  ];

  // Agregar reporte comunitario solo para monitores
  if (user?.role === 'COMMUNITY_MONITOR') {
    navItems.push({
      icon: MessageSquare,
      label: t('nav.communityReport'),
      path: '/community-report',
    });
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo y Nombre */}
        <Link to="/" className="flex items-center gap-3">
          <img src={IMAGES.logo} alt="SMyEG Logo" className="h-10 w-10" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-primary">SMyEG</h1>
            <p className="text-xs text-muted-foreground">
              Sistema de Monitoreo y Evaluación Geoespacial
            </p>
          </div>
        </Link>

        {/* Navegación Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              asChild
              className="gap-2"
            >
              <Link to={item.path}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Acciones de Usuario */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          
          {/* Menú de Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    {user?.institution || user?.community}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Navegación Mobile */}
              <div className="md:hidden">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
              
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('nav.settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};