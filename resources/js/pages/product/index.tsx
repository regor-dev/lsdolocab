import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchableSelect } from '@/components/searchable-select';
import { AsyncSearchableSelect } from '@/components/async-searchable-select';
import { Package, Plus, Search, X } from 'lucide-react';
import type { SharedData } from '@/types';

interface Brand {
    id: number;
    brand_name: string;
}

interface ProductVariant {
    id: number;
    sku: string;
    color?: string | null;
    price?: number | string | null;
}

interface Product {
    id: number;
    name: string;
    brand_id?: number | null;
    product_var_id?: number | null;
    description?: string | null;
    image_url?: string | null;
    img?: string | null;
    brand?: Brand | null;
    variant?: ProductVariant | null;
    created_at?: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

interface ProductIndexProps {
    products: PaginatedData<Product>;
    filters?: { search?: string | null; brand_id?: string | null } | null;
    brands?: Brand[];
    auth?: SharedData['auth'];
}

export default function ProductIndex({
    products,
    filters,
    brands = [],
    auth: propAuth,
}: ProductIndexProps) {
    const page = usePage<SharedData>();
    const auth = (propAuth ?? page.props.auth ?? {}) as SharedData['auth'];
    const user = auth?.user ?? null;
    const isAdmin =
        user?.roles?.some((r) => r.role_name?.toLowerCase() === 'admin') ?? false;

    const productList: Product[] = products?.data ?? [];
    const [search, setSearch] = useState(filters?.search ?? '');
    const [brand, setBrand] = useState(filters?.brand_id ?? 'all');
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/admin/product',
                {
                    search,
                    brand_id: brand === 'all' ? '' : brand,
                },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, brand]);

    const brandCounts: Record<string, number> = { all: productList.length };
    productList.forEach((p) => {
        const key = p.brand?.id ? String(p.brand.id) : 'none';
        brandCounts[key] = (brandCounts[key] ?? 0) + 1;
    });

    const filterOptions = [
        { value: 'all', label: 'All Brands' },
        ...brands.map((b) => ({ value: String(b.id), label: b.brand_name })),
    ];

    /* ---------- inline modals ---------- */
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    const editProductForm = useForm({
        _method: 'put' as const,
        name: '',
        brand_id: '',
        product_var_id: '',
        description: '',
    });

    function openViewProduct(product: Product) {
        setViewingProduct(product);
    }

    function openEditProduct(product: Product) {
        editProductForm.clearErrors();
        setEditingProduct(product);
        editProductForm.setData('name', product.name ?? '');
        editProductForm.setData('brand_id', String(product.brand_id ?? ''));
        editProductForm.setData('product_var_id', String(product.product_var_id ?? ''));
        editProductForm.setData('description', product.description ?? '');
    }

    function handleUpdateProduct(e: React.FormEvent) {
        e.preventDefault();
        if (!editingProduct) return;
        editProductForm.put(`/admin/product/${editingProduct.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingProduct(null),
        });
    }

    function handleDeleteProduct() {
        if (!deletingProduct) return;
        router.delete(`/admin/product/${deletingProduct.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingProduct(null),
        });
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Products', href: '/admin/product' },
            ]}
        >
            <Head title="Products" />

            <div className="space-y-6 p-6">
                {/* OUTER HEADER — eyebrow + title */}
                <div>
                    <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                        Products
                    </p>
                    <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
                        Product Management
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View, filter, add, and manage all inventory products.
                    </p>
                </div>

                {/* BORDERED INNER CARD */}
                <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Products
                            </p>
                            <h2 className="mt-0.5 text-lg font-semibold">
                                Product Management
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Browse, search, and act on every product record.
                            </p>
                        </div>

                        {/* right-aligned search + Create button */}
                        <div className="flex items-center gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search product name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pr-8 pl-9"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Button onClick={() => router.get('/admin/product/create')}>
                                <Plus className="h-4 w-4" /> Create Product
                            </Button>
                        </div>
                    </div>

                    {/* segmented filter pills with counts */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {filterOptions.map((tab) => (
                            <Button
                                key={tab.value}
                                type="button"
                                size="sm"
                                variant={brand === tab.value ? 'default' : 'outline'}
                                onClick={() => setBrand(tab.value)}
                                className="capitalize"
                            >
                                {tab.label} ({brandCounts[tab.value] ?? 0})
                            </Button>
                        ))}
                    </div>

                    {/* minimal table */}
                    <div className="w-full overflow-hidden rounded-md border">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[35%]">Product Name</TableHead>
                                    <TableHead className="w-[20%]">Brand</TableHead>
                                    <TableHead className="w-[25%]">Variant SKU</TableHead>
                                    <TableHead className="w-[20%] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productList.length > 0 ? (
                                    productList.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    {p.image_url ? (
                                                        <img
                                                            src={p.image_url}
                                                            alt={p.name}
                                                            loading="lazy"
                                                            className="h-10 w-10 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <Package className="text-muted-foreground h-4 w-4" />
                                                    )}
                                                    {p.name}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {p.brand?.brand_name ? (
                                                    <Badge variant="outline" className="font-normal">
                                                        {p.brand.brand_name}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-muted-foreground font-normal">
                                                        No Brand
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-muted-foreground text-sm">
                                                {p.variant?.sku
                                                    ? `${p.variant.sku} (${
                                                          p.variant.color || 'Standard'
                                                      })`
                                                    : 'No Variant'}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 text-xs font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() => openViewProduct(p)}
                                                        className="text-foreground hover:underline"
                                                    >
                                                        View
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditProduct(p)}
                                                            className="text-foreground hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingProduct(p)}
                                                            className="text-destructive hover:underline"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                                            No products found matching criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {products.links && products.links.length > 3 && (
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-muted-foreground text-sm">
                                Page {products.current_page} of {products.last_page}
                            </span>
                            <div className="flex gap-1">
                                {products.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url &&
                                            router.get(link.url, {}, {
                                                preserveState: true,
                                                preserveScroll: true,
                                            })
                                        }
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* MODAL — View Product */}
            <Dialog
                open={!!viewingProduct}
                onOpenChange={(open) => !open && setViewingProduct(null)}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Product #{viewingProduct?.id}</DialogTitle>
                        <DialogDescription>
                            Product details, variant, brand, and description.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingProduct && (
                        <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">
                                        Product Name
                                    </Label>
                                    <p className="font-medium">{viewingProduct.name}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Brand</Label>
                                    <p className="font-medium">
                                        {viewingProduct.brand?.brand_name ?? 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Variant SKU</Label>
                                    <p className="font-mono font-medium">
                                        {viewingProduct.variant?.sku ?? 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Color</Label>
                                    <p className="font-medium">
                                        {viewingProduct.variant?.color ?? 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Price</Label>
                                    <p className="font-medium">
                                        {viewingProduct.variant?.price
                                            ? `$${Number(viewingProduct.variant.price).toFixed(2)}`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Created</Label>
                                    <p className="font-medium">
                                        {viewingProduct.created_at
                                            ? new Date(viewingProduct.created_at).toLocaleDateString()
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                            <div className="border-t pt-3">
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <p className="text-foreground/90 bg-muted/10 rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                    {viewingProduct.description ?? 'No description provided.'}
                                </p>
                            </div>
                            {viewingProduct.image_url && (
                                <img
                                    src={viewingProduct.image_url}
                                    alt={viewingProduct.name}
                                    className="rounded-lg border object-contain max-h-64"
                                />
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" onClick={() => setViewingProduct(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL — Edit Product */}
            <Dialog
                open={!!editingProduct}
                onOpenChange={(open) => !open && setEditingProduct(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                            Update details for product #{editingProduct?.id}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProduct} className="space-y-4">
                        {Object.keys(editProductForm.errors).length > 0 && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                                {Object.values(editProductForm.errors).map((err, idx) => (
                                    <div key={idx}>{err}</div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                Product Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. Air Force 1 '07"
                                className="w-full"
                                value={editProductForm.data.name}
                                onChange={(e) =>
                                    editProductForm.setData('name', e.target.value)
                                }
                                disabled={editProductForm.processing}
                            />
                            {editProductForm.errors.name && (
                                <p className="text-destructive text-xs">
                                    {editProductForm.errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Brand <span className="text-destructive">*</span>
                            </Label>
                            <SearchableSelect
                                value={editProductForm.data.brand_id}
                                onChange={(val) =>
                                    editProductForm.setData('brand_id', val)
                                }
                                options={brands.map((b) => ({
                                    value: String(b.id),
                                    label: b.brand_name || `Brand #${b.id}`,
                                }))}
                                placeholder="Select Brand"
                                searchPlaceholder="Search brand..."
                                emptyText="No brand found."
                            />
                            {editProductForm.errors.brand_id && (
                                <p className="text-destructive text-xs">
                                    {editProductForm.errors.brand_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                Product Variant <span className="text-destructive">*</span>
                            </Label>
                            <AsyncSearchableSelect
                                value={editProductForm.data.product_var_id}
                                onChange={(val) =>
                                    editProductForm.setData('product_var_id', val)
                                }
                                endpoint="/admin/productvariant/options"
                                placeholder="Select Variant"
                                searchPlaceholder="Search SKU or color..."
                                emptyText="No variant found."
                                initialOption={
                                    editingProduct?.variant
                                        ? {
                                              value: String(editingProduct.variant.id),
                                              label: `SKU: ${editingProduct.variant.sku}${
                                                  editingProduct.variant.color
                                                      ? ` (${editingProduct.variant.color})`
                                                      : ''
                                              }`,
                                          }
                                        : null
                                }
                            />
                            {editProductForm.errors.product_var_id && (
                                <p className="text-destructive text-xs">
                                    {editProductForm.errors.product_var_id}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                rows={3}
                                placeholder="Add specifications or inventory notes..."
                                className="min-h-[80px] w-full resize-y"
                                value={editProductForm.data.description}
                                onChange={(e) =>
                                    editProductForm.setData('description', e.target.value)
                                }
                                disabled={editProductForm.processing}
                            />
                            {editProductForm.errors.description && (
                                <p className="text-destructive text-xs">
                                    {editProductForm.errors.description}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingProduct(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editProductForm.processing}>
                                {editProductForm.processing
                                    ? 'Updating...'
                                    : 'Update Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL — Delete Product */}
            <Dialog
                open={!!deletingProduct}
                onOpenChange={(open) => !open && setDeletingProduct(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete product{' '}
                            <span className="font-medium text-foreground">
                                {deletingProduct?.name}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingProduct(null)}
                        >
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteProduct}>
                            Delete Product
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
