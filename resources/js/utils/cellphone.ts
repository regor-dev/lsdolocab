export function formatCellphone(value: string | null | undefined): string {
    if (!value) return '—';
    const digits = value.replace(/\D/g, '');
    let normalized = digits;
    // Drop Philippine trunk prefix (leading 0)
    if (normalized.startsWith('0')) normalized = normalized.slice(1);
    // Drop country code if already present (63)
    if (normalized.startsWith('63')) normalized = normalized.slice(2);
    if (!normalized) return value;

    // Only apply the +63 9XX XXX YYYY spacing when we have a full 10 mobile digits.
    // Otherwise show +63 <raw digits> without internal spacing for incomplete numbers.
    if (normalized.length < 10) return `+63 ${normalized}`;

    const parts: string[] = [];
    if (normalized.length > 0) parts.push(normalized.slice(0, 3));
    if (normalized.length > 3) parts.push(normalized.slice(3, 6));
    if (normalized.length > 6) parts.push(normalized.slice(6));

    return `+63 ${parts.join(' ')}`;
}
