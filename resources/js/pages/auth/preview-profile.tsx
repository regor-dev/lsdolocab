import { Head, Link, router } from '@inertiajs/react';

import { parseAddressParts } from '@/components/profile-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCellphone } from '@/utils/cellphone';

interface PreviewData {
    birth_date: string;
    address: string;
    cellphone_number: string;
    postal_code: string;
}

export default function PreviewProfile({ data }: { data: PreviewData }) {
    const parts = parseAddressParts(data.address ?? '');

    const confirm = () => {
        router.patch(route('profile.complete.update'));
    };

    return (
        <>
            <Head title="Preview your profile | LS Dolocab" />

            <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-screen-2xl rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl sm:p-8">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <p className="text-xs font-bold tracking-[0.25em] text-gray-500 uppercase">Account setup</p>
                            <h1 className="mt-3 text-3xl font-black">Preview your profile</h1>
                            <p className="mt-3 text-sm leading-6 text-gray-400">
                                Review your details below before saving. Your age will be calculated from your birth date.
                            </p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="shrink-0 text-sm font-medium text-gray-400 hover:text-white"
                        >
                            Log out
                        </Link>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="birth_date">Birth date</Label>
                                <Input
                                    id="birth_date"
                                    type="text"
                                    value={data.birth_date ?? ''}
                                    readOnly
                                    className="h-10 border-white/10 bg-[#171717] text-white"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="cellphone_number">Cellphone Number</Label>
                                <Input
                                    id="cellphone_number"
                                    type="tel"
                                    value={formatCellphone(data.cellphone_number ?? '')}
                                    readOnly
                                    className="h-10 border-white/10 bg-[#171717] text-white"
                                />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="address">Street / Delivery address</Label>
                                <Input
                                    id="address"
                                    type="text"
                                    value={(parts.street || data.address) ?? ''}
                                    readOnly
                                    className="h-10 border-white/10 bg-[#171717] text-white"
                                />
                            </div>

                            <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="province">Province</Label>
                                    <Input
                                        id="province"
                                        type="text"
                                        value={parts.province}
                                        readOnly
                                        className="h-10 border-white/10 bg-[#171717] text-white"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        type="text"
                                        value={parts.city}
                                        readOnly
                                        className="h-10 border-white/10 bg-[#171717] text-white"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="barangay">Barangay</Label>
                                    <Input
                                        id="barangay"
                                        type="text"
                                        value={parts.barangay}
                                        readOnly
                                        className="h-10 border-white/10 bg-[#171717] text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="postal_code">Zip Code</Label>
                                <Input
                                    id="postal_code"
                                    type="text"
                                    value={data.postal_code ?? ''}
                                    readOnly
                                    className="h-10 border-white/10 bg-[#171717] text-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-6">
                            <div className="flex items-center gap-4">
                                <Link
                                    href={route('profile.complete')}
                                    as="button"
                                    className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
                                >
                                    Edit
                                </Link>
                                <Button onClick={confirm} className="h-10 w-auto bg-white px-6 font-bold text-black hover:bg-gray-200">
                                    Confirm & Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}