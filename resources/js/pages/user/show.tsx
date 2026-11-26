import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle2, Edit, Mail, MapPin, Shield, User as UserIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Role {
    id: number;
    role_name: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    age?: number | null;
    address?: string | null;
    img?: string | null;
    created_at?: string;
    roles?: Role[];
}

interface UserShowProps {
    user: UserData;
}

export default function UserShow({ user }: UserShowProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Users', href: '/admin/user' },
                { title: user.name || 'User Profile', href: `/admin/user/${user.id}` },
            ]}
        >
            <div className="w-full flex-1 space-y-6 p-6">
                {/* Header Navigation */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => router.get('/admin/user')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                                <UserIcon className="text-muted-foreground hidden h-6 w-6 sm:inline-block" />
                                {user.name}
                            </h1>
                            <p className="text-muted-foreground text-sm">View detailed account profile, system roles, and registration parameters.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Button variant="default" className="w-full gap-2 sm:w-auto" onClick={() => router.get(`/admin/user/${user.id}/edit`)}>
                            <Edit className="h-4 w-4" />
                            Edit Profile
                        </Button>
                    </div>
                </div>

                {/* Main Card */}
                <Card className="w-full shadow-sm">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl">User Information</CardTitle>
                            <Badge variant="outline" className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Active Profile
                            </Badge>
                        </div>
                        <CardDescription>Registered system credentials and personal profile attributes.</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {user.img && <img src={user.img} alt={user.name} className="h-32 w-32 rounded-full border object-cover" />}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="bg-muted/20 flex items-start gap-3 rounded-lg border p-3">
                                <UserIcon className="text-muted-foreground mt-0.5 h-5 w-5" />
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Full Name</p>
                                    <p className="text-sm font-semibold">{user.name}</p>
                                </div>
                            </div>

                            <div className="bg-muted/20 flex items-start gap-3 rounded-lg border p-3">
                                <Mail className="text-muted-foreground mt-0.5 h-5 w-5" />
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Email Address</p>
                                    <p className="text-sm font-semibold">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
                                <Shield className="h-4 w-4" /> System Roles
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {user.roles && user.roles.length > 0 ? (
                                    user.roles.map((role) => (
                                        <Badge key={role.id} variant="secondary" className="px-3 py-1 text-xs">
                                            {role.role_name}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No system roles assigned.</p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div className="flex items-start gap-3">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4" />
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Age</p>
                                    <p className="text-sm font-medium">{user.age ? `${user.age} years old` : 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 sm:col-span-2">
                                <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Address</p>
                                    <p className="text-sm font-medium">{user.address || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="bg-muted/10 flex items-center justify-between border-t px-6 py-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => router.get('/admin/user')}>
                            Back to Users
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
