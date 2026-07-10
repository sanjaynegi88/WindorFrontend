'use client';

import * as React from 'react';
import { getPropertyOwners } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { MOCK_USERS } from '@/config/mock-users';

interface UserSelectProps {
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    labelClassName?: string;
    required?: boolean;
    onLoaded?: () => void;
    fallbackEmail?: string;
}

export function UserSelect({
    value,
    onChange,
    label,
    placeholder = "Select User",
    className,
    labelClassName,
    required = false,
    onLoaded,
    fallbackEmail
}: UserSelectProps) {
    const [userList, setUserList] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [hasAttemptedFallback, setHasAttemptedFallback] = React.useState(false);

    React.useEffect(() => {
        if (!value && fallbackEmail && userList.length > 0 && !hasAttemptedFallback) {
            setHasAttemptedFallback(true);
            const matchedUser = userList.find((u: any) => u.email?.toLowerCase() === fallbackEmail.toLowerCase());
            if (matchedUser && onChange) {
                onChange(matchedUser.id);
            }
        }
    }, [userList, value, fallbackEmail, onChange, hasAttemptedFallback]);

    React.useEffect(() => {
        let active = true;
        async function fetchUsers() {
            try {
                setLoading(true);
                const response = await getPropertyOwners();
                if (!active) return;
                
                let data = [];
                if (Array.isArray(response)) {
                    data = response;
                } else if (response && Array.isArray(response.data)) {
                    data = response.data;
                }
                
                if (data.length > 0) {
                    setUserList(data);
                } else {
                    const owners = MOCK_USERS.filter(u => u.role === 'property_owner');
                    setUserList(owners);
                }
            } catch (error) {
                console.error('Failed to load users:', error);
            } finally {
                if (active) setLoading(false);
                if (onLoaded) onLoaded();
            }
        }

        fetchUsers();
        return () => { active = false; };
    }, []);

    return (
        <div className={cn("space-y-2 w-full", className)}>
            {label && (
                <Label 
                    htmlFor="user-select" 
                    className={cn("text-sm font-semibold", labelClassName)}
                >
                    {label}
                    {required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
            )}
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id="user-select" className="w-full h-12 text-sm group">
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                        <SelectValue placeholder={placeholder} />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {userList.length === 0 && !loading && (
                        <div className="p-2 text-sm text-center text-muted-foreground">
                            No users found
                        </div>
                    )}
                    {userList.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                            {user.email || user.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
