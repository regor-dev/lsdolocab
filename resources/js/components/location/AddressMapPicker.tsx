import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComponentType } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Locate, Loader2 } from 'lucide-react';

type Coordinates = {
    lat: number;
    lng: number;
};

type LocationOption = {
    code: string;
    name: string;
    lat?: number;
    lng?: number;
    zip_code?: string;
};

type AddressMapPickerProps = {
    province?: string | null;
    city?: string | null;
    barangay?: string | null;
    zip_code?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    onChange: (address: {
        street: string;
        province: string;
        city: string;
        barangay: string;
        zip_code: string;
        latitude: string;
        longitude: string;
    }) => void;
    error?: string | null;
    provinceError?: string;
    cityError?: string;
    barangayError?: string;
    zipCodeError?: string;
    streetError?: string;
    disabled?: boolean;
};

const locationsApi = '/api/locations';

// Negros Island bounding box [[southWestLat, southWestLng], [northEastLat, northEastLng]].
const NEGROS_BOUNDS = [
    [9.02, 122.35],
    [11.05, 123.58],
] as const;

function isWithinNegrosIsland(coordinates: Coordinates): boolean {
    const [[southLat, westLng], [northLat, eastLng]] = NEGROS_BOUNDS;
    return (
        coordinates.lat >= southLat &&
        coordinates.lat <= northLat &&
        coordinates.lng >= westLng &&
        coordinates.lng <= eastLng
    );
}

// Built-in fallback table for Philippine postal codes where the location API
// lacks a zip code entry (e.g. City of Victorias, Negros Occidental -> 6119).
const POSTAL_CODE_FALLBACKS: Record<string, string> = {
    'city of victorias': '6119',
    victorias: '6119',
};

// Local Negros Island coordinates table (PSGC). Used to resolve the nearest
// city/municipality from a map click without waiting on the location API.
// Covers both Negros Occidental and Negros Oriental so a click anywhere on
// the island immediately resolves province, city, and zip code.
type NegrosCityEntry = {
    name: string;
    province: 'Negros Occidental' | 'Negros Oriental';
    lat: number;
    lng: number;
    zip_code: string;
};

