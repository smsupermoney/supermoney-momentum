
'use client';

import { useApp } from '@/contexts/app-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { LogOut, BookUser } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export function UserSwitcher() {
  const { currentUser, logout } = useApp();
  const { t } = useLanguage();
  const router = useRouter();

  if (!currentUser) return null;

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  const handleLogout = () => {
    logout();
    router.push('/login');
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto text-left">
                 <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold text-sidebar-foreground truncate">{currentUser.name}</span>
                        <span className="text-xs text-sidebar-foreground/70 truncate">{currentUser.role}</span>
                    </div>
                 </div>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/USER_MANUAL.md" download="Supermoney_CRM_User_Manual.md" className="cursor-pointer">
                <BookUser className="mr-2 h-4 w-4" />
                <span>Download Manual</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('userSwitcher.logout')}</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
