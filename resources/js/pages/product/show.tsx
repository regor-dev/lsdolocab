import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, DollarSign, Edit, Layers, Package, Tag, Warehouse } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Brand {
    id: number;
    brand_name: string;
}

interface SizeCategory {
    id: number;
    name: string;
}

interface Variant {
    id: number;
    sku: string;
    color?: string | null;
    size?: string | null;
    price?: number | string | null;
    category?: SizeCategory | null;
}

interface Stock {
    id: number;
    quantity: number;
    reserved_quantity?: number;
}

interface Product {
    id: number;
    name: string;
    description?: string | null;
    img?: string | null;
    brand?: Brand | null;
    variant?: Variant | null;
    stock?: Stock | null;
}

interface ProductShowProps {
    product: Product;
}

export default function ProductShow({ product }: ProductShowProps) {
    const stockQty = product.stock?.quantity ?? 0;
    const isInStock = stockQty > 0;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Products', href: '/admin/product' },
                { title: product.name || 'Product Details', href: `/admin/product/${product.id}` },
            ]}
        >
            <div className="w-full flex-1 space-y-6 p-6">
                {/* Header Navigation Bar */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => router.get('/admin/product')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Products
                            </p>
                            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                                <Package className="text-muted-foreground hidden h-6 w-6 sm:inline-block" />
                                {product.name}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Detailed product metrics, variant attributes, and current warehouse stock counts.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Button variant="default" className="w-full gap-2 sm:w-auto" onClick={() => router.get(`/admin/product/${product.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                            Edit Product
                        </Button>
                    </div>
                </div>

                {/* Primary Product Card */}
                <Card className="w-full shadow-sm">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">Inventory Item Overview</CardTitle>
                            {isInStock ? (
                                <Badge
                                    variant="outline"
                                    className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                >
                                    <CheckCircle2 className="h-3 w-3" /> In Stock ({stockQty})
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1 border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="h-3 w-3" /> Out of Stock
                                </Badge>
                            )}
                        </div>
                        <CardDescription>Main attributes and relationships assigned to this product entry.</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {product.img && <img src={product.img} alt={product.name} className="max-h-96 w-full rounded-lg border object-contain" />}

                        {/* Core Attributes Grid */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="bg-muted/20 flex items-start gap-3 rounded-lg border p-3">
                                <Tag className="text-muted-foreground mt-0.5 h-5 w-5" />
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Brand Name</p>
                                    <p className="text-sm font-semibold">{product.brand?.brand_name || 'Unassigned'}</p>
                                </div>
                            </div>

                            <div className="bg-muted/20 flex items-start gap-3 rounded-lg border p-3">
                                <Layers className="text-muted-foreground mt-0.5 h-5 w-5" />
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Variant SKU</p>
                                    <p className="font-mono text-sm font-semibold">{product.variant?.sku || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-muted/20 flex items-start gap-3 rounded-lg border p-3">
                                <Warehouse className="text-muted-foreground mt-0.5 h-5 w-5" />
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Current Stock</p>
                                    <p className="text-sm font-semibold">{stockQty} Units</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Variant Specifications */}
                        <div className="space-y-3">
                            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Variant Specifications</p>
                            <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-4">
                                <div>
                                    <span className="text-muted-foreground block text-xs">Size Category</span>
                                    <span className="text-sm font-medium">{product.variant?.category?.name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Size</span>
                                    <span className="text-sm font-medium">{product.variant?.size || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Colorway</span>
                                    <span className="text-sm font-medium">{product.variant?.color || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Unit Price</span>
                                    <span className="flex items-center text-sm font-semibold">
                                        <DollarSign className="text-muted-foreground h-3.5 w-3.5" />
                                        {product.variant?.price ? Number(product.variant.price).toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Description Section */}
                        <div className="space-y-2">
                            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Description</p>
                            <p className="text-foreground/90 bg-muted/10 rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                {product.description || 'No detailed description provided for this product.'}
                            </p>
                        </div>
                    </CardContent>

                    <CardFooter className="bg-muted/10 flex items-center justify-between border-t px-6 py-4">
                        <p className="text-muted-foreground text-xs">
                            Product ID: <span className="font-mono">#{product.id}</span>
                        </p>
                        <Button type="button" variant="outline" size="sm" onClick={() => router.get('/admin/product')}>
                            Back to Products
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
