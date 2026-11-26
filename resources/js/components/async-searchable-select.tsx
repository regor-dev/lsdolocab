import { useEffect, useState } from 'react';
import { SearchableSelect } from '@/components/searchable-select';

interface Option { value: string; label: string; }

interface Props {
    value: string;
    onChange: (v: string) => void;
    endpoint: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    initialOption?: Option | null;
}

export function AsyncSearchableSelect({
    value, onChange, endpoint, placeholder, searchPlaceholder, emptyText, initialOption,
}: Props) {
    const [options, setOptions] = useState<Option[]>(initialOption ? [initialOption] : []);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`, { signal: controller.signal });
                if (!res.ok) return;
                const json = await res.json();
                setOptions(
                    (json.data as { id: number; sku: string; color?: string }[]).map((v) => ({
                        value: String(v.id),
                        label: `SKU: ${v.sku}${v.color ? ` (${v.color})` : ''}`,
                    })),
                );
            } catch { /* aborted */ }
        }, 250);

        return () => { clearTimeout(t); controller.abort(); };
    }, [query, endpoint]);

    return (
        <SearchableSelect
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            emptyText={emptyText}
            onSearch={(q) => setQuery(q)}
        />
    );
}
