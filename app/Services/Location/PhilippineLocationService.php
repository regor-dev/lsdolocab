<?php

namespace App\Services\Location;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PhilippineLocationService
{
    private const PHOTON_BASE_URL = 'https://photon.komoot.io';

    private const NEGROS_PROVINCES_CACHE_KEY = 'psgc:negros:provinces';
    private const PROVINCE_CITIES_CACHE_KEY = 'psgc:province:{code}:cities';
    private const CITY_BARANGAYS_CACHE_KEY = 'psgc:city:{code}:barangays';

    private const GEOCODE_CACHE_TTL = 7 * 24 * 60; // 7 days, in minutes

    /**
     * Negros Island provinces only. Every other province is excluded from this
     * service so lookups can never leak LGUs outside the island.
     *
     * @var array<int, string>
     */
    private const NEGROS_PROVINCES = [
        'Negros Occidental',
        'Negros Oriental',
    ];

    /**
     * Negros Island cities/municipalities keyed by PSGC province code.
     * Sourced from the Philippine Statistics Authority (PSGC). Only Negros
     * Occidental (064500000) and Negros Oriental (074600000) are present, so
     * lookups can never leak LGUs from other regions. No external HTTP request
     * is made — this lives entirely in memory.
     *
     * @var array<string, array<int, array<string, string>>>
     */
    private const NEGROS_CITIES = [
        '064500000' => [
            ['code' => '064501000', 'name' => 'Bacolod City', 'lat' => 10.6765, 'lng' => 122.9509, 'zip_code' => '6100'],
            ['code' => '064502000', 'name' => 'Bago City', 'lat' => 10.5389, 'lng' => 122.8364, 'zip_code' => '6101'],
            ['code' => '064503000', 'name' => 'Binalbagan', 'lat' => 10.1941, 'lng' => 122.8645, 'zip_code' => '6107'],
            ['code' => '064504000', 'name' => 'Cadiz City', 'lat' => 10.9544, 'lng' => 123.3056, 'zip_code' => '6121'],
            ['code' => '064505000', 'name' => 'Calatrava', 'lat' => 10.5970, 'lng' => 123.4780, 'zip_code' => '6126'],
            ['code' => '064506000', 'name' => 'Candoni', 'lat' => 9.8307, 'lng' => 122.6430, 'zip_code' => '6110'],
            ['code' => '064507000', 'name' => 'Cauayan', 'lat' => 9.9724, 'lng' => 122.6242, 'zip_code' => '6112'],
            ['code' => '064508000', 'name' => 'Enrique B. Magalona', 'lat' => 10.8769, 'lng' => 122.9814, 'zip_code' => '6118'],
            ['code' => '064509000', 'name' => 'Escalante City', 'lat' => 10.8403, 'lng' => 123.4992, 'zip_code' => '6124'],
            ['code' => '064510000', 'name' => 'Himamaylan City', 'lat' => 10.0983, 'lng' => 122.8706, 'zip_code' => '6108'],
            ['code' => '064511000', 'name' => 'Hinigaran', 'lat' => 10.2706, 'lng' => 122.8507, 'zip_code' => '6106'],
            ['code' => '064512000', 'name' => 'Hinoba-an', 'lat' => 9.6018, 'lng' => 122.4670, 'zip_code' => '6114'],
            ['code' => '064513000', 'name' => 'Ilog', 'lat' => 10.0333, 'lng' => 122.7667, 'zip_code' => '6109'],
            ['code' => '064514000', 'name' => 'Isabela', 'lat' => 10.2048, 'lng' => 122.9888, 'zip_code' => '6128'],
            ['code' => '064515000', 'name' => 'Kabankalan City', 'lat' => 9.9889, 'lng' => 122.8122, 'zip_code' => '6111'],
            ['code' => '064516000', 'name' => 'La Carlota City', 'lat' => 10.4258, 'lng' => 122.9214, 'zip_code' => '6130'],
            ['code' => '064517000', 'name' => 'La Castellana', 'lat' => 10.3230, 'lng' => 123.0187, 'zip_code' => '6131'],
            ['code' => '064518000', 'name' => 'Manapla', 'lat' => 10.9539, 'lng' => 123.1225, 'zip_code' => '6120'],
            ['code' => '064519000', 'name' => 'Moises Padilla', 'lat' => 10.2708, 'lng' => 123.0734, 'zip_code' => '6132'],
            ['code' => '064520000', 'name' => 'Murcia', 'lat' => 10.6047, 'lng' => 123.0408, 'zip_code' => '6129'],
            ['code' => '064521000', 'name' => 'Don Salvador Benedicto', 'lat' => 10.5506, 'lng' => 123.2364, 'zip_code' => '6133'],
            ['code' => '064522000', 'name' => 'Pulupandan', 'lat' => 10.5167, 'lng' => 122.8167, 'zip_code' => '6102'],
            ['code' => '064523000', 'name' => 'Sagay City', 'lat' => 10.8964, 'lng' => 123.4244, 'zip_code' => '6122'],
            ['code' => '064524000', 'name' => 'San Carlos City', 'lat' => 10.4939, 'lng' => 123.4203, 'zip_code' => '6127'],
            ['code' => '064525000', 'name' => 'Pontevedra', 'lat' => 10.3679, 'lng' => 122.8703, 'zip_code' => '6105'],
            ['code' => '064526000', 'name' => 'Silay City', 'lat' => 10.7953, 'lng' => 122.9764, 'zip_code' => '6116'],
            ['code' => '064527000', 'name' => 'Sipalay City', 'lat' => 9.7519, 'lng' => 122.4042, 'zip_code' => '6113'],
            ['code' => '064528000', 'name' => 'Talisay City', 'lat' => 10.7372, 'lng' => 122.9669, 'zip_code' => '6115'],
            ['code' => '064529000', 'name' => 'San Enrique', 'lat' => 10.4167, 'lng' => 122.8500, 'zip_code' => '6104'],
            ['code' => '064530000', 'name' => 'Toboso', 'lat' => 10.7155, 'lng' => 123.5172, 'zip_code' => '6125'],
            ['code' => '064531000', 'name' => 'City of Victorias', 'lat' => 10.9000, 'lng' => 123.0730, 'zip_code' => '6119'],
            ['code' => '064532000', 'name' => 'Valladolid', 'lat' => 10.4614, 'lng' => 122.8241, 'zip_code' => '6103'],
        ],
        '074600000' => [
            ['code' => '074601000', 'name' => 'Amlan', 'lat' => 9.4636, 'lng' => 123.2266, 'zip_code' => '6203'],
            ['code' => '074602000', 'name' => 'Ayungon', 'lat' => 9.8587, 'lng' => 123.1436, 'zip_code' => '6210'],
            ['code' => '074603000', 'name' => 'Bacong', 'lat' => 9.2452, 'lng' => 123.2951, 'zip_code' => '6200'],
            ['code' => '074604000', 'name' => 'City of Bais', 'lat' => 9.5906, 'lng' => 123.1219, 'zip_code' => '6206'],
            ['code' => '074605000', 'name' => 'Basay', 'lat' => 9.4200, 'lng' => 122.6300, 'zip_code' => '6222'],
            ['code' => '074606000', 'name' => 'City of Bayawan', 'lat' => 9.3647, 'lng' => 122.8014, 'zip_code' => '6221'],
            ['code' => '074607000', 'name' => 'Bindoy', 'lat' => 9.7557, 'lng' => 123.1408, 'zip_code' => '6209'],
            ['code' => '074608000', 'name' => 'City of Canlaon', 'lat' => 10.3861, 'lng' => 123.2219, 'zip_code' => '6223'],
            ['code' => '074609000', 'name' => 'Dauin', 'lat' => 9.1911, 'lng' => 123.2655, 'zip_code' => '6217'],
            ['code' => '074610000', 'name' => 'Dumaguete City', 'lat' => 9.3068, 'lng' => 123.3054, 'zip_code' => '6200'],
            ['code' => '074611000', 'name' => 'City of Guihulngan', 'lat' => 10.1194, 'lng' => 123.2731, 'zip_code' => '6214'],
            ['code' => '074612000', 'name' => 'Jimalalud', 'lat' => 9.9791, 'lng' => 123.2003, 'zip_code' => '6212'],
            ['code' => '074613000', 'name' => 'La Libertad', 'lat' => 10.0264, 'lng' => 123.2338, 'zip_code' => '6213'],
            ['code' => '074614000', 'name' => 'Mabinay', 'lat' => 9.7265, 'lng' => 122.9294, 'zip_code' => '6207'],
            ['code' => '074615000', 'name' => 'Manjuyod', 'lat' => 9.6795, 'lng' => 123.1492, 'zip_code' => '6208'],
            ['code' => '074616000', 'name' => 'Pamplona', 'lat' => 9.4722, 'lng' => 123.1184, 'zip_code' => '6205'],
            ['code' => '074617000', 'name' => 'San Jose', 'lat' => 9.4138, 'lng' => 123.2417, 'zip_code' => '6202'],
            ['code' => '074618000', 'name' => 'Santa Catalina', 'lat' => 9.3330, 'lng' => 122.8631, 'zip_code' => '6220'],
            ['code' => '074619000', 'name' => 'Siaton', 'lat' => 9.0641, 'lng' => 123.0323, 'zip_code' => '6219'],
            ['code' => '074620000', 'name' => 'Sibulan', 'lat' => 9.3589, 'lng' => 123.2847, 'zip_code' => '6201'],
            ['code' => '074621000', 'name' => 'City of Tanjay', 'lat' => 9.5161, 'lng' => 123.1583, 'zip_code' => '6204'],
            ['code' => '074622000', 'name' => 'Tayasan', 'lat' => 9.9231, 'lng' => 123.1723, 'zip_code' => '6211'],
            ['code' => '074623000', 'name' => 'Valencia', 'lat' => 9.2817, 'lng' => 123.2446, 'zip_code' => '6215'],
            ['code' => '074624000', 'name' => 'Vallehermoso', 'lat' => 10.3348, 'lng' => 123.3260, 'zip_code' => '6224'],
            ['code' => '074625000', 'name' => 'Zamboanguita', 'lat' => 9.1019, 'lng' => 123.1987, 'zip_code' => '6218'],
        ],
    ];

