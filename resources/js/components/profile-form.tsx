import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import AddressPicker from '@/components/address-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCellphone } from '@/utils/cellphone';

interface ProfileUser {
    name: string;
    email: string;
    cellphone_number: string | null | undefined;
    address: string | null | undefined;
    latitude: number | string | null | undefined;
    longitude: number | string | null | undefined;
}

// AddressPicker now stores the saved address as structured JSON:
// {"street":"...","barangay":"...","city":"...","province":"...","region":"...","country":"..."}
// so the components round-trip exactly instead of being re-parsed from a lossy comma string.
// Legacy comma-separated addresses are still supported as a fallback.
interface AddressComponents {
    street: string;
    barangay: string;
    city: string;
    province: string;
    region: string;
    country: string;
}

export function parseAddressParts(
    address: string | null | undefined,
): AddressComponents & { hasParts: boolean } {
    const empty: AddressComponents = {
        street: '',
        barangay: '',
        city: '',
        province: '',
        region: '',
        country: '',
    };
    if (!address) {
        return { ...empty, hasParts: false };
    }

    try {
        const parsed = JSON.parse(address);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const c = parsed as Record<string, unknown>;
            const result: AddressComponents = {
                street: String(c.street ?? c.street_address ?? ''),
                barangay: String(c.barangay ?? c.barangay_name ?? c.brgy ?? ''),
                city: String(c.city ?? c.city_name ?? c.municipality ?? c.city_municipality ?? ''),
                province: String(c.province ?? c.province_name ?? ''),
                region: String(c.region ?? c.region_name ?? ''),
                country: String(c.country ?? 'Philippines'),
            };
            return {
                ...result,
                hasParts: Boolean(result.barangay || result.city || result.province),
            };
        }
    } catch {
        // Not JSON — fall through to the legacy comma-separated format below.
    }

    // Legacy format: "street, barangay, city, province, region, country" (empty parts filtered out).
    const parts = (address ?? '').split(',').map((p) => p.trim()).filter(Boolean);
    const last = parts.length - 1;
    if (last < 0) {
        return { ...empty, hasParts: false };
    }
    return {
        street: parts[last - 5] ?? '',
        barangay: parts[last - 4] ?? '',
        city: parts[last - 3] ?? '',
        province: parts[last - 2] ?? '',
        region: parts[last - 1] ?? '',
        country: parts[last] ?? '',
        hasParts: parts.length >= 3,
    };
}

export default function ProfileForm({ user }: { user: ProfileUser }) {
    const { data, setData, patch, errors } = useForm({
        name: user.name ?? '',
        email: user.email ?? '',
        cellphone_number: user.cellphone_number ?? '',
        address: user.address ?? '',
        latitude: user.latitude === null || user.latitude === undefined ? '' : String(user.latitude),
        longitude:
            user.longitude === null || user.longitude === undefined ? '' : String(user.longitude),
    });

    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const parts = parseAddressParts(data.address);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <form onSubmit={submit} className="space-y-10">
            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="Email address"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-neutral-500">Cellphone Number</label>
                        <Input
                            id="cellphone_number"
                            type="tel"
                            required
                            value={data.cellphone_number ? formatCellphone(data.cellphone_number) : ''}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                // Limit to 12 digits total including country code (63 + 10 mobile digits)
                                const limited = raw.slice(0, 12);
                                setData('cellphone_number', limited ? formatCellphone(limited) : '');
                            }}
                            autoComplete="tel"
                            placeholder="+63 9XX XXX YYYY"
                            maxLength={16}
                        />
                        <InputError message={errors.cellphone_number} />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                        {isEditingAddress ? (
                            <>
                                <Label htmlFor="address">Delivery address</Label>
                                <AddressPicker
                                    layout="split"
                                    onChange={(address) => {
                                        try {
                                            const parsed = JSON.parse(address);
                                            setData('address', JSON.stringify({
                                                street: String(parsed.street ?? ''),
                                                barangay: String(parsed.barangay ?? ''),
                                                city: String(parsed.city ?? ''),
                                                province: String(parsed.province ?? ''),
                                                region: String(parsed.region ?? ''),
                                                country: String(parsed.country ?? 'Philippines'),
                                            }));
                                        } catch {
                                            setData('address', address);
                                        }
                                    }}
                                    latitude={data.latitude}
                                    longitude={data.longitude}
                                    onCoordinatesChange={(latitude, longitude) => {
                                        setData((current) => ({ ...current, latitude, longitude }));
                                    }}
                                    error={errors.address}
                                    initialStreet={parts.street}
                                    initialProvince={parts.province}
                                    initialCity={parts.city}
                                    initialBarangay={parts.barangay}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={() => setIsEditingAddress(false)}
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            patch(route('profile.update'));
                                            setIsEditingAddress(false);
                                        }}
                                    >
                                        Save address
                                    </Button>
                                </div>
                                <InputError message={errors.address} />
                            </>
                        ) : (
                            <div className="grid gap-2">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="grid gap-2">
                                        <Label>Province</Label>
                                        <Input
                                            id="province"
                                            value={parts.province}
                                            readOnly
                                            placeholder="Province"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>City</Label>
                                        <Input
                                            id="city"
                                            value={parts.city}
                                            readOnly
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Barangay</Label>
                                        <Input
                                            id="barangay"
                                            value={parts.barangay}
                                            readOnly
                                            placeholder="Barangay"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => setIsEditingAddress(true)}
                                        size="sm"
                                    >
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}
