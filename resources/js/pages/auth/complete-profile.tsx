import AddressMapPicker from '@/components/location/AddressMapPicker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type SharedData } from '@/types';
import { formatCellphone } from '@/utils/cellphone';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type ChangeEvent, type FormEventHandler } from 'react';

interface ProfileForm {
    [key: string]: string | number | null;
    birth_date: string;
    address: string;
    cellphone_number: string;
    postal_code: string;
    province: string;
    city: string;
    barangay: string;
    street: string;
    zip_code: string;
    latitude: number | string | null;
    longitude: number | string | null;
}

function toTitleCase(value: string): string {
    return value
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function latestAllowedBirthDate(minimumAgeYears: number): string {
    const today = new Date();
    const latest = new Date(
        today.getFullYear() - minimumAgeYears,
        today.getMonth(),
        today.getDate(),
    );
    if (latest.getMonth() !== today.getMonth()) {
        latest.setDate(0);
    }
    return formatLocalDate(latest);
}

function formatLocalDate(date: Date): string {
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export default function CompleteProfile({ sessionData }: { sessionData?: Record<string, unknown> }) {
    const { auth } = usePage<SharedData>().props;
    // Strict minimum age of 18 for every user, regardless of role.
    const maxBirthDate = latestAllowedBirthDate(18);

    const sessionFormData = sessionData as Partial<ProfileForm> | undefined;

    // The address column stores a JSON object (street, barangay, city,
    // province). Parse it once so both the form fields and the location
    // picker are seeded from the same source, keeping every required field
    // bound in useForm data before post().
    const initialAddress = sessionFormData?.address ?? auth.user.address ?? '';
    let initialProvince = '';
    let initialCity = '';
    let initialBarangay = '';
    let initialStreet = '';
    try {
        const parsed = JSON.parse(initialAddress);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            initialProvince = String(parsed.province ?? '');
            initialCity = String(parsed.city ?? '');
            initialBarangay = String(parsed.barangay ?? '');
            initialStreet = String(parsed.street ?? '');
        }
    } catch {
        // Legacy or plain-text address: nothing to preselect.
    }

    const initialPostalCode =
        sessionFormData?.postal_code ?? auth.user.billing_postal_code ?? '';

    const { data, setData, post, processing, errors } = useForm<ProfileForm>({
        birth_date: sessionFormData?.birth_date ?? auth.user.birth_date ?? '',
        address: sessionFormData?.address ?? auth.user.address ?? '',
        cellphone_number:
            sessionFormData?.cellphone_number ?? auth.user.cellphone_number ?? '',
        postal_code: initialPostalCode,
        province: sessionFormData?.province ?? initialProvince,
        city: sessionFormData?.city ?? initialCity,
        barangay: sessionFormData?.barangay ?? initialBarangay,
        street: sessionFormData?.street ?? initialStreet,
        zip_code: initialPostalCode,
        latitude: sessionFormData?.latitude ?? auth.user.latitude ?? null,
        longitude: sessionFormData?.longitude ?? auth.user.longitude ?? null,
    });

    // Inline guard: the date input is capped at maxBirthDate, but surface a
    // clear error if an under-18 date is submitted anyway (e.g. pre-filled data).
    const underageBirthDate =
        data.birth_date !== '' && data.birth_date > maxBirthDate;

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('profile.complete.update'), {
            onSuccess: () => {
                // The controller redirects to the shop route on completion;
                // Inertia follows that redirect automatically.
            },
        });
    };

    const handleBirthDateChange = (event: ChangeEvent<HTMLInputElement>) => {
        setData('birth_date', event.target.value);
    };

    const handleAddressChange = ({
        province,
        city,
        barangay,
        zip_code,
        street,
        latitude,
        longitude,
    }: {
        province: string;
        city: string;
        barangay: string;
        zip_code: string;
        street: string;
        latitude: string;
        longitude: string;
    }) => {
        setData('postal_code', zip_code);
        setData('zip_code', zip_code);
        setData('province', province);
        setData('city', city);
        setData('barangay', barangay);
        setData('street', street);
        setData('latitude', latitude);
        setData('longitude', longitude);
        setData(
            'address',
            JSON.stringify({
                street,
                barangay,
                city,
                province,
                region: '',
                country: 'Philippines',
            }),
        );
    };

    return (
        <>
            <Head title="Complete your profile | LS Dolocab" />

            <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-screen-2xl rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl sm:p-8">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <p className="text-xs font-bold tracking-[0.25em] text-gray-500 uppercase">
                                Account setup
                            </p>
                            <h1 className="mt-3 text-3xl font-black">Complete your profile</h1>
                            <p className="mt-3 text-sm leading-6 text-gray-400">
                                Hi {toTitleCase(auth.user.name)}, add your birth date and address to continue to your dashboard. Your age will be calculated from your birth date.
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

                    <form onSubmit={submit} className="mt-8 space-y-8">
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="birth_date">Birth date</Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    min="1900-01-01"
                                    max={maxBirthDate}
                                    value={data.birth_date}
                                    onChange={handleBirthDateChange}
                                    required
                                    disabled={processing}
                                    className="birth-date-input h-10 border-white/10 bg-[#171717] text-white"
                                />
                                <InputError
                                    message={
                                        errors.birth_date ??
                                        (underageBirthDate
                                            ? 'You must be at least 18 years old.'
                                            : undefined)
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="cellphone_number">Cellphone Number</Label>
                                <Input
                                    id="cellphone_number"
                                    type="tel"
                                    required
                                    value={
                                        data.cellphone_number
                                            ? formatCellphone(data.cellphone_number)
                                            : ''
                                    }
                                    onChange={(event) => {
                                        const raw = event.target.value.replace(/\D/g, '');
                                        // Limit to 12 digits total including country code (63 + 10 mobile digits)
                                        const limited = raw.slice(0, 12);
                                        setData('cellphone_number', limited
                                            ? formatCellphone(limited)
                                            : '');
                                    }}
                                    disabled={processing}
                                    placeholder="+63 9XX XXX YYYY"
                                    className="h-10 border-white/10 bg-[#171717] text-white"
                                    maxLength={16}
                                />
                                <InputError message={errors.cellphone_number} />
                            </div>
                        </div>

                        <AddressMapPicker
                            province={initialProvince}
                            city={initialCity}
                            barangay={initialBarangay}
                            zip_code={data.zip_code}
                            latitude={data.latitude}
                            longitude={data.longitude}
                            onChange={handleAddressChange}
                            error={errors.address}
                            provinceError={errors.province}
                            cityError={errors.city}
                            barangayError={errors.barangay}
                            zipCodeError={errors.postal_code}
                            streetError={errors.street}
                            disabled={processing}
                        />
                        {errors.latitude && (
                            <p className="text-sm text-red-600" role="alert">
                                {errors.latitude}
                            </p>
                        )}
                        {errors.longitude && (
                            <p className="text-sm text-red-600" role="alert">
                                {errors.longitude}
                            </p>
                        )}

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={processing || !data.latitude || !data.longitude}
                                className="h-10 w-auto bg-white px-6 font-bold text-black hover:bg-gray-200"
                            >
                                {processing ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