    private const NEGROS_BBOX = '122.35,9.02,123.58,11.05';

    /**
     * Local zip code fallback mappings for all Negros Occidental and Negros
     * Oriental cities/municipalities (PHLPost common zip codes).
     */
    private const NEGROS_ZIP_CODES = [
        // Negros Occidental
        'Bacolod City' => '6100',
        'Bago City' => '6101',
        'Binalbagan' => '6107',
        'Cadiz City' => '6121',
        'Calatrava' => '6126',
        'Candoni' => '6110',
        'Cauayan' => '6112',
        'Don Salvador Benedicto' => '6133',
        'Enrique B. Magalona' => '6118',
        'Escalante City' => '6124',
        'Himamaylan City' => '6108',
        'Hinigaran' => '6106',
        'Hinoba-an' => '6114',
        'Ilog' => '6109',
        'Isabela' => '6128',
        'Kabankalan City' => '6111',
        'La Carlota City' => '6130',
        'La Castellana' => '6131',
        'Manapla' => '6120',
        'Moises Padilla' => '6132',
        'Murcia' => '6129',
        'Paraiso' => '6123',
        'Pontevedra' => '6105',
        'Pulupandan' => '6102',
        'Sagay City' => '6122',
        'San Carlos City' => '6127',
        'San Enrique' => '6104',
        'Silay City' => '6116',
        'Sipalay City' => '6113',
        'Talisay City' => '6115',
        'Toboso' => '6125',
        'Valladolid' => '6103',
        'City of Victorias' => '6119',

        // Negros Oriental
        'Amlan' => '6203',
        'Ayungon' => '6210',
        'Bacong' => '6200',
        'Bais City' => '6206',
        'Basay' => '6222',
        'Bayawan City' => '6221',
        'Bindoy' => '6209',
        'Canlaon City' => '6223',
        'Dauin' => '6217',
        'Dumaguete City' => '6200',
        'Guihulngan City' => '6214',
        'Jimalalud' => '6212',
        'La Libertad' => '6213',
        'Mabinay' => '6207',
        'Manjuyod' => '6208',
        'Pamplona' => '6205',
        'San Jose' => '6202',
        'Santa Catalina' => '6220',
        'Siaton' => '6219',
        'Sibulan' => '6201',
        'Tanjay City' => '6204',
        'Tayasan' => '6211',
        'Valencia' => '6215',
        'Vallehermoso' => '6224',
        'Zamboanguita' => '6218',
    ];

