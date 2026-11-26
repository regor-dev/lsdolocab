import AppLogoIcon from '@/components/app-logo-icon';
import InventoryOverview from '@/components/dashboard/inventory-overview';
import QuickActions from '@/components/dashboard/quick-actions';
import type { DashboardProps } from '@/components/dashboard/types';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Box, Package, ShoppingBag, ShoppingCart, type LucideIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

// Created once at module scope instead of on every row of every render.
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const moneyFormatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// `order_date` is a date-only string (YYYY-MM-DD). Parse as local time so it never shifts a day.
const formatOrderDate = (value: string | null) => (value ? dateFormatter.format(new Date(`${value}T00:00:00`)) : '—');

const YEAR = new Date().getFullYear();

function Eyebrow({ children }: { children: React.ReactNode }) {
    return <p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">{children}</p>;
}

function StatCard({ title, value, description, icon: Icon }: { title: string; value: number; description: string; icon: LucideIcon }) {
    return (
        <div className="group rounded-xl border border-white/10 bg-[#0b0b0b] p-5 transition duration-300 hover:border-white/40">
            <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white">
                    <Icon size={21} aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold tracking-widest text-gray-600 uppercase">LS Dolocab</span>
            </div>
            <div className="mt-6">
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <p className="mt-2 text-3xl font-black">{value.toLocaleString()}</p>
                <p className="mt-2 text-xs text-gray-600">{description}</p>
            </div>
        </div>
    );
}

export default function Dashboard({ userName, canManage, overview, inventory, recentOrders, staffs }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard | LS Dolocab" />

            <div className="min-h-full bg-black p-4 text-white sm:p-6 lg:p-8">
                <div className="w-full space-y-8">
                    <section className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0b] p-6 sm:p-8">
                        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full border border-white/5" />
                        <div className="absolute -top-5 -right-5 h-36 w-36 rounded-full border border-white/5" />
                        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                            <div>
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                                        <AppLogoIcon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-bold tracking-[0.2em] text-gray-400">Dolocab</span>
                                </div>
                                <Eyebrow>Store Management</Eyebrow>
                                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Welcome, {userName}.</h1>
                                <p className="mt-3 text-sm leading-7 text-gray-400">
                                    Manage your footwear inventory and monitor your store's activity in one place.
                                </p>
                            </div>
                            <ShoppingBag size={90} strokeWidth={1} className="hidden text-white/10 sm:block" aria-hidden="true" />
                        </div>
                    </section>

                    <section aria-labelledby="overview-heading">
                        <div className="mb-5">
                            <Eyebrow>Overview</Eyebrow>
                            <h2 id="overview-heading" className="mt-2 text-2xl font-black">
                                Store Summary
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">A quick look at your store information.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard title="Total Products" value={overview.products} description="Products in your inventory" icon={Package} />
                            <StatCard title="Categories" value={overview.categories} description="Available shoe categories" icon={Box} />
                            <StatCard title="Orders" value={overview.orders} description="Total customer orders" icon={ShoppingCart} />
                            <StatCard title="Customers" value={overview.customers} description="Unique customers with orders" icon={ShoppingBag} />
                        </div>
                    </section>

                    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <InventoryOverview inventory={inventory} canManage={canManage} className={canManage ? 'lg:col-span-2' : 'lg:col-span-3'} />
                        {canManage && <QuickActions />}
                    </section>

                    {canManage && (
                        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <div className="rounded-xl border border-white/10 bg-[#0b0b0b] p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <Eyebrow>Orders</Eyebrow>
                                        <h2 className="mt-2 text-xl font-black">Recent Orders</h2>
                                    </div>
                                    <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white">
                                        View all <ArrowRight size={16} aria-hidden="true" />
                                    </Link>
                                </div>

                                {recentOrders.length ? (
                                    <ul className="mt-5 divide-y divide-white/10">
                                        {recentOrders.map((order) => (
                                            <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                                                <div>
                                                    <Link href={`/staff-orders/${order.id}`} className="font-semibold hover:text-gray-300">
                                                        {order.order_number}
                                                    </Link>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {order.customer_name} · {formatOrderDate(order.order_date)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300 capitalize">{order.status}</span>
                                                    <span className="text-sm font-semibold">{moneyFormatter.format(Number(order.total))}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-5 rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">
                                        No orders have been recorded yet.
                                    </p>
                                )}
                            </div>

                            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0b] p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <Eyebrow>Team</Eyebrow>
                                        <h2 className="mt-2 text-xl font-black">Staff Directory</h2>
                                    </div>
                                    <Link href="/admin/user" className="text-sm font-semibold text-gray-400 hover:text-white">
                                        Manage team
                                    </Link>
                                </div>
                                <div className="mt-5 overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-white/10 text-xs tracking-wider text-gray-500 uppercase">
                                            <tr>
                                                <th scope="col" className="py-3 pr-4 font-semibold">Staff member</th>
                                                <th scope="col" className="py-3 font-semibold">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {staffs.length ? (
                                                staffs.map((staff) => (
                                                    <tr key={staff.id}>
                                                        <td className="py-3 pr-4 font-medium text-gray-200">{staff.name}</td>
                                                        <td className="py-3 text-gray-400">{staff.email}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={2} className="py-6 text-center text-gray-500">No staff members found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    <footer className="flex flex-col justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-sm font-bold tracking-[0.2em] text-gray-400">LS Dolocab</p>
                            <p className="mt-1 text-xs text-gray-600">Quality. Comfort. Style.</p>
                        </div>
                        <p className="text-xs text-gray-600">© {YEAR} LS Dolocab. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        </AppLayout>
    );
}
