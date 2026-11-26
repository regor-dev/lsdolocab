import { type KeyboardEvent } from 'react';

function formatDate(date: Date): string {
    const year = String(date.getFullYear()).padStart(4, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function getBirthDateInputBounds(): { min: string; max: string } {
    const today = new Date();
    const earliestDate = new Date(today);
    earliestDate.setFullYear(earliestDate.getFullYear() - 100);

    if (earliestDate.getMonth() !== today.getMonth()) {
        earliestDate.setDate(0);
    }

    const latestDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    return {
        min: formatDate(earliestDate),
        max: formatDate(latestDate),
    };
}

export function hasFourDigitBirthYear(value: string): boolean {
    return value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function preventManualBirthDateTyping(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Tab' || event.key === 'Escape' || event.key === 'F4' || (event.altKey && event.key === 'ArrowDown')) {
        return;
    }

    event.preventDefault();
}
