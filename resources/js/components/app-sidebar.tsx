import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Footprints, LayoutGrid, Package, ShoppingCart, ShieldCheck, UserRound, Warehouse } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Orders',
        url: '/admin/orders',
        icon: ShoppingCart,
    },
    {
        title: 'Products',
        url: '/admin/product',
        icon: Package,
    },
    {
        title: 'Brands',
        url: '/admin/brand',
        icon: Footprints,
    },
    {
        title: 'Stock',
        url: '/stocks',
        icon: Warehouse,
    },
    {
        title: 'Users',
        url: '/admin/user',
        icon: UserRound,
    },
    {
        title: 'Roles',
        url: '/admin/role',
        icon: ShieldCheck,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const roles = auth?.user?.roles?.map((role) => role.role_name) ?? [];
    const isAdmin = roles.includes('Admin');
    const isStaff = roles.includes('Staff') || isAdmin;

    const visibleNavItems = isAdmin
        ? mainNavItems
        : isStaff
        ? mainNavItems
              .filter((item) => ['Orders', 'Stock'].includes(item.title))
              .map((item) =>
                  item.title === 'Orders'
                      ? { ...item, url: '/staff-orders' }
                      : item
              )
        : mainNavItems.slice(0, 1);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
