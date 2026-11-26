import { Link } from '@inertiajs/react';
import { ArrowRight, Package, ShoppingBag, ShoppingCart, Users, type LucideIcon } from 'lucide-react';

interface QuickAction {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
}

// Admin routes live under the `admin` prefix in routes/web.php.
const ACTIONS: QuickAction[] = [
    { title: 'Manage Products', description: 'Organize your footwear inventory.', href: '/admin/product', icon: Package },
    { title: 'Manage Brands', description: 'Update your product brands.', href: '/admin/brand', icon: ShoppingBag },
    { title: 'Manage Orders', description: 'Review orders and customer purchases.', href: '/admin/orders', icon: ShoppingCart },
    { title: 'Manage Stock', description: 'Update quantities and stock status.', href: '/admin/stock', icon: Package },
    { title: 'Manage Users', description: 'View user accounts and roles.', href: '/admin/user', icon: Users },
];

export default function QuickActions() {
    return (
        <div className="rounded-xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">Shortcuts</p>
            <h2 className="mt-2 text-xl font-black">Quick Actions</h2>
            <p className="mt-2 text-sm text-gray-500">Frequently used store management tasks.</p>

            <nav aria-label="Quick actions" className="mt-7 space-y-3">
                {ACTIONS.map(({ title, description, href, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        prefetch
                        className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black">
                            <Icon size={20} aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold">{title}</h3>
                            <p className="mt-1 text-xs text-gray-500">{description}</p>
                        </div>
                        <ArrowRight size={16} className="text-gray-500" aria-hidden="true" />
                    </Link>
                ))}
            </nav>
        </div>
    );
}
