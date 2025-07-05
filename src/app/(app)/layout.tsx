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
  Loader2
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
} from '@/components/ui/sidebar';
import { UserSwitcher } from '@/components/user-switcher';
import { useApp } from '@/contexts/app-context';
import { Logo } from '@/components/logo';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }


  const allNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Onboarding Specialist'] },
    { href: '/anchors', label: 'Anchors', icon: Building, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Onboarding Specialist'] },
    { href: '/dealers', label: 'Dealers', icon: Handshake, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Onboarding Specialist'] },
    { href: '/suppliers', label: 'Suppliers', icon: Users, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Onboarding Specialist'] },
    { href: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Onboarding Specialist'] },
    { href: '/reports', label: 'Reports', icon: BarChart, roles: ['Admin', 'Sales', 'Zonal Sales Manager'] },
    { href: '/admin', label: 'Admin Panel', icon: Shield, roles: ['Admin', 'Zonal Sales Manager', 'Onboarding Specialist'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(currentUser.role));

  if (currentUser.role === 'Onboarding Specialist') {
      const anchorItem = navItems.find(i => i.href === '/anchors');
      if (anchorItem) anchorItem.label = 'Onboarding';
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                 <Logo className="text-sidebar-foreground h-8 w-8" />
                 <h1 className="text-xl font-headline font-bold text-sidebar-foreground">Supermoney</h1>
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
            <UserSwitcher />
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2 font-headline text-xl font-bold text-primary">
            <Logo className="h-8 w-8 text-primary" />
            Supermoney
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