const NEGROS_CITY_TABLE: NegrosCityEntry[] = [
    // Negros Occidental
    { name: 'Bacolod City', province: 'Negros Occidental', lat: 10.6765, lng: 122.9509, zip_code: '6100' },
    { name: 'Bago City', province: 'Negros Occidental', lat: 10.5389, lng: 122.8364, zip_code: '6101' },
    { name: 'Binalbagan', province: 'Negros Occidental', lat: 10.1941, lng: 122.8645, zip_code: '6107' },
    { name: 'Cadiz City', province: 'Negros Occidental', lat: 10.9544, lng: 123.3056, zip_code: '6121' },
    { name: 'Calatrava', province: 'Negros Occidental', lat: 10.5970, lng: 123.4780, zip_code: '6126' },
    { name: 'Candoni', province: 'Negros Occidental', lat: 9.8307, lng: 122.6430, zip_code: '6110' },
    { name: 'Cauayan', province: 'Negros Occidental', lat: 9.9724, lng: 122.6242, zip_code: '6112' },
    { name: 'Enrique B. Magalona', province: 'Negros Occidental', lat: 10.8769, lng: 122.9814, zip_code: '6118' },
    { name: 'Escalante City', province: 'Negros Occidental', lat: 10.8403, lng: 123.4992, zip_code: '6124' },
    { name: 'Himamaylan City', province: 'Negros Occidental', lat: 10.0983, lng: 122.8706, zip_code: '6108' },
    { name: 'Hinigaran', province: 'Negros Occidental', lat: 10.2706, lng: 122.8507, zip_code: '6106' },
    { name: 'Hinoba-an', province: 'Negros Occidental', lat: 9.6018, lng: 122.4670, zip_code: '6114' },
    { name: 'Ilog', province: 'Negros Occidental', lat: 10.0333, lng: 122.7667, zip_code: '6109' },
    { name: 'Isabela', province: 'Negros Occidental', lat: 10.2048, lng: 122.9888, zip_code: '6128' },
    { name: 'Kabankalan City', province: 'Negros Occidental', lat: 9.9889, lng: 122.8122, zip_code: '6111' },
    { name: 'La Carlota City', province: 'Negros Occidental', lat: 10.4258, lng: 122.9214, zip_code: '6130' },
    { name: 'La Castellana', province: 'Negros Occidental', lat: 10.3230, lng: 123.0187, zip_code: '6131' },
    { name: 'Manapla', province: 'Negros Occidental', lat: 10.9539, lng: 123.1225, zip_code: '6120' },
    { name: 'Moises Padilla', province: 'Negros Occidental', lat: 10.2708, lng: 123.0734, zip_code: '6132' },
    { name: 'Murcia', province: 'Negros Occidental', lat: 10.6047, lng: 123.0408, zip_code: '6129' },
    { name: 'Don Salvador Benedicto', province: 'Negros Occidental', lat: 10.5506, lng: 123.2364, zip_code: '6133' },
    { name: 'Pulupandan', province: 'Negros Occidental', lat: 10.5167, lng: 122.8167, zip_code: '6102' },
    { name: 'Sagay City', province: 'Negros Occidental', lat: 10.8964, lng: 123.4244, zip_code: '6122' },
    { name: 'San Carlos City', province: 'Negros Occidental', lat: 10.4939, lng: 123.4203, zip_code: '6127' },
    { name: 'Pontevedra', province: 'Negros Occidental', lat: 10.3679, lng: 122.8703, zip_code: '6105' },
    { name: 'Silay City', province: 'Negros Occidental', lat: 10.7953, lng: 122.9764, zip_code: '6116' },
    { name: 'Sipalay City', province: 'Negros Occidental', lat: 9.7519, lng: 122.4042, zip_code: '6113' },
    { name: 'Talisay City', province: 'Negros Occidental', lat: 10.7372, lng: 122.9669, zip_code: '6115' },
    { name: 'San Enrique', province: 'Negros Occidental', lat: 10.4167, lng: 122.8500, zip_code: '6104' },
    { name: 'Toboso', province: 'Negros Occidental', lat: 10.7155, lng: 123.5172, zip_code: '6125' },
    { name: 'City of Victorias', province: 'Negros Occidental', lat: 10.9000, lng: 123.0730, zip_code: '6119' },
    { name: 'Valladolid', province: 'Negros Occidental', lat: 10.4614, lng: 122.8241, zip_code: '6103' },
    // Negros Oriental
    { name: 'Amlan', province: 'Negros Oriental', lat: 9.4636, lng: 123.2266, zip_code: '6203' },
    { name: 'Ayungon', province: 'Negros Oriental', lat: 9.8587, lng: 123.1436, zip_code: '6210' },
    { name: 'Bacong', province: 'Negros Oriental', lat: 9.2452, lng: 123.2951, zip_code: '6200' },
    { name: 'City of Bais', province: 'Negros Oriental', lat: 9.5906, lng: 123.1219, zip_code: '6206' },
    { name: 'Basay', province: 'Negros Oriental', lat: 9.4200, lng: 122.6300, zip_code: '6222' },
    { name: 'City of Bayawan', province: 'Negros Oriental', lat: 9.3647, lng: 122.8014, zip_code: '6221' },
    { name: 'Bindoy', province: 'Negros Oriental', lat: 9.7557, lng: 123.1408, zip_code: '6209' },
    { name: 'City of Canlaon', province: 'Negros Oriental', lat: 10.3861, lng: 123.2219, zip_code: '6223' },
    { name: 'Dauin', province: 'Negros Oriental', lat: 9.1911, lng: 123.2655, zip_code: '6217' },
    { name: 'Dumaguete City', province: 'Negros Oriental', lat: 9.3068, lng: 123.3054, zip_code: '6200' },
    { name: 'City of Guihulngan', province: 'Negros Oriental', lat: 10.1194, lng: 123.2731, zip_code: '6214' },
    { name: 'Jimalalud', province: 'Negros Oriental', lat: 9.9791, lng: 123.2003, zip_code: '6212' },
    { name: 'La Libertad', province: 'Negros Oriental', lat: 10.0264, lng: 123.2338, zip_code: '6213' },
    { name: 'Mabinay', province: 'Negros Oriental', lat: 9.7265, lng: 122.9294, zip_code: '6207' },
    { name: 'Manjuyod', province: 'Negros Oriental', lat: 9.6795, lng: 123.1492, zip_code: '6208' },
    { name: 'Pamplona', province: 'Negros Oriental', lat: 9.4722, lng: 123.1184, zip_code: '6205' },
    { name: 'San Jose', province: 'Negros Oriental', lat: 9.4138, lng: 123.2417, zip_code: '6202' },
    { name: 'Santa Catalina', province: 'Negros Oriental', lat: 9.3330, lng: 122.8631, zip_code: '6220' },
    { name: 'Siaton', province: 'Negros Oriental', lat: 9.0641, lng: 123.0323, zip_code: '6219' },
    { name: 'Sibulan', province: 'Negros Oriental', lat: 9.3589, lng: 123.2847, zip_code: '6201' },
    { name: 'City of Tanjay', province: 'Negros Oriental', lat: 9.5161, lng: 123.1583, zip_code: '6204' },
    { name: 'Tayasan', province: 'Negros Oriental', lat: 9.9231, lng: 123.1723, zip_code: '6211' },
    { name: 'Valencia', province: 'Negros Oriental', lat: 9.2817, lng: 123.2446, zip_code: '6215' },
    { name: 'Vallehermoso', province: 'Negros Oriental', lat: 10.3348, lng: 123.3260, zip_code: '6224' },
    { name: 'Zamboanguita', province: 'Negros Oriental', lat: 9.1019, lng: 123.1987, zip_code: '6218' },
];

