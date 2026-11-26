import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type ResourceOption = {
    value: number | string;
    label: string;
};

type ResourceField = {
    name: string;
    column?: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea';
    required?: boolean;
    min?: string;
    step?: string;
    multiple?: boolean;
    options?: ResourceOption[];
};

type ResourceColumn = {
    name: string;
    label: string;
};

type ResourceRecord = {
    id: number;
    [key: string]: unknown;
};

type ResourceManagerProps = {
    mode: 'index' | 'create' | 'edit' | 'show';
    resource: {
        key: string;
        title: string;
        fields: ResourceField[];
        columns: ResourceColumn[];
    };
    record?: ResourceRecord;
    records?: {
        data: ResourceRecord[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters?: {
        search?: string;
    };
};

function valueAt(record: ResourceRecord, path: string): unknown {
    return path.split('.').reduce<unknown>((value, key) => {
        if (typeof value !== 'object' || value === null) {
            return undefined;
        }

        return (value as Record<string, unknown>)[key];
    }, record);
}

function displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (typeof value === 'string' && value.includes('T')) {
        return value.replace('T', ' ').replace(/\.\d+Z$/, '');
    }

    return String(value);
}

export default function ResourceManager(props: ResourceManagerProps) {
    const key = `${props.resource.key}:${props.mode}:${props.record?.id ?? 'new'}`;

    return <ResourceManagerContent key={key} {...props} />;
}

function ResourceManagerContent({ mode, resource, record, records, filters }: ResourceManagerProps) {
    const { flash } = usePage<{ flash?: { success?: string; message?: string } }>().props;
    const formDefaults = useMemo(
        () =>
            Object.fromEntries(
                resource.fields.map((field) => {
                    if (field.multiple) {
                        const perms = (record?.permissions as { name: string }[] | undefined) ?? [];
                        return [field.name, perms.map((p) => p.name)];
                    }
                    const value = record ? valueAt(record, field.name) : '';
                    return [field.name, value === null || value === undefined ? '' : String(value).slice(0, field.type === 'date' ? 10 : undefined)];
                }),
            ),
        [record, resource.fields],
    );
    const form = useForm<Record<string, string | string[]>>(formDefaults);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [actionError, setActionError] = useState<string | null>(null);
    const isForm = mode === 'create' || mode === 'edit';

    const baseUrl = `/admin/${resource.key}`;
    const title = mode === 'create' ? `Add ${resource.title}` : mode === 'edit' ? `Edit ${resource.title}` : resource.title;

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (mode === 'edit' && record) {
            form.put(`${baseUrl}/${record.id}`);
            return;
        }

        form.post(baseUrl);
    }

    function deleteRecord(id: number) {
        if (window.confirm(`Delete this ${resource.title.toLowerCase()} record? This cannot be undone.`)) {
            setActionError(null);
            router.delete(`${baseUrl}/${id}`, {
                onError: (errors) => setActionError(Object.values(errors).join(' ')),
            });
        }
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: resource.title, href: baseUrl },
            ]}
        >
            <Head title={`${title} | LS Dolocab`} />
            <div className="min-h-full bg-black p-4 text-white sm:p-6 lg:p-8">
                <main className="mx-auto max-w-7xl space-y-6">
                    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">Management</p>
                            <h1 className="mt-2 text-3xl font-black">{title}</h1>
                            <p className="mt-2 text-sm text-gray-400">Create, review, update, and remove {resource.title.toLowerCase()}.</p>
                        </div>
                        {mode === 'index' && (
                            <Link
                                href={`${baseUrl}/create`}
                                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-gray-200"
                            >
                                Add {resource.title}
                            </Link>
                        )}
                        {mode !== 'index' && (
                            <Link
                                href={baseUrl}
                                className="inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
                            >
                                Back to {resource.title}
                            </Link>
                        )}
                    </header>

                    {(flash?.success || flash?.message || actionError) && (
                        <div
                            role={actionError ? 'alert' : 'status'}
                            className={`rounded-lg border px-4 py-3 text-sm ${actionError ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}
                        >
                            {actionError ?? flash?.success ?? flash?.message}
                        </div>
                    )}

                    {mode === 'index' && records && (
                        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0b]">
                            <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-lg font-bold">{resource.title} directory</h2>
                                    <p className="mt-1 text-sm text-gray-500">{records.total.toLocaleString()} total records</p>
                                </div>
                                <form
                                    className="flex w-full gap-2 sm:max-w-sm"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        router.get(baseUrl, { search }, { preserveState: true, preserveScroll: true, replace: true });
                                    }}
                                >
                                    <input
                                        aria-label={`Search ${resource.title}`}
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search..."
                                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-white/40 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/10"
                                    >
                                        Search
                                    </button>
                                </form>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-white/10 bg-white/[0.03] text-xs tracking-wider text-gray-500 uppercase">
                                        <tr>
                                            {resource.columns.map((column) => (
                                                <th key={column.name} className="px-5 py-3 font-semibold whitespace-nowrap">
                                                    {column.label}
                                                </th>
                                            ))}
                                            <th className="px-5 py-3 text-right font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {records.data.length ? (
                                            records.data.map((item) => (
                                                <tr key={item.id} className="transition hover:bg-white/[0.03]">
                                                    {resource.columns.map((column) => (
                                                        <td key={column.name} className="px-5 py-3 whitespace-nowrap text-gray-300">
                                                            {displayValue(valueAt(item, column.name))}
                                                        </td>
                                                    ))}
                                                    <td className="px-5 py-3 text-right whitespace-nowrap">
                                                        <div className="inline-flex gap-3">
                                                            <Link
                                                                href={`${baseUrl}/${item.id}`}
                                                                className="font-semibold text-gray-200 hover:text-white"
                                                            >
                                                                View
                                                            </Link>
                                                            <Link
                                                                href={`${baseUrl}/${item.id}/edit`}
                                                                className="font-semibold text-gray-400 hover:text-white"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteRecord(item.id)}
                                                                className="font-semibold text-rose-300 hover:text-rose-200"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={resource.columns.length + 1} className="px-5 py-12 text-center text-gray-500">
                                                    No {resource.title.toLowerCase()} found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm">
                                <span className="text-gray-500">
                                    Page {records.current_page} of {records.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {records.prev_page_url && (
                                        <Link
                                            href={records.prev_page_url}
                                            className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/10"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {records.next_page_url && (
                                        <Link
                                            href={records.next_page_url}
                                            className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/10"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {isForm && (
                        <form onSubmit={submit} className="rounded-xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-7">
                            <div className="grid gap-5 md:grid-cols-2">
                                {resource.fields.map((field) => (
                                    <label
                                        key={field.name}
                                        className={`block space-y-2 text-sm font-medium text-gray-300 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
                                    >
                                        <span>
                                            {field.label}
                                            {field.required ? ' *' : ''}
                                        </span>
                                        {field.type === 'select' && field.multiple ? (
                                            <select
                                                multiple
                                                required={field.required}
                                                value={Array.isArray(form.data[field.name]) ? (form.data[field.name] as unknown as string[]) : []}
                                                onChange={(e) => {
                                                    const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
                                                    form.setData(field.name, selected as unknown as string[]);
                                                }}
                                                className="h-40 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-white focus:border-white/40 focus:outline-none"
                                            >
                                                <option value="">Select {field.label.toLowerCase()}</option>
                                                {(field.options ?? []).map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : field.type === 'select' ? (
                                            <select
                                                required={field.required}
                                                value={form.data[field.name] ?? ''}
                                                onChange={(event) => form.setData(field.name, event.target.value)}
                                                className="w-full rounded-lg border border-white/10 bg-black px-3 py-2.5 text-white focus:border-white/40 focus:outline-none"
                                            >
                                                <option value="">Select {field.label.toLowerCase()}</option>
                                                {(field.options ?? []).map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : field.type === 'textarea' ? (
                                            <textarea
                                                required={field.required}
                                                value={form.data[field.name] ?? ''}
                                                onChange={(event) => form.setData(field.name, event.target.value)}
                                                rows={4}
                                                className="w-full rounded-lg border border-white/10 bg-black px-3 py-2.5 text-white focus:border-white/40 focus:outline-none"
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                required={field.required}
                                                step={field.step}
                                                min={field.min ?? (field.type === 'number' ? '0' : undefined)}
                                                value={form.data[field.name] ?? ''}
                                                onChange={(event) => form.setData(field.name, event.target.value)}
                                                className="w-full rounded-lg border border-white/10 bg-black px-3 py-2.5 text-white focus:border-white/40 focus:outline-none"
                                            />
                                        )}
                                        {form.errors[field.name] && (
                                            <span className="block text-xs font-normal text-rose-300">{form.errors[field.name]}</span>
                                        )}
                                    </label>
                                ))}
                            </div>
                            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Create record'}
                                </button>
                                <Link
                                    href={baseUrl}
                                    className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10"
                                >
                                    Cancel
                                </Link>
                                {form.errors && Object.keys(form.errors).length > 0 && (
                                    <p role="alert" className="basis-full text-sm text-rose-300">
                                        Review the highlighted fields and try again.
                                    </p>
                                )}
                            </div>
                        </form>
                    )}

                    {mode === 'show' && record && (
                        <section className="rounded-xl border border-white/10 bg-[#0b0b0b] p-5 sm:p-7">
                            <dl className="grid gap-5 sm:grid-cols-2">
                                {resource.fields.map((field) => (
                                    <div key={field.name} className="border-b border-white/10 pb-4">
                                        <dt className="text-xs font-bold tracking-wider text-gray-500 uppercase">{field.label}</dt>
                                        <dd className="mt-2 text-sm break-words text-gray-200">
                                            {displayValue(valueAt(record, field.column ?? field.name))}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-6 flex gap-3">
                                <Link
                                    href={`${baseUrl}/${record.id}/edit`}
                                    className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black hover:bg-gray-200"
                                >
                                    Edit
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => deleteRecord(record.id)}
                                    className="rounded-lg border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-400/10"
                                >
                                    Delete
                                </button>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
