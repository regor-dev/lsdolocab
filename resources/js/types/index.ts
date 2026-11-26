import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User | null;
    roles: string[];
    permissions: string[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    items?: NavItem[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash?: { success?: string | null; message?: string | null };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    profile_complete?: boolean;
    roles?: { id: number; role_name?: string; name?: string }[];
    birth_date?: string | null;
    age?: number | null;
    address?: string | null;
    cellphone_number?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    phone?: string | null;
    billing_name?: string | null;
    billing_address?: string | null;
    billing_city?: string | null;
    billing_postal_code?: string | null;
    billing_country?: string | null;
    payment_method?: string | null;
    payment_reference?: string | null;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
