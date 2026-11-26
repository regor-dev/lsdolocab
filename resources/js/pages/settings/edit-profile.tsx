import { Head, Link } from '@inertiajs/react';

import { type SharedData } from '@/types';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import ProfileForm from '@/components/profile-form';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

export default function EditProfile({ auth }: { auth: SharedData['auth'] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit profile" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Edit profile" description="Update your account and contact details" />
                    <ProfileForm user={auth.user} />
                    <Link
                        href={route('profile.edit')}
                        as="button"
                        className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm hover:bg-neutral-50 hover:text-neutral-900"
                    >
                        Cancel
                    </Link>
                </div>
                <div className="mt-10">
                    <DeleteUser />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
