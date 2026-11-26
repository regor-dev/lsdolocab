import AppLayout from '@/layouts/app-layout';
import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save, Tags } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Brand {
    id: number;
    brand_name: string;
    img?: string | null;
}

export default function BrandEdit({ brand }: { brand: Brand }) {
    const { data, setData, setError, processing, errors } = useForm({
        brand_name: brand.brand_name,
        image: null as File | null,
        remove_image: false as boolean,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(brand.img ?? null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (data.image) {
            const previewUrl = URL.createObjectURL(data.image);
            setImagePreview(previewUrl);
            return () => URL.revokeObjectURL(previewUrl);
        }

        setImagePreview(data.remove_image ? null : (brand.img ?? null));
    }, [data.image, data.remove_image, brand.img]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (submitting) return;
        setSubmitting(true);
        router.post(`/admin/brand/${brand.id}`, { ...data, _method: 'PUT' }, {
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
                { title: 'Brands', href: '/admin/brand' },
                { title: brand.brand_name, href: `/admin/brand/${brand.id}` },
                { title: 'Edit', href: `/admin/brand/${brand.id}/edit` },
            ]}
        >
            <div className="w-full flex-1 space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.get('/admin/brand')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Brands
                        </p>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <Tags className="h-6 w-6" />
                            Edit Brand
                        </h1>
                        <p className="text-muted-foreground text-sm">Update brand details and image.</p>
                    </div>
                </div>
                <Card className="w-full shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Brand details</CardTitle>
                            <CardDescription>Editing brand #{brand.id}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="brand_name">Brand name</Label>
                                <Input id="brand_name" value={data.brand_name} onChange={(event) => setData('brand_name', event.target.value)} />
                                {errors.brand_name && <p className="text-destructive text-xs">{errors.brand_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="image">Brand image</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => {
                                        setData('image', event.currentTarget.files?.[0] ?? null);
                                        if (event.currentTarget.files?.length) setData('remove_image', false);
                                    }}
                                />
                                <p className="text-muted-foreground text-xs">JPEG, PNG, or WebP. Maximum size: 5 MB; dimensions up to 4096 x 4096.</p>
                                {errors.image && <p className="text-destructive text-xs">{errors.image}</p>}
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt={`${brand.brand_name} image preview`}
                                        className="h-32 w-32 rounded-md border object-contain"
                                    />
                                )}
                                {brand.img && (
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={data.remove_image}
                                            onChange={(event) => setData('remove_image', event.currentTarget.checked)}
                                        />
                                        Remove current image
                                    </label>
                                )}
                                {errors.remove_image && <p className="text-destructive text-xs">{errors.remove_image}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/10 justify-end gap-3 border-t px-6 py-4">
                            <Button type="button" variant="outline" onClick={() => router.get('/admin/brand')}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || submitting} className="gap-2">
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Changes
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