    /**
     * Barangays keyed by PSGC city/municipality code. Only Negros Island cities
     * are present; an unknown city code resolves to an empty array. No external
     * HTTP request is made — this lives entirely in memory.
     *
     * @var array<string, array<int, array<string, string>>>
     */
    private const NEGROS_BARANGAYS = [
        // City of Victorias — all 26 barangays (PSGC verified)
        '064531000' => [
            ['code' => '064531004', 'name' => 'Barangay I (Pob.)'],
            ['code' => '064531005', 'name' => 'Barangay II (Pob.)'],
            ['code' => '064531006', 'name' => 'Barangay III (Pob.)'],
            ['code' => '064531007', 'name' => 'Barangay IV (Pob.)'],
            ['code' => '064531008', 'name' => 'Barangay V (Pob.)'],
            ['code' => '064531009', 'name' => 'Barangay VI (Pob.)'],
            ['code' => '064531029', 'name' => 'Barangay VI-A'],
            ['code' => '064531010', 'name' => 'Barangay VII (Pob.)'],
            ['code' => '064531011', 'name' => 'Barangay VIII (Pob.)'],
            ['code' => '064531012', 'name' => 'Barangay IX (Daan Banwa)'],
            ['code' => '064531013', 'name' => 'Barangay X (Estado)'],
            ['code' => '064531014', 'name' => 'Barangay XI (Gawahon)'],
            ['code' => '064531015', 'name' => 'Barangay XII'],
            ['code' => '064531016', 'name' => 'Barangay XIII'],
            ['code' => '064531017', 'name' => 'Barangay XIV'],
            ['code' => '064531018', 'name' => 'Barangay XV'],
            ['code' => '064531019', 'name' => 'Barangay XV-A'],
            ['code' => '064531020', 'name' => 'Barangay XVI'],
            ['code' => '064531021', 'name' => 'Barangay XVI-A'],
            ['code' => '064531022', 'name' => 'Barangay XVII'],
            ['code' => '064531023', 'name' => 'Barangay XVIII'],
            ['code' => '064531024', 'name' => 'Barangay XVIII-A'],
            ['code' => '064531025', 'name' => 'Barangay XIX'],
            ['code' => '064531026', 'name' => 'Barangay XIX-A'],
            ['code' => '064531027', 'name' => 'Barangay XX'],
            ['code' => '064531028', 'name' => 'Barangay XXI'],
        ],
        // City of Bago — 24 barangays (PSGC verified)
        '064502000' => [
            ['code' => '064502001', 'name' => 'Abuanan'],
            ['code' => '064502002', 'name' => 'Alianza'],
            ['code' => '064502003', 'name' => 'Atipuluan'],
            ['code' => '064502004', 'name' => 'Bacong-Montilla'],
            ['code' => '064502005', 'name' => 'Bagroy'],
            ['code' => '064502006', 'name' => 'Balingasag'],
            ['code' => '064502007', 'name' => 'Binubuhan'],
            ['code' => '064502008', 'name' => 'Busay'],
            ['code' => '064502009', 'name' => 'Calumangan'],
            ['code' => '064502010', 'name' => 'Caridad'],
            ['code' => '064502011', 'name' => 'Dulao'],
            ['code' => '064502012', 'name' => 'Ilijan'],
            ['code' => '064502013', 'name' => 'Lag-Asan'],
            ['code' => '064502014', 'name' => 'Ma-ao Barrio'],
            ['code' => '064502015', 'name' => 'Jorge L. Araneta'],
            ['code' => '064502016', 'name' => 'Mailum'],
            ['code' => '064502017', 'name' => 'Malingin'],
            ['code' => '064502018', 'name' => 'Napoles'],
            ['code' => '064502019', 'name' => 'Pacol'],
            ['code' => '064502020', 'name' => 'Poblacion'],
            ['code' => '064502021', 'name' => 'Sagasa'],
            ['code' => '064502022', 'name' => 'Tabunan'],
            ['code' => '064502023', 'name' => 'Taloc'],
            ['code' => '064502024', 'name' => 'Sampinit'],
        ],
        // City of Silay — 16 barangays (PSGC verified)
        '064526000' => [
            ['code' => '064526001', 'name' => 'Balaring'],
            ['code' => '064526002', 'name' => 'Barangay I'],
            ['code' => '064526003', 'name' => 'Barangay II'],
            ['code' => '064526004', 'name' => 'Barangay III'],
            ['code' => '064526005', 'name' => 'Barangay IV'],
            ['code' => '064526006', 'name' => 'Barangay V'],
            ['code' => '064526007', 'name' => 'Barangay VI Pob.'],
            ['code' => '064526008', 'name' => 'Eustaquio Lopez'],
            ['code' => '064526010', 'name' => 'Guimbala-on'],
            ['code' => '064526011', 'name' => 'Guinhalaran'],
            ['code' => '064526012', 'name' => 'Kapitan Ramon'],
            ['code' => '064526013', 'name' => 'Lantad'],
            ['code' => '064526015', 'name' => 'Mambulac'],
            ['code' => '064526016', 'name' => 'Rizal'],
            ['code' => '064526017', 'name' => 'Bagtic'],
            ['code' => '064526018', 'name' => 'Patag'],
        ],
    ];

