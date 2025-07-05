'use client';

import { useApp } from '@/contexts/app-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function UserSwitcher() {
  const { users, currentUser, setCurrentUser } = useApp();

  const handleValueChange = (uid: string) => {
    const user = users.find(u => u.uid === uid);
    if (user) {
      setCurrentUser(user);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-sidebar-foreground/80">View as:</span>
      <Select value={currentUser.uid} onValueChange={handleValueChange}>
        <SelectTrigger className="w-auto border-none bg-transparent text-sidebar-foreground hover:bg-sidebar-accent h-8 px-2 focus:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="Select user" />
        </SelectTrigger>
        <SelectContent>
          {users.map(user => (
            <SelectItem key={user.uid} value={user.uid}>
              {user.name} ({user.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