function normalizeCityName(name: string): string {
    return name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\b(?:city|municipality)\b/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function postalCodeForCity(cityName: string): string {
    const key = normalizeCityName(cityName);
    if (POSTAL_CODE_FALLBACKS[key]) return POSTAL_CODE_FALLBACKS[key];
    const match = Object.entries(POSTAL_CODE_FALLBACKS).find(
        ([entry]) => entry === key || key.includes(entry),
    );
    return match ? match[1] : '';
}

function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

// Great-circle (haversine) distance in kilometres between two lat/lng points.
function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

// Find the nearest Negros Island city/municipality from the local coordinates
// table across both Negros Occidental and Negros Oriental.
function findNearestNegrosCity(
    coordinates: Coordinates,
): NegrosCityEntry | null {
    let nearest: NegrosCityEntry | null = null;
    let nearestDistance = Infinity;
    for (const city of NEGROS_CITY_TABLE) {
        const distance = haversineDistance(
            coordinates.lat,
            coordinates.lng,
            city.lat,
            city.lng,
        );
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = city;
        }
    }
    return nearest;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new Error(`Location service returned HTTP ${response.status}.`);
    }
    return response.json();
}

export default function AddressMapPicker({
    province: initialProvince,
    city: initialCity,
    barangay: initialBarangay,
    zip_code: initialZipCode,
    latitude,
    longitude,
    onChange,
    error,
    provinceError,
    cityError,
    barangayError,
    zipCodeError,
    streetError,
    disabled = false,
}: AddressMapPickerProps) {
    const initialLatitude = Number(latitude);
    const initialLongitude = Number(longitude);
    const hasSavedPin =
        latitude !== null &&
        latitude !== undefined &&
        String(latitude).trim() !== '' &&
        longitude !== null &&
        longitude !== undefined &&
        String(longitude).trim() !== '' &&
        Number.isFinite(initialLatitude) &&
        Number.isFinite(initialLongitude);
    const [provinces, setProvinces] = useState<LocationOption[]>([]);
    const [cities, setCities] = useState<LocationOption[]>([]);
    const [barangays, setBarangays] = useState<LocationOption[]>([]);
    const [provinceCode, setProvinceCode] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [barangayCode, setBarangayCode] = useState('');
    const [zipCode, setZipCode] = useState(initialZipCode ?? '');
    const [street, setStreet] = useState('');
    // City name resolved from the local table on map click, to be selected
    // once its province's cities have finished loading.
    const [pendingCityName, setPendingCityName] = useState<string | null>(null);
    const [provinceLoading, setProvinceLoading] = useState(false);

    const [locationError, setLocationError] = useState<string | null>(null);
    const [position, setPosition] = useState<Coordinates | null>(
        hasSavedPin ? { lat: initialLatitude, lng: initialLongitude } : null,
    );
    const [zoom, setZoom] = useState(hasSavedPin ? 16 : 9);
    const [AddressMapComponent, setAddressMapComponent] =
        useState<ComponentType<{
            position: Coordinates | null;
            zoom: number;
            onSelect: (coordinates: Coordinates) => void;
        }> | null>(null);
    const [locating, setLocating] = useState(false);
    const forwardGeocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reverseGeocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const forwardGeocodeController = useRef<AbortController | null>(null);
    const reverseGeocodeController = useRef<AbortController | null>(null);
    const lastForwardGeocodeAt = useRef(0);
    const lastReverseGeocodeAt = useRef(0);
    const skipNextGeocodeFlyRef = useRef(false);
    const selectedProvince = provinces.find((p) => p.code === provinceCode)?.name ?? '';
    const selectedCity = cities.find((c) => c.code === cityCode)?.name ?? '';
    const selectedBarangay = barangays.find((b) => b.code === barangayCode)?.name ?? '';

    const notifyChange = useCallback(() => {
        onChange({
            street,
            province: selectedProvince,
            city: selectedCity,
            barangay: selectedBarangay,
            zip_code: zipCode,
            latitude: position ? String(position.lat) : '',
            longitude: position ? String(position.lng) : '',
        });
    }, [position, zipCode, street, onChange, selectedProvince, selectedCity, selectedBarangay]);

    useEffect(() => {
        if (AddressMapComponent) return;
        let cancelled = false;
        import('@/components/address-map')
            .then(({ default: Map }) => {
                if (!cancelled) setAddressMapComponent(() => Map);
            })
            .catch(() => {
                if (!cancelled) setLocationError('The map failed to load.');
            });
        return () => {
            cancelled = true;
        };
    }, [AddressMapComponent]);

    // Load provinces on mount. Cities and barangays are loaded for the
    // selected province/city once their option lists are ready.
    useEffect(() => {
        setProvinceLoading(true);
        setLocationError(null);
        setProvinces([]);
        setCities([]);
        setBarangays([]);
        setProvinceCode('');
        setCityCode('');
        setBarangayCode('');
        const controller = new AbortController();
        (async () => {
            try {
                const nextProvinces = await fetchJson<LocationOption[]>(
                    `${locationsApi}/provinces`,
                    controller.signal,
                );
                if (controller.signal.aborted) return;
                setProvinces(nextProvinces);
                setLocationError(null);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setLocationError(
                        error instanceof Error
                            ? error.message
                            : 'Failed to load location options.',
                    );
                }
            } finally {
                if (!controller.signal.aborted) setProvinceLoading(false);
            }
        })();
        return () => controller.abort();
    }, []);

    // Preselect saved province/city/barangay once their lists load (case-insensitive).
    // Selecting a province triggers loading its cities via the provinceCode effect below.
    useEffect(() => {
        if (!initialProvince || provinceCode) return;
        const match = provinces.find(
            (p) => p.name.toLowerCase() === initialProvince.toLowerCase(),
        );
        if (match) {
            setProvinceCode(match.code);
            setCityCode('');
            setBarangayCode('');
            setZipCode('');
            setCities([]);
            setBarangays([]);
        }
    }, [provinces, initialProvince, provinceCode]);

    useEffect(() => {
        if (!initialCity || cityCode) return;
        const match = cities.find(
            (c) => c.name.toLowerCase() === initialCity.toLowerCase(),
        );
        if (match) {
            setCityCode(match.code);
            setBarangayCode('');
            setZipCode('');
            setBarangays([]);
        }
    }, [cities, initialCity, cityCode]);

    // Load cities for the selected province (GET /api/locations/provinces/{code}/cities).
    useEffect(() => {
        if (!provinceCode) {
            setCities([]);
            setCityCode('');
            setBarangays([]);
            setBarangayCode('');
            setZipCode('');
            return;
        }
        const controller = new AbortController();
        (async () => {
            try {
                const nextCities = await fetchJson<LocationOption[]>(
                    `${locationsApi}/provinces/${encodeURIComponent(
                        provinceCode,
                    )}/cities`,
                    controller.signal,
                );
                if (controller.signal.aborted) return;
                setCities(nextCities);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setLocationError(
                        error instanceof Error
                            ? error.message
                            : 'Failed to load cities.',
                    );
                }
            }
        })();
        return () => controller.abort();
    }, [provinceCode]);

    useEffect(() => {
        if (!initialBarangay || barangayCode) return;
        const match = barangays.find(
            (b) => b.name.toLowerCase() === initialBarangay.toLowerCase(),
        );
        if (match) setBarangayCode(match.code);
    }, [barangays, initialBarangay, barangayCode]);

    // Load barangays for the selected city (GET /api/locations/cities/{code}/barangays).
    useEffect(() => {
        if (!cityCode) {
            setBarangays([]);
            setBarangayCode('');
            return;
        }
        const controller = new AbortController();
        (async () => {
            try {
                const nextBarangays = await fetchJson<LocationOption[]>(
                    `${locationsApi}/cities/${encodeURIComponent(cityCode)}/barangays`,
                    controller.signal,
                );
                if (controller.signal.aborted) return;
                setBarangays(nextBarangays);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setLocationError(
                        error instanceof Error
                            ? error.message
                            : 'Failed to load barangays.',
                    );
                }
            }
        })();
        return () => controller.abort();
    }, [cityCode]);

    // Forward geocode (debounced 500ms) when the user types the Street / House /
    // Unit input or changes the Barangay / City selection. Combines street,
    // barangay, city, and province, then flies the map pin to the matched
    // Negros Island coordinates. Manual pin dragging still works.
    useEffect(() => {
        // Consumed by map clicks/drags: skip one forward-geocode pass so a
        // reverse-geocode-driven dropdown change does not fly the map back to
        // the barangay centroid while the user's pin stays put.
        if (skipNextGeocodeFlyRef.current) {
            skipNextGeocodeFlyRef.current = false;
            return;
        }
        if (!street && !barangayCode) return;
        if (forwardGeocodeTimer.current) clearTimeout(forwardGeocodeTimer.current);
        forwardGeocodeController.current?.abort();
        const controller = new AbortController();
        forwardGeocodeController.current = controller;
        forwardGeocodeTimer.current = setTimeout(async () => {
            forwardGeocodeTimer.current = null;
            const localQuery = [street, selectedBarangay, selectedCity, selectedProvince]
                .filter(Boolean)
                .join(', ');
            const query = `${localQuery}, Philippines`;
            try {
                if (
                    !(await waitForGeocodeSlot(
                        lastForwardGeocodeAt,
                        controller.signal,
                        500,
                    ))
                ) {
                    return;
                }
                const results = await fetchJson<{ features: unknown[] }>(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`,
                    controller.signal,
                );
                if (controller.signal.aborted) return;
                const feature = results.features[0] as
                    | { geometry: { coordinates: [number, number] } }
                    | undefined;
                if (!feature) return;
                const [lng, lat] = feature.geometry.coordinates;
                const coordinates = { lat, lng };
                if (!isWithinNegrosIsland(coordinates)) {
                    // Outside Negros Island: keep the city coordinates as fallback.
                    return;
                }
                setPosition(coordinates);
                setZoom(16);
                onChange({
                    street,
                    province: selectedProvince,
                    city: selectedCity,
                    barangay: selectedBarangay,
                    zip_code: zipCode || postalCodeForCity(selectedCity),
                    latitude: String(lat),
                    longitude: String(lng),
                });
            } catch {
                // Photon refinement is optional and silent: keep the city
                // coordinates as fallback when offline or unresolved.
            }
        }, 500);
        return () => {
            if (forwardGeocodeTimer.current) clearTimeout(forwardGeocodeTimer.current);
            controller.abort();
        };
    }, [street, barangayCode, selectedBarangay, selectedCity, selectedProvince, onChange, zipCode]);

    // Reverse geocode (debounced 450ms) when the map pin moves. Best-effort
    // auto-fill of Province, City, Barangay, and Zip Code via
    // GET /api/locations/reverse -- an optional refinement that never blocks pin movement.
    useEffect(() => {
        if (!position) return;
        if (reverseGeocodeTimer.current) clearTimeout(reverseGeocodeTimer.current);
        reverseGeocodeController.current?.abort();
        const controller = new AbortController();
        reverseGeocodeController.current = controller;
        reverseGeocodeTimer.current = setTimeout(async () => {
            reverseGeocodeTimer.current = null;
            try {
                if (
                    !(await waitForGeocodeSlot(
                        lastReverseGeocodeAt,
                        controller.signal,
                        450,
                    ))
                ) {
                    return;
                }
                const results = await fetchJson<{ features: unknown[] }>(
                    `${locationsApi}/reverse?lat=${position.lat}&lon=${position.lng}`,
                    controller.signal,
                );
                if (controller.signal.aborted) return;
                const feature = results.features[0] as
                    | { properties: Record<string, unknown> }
                    | undefined;
                if (!feature) return;
                const properties = feature.properties;
                                // Province/city are set synchronously from the local table on
                // map click and are intentionally not re-derived here. Only
                // refine barangay (matched against the city's loaded barangay
                // options) and street (if empty).
                const suburb =
                    (properties.suburb as string) ??
                    (properties.neighbourhood as string) ??
                    (properties.neighborhood as string) ??
                    (properties.hamlet as string) ?? '';
                if (suburb && cityCode) {
                    const barangayMatch = barangays.find((b) =>
                        normalizeCityName(b.name) === normalizeCityName(suburb),
                    );
                    if (barangayMatch) {
                        setBarangayCode(barangayMatch.code);
                    }
                }
                if (!street) {
                    const streetFromGeocode = (properties.street as string) ?? '';
                    if (streetFromGeocode) {
                        setStreet(streetFromGeocode);
                    }
                }
                notifyChange();
            } catch {
                // Reverse geocode failures are non-fatal: keep the pin.
            }
        }, 450);
        return () => {
            if (reverseGeocodeTimer.current) clearTimeout(reverseGeocodeTimer.current);
            controller.abort();
        };
    }, [position, cities, provinces, barangays, provinceCode, cityCode, barangayCode, street, notifyChange]);

    // Auto-fill postal code when the city selection changes.
    useEffect(() => {
        if (!cityCode) return;
        const match = cities.find((c) => c.code === cityCode);
        if (!match) return;
        setZipCode((current) => current || postalCodeForCity(match.name));
    }, [cityCode, cities]);

    // Select the matching city option once its province's cities have loaded.
    // Matches by normalized name so "City of Victorias" and "Municipality of
    // X" align with their stripped forms. This runs after setProvinceCode
    // triggers the cities load, so province is always set before city.
    useEffect(() => {
        if (!provinceCode || !pendingCityName) return;
        const match = cities.find(
            (c) => normalizeCityName(c.name) === normalizeCityName(pendingCityName),
        );
        if (!match) return;
        setCityCode(match.code);
        setZipCode((current) => current || postalCodeForCity(match.name));
        setPendingCityName(null);
    }, [provinceCode, cities, pendingCityName]);

    function waitForGeocodeSlot(
        stamp: { current: number },
        signal: AbortSignal,
        minInterval: number,
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const tick = () => {
                if (signal.aborted) {
                    resolve(false);
                    return;
                }
                const delay = minInterval - (Date.now() - stamp.current);
                if (delay <= 0) {
                    stamp.current = Date.now();
                    resolve(true);
                    return;
                }
                setTimeout(tick, delay);
            };
            tick();
        });
    }

    function handleMapSelect(coordinates: Coordinates) {
        // Only accept picks inside Negros Island so the pin never leaves the
        // island bounds; clicks or drags outside are ignored.
        if (!isWithinNegrosIsland(coordinates)) return;
        // Guard the forward-geocode effect: a map click/drag triggers reverse
        // geocode, which updates barangay/city/province and would otherwise
        // re-fly the map to the barangay centroid (pin bounce-back).
        skipNextGeocodeFlyRef.current = true;
        setPosition(coordinates);
        setZoom(16);

        // Resolve the nearest Negros city/municipality from the local table so
        // province, city, and zip_code populate immediately even when the
        // province was initially empty. Province is set first so its cities can
        // load; the matching city option is then selected by normalized name.
        const nearest = findNearestNegrosCity(coordinates);
        let provinceName = selectedProvince;
        let cityName = selectedCity;
        if (nearest) {
            const provinceMatch = provinces.find(
                (p) => p.name.toLowerCase() === nearest.province.toLowerCase(),
            );
            if (provinceMatch) {
                setProvinceCode(provinceMatch.code);
                provinceName = provinceMatch.name;
                setPendingCityName(nearest.name);
                cityName = nearest.name;
                setZipCode(nearest.zip_code);
            }
        }

        // Publish the clicked latitude/longitude immediately so the pin moves
        // on the next render; barangay and street are refined asynchronously
        // by the reverse-geocode effect below.
        onChange({
            street,
            province: provinceName,
            city: cityName,
            barangay: selectedBarangay,
            zip_code: nearest ? nearest.zip_code : zipCode,
            latitude: String(coordinates.lat),
            longitude: String(coordinates.lng),
        });
    }

    function handleUseMyLocation() {
        if (!('geolocation' in navigator)) {
            setLocationError('Your browser does not support geolocation.');
            return;
        }
        setLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coordinates = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setPosition(coordinates);
                setZoom(16);
                setLocating(false);
                notifyChange();
            },
            (err) => {
                setLocating(false);
                setLocationError(
                    err.code === err.PERMISSION_DENIED
                        ? 'Location access was denied.'
                        : 'Unable to determine your location.',
                );
            },
            { timeout: 10000 },
        );
    }

    function handleZipChange(value: string) {
        setZipCode(value);
        notifyChange();
    }

    function handleStreetChange(value: string) {
        setStreet(value);
        notifyChange();
    }

    const addressSummary = (
        <div className="grid gap-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="picker-province">Province</Label>
                    <select
                        id="picker-province"
                        value={provinceCode}
                        disabled={disabled || provinceLoading || provinces.length === 0}
                        onChange={(event) => {
                            const selected = provinces.find(
                                (p) => p.code === event.target.value,
                            );
                            if (!selected) return;
                            setProvinceCode(selected.code);
                            setCityCode('');
                            setBarangayCode('');
                            setZipCode('');
                            setCities([]);
                            setBarangays([]);
                            skipNextGeocodeFlyRef.current = false;
                            notifyChange();
                        }}
                        className="border-input bg-background text-foreground h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50"
                    >
                        <option value="">Select province</option>
                        {provinces.map((p) => (
                            <option key={p.code} value={p.code}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={provinceError} />
                </div>
                <div>
                    <Label htmlFor="picker-city">City / Municipality</Label>
                    <select
                        id="picker-city"
                        value={cityCode}
                        disabled={
                            disabled ||
                            !provinceCode ||
                            cities.length === 0
                        }
                        onChange={(event) => {
                            const selected = cities.find(
                                (c) => c.code === event.target.value,
                            );
                            if (!selected) return;
                            setCityCode(selected.code);
                            setBarangayCode('');
                            setBarangays([]);
                            skipNextGeocodeFlyRef.current = false;
                            const cityZip =
                                selected.zip_code ?? postalCodeForCity(selected.name) ?? '';
                            setZipCode(cityZip);
                            const cityLat = selected.lat ?? null;
                            const cityLng = selected.lng ?? null;
                            if (cityLat !== null && cityLng !== null) {
                                setPosition({ lat: cityLat, lng: cityLng });
                                setZoom(13);
                            } else {
                                setPosition(null);
                                setZoom(9);
                            }
                            onChange({
                                street,
                                province: selectedProvince,
                                city: selected.name,
                                barangay: '',
                                zip_code: cityZip,
                                latitude: cityLat !== null ? String(cityLat) : '',
                                longitude: cityLng !== null ? String(cityLng) : '',
                            });
                        }}
                        className="border-input bg-background text-foreground h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50"
                    >
                        <option value="">Select city</option>
                        {cities.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={cityError} />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="picker-barangay">Barangay</Label>
                    <select
                        id="picker-barangay"
                        value={barangayCode}
                        disabled={
                            disabled ||
                            !cityCode ||
                            barangays.length === 0
                        }
                        onChange={(event) => {
                            const selected = barangays.find(
                                (b) => b.code === event.target.value,
                            );
                            if (!selected) return;
                            setBarangayCode(selected.code);
                            skipNextGeocodeFlyRef.current = false;
                            notifyChange();
                        }}
                        className="border-input bg-background text-foreground h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50"
                    >
                        <option value="">Select barangay</option>
                        {barangays.map((b) => (
                            <option key={b.code} value={b.code}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={barangayError} />
                </div>
                <div>
                    <Label htmlFor="picker-zip">Zip Code</Label>
                    <Input
                        id="picker-zip"
                        value={zipCode}
                        disabled={disabled}
                        onChange={(event) => handleZipChange(event.target.value)}
                        placeholder="e.g. 6119"
                        className="h-10 w-full"
                    />
                    <InputError message={zipCodeError} />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <Label htmlFor="picker-street">Street / House / Unit</Label>
                    <Input
                        id="picker-street"
                        value={street}
                        disabled={disabled}
                        onChange={(event) => handleStreetChange(event.target.value)}
                        placeholder="e.g. 123 J. Rizal St., Unit 5B"
                        className="h-10 w-full"
                    />
                    <InputError message={streetError} />
                </div>
            </div>
            {provinceLoading && (
                <p className="text-muted-foreground text-xs">Loading location options…</p>
            )}
            {locationError && (
                <p role="alert" className="text-destructive text-xs">{locationError}</p>
            )}
            {error && (
                <p role="alert" className="text-destructive text-xs">{error}</p>
            )}
            <p className="text-muted-foreground text-xs">
                Pick your province, city, and barangay, then adjust the pin on the map. Your zip code fills in
                automatically and the pickup point updates as you move the pin.
            </p>
        </div>
    );

    const mapPanel = (
        <div className="space-y-2">
            <div
                className={`border-border overflow-hidden rounded-lg border h-[70vh] max-h-[950px] min-h-[560px] flex flex-col`}
            >
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-background/50 border-b">
                    <h3 className="text-sm font-semibold text-foreground">Map</h3>
                    <Button
                        onClick={handleUseMyLocation}
                        disabled={disabled || locating}
                        variant="outline"
                        size="sm"
                        className="md:hidden w-auto shrink-0"
                    >
                        {locating ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Locate className="size-4" />
                        )}
                        Use my location
                    </Button>
                </div>
                <div className="relative flex-1 min-h-0 overflow-hidden">
                    {AddressMapComponent ? (
                        <AddressMapComponent
                            position={position}
                            zoom={zoom}
                            onSelect={handleMapSelect}
                        />
                    ) : (
                        <p className="text-muted-foreground p-3 text-sm">Loading map…</p>
                    )}
                </div>
            </div>
            <p className="text-muted-foreground text-xs">
                Drag the pin or click the map to set your exact pickup point. Province, city, barangay, and zip
                code update automatically from the map location.
            </p>
        </div>
    );

    return (
        <div className="space-y-4">
            {addressSummary}
            {mapPanel}
        </div>
    );

}