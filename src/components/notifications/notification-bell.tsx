
'use client';

import { useApp } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Bell, AlertTriangle, CalendarClock, Users, Star, Trophy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';

const iconMap: { [key: string]: React.ElementType } = {
    AlertTriangle,
    CalendarClock,
    Users,
    Star,
    Trophy,
    Bell,
};

export function NotificationBell() {
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead, t } = useApp();
    const router = useRouter();

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = (notification: Notification) => {
        markNotificationAsRead(notification.id);
        router.push(notification.href);
    };
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 focus-visible:ring-sidebar-ring">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 sm:w-96" align="end">
                <DropdownMenuLabel>{t('notifications.title')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    <DropdownMenuGroup>
                        {notifications.length > 0 ? (
                            notifications.map(notification => {
                                const Icon = iconMap[notification.icon] || Bell;
                                return (
                                    <DropdownMenuItem key={notification.id} onClick={() => handleNotificationClick(notification)} className={cn("flex items-start gap-3 p-2 h-auto cursor-pointer focus:bg-accent focus:text-accent-foreground", !notification.isRead && "bg-secondary")}>
                                        <Icon className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                                        <div className="flex flex-col whitespace-normal">
                                            <p className="text-sm font-medium">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground">{notification.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
                                        </div>
                                    </DropdownMenuItem>
                                );
                            })
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {t('notifications.noNotifications')}
                            </div>
                        )}
                    </DropdownMenuGroup>
                </ScrollArea>
                {unreadCount > 0 && (
                    <>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0 focus:bg-transparent">
                            <Button variant="ghost" size="sm" className="w-full" onClick={markAllNotificationsAsRead}>
                                {t('notifications.markAllAsRead')}
                            </Button>
                         </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
