import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import InlinePasswordForm from '@/components/settings/InlinePasswordForm';
import SavedCheckoutAddressBanner from '@/components/settings/SavedCheckoutAddressBanner';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type SharedData } from '@/types';
import { formatCellphone } from '@/utils/cellphone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useForm, usePage } from '@inertiajs/react';
import { type FormEventHandler, useState } from 'react';

const breadcrumbs = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

interface ProfileUser {
    name: string;
    email: string;
    phone: string | null;
    cellphone_number: string | null;
    address: string | null;
    email_verified_at: string | null;
}

interface ProfileProps {
    user: ProfileUser;
    customerProfile: Record<string, unknown>;
    mustVerifyEmail: boolean;
    status?: string;
}

/**
 * Splits a full name into first name, middle initial, and last name.
 * "Roger Roi Morillo" -> { first: "Roger", middle: "R", last: "Morillo" }
 */
function parseNameParts(fullName: string) {
    const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
    const first = parts[0] ?? '';
    const middle = parts.length > 2 ? String(parts[1]).charAt(0).toUpperCase() : '';
    const last = parts.length > 1 ? parts[parts.length - 1] ?? '' : '';
    return { first, middle, last };
}

export default function Profile({ user, customerProfile, mustVerifyEmail, status }: ProfileProps) {
    const page = usePage<SharedData>();
    const authUser = page.props.auth?.user ?? null;
    const [isEditing, setIsEditing] = useState(false);
    const nameParts = parseNameParts(authUser?.name ?? user.name ?? '');

    const {
        data,
        setData,
        errors,
        patch,
        processing,
        recentlySuccessful,
    } = useForm({
        first_name: nameParts.first,
        middle_initial: nameParts.middle,
        last_name: nameParts.last,
        email: user.email ?? '',
        cellphone_number: user.cellphone_number ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    };

    const resetForm = () => {
        setData('first_name', nameParts.first);
        setData('middle_initial', nameParts.middle);
        setData('last_name', nameParts.last);
        setData('email', authUser?.email ?? user.email ?? '');
        setData('cellphone_number', authUser?.cellphone_number ?? user.cellphone_number ?? '');
        setIsEditing(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Account & Security"
                        description="Manage your name, contact details, and password"
                    />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    required
                                    autoComplete="given-name"
                                    placeholder="First name"
                                    disabled={!isEditing}
                                    className={!isEditing ? 'opacity-80 cursor-default' : undefined}
                                />
                                <InputError message={errors.first_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="middle_initial">Middle Initial</Label>
                                <Input
                                    id="middle_initial"
                                    value={data.middle_initial}
                                    onChange={(e) =>
                                        setData('middle_initial', e.target.value.toUpperCase().slice(0, 2))
                                    }
                                    autoComplete="middle-name"
                                    placeholder="M."
                                    maxLength={2}
                                    disabled={!isEditing}
                                    className={!isEditing ? 'opacity-80 cursor-default' : undefined}
                                />
                                <InputError message={errors.middle_initial} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    required
                                    autoComplete="family-name"
                                    placeholder="Last name"
                                    disabled={!isEditing}
                                    className={!isEditing ? 'opacity-80 cursor-default' : undefined}
                                />
                                <InputError message={errors.last_name} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                    disabled={!isEditing}
                                    className={!isEditing ? 'opacity-80 cursor-default' : undefined}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="cellphone_number">Cellphone Number</Label>
                                <Input
                                    id="cellphone_number"
                                    type="tel"
                                    value={
                                        data.cellphone_number ? formatCellphone(data.cellphone_number) : ''
                                    }
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        // Limit to 12 digits total including country code (63 + 10 mobile digits)
                                        const limited = raw.slice(0, 12);
                                        setData(
                                            'cellphone_number',
                                            limited ? formatCellphone(limited) : '',
                                        );
                                    }}
                                    autoComplete="tel"
                                    placeholder="+63 9XX XXX YYYY"
                                    maxLength={16}
                                    disabled={!isEditing}
                                    className={!isEditing ? 'opacity-80 cursor-default' : undefined}
                                />
                                <InputError message={errors.cellphone_number} />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {!isEditing ? (
                                <Button type="button" onClick={() => setIsEditing(true)}>
                                    Edit
                                </Button>
                            ) : (
                                <>
                                    <Button type="submit" disabled={processing}>
                                        Save changes
                                    </Button>
                                    <Button type="button" variant="outline" onClick={resetForm}>
                                        Cancel
                                    </Button>
                                </>
                            )}

                            {recentlySuccessful && (
                                <p className="text-sm text-neutral-600">Saved</p>
                            )}
                        </div>
                    </form>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div>
                            <p className="mt-2 text-sm text-neutral-800">
                                Your email address is unverified.{' '}
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="rounded-md text-sm text-neutral-600 underline hover:text-neutral-900"
                                >
                                    Click here to re-send the verification email.
                                </Link>
                            </p>

                            {status === 'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600">
                                    A new verification link has been sent to your email address.
                                </div>
                            )}
                        </div>
                    )}

                    <SavedCheckoutAddressBanner customerProfile={customerProfile} />
                    <InlinePasswordForm />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
