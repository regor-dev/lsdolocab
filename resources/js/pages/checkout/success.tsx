import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccess() {
    return (
        <AppLayout>
            <Head title="Order Placed" />
            <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
                <div className="bg-emerald-500/10 flex size-16 items-center justify-center rounded-full">
                    <CheckCircle className="text-emerald-600 size-8" />
                </div>
                <h1 className="mt-6 text-3xl font-bold tracking-tight">Order Placed</h1>
                <p className="mt-2 text-muted-foreground text-center">
                    Thank you for your order. Track its status in Order History.
                </p>
                <div className="mt-8 flex items-center gap-3">
                    <Button asChild className="rounded-full px-8">
                        <Link href="/dashboard">View Orders</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full px-8">
                        <Link href="/shop">Continue Shopping</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
