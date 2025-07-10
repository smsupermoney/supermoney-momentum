

'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building,
  Users,
  Handshake,
  ListTodo,
  Shield,
  BarChart,
  BookCheck,
  Loader2,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { UserSwitcher } from '@/components/user-switcher';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useApp } from '@/contexts/app-context';
import { useLanguage } from '@/contexts/language-context';
import { Logo } from '@/components/logo';
import { NotificationBell } from '@/components/notifications/notification-bell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useApp();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading Sales Hub...</p>
        </div>
      </div>
    );
  }


  const allNavItems = [
    { href: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/activities', labelKey: 'sidebar.activities', icon: BookCheck, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'] },
    { href: '/anchors', labelKey: 'sidebar.anchors', icon: Building, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/dealers', labelKey: 'sidebar.dealers', icon: Handshake, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/suppliers', labelKey: 'sidebar.vendors', icon: Users, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/tasks', labelKey: 'sidebar.tasks', icon: ListTodo, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/reports', labelKey: 'sidebar.reports', icon: BarChart, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/admin', labelKey: 'sidebar.admin', icon: Shield, roles: ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(currentUser.role)).map(item => {
    let label = t(item.labelKey);
    return { ...item, label };
  });

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <img
                src="/assets/images/logowhite.png" // path from public/
                alt="Logo"
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            <div className="group-data-[state=collapsed]:hidden">
              <NotificationBell />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <LanguageSwitcher />
          <SidebarSeparator />
          <UserSwitcher />
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 md:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div className="flex items-center gap-2 font-headline text-xl font-bold text-primary">
              <Logo className="h-8 w-8 text-primary" />
              Supermoney
            </div>
          </div>
          <NotificationBell />
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