    /**
     * Get Negros Island provinces only (Negros Occidental and Negros Oriental),
     * returned directly from memory with their PSGC codes — no external HTTP
     * request is made, so this can never throw a 500. Cached forever under
     * psgc:negros:provinces.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getProvinces(): array
    {
        return Cache::rememberForever(self::NEGROS_PROVINCES_CACHE_KEY, function () {
            return [
                [
                    'code' => '064500000',
                    'name' => 'Negros Occidental',
                    'region' => 'Western Visayas',
                ],
                [
                    'code' => '074600000',
                    'name' => 'Negros Oriental',
                    'region' => 'Central Visayas',
                ],
            ];
        });
    }

    /**
     * Resolve a province input (PSGC code or province name) to its PSGC code.
     * Returns null for anything outside Negros Island so lookups never leak
     * LGUs from other islands and never throw.
     */
    private function resolveProvinceCode(string $input): ?string
    {
        foreach ($this->getProvinces() as $province) {
            if ((string) ($province['code'] ?? '') === $input) {
                return $input;
            }

            if (Str::lower((string) ($province['name'] ?? '')) === Str::lower($input)) {
                return (string) ($province['code'] ?? '');
            }
        }

        return null;
    }

    /**
     * Get sorted cities/municipalities of a Negros Island province.
     * Accepts a PSGC province code or a province name. Falls back to an empty
     * array on HTTP failure so lookups never 500.
     *
     * @param  string  $provinceCode  PSGC province code or province name
     * @return array<int, array<string, mixed>>
     */
    public function getCitiesByProvince(string $provinceCode): array
    {
        $code = $this->resolveProvinceCode($provinceCode);

        if ($code === null) {
            return [];
        }

        $cacheKey = str_replace('{code}', $code, self::PROVINCE_CITIES_CACHE_KEY);

        return Cache::rememberForever($cacheKey, function () use ($code) {
            $cities = self::NEGROS_CITIES[$code] ?? [];

            usort($cities, function (array $a, array $b) {
                return strcmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
            });

            return $cities;
        });
    }

