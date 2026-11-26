import AppLayout from '@/layouts/app-layout';
import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, PackageCheck, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { SearchableSelect } from '@/components/searchable-select';
import { AsyncSearchableSelect } from '@/components/async-searchable-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BrandOption {
    id: number;
    brand_name: string; // Strictly matches database column
}

const US_SHOE_SIZES = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12] as const;

interface ProductFormData {
    name: string;
    brand_id: string;
    product_var_id: string;
    description: string;
    image: File | null;
    remove_image: boolean;
    size_stocks: Record<string, string>;
}

interface ProductData {
    id: number;
    name: string;
    brand_id: number;
    product_var_id: number;
    description?: string | null;
    img?: string | null;
    brand?: BrandOption | null;
    variant?: { id: number; sku: string; color?: string | null; price?: number | string | null } | null;
    size_stocks?: Record<string, string> | null;
}

interface ProductEditProps {
    product: ProductData;
    brands: BrandOption[];
}

export default function ProductEdit({ product, brands = [] }: ProductEditProps) {
    const { data, setData, setError, processing, errors } = useForm<ProductFormData>({
        name: product.name || '',
        brand_id: String(product.brand_id || ''),
        product_var_id: String(product.product_var_id || ''),
        description: product.description || '',
        image: null as File | null,
        remove_image: false as boolean,
        size_stocks: {
            ...Object.fromEntries(US_SHOE_SIZES.map((size) => [String(size), ''])),
            ...(product.size_stocks ?? {}),
        },
    });
    const [imagePreview, setImagePreview] = useState<string | null>(product.img ?? null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (data.image) {
            const previewUrl = URL.createObjectURL(data.image);
            setImagePreview(previewUrl);

            return () => URL.revokeObjectURL(previewUrl);
        }

        setImagePreview(data.remove_image ? null : (product.img ?? null));
    }, [data.image, data.remove_image, product.img]);

    const handleSizeStockChange = (size: number, value: string) => {
        setData('size_stocks', { ...data.size_stocks, [String(size)]: value });
    };

    const totalStock = Object.values(data.size_stocks).reduce((total, value) => {
        const quantity = parseInt(value, 10);
        return total + (Number.isNaN(quantity) || quantity < 0 ? 0 : quantity);
    }, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (submitting) return;
        setSubmitting(true);
        router.post(`/admin/product/${product.id}`, { ...data, _method: 'PUT' }, {
            forceFormData: true,
            onError: (serverErrors) => {
                Object.entries(serverErrors).forEach(([field, message]) => {
                    setError(field as keyof typeof data, message);
                });
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Products', href: '/admin/product' },
                { title: product.name, href: `/admin/product/${product.id}` },
                { title: 'Edit', href: `/admin/product/${product.id}/edit` },
            ]}
        >
            <div className="w-full flex-1 space-y-6 p-6">
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
                                <PackageCheck className="text-muted-foreground hidden h-6 w-6 sm:inline-block" />
                                Edit Product
                            </h1>
                            <p className="text-muted-foreground text-sm">Modify core identity and foreign relationship mapping.</p>
                        </div>
                    </div>
                </div>

                <Card className="w-full shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-xl">Product Specifications</CardTitle>
                            <CardDescription>
                                Modify details for record <span className="text-foreground font-semibold">#{product.id}</span>.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Product Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Air Force 1 '07"
                                    className="w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* BRAND */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Brand <span className="text-destructive">*</span>
                                    </Label>
                                    <SearchableSelect
                                        value={data.brand_id}
                                        onChange={(val) => setData('brand_id', val)}
                                        options={brands.map((b) => ({
                                            value: String(b.id),
                                            label: b.brand_name || `Brand #${b.id}`,
                                        }))}
                                        placeholder="Select Brand"
                                        searchPlaceholder="Search brand..."
                                        emptyText="No brand found."
                                    />
                                    {errors.brand_id && <p className="text-destructive text-xs">{errors.brand_id}</p>}
                                </div>

                                {/* PRODUCT VARIANT */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Product Variant <span className="text-destructive">*</span>
                                    </Label>
                                    <AsyncSearchableSelect
                                        value={data.product_var_id}
                                        onChange={(val) => setData('product_var_id', val)}
                                        endpoint="/admin/productvariant/options"
                                        placeholder="Select Variant"
                                        searchPlaceholder="Search SKU or color..."
                                        emptyText="No variant found."
                                        initialOption={
                                            product.variant
                                                ? {
                                                      value: String(product.variant.id),
                                                      label: `SKU: ${product.variant.sku}${product.variant.color ? ` (${product.variant.color})` : ''}`,
                                                  }
                                                : null
                                        }
                                    />
                                    {errors.product_var_id && <p className="text-destructive text-xs">{errors.product_var_id}</p>}
                                </div>
                            </div>

                            {/* Stock per US Shoe Size */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Stock per US Shoe Size</Label>
                                    <p className="text-sm font-semibold" aria-live="polite">
                                        Total Stock: {totalStock}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                    {US_SHOE_SIZES.map((size) => (
                                        <div key={size} className="space-y-1">
                                            <Label
                                                htmlFor={`size-stock-${size}`}
                                                className="text-xs font-medium text-muted-foreground"
                                            >
                                                {size}
                                            </Label>
                                            <Input
                                                id={`size-stock-${size}`}
                                                type="number"
                                                min="0"
                                                className="w-full text-center"
                                                value={data.size_stocks[String(size)]}
                                                onChange={(e) => handleSizeStockChange(size, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    Enter the quantity on hand for each US shoe size.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Product Image</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        setData('image', e.currentTarget.files?.[0] ?? null);
                                        if (e.currentTarget.files?.length) setData('remove_image', false);
                                    }}
                                />
                                <p className="text-muted-foreground text-xs">
                                    JPEG, PNG, or WebP. Maximum size: 45 KB and dimensions: 4096 x 4096 (to fit the products.img column).
                                </p>
                                {errors.image && <p className="text-destructive text-xs">{errors.image}</p>}
                                {imagePreview && (
                                    <img src={imagePreview} alt={`${product.name} preview`} className="h-40 w-40 rounded-md border object-cover" />
                                )}
                                {product.img && (
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={data.remove_image}
                                            onChange={(e) => setData('remove_image', e.currentTarget.checked)}
                                        />
                                        Remove current image
                                    </label>
                                )}
                                {errors.remove_image && <p className="text-destructive text-xs">{errors.remove_image}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    rows={4}
                                    placeholder="Add specifications or inventory notes..."
                                    className="min-h-[100px] w-full resize-y"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                {errors.description && <p className="text-destructive text-xs">{errors.description}</p>}
                            </div>
                        </CardContent>

                        <CardFooter className="bg-muted/10 flex flex-col-reverse justify-end gap-3 border-t px-6 py-4 sm:flex-row">
                            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => router.get('/admin/product')}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || submitting} className="w-full gap-2 sm:w-auto">
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
