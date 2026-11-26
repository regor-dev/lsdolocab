import { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { SharedData } from '@/types';

interface Brand {
    id: number;
    brand_name: string;
    image_url?: string | null;
    products_count?: number;
    created_at?: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    brands: PaginatedData<Brand> | Brand[];
    filters?: { search?: string | null } | null;
}

type BrandFilter = 'all' | 'with-products' | 'without-products';

const brandFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'with-products', label: 'With Products' },
    { value: 'without-products', label: 'Without Products' },
] as const;

export default function BrandIndex({ brands, filters }: Props) {
    const pageProps = usePage().props as Record<string, unknown>;
    const auth = (pageProps.auth ?? {}) as SharedData['auth'];
    const user = auth?.user ?? null;
    const isAdmin =
        user?.roles?.some((r) => r.role_name?.toLowerCase() === 'admin') ?? false;

    const paginatedBrands = !Array.isArray(brands) && brands ? brands : null;
    const brandList: Brand[] = Array.isArray(brands)
        ? brands
        : (brands?.data ?? []);

    const [search, setSearch] = useState(filters?.search ?? '');
    const [brandFilter, setBrandFilter] = useState<BrandFilter>('all');

    const [viewingBrand, setViewingBrand] = useState<Brand | null>(null);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);

    const editBrandForm = useForm({
        brand_name: '',
        image: null as File | null,
        remove_image: false as boolean,
    });

    const filteredBrands = brandList.filter((b) => {
        const matchesSearch =
            !search ||
            b.brand_name?.toLowerCase().includes(search.toLowerCase());
        const hasProducts = (b.products_count ?? 0) > 0;
        const matchesFilter =
            brandFilter === 'all' ||
            (brandFilter === 'with-products' && hasProducts) ||
            (brandFilter === 'without-products' && !hasProducts);
        return matchesSearch && matchesFilter;
    });

    const filterCounts: Record<BrandFilter, number> = {
        all: brandList.length,
        'with-products': brandList.filter((b) => (b.products_count ?? 0) > 0).length,
        'without-products': brandList.filter(
            (b) => (b.products_count ?? 0) === 0
        ).length,
    };

    function openEditBrand(brand: Brand) {
        editBrandForm.clearErrors();
        setEditingBrand(brand);
        editBrandForm.setData({
            brand_name: brand.brand_name ?? '',
            image: null,
            remove_image: false,
        });
    }

    function handleUpdateBrand(e: React.FormEvent) {
        e.preventDefault();
        if (!editingBrand) return;
        editBrandForm.put(`/admin/brand/${editingBrand.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingBrand(null);
            },
        });
    }

    function handleDeleteBrand() {
        if (!deletingBrand) return;
        router.delete(`/admin/brand/${deletingBrand.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingBrand(null);
            },
        });
    }

    return (
        <AppLayout>
            <Head title="Brands" />

            <div className="space-y-6 p-6">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Brand Management
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">Brands</h1>
                    <p className="text-sm text-muted-foreground">
                        View, filter, update, and manage all product brands.
                    </p>
                </div>

                {/* CARD — Brands Management */}
                <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Brands
                            </p>
                            <h2 className="mt-0.5 text-lg font-semibold">
                                Brand Management
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Manage brand information and product associations.
                            </p>
                        </div>

                        <div className="flex items-end gap-2">
                            <Input
                                type="text"
                                placeholder="Search brand name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64"
                            />
                            {isAdmin && (
                                <Button
                                    onClick={() => router.get('/admin/brand/create')}
                                >
                                    Create Brand
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {brandFilterOptions.map((tab) => (
                            <Button
                                key={tab.value}
                                type="button"
                                size="sm"
                                variant={brandFilter === tab.value ? 'default' : 'outline'}
                                onClick={() => setBrandFilter(tab.value)}
                                className="capitalize"
                            >
                                {tab.label} ({filterCounts[tab.value]})
                            </Button>
                        ))}
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Brand</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBrands.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-6 text-center text-sm text-muted-foreground"
                                    >
                                        No brands found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBrands.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                {b.image_url ? (
                                                    <img
                                                        src={b.image_url}
                                                        alt={b.brand_name}
                                                        className="h-10 w-10 rounded object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground h-4 w-4 flex items-center justify-center">
                                                        -
                                                    </span>
                                                )}
                                                {b.brand_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{b.products_count ?? 0}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {b.created_at
                                                ? new Date(b.created_at).toLocaleDateString()
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-3 text-xs font-medium">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingBrand(b)}
                                                    className="text-foreground hover:underline"
                                                >
                                                    View
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditBrand(b)}
                                                        className="text-foreground hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingBrand(b)}
                                                        className="text-destructive hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {paginatedBrands && paginatedBrands.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                            {paginatedBrands.prev_page_url && (
                                <a
                                    href={paginatedBrands.prev_page_url}
                                    className="hover:underline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.get(paginatedBrands.prev_page_url!, {
                                            preserveScroll: true,
                                        });
                                    }}
                                >
                                    Previous
                                </a>
                            )}
                            <span className="text-muted-foreground">
                                Page {paginatedBrands.current_page} of{' '}
                                {paginatedBrands.last_page}
                            </span>
                            {paginatedBrands.next_page_url && (
                                <a
                                    href={paginatedBrands.next_page_url}
                                    className="hover:underline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.get(paginatedBrands.next_page_url!, {
                                            preserveScroll: true,
                                        });
                                    }}
                                >
                                    Next
                                </a>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* MODAL — View Brand Details */}
            <Dialog
                open={!!viewingBrand}
                onOpenChange={(open) => !open && setViewingBrand(null)}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Brand #{viewingBrand?.id}</DialogTitle>
                        <DialogDescription>
                            Brand details and associated product count.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingBrand && (
                        <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">
                                        Brand Name
                                    </Label>
                                    <p className="font-medium">
                                        {viewingBrand.brand_name}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Brand ID</Label>
                                    <p className="font-mono font-medium">
                                        #{viewingBrand.id}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">
                                        Products
                                    </Label>
                                    <p className="font-medium">
                                        {viewingBrand.products_count ?? 0}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Created</Label>
                                    <p className="font-medium">
                                        {viewingBrand.created_at
                                            ? new Date(
                                                  viewingBrand.created_at
                                              ).toLocaleDateString()
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                            {viewingBrand.image_url && (
                                <div className="border-t pt-3">
                                    <Label className="text-xs text-muted-foreground">
                                        Brand Image
                                    </Label>
                                    <img
                                        src={viewingBrand.image_url}
                                        alt={viewingBrand.brand_name}
                                        className="mt-2 max-h-64 w-full rounded-md border object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={() => setViewingBrand(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL — Edit Brand */}
            <Dialog
                open={!!editingBrand}
                onOpenChange={(open) => !open && setEditingBrand(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Brand</DialogTitle>
                        <DialogDescription>
                            Update details for brand #{editingBrand?.id}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateBrand} className="space-y-4">
                        {Object.keys(editBrandForm.errors).length > 0 && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                                {Object.values(editBrandForm.errors).map(
                                    (err, idx) => (
                                        <div key={idx}>{err}</div>
                                    )
                                )}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Brand Name</Label>
                            <Input
                                value={editBrandForm.data.brand_name}
                                onChange={(e) =>
                                    editBrandForm.setData(
                                        'brand_name',
                                        e.target.value
                                    )
                                }
                                disabled={editBrandForm.processing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Brand Image</Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(event) => {
                                    editBrandForm.setData(
                                        'image',
                                        event.currentTarget.files?.[0] ?? null
                                    );
                                    if (event.currentTarget.files?.length) {
                                        editBrandForm.setData('remove_image', false);
                                    }
                                }}
                                disabled={editBrandForm.processing}
                            />
                            <p className="text-muted-foreground text-xs">
                                JPEG, PNG, or WebP. Maximum size: 5 MB.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingBrand(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={editBrandForm.processing}
                            >
                                {editBrandForm.processing
                                    ? 'Updating...'
                                    : 'Update Brand'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL — Delete Brand Confirmation */}
            <Dialog
                open={!!deletingBrand}
                onOpenChange={(open) => !open && setDeletingBrand(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Brand</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete brand{' '}
                            <span className="font-medium text-foreground">
                                {deletingBrand?.brand_name}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingBrand(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteBrand}
                        >
                            Delete Brand
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
