'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building,
  Users,
  Handshake,
  ListTodo,
  Shield,
  FileUp,
  BarChart,
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
} from '@/components/ui/sidebar';
import { UserSwitcher } from '@/components/user-switcher';
import { useApp } from '@/contexts/app-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useApp();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/anchors', label: 'Anchors', icon: Building },
    { href: '/dealers', label: 'Dealers', icon: Handshake },
    { href: '/suppliers', label: 'Suppliers', icon: Users },
    { href: '/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/reports', label: 'Reports', icon: BarChart },
  ];

  if (currentUser.role === 'Admin') {
    navItems.push({ href: '/admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                 <FileUp className="text-accent h-8 w-8" />
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
      <main className="flex-1">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
