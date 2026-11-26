import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComponentType, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

type Coordinates = {
    lat: number;
    lng: number;
};

type AddressMapProps = {
    position: Coordinates | null;
    zoom: number;
    onSelect: (coordinates: Coordinates) => void;
};

type LocationOption = {
    code: string;
    name: string;
    regionName?: string;
    regionCode?: string;
    provinceCode?: string | false;
};

type CountryOption = {
    cca2: string;
    name: { common: string };
};

type PhotonFeature = {
    geometry: { coordinates: [number, number] };
    properties: Record<string, unknown>;
};

type AddressPickerProps = {
    onChange: (address: string) => void;
    layout?: 'stacked' | 'split';
    leftContent?: ReactNode;
    latitude?: number | string | null;
    longitude?: number | string | null;
    onCoordinatesChange: (latitude: string, longitude: string) => void;
    error?: string;
    required?: boolean;
    onCityChange?: (city: string) => void;
    initialProvince?: string;
    initialCity?: string;
    initialBarangay?: string;
    initialStreet?: string;
};

const psgcApi = 'https://psgc.gitlab.io/api';
const photonApi = 'https://photon.komoot.io';
const countryCodes = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
DE DJ DK DM DO DZ
EC EE EG EH ER ES ET
FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU
ID IE IL IM IN IO IQ IR IS IT
JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ
LA LB LC LI LK LR LS LT LU LV LY
MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ
OM
PA PE PF PG PH PK PL PM PN PR PS PT PW PY
QA
RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ
UA UG UM US UY UZ
VA VC VE VG VI VN VU
WF WS
YE YT
ZA ZM ZW
`;
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countries: CountryOption[] = countryCodes
    .trim()
    .split(/\s+/)
    .map((cca2) => ({ cca2, name: { common: countryNames.of(cca2) ?? cca2 } }))
    .sort((first, second) => first.name.common.localeCompare(second.name.common));

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isLocationOption(value: unknown): value is LocationOption {
    return (
        isRecord(value) &&
        typeof value.code === 'string' &&
        typeof value.name === 'string' &&
        (value.regionName === undefined || typeof value.regionName === 'string') &&
        (value.regionCode === undefined || typeof value.regionCode === 'string')
    );
}

function isPhotonFeature(value: unknown): value is PhotonFeature {
    if (!isRecord(value) || !isRecord(value.geometry) || !isRecord(value.properties)) {
        return false;
    }

    const coordinates = value.geometry.coordinates;

    return Array.isArray(coordinates) && coordinates.length >= 2 && typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number';
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'The location service request failed.';
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`Location service returned HTTP ${response.status}.`);
    }

    return response.json();
}

async function fetchLocations(url: string, signal: AbortSignal): Promise<LocationOption[]> {
    const data = await fetchJson(url, signal);

    if (!Array.isArray(data)) {
        throw new Error('The Philippine location service returned invalid data.');
    }

    return data.filter(isLocationOption);
}

function placeLabel(feature: PhotonFeature): string {
    const fields = ['housenumber', 'street', 'locality', 'district', 'city', 'county', 'state', 'postcode', 'country'];
    const parts = fields
        .map((field) => feature.properties[field])
        .filter((value): value is string => typeof value === 'string' && value.trim() !== '');

    if (parts.length === 0 && typeof feature.properties.name === 'string') {
        parts.push(feature.properties.name);
    }

    return [...new Set(parts)].join(', ');
}

function normalizeLocationName(name: string): string {
    return name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\bregion\s+(?:[ivxlcdm]+|\d+)\b/g, '')
        .replace(/\s+\bregion\b/g, '')
        .replace(/\b(?:city|municipality|province|barangay)\s+of\s+/g, '')
        .replace(/\s+\b(?:city|municipality|province|barangay)\b/g, '')
        .replace(/[(),]/g, ' ')
        .replace(/\bthe\b/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function findLocationOption(options: LocationOption[], names: string[]): LocationOption | undefined {
    const candidates = names.map(normalizeLocationName).filter(Boolean);

    return options.find((option) => {
        const optionNames = [
            option.name,
            option.regionName ?? '',
            option.name.replace(/\s*\([^)]*\)/g, ''),
            option.name.replace(/\s*\([^)]*\)/g, '').replace(/\s+\b(?:region|province)\b.*/i, ''),
        ].map(normalizeLocationName);

        return optionNames.some((name) => candidates.includes(name));
    });
}

function photonPropertyNames(properties: Record<string, unknown>, fields: string[]): string[] {
    return fields.map((field) => properties[field]).filter((value): value is string => typeof value === 'string' && value.trim() !== '');
}

export default function AddressPicker({
    onChange,
    layout = 'stacked',
    leftContent,
    latitude,
    longitude,
    onCoordinatesChange,
    error,
    onCityChange,
    initialProvince,
    initialCity,
    initialBarangay,
    initialStreet,
}: AddressPickerProps) {
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
    const [countryCode, setCountryCode] = useState('PH');
    const [regions, setRegions] = useState<LocationOption[]>([]);
    const [provinces, setProvinces] = useState<LocationOption[]>([]);
    const [cities, setCities] = useState<LocationOption[]>([]);
    const [barangays, setBarangays] = useState<LocationOption[]>([]);
    const [regionCode, setRegionCode] = useState('');
    const [provinceCode, setProvinceCode] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [barangayCode, setBarangayCode] = useState('');
    const [street, setStreet] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);
    const [provinceLoading, setProvinceLoading] = useState(false);
    const [cityLoading, setCityLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [position, setPosition] = useState<Coordinates | null>(hasSavedPin ? { lat: initialLatitude, lng: initialLongitude } : null);
    const [zoom, setZoom] = useState(hasSavedPin ? 15 : 8);
    const [AddressMap, setAddressMap] = useState<ComponentType<AddressMapProps> | null>(null);
    const lastGeocodeAt = useRef(0);
    const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const geocodeController = useRef<AbortController | null>(null);
    const updateStructuredAddressRef = useRef(updateStructuredAddress);
    const country = countries.find((item) => item.cca2 === countryCode);
    const countryName = country?.name.common ?? 'Philippines';
    const isPhilippines = countryCode === 'PH';
    const selectedRegion = regions.find((item) => item.code === regionCode)?.name ?? '';
    const selectedProvince = provinces.find((item) => item.code === provinceCode)?.name ?? '';
    const selectedCity = cities.find((item) => item.code === cityCode)?.name ?? '';
    const selectedBarangay = barangays.find((item) => item.code === barangayCode)?.name ?? '';
    const visibleProvinces = regionCode ? provinces.filter((province) => province.regionCode === regionCode) : provinces;
    const visibleCities = provinceCode ? cities.filter((city) => city.provinceCode === provinceCode) : cities;

    function updateCoordinates(coordinates: Coordinates | null) {
        if (!coordinates) {
            onCoordinatesChange('', '');
            setPosition(null);
            return;
        }

        setPosition(coordinates);
        onCoordinatesChange(String(coordinates.lat), String(coordinates.lng));
    }

    function updateStructuredAddress(
        next: Partial<{
            country: string;
            region: string;
            province: string;
            city: string;
            barangay: string;
            street: string;
        }> = {},
    ) {
        const address = {
            street: next.street ?? street,
            barangay: next.barangay ?? selectedBarangay,
            city: next.city ?? selectedCity,
            province: next.province ?? selectedProvince,
            region: next.region ?? selectedRegion,
            country: next.country ?? countryName,
        };

        onChange(JSON.stringify(address));

        if (Object.prototype.hasOwnProperty.call(next, 'street')) {
            setMapError(null);
            return;
        }

        updateCoordinates(null);
        const mapParts = [
            next.barangay ?? selectedBarangay,
            next.city ?? selectedCity,
            next.province ?? selectedProvince,
            next.region ?? selectedRegion,
            next.country ?? countryName,
        ].filter((part) => part.trim() !== '');
        scheduleAddressLookup(mapParts.join(', '));
    }
    updateStructuredAddressRef.current = updateStructuredAddress;

    useEffect(() => {
        if (!isPhilippines) {
            setRegions([]);
            setRegionCode('');
            setProvinceCode('');
            setCityCode('');
            setBarangayCode('');
            setProvinces([]);
            setCities([]);
            setBarangays([]);
            setProvinceLoading(false);
            setLocationLoading(false);
            return;
        }

        const controller = new AbortController();
        setLocationLoading(true);
        setProvinceLoading(true);
        setLocationError(null);

        fetchLocations(`${psgcApi}/regions/`, controller.signal)
            .then(setRegions)
            .catch((error: unknown) => {
                if (error instanceof Error && error.name !== 'AbortError') {
                    setLocationError(errorMessage(error));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLocationLoading(false);
                }
            });

        fetchLocations(`${psgcApi}/provinces/`, controller.signal)
            .then(setProvinces)
            .catch((error: unknown) => {
                if (error instanceof Error && error.name !== 'AbortError') {
                    setLocationError(errorMessage(error));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setProvinceLoading(false);
                }
            });

        return () => controller.abort();
    }, [isPhilippines]);

    useEffect(() => {
        setCityCode('');
        setBarangayCode('');
        setCities([]);
        setBarangays([]);

        if (!regionCode) {
            setCityLoading(false);
            setLocationLoading(false);
            return;
        }

        const controller = new AbortController();
        setCityLoading(true);
        setLocationLoading(true);
        setLocationError(null);

        fetchLocations(`${psgcApi}/regions/${regionCode}/cities-municipalities/`, controller.signal)
            .then(setCities)
            .catch((error: unknown) => {
                if (error instanceof Error && error.name !== 'AbortError') {
                    setLocationError(errorMessage(error));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setCityLoading(false);
                    setLocationLoading(false);
                }
            });

        return () => controller.abort();
    }, [countryCode, isPhilippines, regionCode]);

    useEffect(() => {
        setBarangayCode('');
        setBarangays([]);

        if (!cityCode) {
            return;
        }

        const controller = new AbortController();
        setLocationLoading(true);
        setLocationError(null);

        fetchLocations(`${psgcApi}/cities-municipalities/${cityCode}/barangays/`, controller.signal)
            .then(setBarangays)
            .catch((error: unknown) => {
                if (error instanceof Error && error.name !== 'AbortError') {
                    setLocationError(errorMessage(error));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLocationLoading(false);
                }
            });

        return () => controller.abort();
    }, [cityCode, isPhilippines]);

    useEffect(() => {
        if (AddressMap) {
            return;
        }

        let cancelled = false;

        import('./address-map')
            .then(({ default: Map }) => {
                if (!cancelled) {
                    setAddressMap(() => Map);
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setMapError(errorMessage(error));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [AddressMap]);

    // Pre-select saved province/city/barangay once their option lists load.
    // Setting regionCode triggers the cities loading effect; setting cityCode
    // triggers the barangays loading effect. updateStructuredAddress keeps
    // data.address in sync so Save address persists the full address.
    useEffect(() => {
        if (!initialProvince || provinceCode) return;
        const match = provinces.find((p) => p.name === initialProvince);
        if (match) {
            setProvinceCode(match.code);
            setRegionCode(match.regionCode ?? '');
            setCityCode('');
            setBarangayCode('');
            setCities([]);
            setBarangays([]);
            updateStructuredAddressRef.current({ street, province: initialProvince });
        }
    }, [provinces, initialProvince, provinceCode, street]);

    useEffect(() => {
        if (!initialCity || cityCode) return;
        const match = cities.find((c) => c.name === initialCity);
        if (match) {
            setCityCode(match.code);
            updateStructuredAddressRef.current({ street, city: initialCity });
        }
    }, [cities, initialCity, cityCode, street]);

    useEffect(() => {
        if (!initialBarangay || barangayCode) return;
        const match = barangays.find((b) => b.name === initialBarangay);
        if (match) {
            setBarangayCode(match.code);
            updateStructuredAddressRef.current({ street, barangay: initialBarangay });
        }
    }, [barangays, initialBarangay, barangayCode, street]);

    // Pre-fill the saved street once so it round-trips through the structured address.
    useEffect(() => {
        if (!initialStreet || street) return;
        setStreet(initialStreet);
        updateStructuredAddressRef.current({ street: initialStreet });
    }, [initialStreet, street]);

    useEffect(() => {
        return () => {
            if (geocodeTimer.current) {
                clearTimeout(geocodeTimer.current);
            }
            geocodeController.current?.abort();
        };
    }, []);

    async function requestPhoton(url: string, signal: AbortSignal): Promise<PhotonFeature[]> {
        const data = await fetchJson(url, signal);
        if (!isRecord(data) || !Array.isArray(data.features)) {
            throw new Error('The map search service returned invalid data.');
        }

        return data.features.filter(isPhotonFeature);
    }

    async function waitForGeocodeSlot(signal: AbortSignal): Promise<boolean> {
        while (!signal.aborted) {
            const delay = 1000 - (Date.now() - lastGeocodeAt.current);
            if (delay <= 0) {
                lastGeocodeAt.current = Date.now();
                return true;
            }

            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        return false;
    }

    async function lookupAddress(query: string, signal: AbortSignal) {
        setSearchLoading(true);
        setMapError(null);

        try {
            if (!(await waitForGeocodeSlot(signal))) {
                return;
            }

            const results = await requestPhoton(`${photonApi}/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`, signal);
            if (signal.aborted) {
                return;
            }

            const feature = results[0];
            if (!feature) {
                setMapError('No matching places were found. Try adding more location details.');
                return;
            }

            const [lng, lat] = feature.geometry.coordinates;
            const coordinates = { lat, lng };
            setPosition(coordinates);
            setZoom(16);
            updateCoordinates(coordinates);
        } catch (error) {
            if (!signal.aborted) {
                setMapError(errorMessage(error));
            }
        } finally {
            if (!signal.aborted) {
                setSearchLoading(false);
            }
        }
    }

    function cancelAddressLookup() {
        if (geocodeTimer.current) {
            clearTimeout(geocodeTimer.current);
            geocodeTimer.current = null;
        }
        geocodeController.current?.abort();
        geocodeController.current = null;
        setSearchLoading(false);
    }

    function scheduleAddressLookup(query: string) {
        cancelAddressLookup();
        setMapError(null);

        if (query.trim().length < 4) {
            return;
        }

        const controller = new AbortController();
        geocodeController.current = controller;
        geocodeTimer.current = setTimeout(() => {
            geocodeTimer.current = null;
            void lookupAddress(query.trim(), controller.signal);
        }, 800);
    }

    async function updateLocationSelectors(feature: PhotonFeature, signal: AbortSignal) {
        const properties = feature.properties;
        const countryCode = String(properties.countrycode ?? '').toUpperCase();
        const matchedCountry =
            countries.find((item) => item.cca2 === countryCode) ??
            countries.find((item) => normalizeLocationName(item.name.common) === normalizeLocationName(String(properties.country ?? '')));

        if (matchedCountry) {
            setCountryCode(matchedCountry.cca2);
        }

        setRegionCode('');
        setProvinceCode('');
        setCityCode('');
        setBarangayCode('');
        setCities([]);
        setBarangays([]);

        if (matchedCountry?.cca2 !== 'PH') {
            setRegions([]);
            setLocationLoading(false);
            return;
        }

        setLocationLoading(true);
        setLocationError(null);

        try {
            const nextRegions = await fetchLocations(`${psgcApi}/regions/`, signal);
            if (signal.aborted) {
                return;
            }

            setRegions(nextRegions);
            const regionNames = photonPropertyNames(properties, ['state', 'region']);
            if (regionNames.some((name) => /^(metro manila|ncr)$/i.test(name.trim()))) {
                regionNames.push('National Capital Region');
            }
            let matchedRegion = findLocationOption(nextRegions, regionNames);

            if (!matchedRegion) {
                const allProvinces = await fetchLocations(`${psgcApi}/provinces/`, signal);
                if (signal.aborted) {
                    return;
                }

                const matchedProvince = findLocationOption(allProvinces, photonPropertyNames(properties, ['province', 'state', 'county']));
                if (matchedProvince?.regionCode) {
                    matchedRegion = nextRegions.find((region) => region.code === matchedProvince.regionCode);
                }
            }

            if (!matchedRegion) {
                setLocationError('The pin was saved, but its Philippine region could not be matched to the selectors.');
                return;
            }

            setRegionCode(matchedRegion.code);
            const [nextProvinces, nextCities] = await Promise.all([
                fetchLocations(`${psgcApi}/regions/${matchedRegion.code}/provinces/`, signal),
                fetchLocations(`${psgcApi}/regions/${matchedRegion.code}/cities-municipalities/`, signal),
            ]);
            if (signal.aborted) {
                return;
            }

            setProvinces((current) => (current.length > 0 ? current : nextProvinces));
            setCities(nextCities);

            const matchedProvince = findLocationOption(nextProvinces, photonPropertyNames(properties, ['province', 'county', 'state']));
            if (matchedProvince) {
                setProvinceCode(matchedProvince.code);
            }

            const cityNames = photonPropertyNames(properties, ['city', 'locality', 'municipality', 'town', 'village']);
            if (!matchedProvince) {
                cityNames.push(...photonPropertyNames(properties, ['county']));
            }
            const matchedCity = findLocationOption(nextCities, cityNames);
            if (!matchedCity) {
                setLocationError('The pin was saved, but its city or municipality could not be matched.');
                return;
            }

            setCityCode(matchedCity.code);
            const nextBarangays = await fetchLocations(`${psgcApi}/cities-municipalities/${matchedCity.code}/barangays/`, signal);
            if (signal.aborted) {
                return;
            }

            setBarangays(nextBarangays);
            const matchedBarangay = findLocationOption(
                nextBarangays,
                photonPropertyNames(properties, [
                    'locality',
                    'suburb',
                    'district',
                    'city_district',
                    'neighbourhood',
                    'neighborhood',
                    'quarter',
                    'hamlet',
                    'borough',
                ]),
            );
            if (matchedBarangay) {
                setBarangayCode(matchedBarangay.code);
            }
        } catch (error) {
            if (!signal.aborted) {
                setLocationError(errorMessage(error));
            }
        } finally {
            if (!signal.aborted) {
                setLocationLoading(false);
            }
        }
    }

    async function chooseMapPoint(coordinates: Coordinates) {
        cancelAddressLookup();
        setLocationLoading(false);
        setLocationError(null);
        const controller = new AbortController();
        geocodeController.current = controller;
        setPosition(coordinates);
        setZoom(16);
        setMapError(null);
        updateCoordinates(coordinates);

        try {
            if (!(await waitForGeocodeSlot(controller.signal))) {
                return;
            }
            const results = await requestPhoton(`${photonApi}/reverse?lat=${coordinates.lat}&lon=${coordinates.lng}&lang=en`, controller.signal);
            if (controller.signal.aborted) {
                return;
            }
            const feature = results[0];
            if (!feature) {
                setMapError('The pin was saved, but no mapped address was found.');
                return;
            }

            const address = placeLabel(feature);
            if (address) {
                onChange(address);
            } else {
                setMapError('The pin was saved, but no mapped address was found.');
            }

            await updateLocationSelectors(feature, controller.signal);
        } catch (error) {
            if (!controller.signal.aborted) {
                setMapError(errorMessage(error));
            }
        } finally {
            if (!controller.signal.aborted) {
                setSearchLoading(false);
            }
        }
    }

    const addressFields = (
        <div className="space-y-4">
            {leftContent}
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">

                        <LocationSelect
                            id="address-province"
                            label="Province"
                            value={provinceCode}
                            options={visibleProvinces}
                            disabled={provinceLoading || visibleProvinces.length === 0}
                            onChange={(code, name) => {
                                setProvinceCode(code);
                                setCityCode('');
                                setBarangayCode('');
                                setBarangays([]);
                                updateStructuredAddress({
                                    region: selectedRegion,
                                    province: name,
                                    city: '',
                                    barangay: '',
                                });
                            }}
                        />

                        <LocationSelect
                            id="address-city"
                            label="City / Municipality"
                            value={cityCode}
                            options={visibleCities}
                            disabled={cityLoading || visibleCities.length === 0}
                            onChange={(code, name) => {
                                setCityCode(code);
                                setBarangayCode('');
                                setBarangays([]);
                                updateStructuredAddress({ city: name, barangay: '' });
                                onCityChange?.(name);
                            }}
                        />

                        <LocationSelect
                            id="address-barangay"
                            label="Barangay"
                            value={barangayCode}
                            options={barangays}
                            disabled={!cityCode || locationLoading}
                            onChange={(code, name) => {
                                setBarangayCode(code);
                                updateStructuredAddress({ barangay: name });
                            }}
                        />
            </div>

            {isPhilippines && (
                <div className="grid min-w-0 gap-2">
                    <Label htmlFor="address-street">Street / House / Unit</Label>
                    <Input
                        id="address-street"
                        value={street}
                        className="h-10 w-full bg-white text-gray-900 placeholder:text-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                        onChange={(event) => {
                            setStreet(event.target.value);
                            updateStructuredAddress({ street: event.target.value });
                        }}
                        placeholder="Street name, house or unit number"
                    />
                    <p className="text-muted-foreground text-xs">Optional. Street details are saved but are not used to place the map pin.</p>
                </div>
            )}

            {locationLoading && <p className="text-muted-foreground text-xs">Loading address options…</p>}
            {locationError && (
                <p role="alert" className="text-destructive text-xs">
                    {locationError}
                </p>
            )}
            {searchLoading && <p className="text-muted-foreground text-xs">Locating address on the map…</p>}
            <p className="text-muted-foreground text-xs">
                Philippine location options load from PSGC. Address and map lookups send the entered location to Photon; map tiles come from
                OpenStreetMap. Street details stay unchanged when you move the map pin.
            </p>
            {error && (
                <p role="alert" className="text-destructive text-xs">
                    {error}
                </p>
            )}
        </div>
    );

    const mapPanel = (
        <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Scroll to zoom, then click the map or drag the pin to update your location.</p>
            <div
                className={`border-border overflow-hidden rounded-lg border ${layout === 'split' ? 'h-[70vh] max-h-[950px] min-h-[560px]' : 'h-72'}`}
            >
                {AddressMap ? (
                    <AddressMap position={position} zoom={zoom} onSelect={(coordinates) => void chooseMapPoint(coordinates)} />
                ) : (
                    <p className="text-muted-foreground p-3 text-sm">Loading map…</p>
                )}
            </div>
            {mapError && (
                <p role="alert" className="text-destructive text-xs">
                    {mapError}
                </p>
            )}
        </div>
    );

    if (layout === 'split') {
        return (
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.5fr)]">
                <div className="min-w-0">{addressFields}</div>
                <div className="min-w-0">{mapPanel}</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {addressFields}
            {mapPanel}
        </div>
    );
}

function LocationSelect({
    id,
    label,
    value,
    options,
    disabled,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    options: LocationOption[];
    disabled: boolean;
    onChange: (code: string, name: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <select
                id={id}
                value={value}
                disabled={disabled}
                onChange={(event) => {
                    const selected = options.find((option) => option.code === event.target.value);
                    onChange(event.target.value, selected?.name ?? '');
                }}
                className="border-input bg-background text-foreground h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50"
            >
                <option value="">Select {label.toLowerCase()}</option>
                {options.map((option) => (
                    <option key={option.code} value={option.code}>
                        {option.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
