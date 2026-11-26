import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

export function useAuth() {
    const { auth } = usePage<SharedData>().props;
    return {
        user: auth.user,
        roles: auth.roles ?? [],
        permissions: auth.permissions ?? [],
        can: (perm: string) => (auth.permissions ?? []).includes(perm),
        hasRole: (role: string) => (auth.roles ?? []).includes(role),
    };
}
