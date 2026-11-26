import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register | LS Dolocab" />

            <div className="relative min-h-screen overflow-hidden bg-black font-sans text-white">
                {/* Background Decoration */}
                <div className="pointer-events-none fixed inset-0">
                    <div className="absolute top-20 -left-40 h-96 w-96 rounded-full bg-white/5 blur-[120px]" />
                    <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-gray-500/5 blur-[120px]" />
                </div>

                {/* Header */}
                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-12">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-black">LS</div>

                        <span className="text-xl font-extrabold tracking-[0.15em]">
                            <span className="text-gray-400">Dolocab</span>
                        </span>
                    </Link>

                    <Link href="/" className="text-sm font-medium text-gray-400 transition hover:text-white">
                        Back to Home
                    </Link>
                </header>

                {/* Main Registration Section */}
                <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] max-w-7xl items-center justify-center px-6 pb-12 lg:px-12">
                    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#090909] shadow-2xl lg:grid-cols-2">
                        {/* Left Side - Store Branding */}
                        <div className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden p-12 lg:flex">
                            <img
                                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90"
                                alt="Featured footwear"
                                className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

                            {/* Branding */}
                            <div className="relative z-10">
                                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-gray-300 uppercase backdrop-blur-md">
                                    Premium Footwear Store
                                </span>
                            </div>

                            <div className="relative z-10">
                                <h1 className="text-5xl leading-tight font-extrabold tracking-tight">
                                    Be Part of
                                    <span className="block text-gray-400">LS Dolocab.</span>
                                </h1>

                                <p className="mt-6 max-w-md text-sm leading-7 text-gray-300">
                                    Create your account and experience a more convenient way to access our footwear store management system.
                                </p>

                                <div className="mt-10 flex items-center gap-4">
                                    <div className="h-px w-12 bg-white" />

                                    <span className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
                                        Quality Footwear. Simple Management.
                                    </span>
                                </div>
                            </div>

                            {/* Decorative Circle */}
                            <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full border border-white/10" />
                        </div>

                        {/* Right Side - Registration Form */}
                        <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14">
                            {/* Mobile Logo */}
                            <div className="mb-10 flex items-center gap-3 lg:hidden">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-black">LS</div>

                                <span className="text-xl font-extrabold tracking-[0.15em]">
                                    LS <span className="text-gray-400">DOLOCAB</span>
                                </span>
                            </div>

                            {/* Heading */}
                            <div className="mb-8">
                                <span className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">Get Started</span>

                                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Create an account</h2>

                                <p className="mt-3 text-sm leading-6 text-gray-400">Enter your details below to create your LS Dolocab account.</p>
                            </div>

                            {/* Registration Form */}
                            <form className="flex flex-col gap-5" onSubmit={submit}>
                                {/* Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-sm font-semibold text-gray-200">
                                        Full Name
                                    </Label>

                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        disabled={processing}
                                        placeholder="Enter your full name"
                                        className="h-12 border-white/10 bg-[#171717] text-white placeholder:text-gray-600 focus-visible:ring-white/30"
                                    />

                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                {/* Email */}
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-200">
                                        Email Address
                                    </Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        tabIndex={2}
                                        autoComplete="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        disabled={processing}
                                        placeholder="email@example.com"
                                        className="h-12 border-white/10 bg-[#171717] text-white placeholder:text-gray-600 focus-visible:ring-white/30"
                                    />

                                    <InputError message={errors.email} />
                                </div>

                                {/* Password */}
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-200">
                                        Password
                                    </Label>

                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        tabIndex={3}
                                        autoComplete="new-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        disabled={processing}
                                        placeholder="Create a password"
                                        className="h-12 border-white/10 bg-[#171717] text-white placeholder:text-gray-600 focus-visible:ring-white/30"
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                {/* Confirm Password */}
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation" className="text-sm font-semibold text-gray-200">
                                        Confirm Password
                                    </Label>

                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        required
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        disabled={processing}
                                        placeholder="Confirm your password"
                                        className="h-12 border-white/10 bg-[#171717] text-white placeholder:text-gray-600 focus-visible:ring-white/30"
                                    />

                                    <InputError message={errors.password_confirmation} />
                                </div>

                                {/* Create Account Button */}
                                <Button
                                    type="submit"
                                    className="mt-2 h-12 w-full bg-white font-bold text-black transition hover:bg-gray-200"
                                    tabIndex={5}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>
                            </form>

                            {/* Login Link */}
                            <div className="mt-8 text-center text-sm text-gray-500">
                                Already have an account?{' '}
                                <TextLink href={route('login')} tabIndex={6} className="font-semibold text-white underline-offset-4 hover:underline">
                                    Log in
                                </TextLink>
                            </div>

                            {/* Footer */}
                            <div className="mt-10 border-t border-white/10 pt-6 text-center">
                                <p className="text-xs text-gray-600">© {new Date().getFullYear()} LS Dolocab. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
