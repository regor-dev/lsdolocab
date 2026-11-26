import { Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export interface SavedCheckoutAddressBannerProps {
    customerProfile?: {
        name?: string;
        phone?: string;
        address?: string;
        city?: string;
        postal_code?: string;
        country?: string;
    };
}

export default function SavedCheckoutAddressBanner({
    customerProfile,
}: SavedCheckoutAddressBannerProps) {
    const addressParts = [
        customerProfile?.address,
        customerProfile?.city,
        customerProfile?.postal_code,
        customerProfile?.country,
    ].filter(Boolean);

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    Saved delivery address
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {addressParts.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {addressParts.join(', ')}
                        </p>
                    ) : (
                        <CardDescription>
                            No delivery address saved yet
                        </CardDescription>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-4">
                <Link href="/checkout">
                    <Button variant="outline" size="sm" asChild>
                        Manage at Checkout
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
