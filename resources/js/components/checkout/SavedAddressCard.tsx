import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, MapPin, Save } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

export interface BillingAddress {
    name: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
}

/**
 * PHLPost (Philippines Postal Corporation) common zip codes, keyed by
 * city/municipality. Not exhaustive — covers major cities and municipalities.
 * Users can override the auto-filled value manually.
 */
export const zipCodes: Record<string, string> = {
    // Metro Manila / NCR
    'Manila': '1000',
    'Quezon City': '1100',
    'Caloocan City': '1400',
    'Pasay City': '1300',
    'Makati City': '1200',
    'Pasig City': '1600',
    'Marikina City': '1800',
    'Taguig City': '1630',
    'Mandaluyong City': '1550',
    'San Juan City': '1500',
    'Valenzuela City': '1440',
    'Malabon City': '1470',
    'Navotas City': '1480',
    'Parañaque City': '1700',
    'Las Piñas City': '1740',
    'Muntinlupa City': '1770',
    'Taguig City (BGC)': '1634',
    'Pateros': '1620',
    'San Mateo, Rizal': '1850',
    'Rodriguez, Rizal': '1860',

    // Luzon
    'Baguio City': '2600',
    'Laoag City': '2900',
    'Vigan City': '2700',
    'San Fernando, La Union': '2500',
    'Dagupan City': '2400',
    'Tuguegarao City': '3500',
    'Santiago City': '3311',
    'Cabanatuan City': '3100',
    'Angeles City': '2000',
    'San Fernando, Pampanga': '2000',
    'Tarlac City': '2300',
    'Balanga City': '2100',
    'Lucena City': '4300',
    'Naga City': '4400',
    'Legaspi City': '4500',
    'Sorsogon City': '4700',
    'Puerto Princesa City': '5300',

    // Visayas
    'Iloilo City': '5000',
    'Bacolod City': '6100',
    'Cebu City': '6000',
    'Mandaue City': '6014',
    'Lapu-Lapu City': '6015',
    'Talisay City, Cebu': '6045',
    'Toledo City': '6038',
    'Tagbilaran City': '6300',
    'Dumaguete City': '6200',
    'Tacloban City': '6500',
    'Ormoc City': '6541',
    'Calbayog City': '6710',
    'Borongan City': '6800',
    'Catbalogan City': '6700',

    // Mindanao
    'Zamboanga City': '7000',
    'Cagayan de Oro City': '9000',
    'Davao City': '8000',
    'General Santos City': '9500',
    'Iligan City': '9200',
    'Butuan City': '8600',
    'Pagadian City': '7016',
    'Ozamiz City': '7200',
    'Cotabato City': '9600',
    'Kidapawan City': '9400',
    'Koronadal City': '9506',
    'Surigao City': '8400',
    'Bislig City': '8311',
    'Tandag City': '8300',
    'Mati City': '8200',
};

function cityKey(key: string): string {
    return key.toLowerCase().replace(/\s*city\s*$/i, '').trim();
}

/**
 * Look up a PHLPost zip code for a city. Matches the exact key first, then any
 * key whose trailing " city" segment is stripped, both case-insensitively.
 */
export function lookupZipCode(city: string, codes: Record<string, string> = zipCodes): string | undefined {
    const normalized = city.trim();
    if (!normalized) return undefined;

    const lower = normalized.toLowerCase();

    // 1. Exact key match (case-insensitive)
    for (const [key, zip] of Object.entries(codes)) {
        if (key.toLowerCase() === lower) return zip;
    }

    // 2. Key with trailing " city" stripped (case-insensitive)
    for (const [key, zip] of Object.entries(codes)) {
        if (cityKey(key) === lower) return zip;
    }

    return undefined;
}

interface SavedAddressCardProps {
    billing: BillingAddress;
    onChange: (field: keyof BillingAddress, value: string) => void;
    errors?: Record<string, string | string[]>;
}

function errorMessage(errors: SavedAddressCardProps['errors'] | undefined, field: string): string | undefined {
    const error = errors?.[field];
    if (!error) return undefined;
    return Array.isArray(error) ? error[0] : String(error);
}

