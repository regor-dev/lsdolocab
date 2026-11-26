import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Settings, ShoppingCart } from 'lucide-react';

interface StorefrontHeaderProps {
    cartCount: number;
    onCartClick: () => void;
    activeTab?: 'shop' | 'orders';
}

export default function StorefrontHeader({
    cartCount,
    onCartClick,
    activeTab,
}: StorefrontHeaderProps) {
    return (
        <header className="bg-neutral-900 text-white sticky top-0 z-40 border-b border-neutral-800">
            <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3"
                    aria-label="LS Dolocab home"
                >
                    <span className="bg-white text-black flex size-9 items-center justify-center rounded-lg text-sm font-black">
                        LS
                    </span>
                    <span className="font-bold tracking-tight">Dolocab</span>
                </Link>

                <nav
                    className="hidden items-center gap-6 text-sm font-medium sm:flex"
                    aria-label="Store navigation"
                >
                    <Link
                        href="/shop"
                        className={cn(
                            'transition-colors hover:text-neutral-300',
                            activeTab === 'shop' ? 'text-white' : 'text-neutral-400'
                        )}
                    >
                        Shop
                    </Link>
                    <Link
                        href="/orders"
                        className={cn(
                            'transition-colors hover:text-neutral-300',
                            activeTab === 'orders' ? 'text-white' : 'text-neutral-400'
                        )}
                    >
                        Order history
                    </Link>
                </nav>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onCartClick}
                        className={cn(
                            'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2',
                            'text-neutral-200 hover:text-neutral-100 hover:bg-neutral-800'
                        )}
                    >
                        <ShoppingCart className="size-4 mr-2" />
                        Cart ({cartCount})
                    </button>
                    <Link
                        href="/settings/profile"
                        className="text-neutral-400 hover:text-white transition-colors"
                        aria-label="Settings"
                    >
                        <Settings className="size-5" />
                    </Link>
                </div>
            </div>
        </header>
    );
}
