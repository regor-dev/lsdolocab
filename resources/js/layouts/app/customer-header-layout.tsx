import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Settings, ShoppingCart, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getTotalCartCount } from '@/lib/storefrontCart';

export default function CustomerHeaderLayout({ children }: { children: React.ReactNode }) {
    const { auth } = usePage<SharedData>().props;
    const userId = auth?.user?.id ?? null;
    const [cartCount, setCartCount] = useState(() => getTotalCartCount(userId));

    useEffect(() => {
        const refreshCartCount = () => setCartCount(getTotalCartCount(userId));

        window.addEventListener('storefront-cart-updated', refreshCartCount);
        return () => window.removeEventListener('storefront-cart-updated', refreshCartCount);
    }, [userId]);

    return (
        <div className="bg-background text-foreground min-h-screen">
            <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
                <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">
                    <Link href={route('shop')} className="flex items-center gap-3" aria-label="LS Dolocab shop home">
                        <span className="bg-foreground text-background flex size-9 items-center justify-center rounded-lg text-sm font-black">
                            LS
                        </span>
                        <span className="font-bold tracking-tight">Dolocab</span>
                    </Link>

                    <nav className="hidden items-center gap-6 text-sm font-medium sm:flex" aria-label="Store navigation">
                        <Link className="hover:text-muted-foreground transition-colors" href={route('shop')}>
                            Shop
                        </Link>
                        <Link className="hover:text-muted-foreground transition-colors" href={route('orders.history')}>
                            Order history
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`${route('shop')}?openCart=1`} aria-label="Open shopping cart">
                                <ShoppingCart className="size-4" />
                                <span className="hidden sm:inline">Cart ({cartCount})</span>
                            </Link>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Settings">
                                    <Settings className="size-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="truncate">{auth?.user?.name ?? 'Customer'}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={route('profile.edit')}>
                                        <User className="size-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/logout" method="post" as="button">
                                        Log out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
            {children}
        </div>
    );
}