function AddressField({
    label,
    value,
    onChange,
    error,
    required,
    autoComplete,
    type = 'text',
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string | undefined;
    required?: boolean;
    autoComplete?: string;
    type?: string;
    placeholder?: string;
}) {
    const id = label.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className={`text-xs font-medium ${error ? 'text-destructive' : ''}`}>
                {label}{required && ' *'}
            </Label>
            <Input
                id={id}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={`h-11 rounded-lg ${error ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
            {error && (
                <p className="text-destructive mt-1 text-xs font-medium" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

const REQUIRED_FIELDS: (keyof BillingAddress)[] = ['name', 'phone', 'address', 'city'];

export default function SavedAddressCard({ billing, onChange, errors }: SavedAddressCardProps) {
    const { name, phone, address, city, postal_code, country } = billing;

    const isComplete = Boolean(name && phone && address && city);
    const [isEditing, setIsEditing] = useState<boolean>(!isComplete);
    const postalCodeManuallyEdited = useRef<boolean>(false);

    const missingRequired = useMemo(() => REQUIRED_FIELDS.filter((field) => !billing[field]), [billing]);

    const handleCityChange = useCallback(
        (value: string) => {
            onChange('city', value);
            if (postalCodeManuallyEdited.current) return;
            const zip = lookupZipCode(value);
            if (zip) onChange('postal_code', zip);
        },
        [onChange],
    );

    const handlePostalCodeChange = useCallback(
        (value: string) => {
            postalCodeManuallyEdited.current = true;
            onChange('postal_code', value);
        },
        [onChange],
    );

    return (
        <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold leading-none">Delivery Address</CardTitle>
                </div>
                <Button
                    type="button"
                    variant={isEditing ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => setIsEditing((current) => !current)}
                    className="text-xs"
                >
                    {isEditing ? <Save className="mr-2 size-3" /> : <Edit className="mr-2 size-3" />}
                    {isEditing ? 'Done' : 'Change'}
                </Button>
            </CardHeader>

            {isEditing ? (
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <AddressField
                            label="Full name"
                            value={name}
                            autoComplete="name"
                            onChange={(value) => onChange('name', value)}
                            error={
                                errorMessage(errors, 'billing.name') ||
                                (missingRequired.includes('name') ? 'Required' : undefined)
                            }
                            required
                        />
                        <AddressField
                            label="Cellphone number"
                            value={phone}
                            autoComplete="tel"
                            type="tel"
                            placeholder="0917 123 4567"
                            onChange={(value) => onChange('phone', value)}
                            error={
                                errorMessage(errors, 'billing.phone') ||
                                (missingRequired.includes('phone') ? 'Required' : undefined)
                            }
                            required
                        />
                    </div>
                    <AddressField
                        label="Street address"
                        value={address}
                        autoComplete="street-address"
                        onChange={(value) => onChange('address', value)}
                        error={
                            errorMessage(errors, 'billing.address') ||
                            (missingRequired.includes('address') ? 'Required' : undefined)
                        }
                        required
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <AddressField
                            label="City"
                            value={city}
                            autoComplete="address-level2"
                            placeholder="Victorias City"
                            onChange={handleCityChange}
                            error={
                                errorMessage(errors, 'billing.city') ||
                                (missingRequired.includes('city') ? 'Required' : undefined)
                            }
                            required
                        />
                        <AddressField
                            label="Postal code"
                            value={postal_code}
                            autoComplete="postal-code"
                            placeholder="6119"
                            onChange={handlePostalCodeChange}
                            error={errorMessage(errors, 'billing.postal_code')}
                        />
                    </div>
                    <AddressField
                        label="Country"
                        value={country}
                        autoComplete="country-name"
                        onChange={(value) => onChange('country', value)}
                        error={errorMessage(errors, 'billing.country')}
                    />
                    {missingRequired.length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-xs text-destructive">
                            Complete the highlighted fields to save your address.
                        </div>
                    )}
                </CardContent>
            ) : (
                <CardContent className="space-y-3 pt-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{name}</span>
                        <span className="text-muted-foreground text-xs">|</span>
                        <span className="text-muted-foreground text-xs">{phone}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-none">
                        {[address, city, postal_code, country].filter(Boolean).join(', ')}
                    </p>
                    {missingRequired.length > 0 && (
                        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-2.5 text-xs text-destructive flex items-center gap-1.5">
                            Missing: {missingRequired.map((field) => field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')).join(', ')} -- click Change to complete
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
