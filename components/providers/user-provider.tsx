'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import { Role } from '@/config/rbac';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  profile_image_url?: string;
  [key: string]: any;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  role: Role | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = (user?.role?.toLowerCase() ?? null) as Role | null;

  return (
    <UserContext.Provider value={{ user, setUser, role, isLoading, setIsLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