    /**
     * Resolve a city input (PSGC code or city name) to its PSGC city/municipality
     * code across both Negros Island provinces. Returns null when unknown so
     * lookups never throw.
     */
    private function resolveCityCode(string $input): ?string
    {
        foreach (['064500000', '074600000'] as $provinceCode) {
            foreach ($this->getCitiesByProvince($provinceCode) as $city) {
                if ((string) ($city['code'] ?? '') === $input) {
                    return $input;
                }

                if (Str::lower((string) ($city['name'] ?? '')) === Str::lower($input)) {
                    return (string) ($city['code'] ?? '');
                }
            }
        }

        return null;
    }

    /**
     * Get sorted barangays of a Negros Island city/municipality.
     * Accepts a PSGC city code or a city name. Falls back to an empty array on
     * HTTP failure so lookups never 500.
     *
     * @param  string  $cityCode  PSGC city/municipality code or city name
     * @return array<int, array<string, mixed>>
     */
    public function getBarangaysByCity(string $cityCode): array
    {
        $code = $this->resolveCityCode($cityCode);

        if ($code === null) {
            return [];
        }

        $cacheKey = str_replace('{code}', $code, self::CITY_BARANGAYS_CACHE_KEY);

        return Cache::rememberForever($cacheKey, function () use ($code) {
            $barangays = self::NEGROS_BARANGAYS[$code] ?? [];

            usort($barangays, function (array $a, array $b) {
                return strcmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
            });

            return $barangays;
        });
    }

