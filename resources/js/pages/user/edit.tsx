import AddressPicker from '@/components/address-picker';
import AppLayout from '@/layouts/app-layout';
import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save, UserCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBirthDateInputBounds, hasFourDigitBirthYear, preventManualBirthDateTyping } from '@/lib/birth-date';

interface RoleOption {
    id: number;
    role_name: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    birth_date?: string | null;
    age?: number | null;
    address?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    img?: string | null;
    roles?: RoleOption[];
}

interface UserEditProps {
    user: UserData;
    roles?: RoleOption[];
}

export default function UserEdit({ user, roles = [] }: UserEditProps) {
    const birthDateBounds = getBirthDateInputBounds();
    const currentRoleId = user.roles && user.roles.length > 0 ? String(user.roles[0].id) : '';

    const calculateAge = (dob: string): string => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }
        return calculatedAge >= 0 ? String(calculatedAge) : '';
    };

    const formattedBirthDate = user.birth_date ? user.birth_date.split('T')[0] : '';

    const { data, setData, post, processing, errors } = useForm({
        _method: 'put' as const,
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        birth_date: formattedBirthDate,
        age: user.birth_date ? calculateAge(formattedBirthDate) : user.age ? String(user.age) : '',
        address: user.address || '',
        latitude: user.latitude === null || user.latitude === undefined ? '' : String(user.latitude),
        longitude: user.longitude === null || user.longitude === undefined ? '' : String(user.longitude),
        role_id: currentRoleId,
        image: null as File | null,
        remove_image: false as boolean,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(user.img ?? null);

    useEffect(() => {
        if (data.image) {
            const previewUrl = URL.createObjectURL(data.image);
            setImagePreview(previewUrl);

            return () => URL.revokeObjectURL(previewUrl);
        }

        setImagePreview(data.remove_image ? null : (user.img ?? null));
    }, [data.image, data.remove_image, user.img]);

    const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!hasFourDigitBirthYear(value)) {
            e.currentTarget.value = data.birth_date;
            return;
        }

        const computedAge = calculateAge(value);
        setData((prevData) => ({
            ...prevData,
            birth_date: value,
            age: computedAge,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/user/${user.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Users', href: '/admin/user' },
                { title: `Edit ${user.name}`, href: `/admin/user/${user.id}/edit` },
            ]}
        >
            <div className="w-full flex-1 space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => router.get('/admin/user')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <UserCheck className="text-muted-foreground hidden h-6 w-6 sm:inline-block" />
                            Edit User Profile
                        </h1>
                        <p className="text-muted-foreground text-sm">Modify details or reassign system roles.</p>
                    </div>
                </div>

                <Card className="w-full shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-xl">Account Credentials</CardTitle>
                            <CardDescription>
                                Updating user <span className="text-foreground font-semibold">{user.name}</span>.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Full Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                    {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email Address <span className="text-destructive">*</span>
                                    </Label>
                                    <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                    {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        New Password <span className="text-muted-foreground text-xs font-normal">(Leave blank to keep current)</span>
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        placeholder="••••••••"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                    />
                                    {errors.password_confirmation && <p className="text-destructive text-xs">{errors.password_confirmation}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Profile Image</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                        setData('image', e.currentTarget.files?.[0] ?? null);
                                        if (e.currentTarget.files?.length) setData('remove_image', false);
                                    }}
                                />
                                <p className="text-muted-foreground text-xs">JPEG, PNG, or WebP. Maximum size: 5 MB; dimensions up to 4096 x 4096.</p>
                                {errors.image && <p className="text-destructive text-xs">{errors.image}</p>}
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt={`${user.name} profile preview`}
                                        className="h-32 w-32 rounded-full border object-cover"
                                    />
                                )}
                                {user.img && (
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={data.remove_image}
                                            onChange={(e) => setData('remove_image', e.currentTarget.checked)}
                                        />
                                        Remove current image
                                    </label>
                                )}
                                {errors.remove_image && <p className="text-destructive text-xs">{errors.remove_image}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>
                                        System Role <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={data.role_id} onValueChange={(val) => setData('role_id', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={String(r.id)}>
                                                    {r.role_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.role_id && <p className="text-destructive text-xs">{errors.role_id}</p>}
                                </div>

                                {/* BIRTH DATE INPUT */}
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date">Birth Date</Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        className="birth-date-input"
                                        min={birthDateBounds.min}
                                        max={birthDateBounds.max}
                                        value={data.birth_date}
                                        onKeyDown={preventManualBirthDateTyping}
                                        onPaste={(e) => e.preventDefault()}
                                        onDrop={(e) => e.preventDefault()}
                                        onChange={handleBirthDateChange}
                                    />
                                    {errors.birth_date && <p className="text-destructive text-xs">{errors.birth_date}</p>}
                                </div>

                                {/* AUTOMATICALLY FILLED AGE INPUT */}
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age (Auto)</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        placeholder="Auto-calculated"
                                        value={data.age}
                                        readOnly
                                        className="bg-muted cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <AddressPicker
                                onChange={(address) => setData('address', address)}
                                latitude={data.latitude}
                                longitude={data.longitude}
                                onCoordinatesChange={(latitude, longitude) => setData((current) => ({ ...current, latitude, longitude }))}
                                error={errors.address}
                            />
                        </CardContent>

                        <CardFooter className="bg-muted/10 flex justify-end gap-3 border-t px-6 py-4">
                            <Button type="button" variant="outline" onClick={() => router.get('/admin/user')}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="gap-2">
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Update Account
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
