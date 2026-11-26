import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { ArrowLeft, Edit, Tags } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Brand {
    id: number;
    brand_name: string;
    img?: string | null;
    products_count?: number;
}

export default function BrandShow({ brand }: { brand: Brand }) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Brands', href: '/admin/brand' },
                { title: brand.brand_name, href: `/admin/brand/${brand.id}` },
            ]}
        >
            <div className="w-full flex-1 space-y-6 p-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={() => router.get('/admin/brand')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                Brands
                            </p>
                            <h1 className="text-2xl font-bold tracking-tight">{brand.brand_name}</h1>
                            <p className="text-muted-foreground text-sm">Brand details and associated product count.</p>
                        </div>
                    </div>
                    <Button onClick={() => router.get(`/admin/brand/${brand.id}/edit`)} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Brand
                    </Button>
                </div>
                <Card className="w-full shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tags className="h-5 w-5" />
                            Brand information
                        </CardTitle>
                        <CardDescription>Brand ID: #{brand.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {brand.img ? (
                            <img src={brand.img} alt={brand.brand_name} className="max-h-80 w-full rounded-md border object-contain" />
                        ) : (
                            <p className="text-muted-foreground text-sm">No brand image added.</p>
                        )}
                        <p className="text-sm">
                            Products: <span className="font-semibold">{brand.products_count ?? 0}</span>
                        </p>
                    </CardContent>
                    <CardFooter className="bg-muted/10 justify-end border-t px-6 py-4">
                        <Button variant="outline" onClick={() => router.get('/admin/brand')}>
                            Back to Brands
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