    /**
     * Resolve a zip code for a city, with a Photon postcode override.
     *
     * Falls back to local Negros Island mappings when the city name is
     * recognized; returns null when unknown.
     */
    public function resolveZipCode(?string $cityName, ?string $photonPostcode = null): ?string
    {
        if ($photonPostcode !== null && $photonPostcode !== '') {
            return $photonPostcode;
        }

        if ($cityName === null || trim($cityName) === '') {
            return null;
        }

        $normalized = trim($cityName);

        if (isset(self::NEGROS_ZIP_CODES[$normalized])) {
            return self::NEGROS_ZIP_CODES[$normalized];
        }

        foreach (self::NEGROS_ZIP_CODES as $name => $zipCode) {
            if (Str::lower($name) === Str::lower($normalized)) {
                return $zipCode;
            }
        }

        $stripped = preg_replace('/\\s+city\\s*$/i', '', $normalized);
        if ($stripped !== $normalized) {
            if (isset(self::NEGROS_ZIP_CODES[$stripped])) {
                return self::NEGROS_ZIP_CODES[$stripped];
            }

            foreach (self::NEGROS_ZIP_CODES as $name => $zipCode) {
                if (Str::lower($name) === Str::lower($stripped)) {
                    return $zipCode;
                }
            }
        }

        return null;
    }

    /**
     * Forward-geocode a query bounded to Negros Island, cached 7 days.
     * Returns null when Photon is unreachable so callers keep local data.
     *
     * @return array<int, array<string, mixed>>|null
     */
    public function forwardGeocode(string $query): ?array
    {
        $cacheKey = 'psgc:forward:' . md5($query);

        try {
            return Cache::remember($cacheKey, self::GEOCODE_CACHE_TTL, function () use ($query) {
                $response = Http::timeout(8)->withoutVerifying()->get(
                    self::PHOTON_BASE_URL . '/api/',
                    [
                        'q' => $query,
                        'bbox' => self::NEGROS_BBOX,
                        'limit' => 10,
                    ],
                )->throw();

                return $response->json()['features'] ?? [];
            });
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Reverse-geocode a lat/lon pair using Photon, cached 7 days.
     *
     * @return array<int, array<string, mixed>>
     */
    public function reverseGeocode(float $lat, float $lon): array
    {
        $cacheKey = sprintf('psgc:reverse:%.6f,%.6f', $lat, $lon);

        try {
            return Cache::remember($cacheKey, self::GEOCODE_CACHE_TTL, function () use ($lat, $lon) {
                $response = Http::timeout(8)->withoutVerifying()->get(
                    self::PHOTON_BASE_URL . '/api/reverse/',
                    [
                        'lat' => $lat,
                        'lon' => $lon,
                    ],
                )->throw();

                return $response->json()['features'] ?? [];
            });
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Check whether a PSGC province code belongs to Negros Island.
     */
    private function isNegrosProvinceCode(string $provinceCode): bool
    {
        foreach ($this->getProvinces() as $province) {
            if ((string) ($province['code'] ?? '') === $provinceCode) {
                return true;
            }
        }

        return false;
    }

    /**
     * PSGC codes of every Negros Island city/municipality, derived from the
     * cached Negros province lists. Used to validate city codes before any
     * barangay lookup.
     *
     * @return array<int, string>
     */
    private function negrosCityCodes(): array
    {
        $codes = [];

        foreach ($this->getProvinces() as $province) {
            $provinceCode = (string) ($province['code'] ?? '');

            if ($provinceCode === '') {
                continue;
            }

            foreach ($this->getCitiesByProvince($provinceCode) as $city) {
                $code = (string) ($city['code'] ?? '');

                if ($code !== '' && ! in_array($code, $codes, true)) {
                    $codes[] = $code;
                }
            }
        }

        return $codes;
    }
}
