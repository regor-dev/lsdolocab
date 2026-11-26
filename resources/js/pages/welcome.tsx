import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Menu, ShoppingBag, ShoppingCart } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import SizePickerModal, { type SizePickerProduct } from '@/components/storefront/SizePickerModal';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

import type { SharedData } from '@/types';

const products = [
    {
        id: 1,
        name: 'ASICS GEL-KAYANO 31',
        category: 'Running Shoes',
        price: '₱5,495',
        stock: 12,
        image: 'https://0990b9.a-cdn.akinoncloud.com/products/2025/02/07/4619271/bf5a74e7-67a9-41e6-9dd2-352c8fcb3458_size3840x3840_cropCenter.jpg',
    },
    {
        id: 2,
        name: 'Adidas Ultraboost',
        category: 'Running Shoes',
        price: '₱6,299',
        stock: 5,
        image: 'https://images.unsplash.com/photo-1511499008188-de491bbbae98?auto=format&fit=crop&w=800',
    },
    {
        id: 3,
        name: 'Nike Dunk Low',
        category: 'Casual Shoes',
        price: '₱4,995',
        stock: 0,
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800',
    },
];

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [menuOpen, setMenuOpen] = useState(false);
    const [sizePickerOpen, setSizePickerOpen] = useState(false);
    const [sizePickerMode, setSizePickerMode] = useState<'buy' | 'cart'>('cart');
    const [selectedProduct, setSelectedProduct] = useState<(typeof products)[number] | null>(null);

    function openSizePicker(product: (typeof products)[number], mode: 'buy' | 'cart'): void {
        setSelectedProduct(product);
        setSizePickerMode(mode);
        setSizePickerOpen(true);
    }

    function sizePickerProductOf(product: (typeof products)[number]): SizePickerProduct {
        return {
            id: product.id,
            name: product.name,
            price: Number(String(product.price).replace(/[^0-9]/g, '')),
            image: product.image,
            image_url: null,
            available_stock: product.stock,
        };
    }

    return (
        <>
            <Head title="LS Dolocab | Step Into Style" />

            {selectedProduct && (
                <SizePickerModal
                    product={sizePickerProductOf(selectedProduct)}
                    mode={sizePickerMode}
                    open={sizePickerOpen}
                    onClose={() => {
                        setSizePickerOpen(false);
                        setSelectedProduct(null);
                    }}
                />
            )}

            <main className="min-h-screen bg-black text-white">
                {/* NAVIGATION */}
                <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                        {/* LS DOLOCAB LOGO */}
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
                                <AppLogoIcon className="h-5 w-5" />
                            </div>

                            <span className="text-xl font-bold tracking-[0.15em] text-gray-400">Dolocab</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
                            <a href="#home" className="transition hover:text-gray-400">
                                Home
                            </a>

                            <a href="#products" className="transition hover:text-gray-400">
                                Products
                            </a>

                            <a href="#about" className="transition hover:text-gray-400">
                                About
                            </a>
                        </nav>

                        {/* Login and Register */}
                        <div className="hidden items-center gap-3 md:flex">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-gray-300"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="border border-white/40 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-black"
                                    >
                                        Login
                                    </Link>

                                    <Link
                                        href={route('register')}
                                        className="bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-gray-300"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            type="button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="text-white md:hidden"
                            aria-label="Toggle navigation menu"
                        >
                            <Menu size={25} />
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    {menuOpen && (
                        <div className="border-t border-white/10 bg-black px-6 py-5 md:hidden">
                            <nav className="flex flex-col gap-5 text-sm">
                                <a href="#home" onClick={() => setMenuOpen(false)}>
                                    Home
                                </a>

                                <a href="#products" onClick={() => setMenuOpen(false)}>
                                    Products
                                </a>

                                <a href="#about" onClick={() => setMenuOpen(false)}>
                                    About
                                </a>

                                <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
                                    {auth.user ? (
                                        <Link href={route('dashboard')} className="bg-white px-5 py-3 text-center font-bold text-black">
                                            Dashboard
                                        </Link>
                                    ) : (
                                        <>
                                            <Link href={route('login')} className="border border-white/40 px-5 py-3 text-center font-bold">
                                                Login
                                            </Link>

                                            <Link href={route('register')} className="bg-white px-5 py-3 text-center font-bold text-black">
                                                Register
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </nav>
                        </div>
                    )}
                </header>

                {/* HERO SECTION */}
                <section id="home" className="relative flex min-h-[650px] items-center overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 grayscale"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1800')",
                        }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />

                    <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24">
                        <div className="max-w-2xl">
                            <p className="mb-5 text-sm font-bold tracking-[0.4em] text-gray-400 uppercase">Welcome to LS Dolocab</p>

                            <h1 className="text-5xl leading-tight font-black tracking-tight md:text-7xl">
                                STEP INTO
                                <br />
                                <span className="text-gray-400">YOUR STYLE.</span>
                            </h1>

                            <p className="mt-7 max-w-lg text-base leading-8 text-gray-300 md:text-lg">
                                Discover footwear that matches your lifestyle. Find your perfect pair and take every step with confidence.
                            </p>

                            <div className="mt-10 flex flex-wrap gap-4">
                                <a
                                    href="#products"
                                    className="inline-flex items-center gap-3 bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-gray-300"
                                >
                                    Explore Collection
                                    <ArrowRight size={18} />
                                </a>

                                {!auth.user && (
                                    <Link
                                        href={route('register')}
                                        className="border border-white/50 px-8 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-black"
                                    >
                                        Create Account
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="absolute right-10 bottom-10 hidden text-right md:block">
                        <p className="text-xs font-bold tracking-[0.4em] text-gray-500 uppercase">Quality · Comfort · Style</p>
                    </div>
                </section>

                {/* BRAND VALUES */}
                <section className="border-y border-white/10 bg-[#0a0a0a]">
                    <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/10 px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
                        <div className="py-9 text-center">
                            <h3 className="text-lg font-bold">QUALITY</h3>
                            <p className="mt-2 text-sm text-gray-500">Footwear you can rely on.</p>
                        </div>

                        <div className="py-9 text-center">
                            <h3 className="text-lg font-bold">COMFORT</h3>
                            <p className="mt-2 text-sm text-gray-500">Made for every step.</p>
                        </div>

                        <div className="py-9 text-center">
                            <h3 className="text-lg font-bold">STYLE</h3>
                            <p className="mt-2 text-sm text-gray-500">Express yourself with confidence.</p>
                        </div>
                    </div>
                </section>

                {/* PRODUCTS SECTION */}
                <section id="products" className="mx-auto max-w-7xl px-6 py-24">
                    <div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <p className="mb-3 text-xs font-bold tracking-[0.4em] text-gray-500 uppercase">Our Collection</p>

                            <h2 className="text-4xl font-black md:text-5xl">FEATURED SHOES</h2>

                            <p className="mt-4 text-gray-400">Find the perfect pair for your everyday style.</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <ShoppingBag size={18} />
                            <span>LS Dolocab Collection</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="group overflow-hidden border border-white/10 bg-[#0b0b0b] transition hover:border-white/40"
                            >
                                <div className="overflow-hidden bg-[#151515]">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="h-72 w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                                    />
                                </div>

                                <div className="p-6">
                                    <p className="text-xs tracking-widest text-gray-500 uppercase">{product.category}</p>

                                    <h3 className="mt-3 text-xl font-bold">{product.name}</h3>

                                    <div className="mt-5 flex items-center justify-between">
                                        <span className="text-lg font-bold">{product.price}</span>
                                        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">LS Dolocab</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span
                                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                                product.stock > 0
                                                    ? 'border-emerald-500/50 text-emerald-400'
                                                    : 'border-red-500/50 text-red-400'
                                            }`}
                                        >
                                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                        </span>
                                    </div>
                                    <div className="mt-5 flex flex-col sm:flex-row gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={product.stock === 0}
                                            onClick={() => openSizePicker(product, 'cart')}
                                        >
                                            <ShoppingCart className="mr-1.5 size-4" /> Add to Cart
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={product.stock === 0}
                                            onClick={() => openSizePicker(product, 'buy')}
                                        >
                                            Buy Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FEATURED BANNER */}
                <section className="relative overflow-hidden border-y border-white/10 bg-[#0b0b0b]">
                    <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold tracking-[0.4em] text-gray-500 uppercase">Find Your Perfect Pair</p>

                            <h2 className="mt-5 text-4xl leading-tight font-black md:text-5xl">
                                EVERY STEP
                                <br />
                                <span className="text-gray-500">MATTERS.</span>
                            </h2>

                            <p className="mt-6 max-w-md leading-8 text-gray-400">
                                At LS Dolocab, we believe that the right footwear makes every journey better. Discover a style that feels right for
                                you.
                            </p>

                            {!auth.user && (
                                <Link
                                    href={route('register')}
                                    className="mt-8 inline-flex items-center gap-3 bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-gray-300"
                                >
                                    Join LS Dolocab
                                    <ArrowRight size={18} />
                                </Link>
                            )}
                        </div>

                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=1000"
                                alt="Featured footwear"
                                className="h-[400px] w-full object-cover grayscale"
                            />

                            <div className="absolute inset-0 border border-white/10" />
                        </div>
                    </div>
                </section>

                {/* ABOUT SECTION */}
                <section id="about" className="mx-auto max-w-7xl px-6 py-24">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-xs font-bold tracking-[0.4em] text-gray-500 uppercase">About Us</p>

                        <h2 className="mt-5 text-4xl font-black md:text-5xl">ABOUT LS Dolocab</h2>

                        <p className="mt-7 text-base leading-8 text-gray-400">
                            LS Dolocab is dedicated to bringing together style, comfort, and quality in footwear. Our goal is to help every customer
                            find shoes that fit their needs and express their individuality.
                        </p>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="border-t border-white/10 bg-[#080808]">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 text-center md:flex-row md:text-left">
                        {/* FOOTER LOGO */}
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
                                <AppLogoIcon className="h-5 w-5" />
                            </div>

                            <div className="text-left">
                                <h2 className="text-xl font-black tracking-[0.15em] text-gray-400">Dolocab</h2>

                                <p className="mt-1 text-xs text-gray-500">Quality. Comfort. Style.</p>
                            </div>
                        </Link>

                        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                            <a href="#home" className="transition hover:text-white">
                                Home
                            </a>

                            <a href="#products" className="transition hover:text-white">
                                Products
                            </a>

                            <a href="#about" className="transition hover:text-white">
                                About
                            </a>

                            {!auth.user && (
                                <Link href={route('register')} className="transition hover:text-white">
                                    Register
                                </Link>
                            )}
                        </div>

                        <p className="text-xs text-gray-600">© {new Date().getFullYear()} LS Dolocab. All rights reserved.</p>
                    </div>
                </footer>
            </main>
        </>
    );
}
