import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login | LS Dolocab" />

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

                {/* Main Login Section */}
                <main className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] max-w-7xl items-center justify-center px-6 pb-12 lg:px-12">
                    <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#090909] shadow-2xl lg:grid-cols-2">
                        {/* Left Side - Store Branding */}
                        <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden p-12 lg:flex">
                            {/* Background Image */}
                            <img
                                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90"
                                alt="Featured footwear"
                                className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale"
                            />

                            {/* Dark Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

                            {/* Branding Content */}
                            <div className="relative z-10">
                                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-gray-300 uppercase backdrop-blur-md">
                                    Premium Footwear Store
                                </span>
                            </div>

                            <div className="relative z-10">
                                <h1 className="text-5xl leading-tight font-extrabold tracking-tight">
                                    Step Into
                                    <span className="block text-gray-400">Something Better.</span>
                                </h1>

                                <p className="mt-6 max-w-md text-sm leading-7 text-gray-300">
                                    Welcome to LS Dolocab. Your trusted footwear store, bringing quality, comfort, and style together.
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

                        {/* Right Side - Login Form */}
                        <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14">
                            {/* Mobile Logo */}
                            <div className="mb-10 flex items-center gap-3 lg:hidden">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-black">LS</div>

                                <span className="text-xl font-extrabold tracking-[0.15em]">
                                    LS <span className="text-gray-400">DOLOCAB</span>
                                </span>
                            </div>

                            {/* Login Heading */}
                            <div className="mb-8">
                                <span className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">Welcome Back</span>

                                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Log in to your account</h2>

                                <p className="mt-3 text-sm leading-6 text-gray-400">Enter your email and password below to access your account.</p>
                            </div>

                            {/* Status Message */}
                            {status && (
                                <div className="mb-5 rounded-xl border border-white/20 bg-white/5 p-3 text-center text-sm font-medium text-white">
                                    {status}
                                </div>
                            )}

                            {/* Login Form */}
                            <form className="flex flex-col gap-6" onSubmit={submit}>
                                {/* Email */}
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-200">
                                        Email Address
                                    </Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="email@example.com"
                                        className="h-12 border-white/10 bg-[#171717] text-white placeholder:text-gray-600 focus-visible:ring-white/30"
                                    />

                                    <InputError message={errors.email} />
                                </div>

                                {/* Password */}
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-sm font-semibold text-gray-200">
                                            Password
                                        </Label>

                                        {canResetPassword && (
                                            <TextLink
                                                href={route('password.request')}
                                                className="text-xs text-gray-400 transition hover:text-white"
                                                tabIndex={5}
                                            >
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>

                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter your password"
                                        className="h-12 border-white/10 bg-[#171717] text-white placeholder:text-gray-600 focus-visible:ring-white/30"
                                    />

                                    <InputError message={errors.password} />
                                </div>

                                {/* Remember Me */}
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                        checked={data.remember}
                                        onCheckedChange={(checked) => setData('remember', checked === true)}
                                        className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                                    />

                                    <Label htmlFor="remember" className="cursor-pointer text-sm text-gray-400">
                                        Remember me
                                    </Label>
                                </div>

                                {/* Login Button */}
                                <Button
                                    type="submit"
                                    className="mt-2 h-12 w-full bg-white font-bold text-black transition hover:bg-gray-200"
                                    tabIndex={4}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                            Logging in...
                                        </>
                                    ) : (
                                        'Log In'
                                    )}
                                </Button>
                            </form>

                            {/* Register Link */}
                            <div className="mt-8 text-center text-sm text-gray-500">
                                Don't have an account?{' '}
                                <TextLink
                                    href={route('register')}
                                    tabIndex={6}
                                    className="font-semibold text-white underline-offset-4 hover:underline"
                                >
                                    Sign up
                                </TextLink>
                            </div>

                            {/* Footer */}
                            <div className="mt-12 border-t border-white/10 pt-6 text-center">
                                <p className="text-xs text-gray-600">© {new Date().getFullYear()} LS Dolocab. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
