import { Link } from '@inertiajs/react';
import { ArrowRight, CircleAlert, Package } from 'lucide-react';
import type { DashboardProps, StockStatus } from './types';

const LABELS: Record<StockStatus, string> = {
    in_stock: 'In stock',
    low_stock: 'Low stock',
    out_of_stock: 'Out of stock',
};

const COLORS: Record<StockStatus, string> = {
    in_stock: 'bg-emerald-400',
    low_stock: 'bg-amber-400',
    out_of_stock: 'bg-rose-400',
};

interface Props {
    inventory: DashboardProps['inventory'];
    canManage: boolean;
    className?: string;
}

export default function InventoryOverview({ inventory, canManage, className = '' }: Props) {
    const tracked = inventory.statuses.reduce((sum, row) => sum + row.products, 0);

    return (
        <div className={`rounded-xl border border-white/10 bg-[#0b0b0b] p-6 ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">Inventory</p>
                    <h2 className="mt-2 text-xl font-black">Inventory Overview</h2>
                </div>
                <Package size={25} className="text-gray-500" aria-hidden="true" />
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
                <div>
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold">Stock status</h3>
                        <span className="text-sm text-gray-400">{inventory.totalUnits.toLocaleString()} total units</span>
                    </div>
                    <div className="mt-5 space-y-5">
                        {inventory.statuses.map((row) => {
                            const pct = tracked ? Math.round((row.products / tracked) * 100) : 0;

                            return (
                                <div key={row.status}>
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-gray-300">{LABELS[row.status]}</span>
                                        <span className="text-gray-400">
                                            {row.products} products · {row.units.toLocaleString()} units
                                        </span>
                                    </div>
                                    <div
                                        className="h-2 overflow-hidden rounded-full bg-white/10"
                                        role="progressbar"
                                        aria-label={LABELS[row.status]}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={pct}
                                    >
                                        <div className={`h-full ${COLORS[row.status]}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold">Needs attention</h3>
                        <CircleAlert size={18} className="text-amber-400" aria-hidden="true" />
                    </div>

                    {inventory.lowStock.length ? (
                        <ul className="mt-3 divide-y divide-white/10">
                            {inventory.lowStock.map((stock) => {
                                const row = (
                                    <>
                                        <span className="truncate text-gray-300">{stock.product?.name ?? 'Unknown product'}</span>
                                        <span className="shrink-0 text-amber-300">{stock.quantity} units</span>
                                    </>
                                );
                                const cls = 'flex items-center justify-between gap-3 py-3 text-sm';

                                return (
                                    <li key={stock.id}>
                                        {canManage && stock.product ? (
                                            <Link href={`/admin/product/${stock.product.id}`} className={`${cls} transition hover:text-white`}>
                                                {row}
                                            </Link>
                                        ) : (
                                            <div className={cls}>{row}</div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">No low or out-of-stock items.</p>
                    )}

                    {canManage && (
                        <Link href="/admin/product" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white">
                            View products <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
