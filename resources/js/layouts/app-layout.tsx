import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import CustomerHeaderLayout from '@/layouts/app/customer-header-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const { auth } = usePage<SharedData>().props;
    const roles = auth?.user?.roles ?? [];
    const isAdmin = roles.some((role) => role.role_name === 'Admin');
    const isCustomer = roles.some((role) => role.role_name === 'Customer');

    if (isCustomer && !isAdmin) {
        return <CustomerHeaderLayout>{children}</CustomerHeaderLayout>;
    }

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppLayoutTemplate>
    );
}
