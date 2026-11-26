<?php

namespace App\Services;

class PhilippineZipCodeService
{
    /**
     * Philippine city/municipality to zip code mappings.
     * Sourced from Philippines Postal Corporation (PHLPost) common zip codes.
     * Not exhaustive — covers major cities and municipalities. Users can override manually.
     */
    private const ZIP_CODES = [
        // Metro Manila / NCR
        'Manila' => '1000',
        'Quezon City' => '1100',
        'Caloocan City' => '1400',
        'Pasay City' => '1300',
        'Makati City' => '1200',
        'Pasig City' => '1600',
        'Marikina City' => '1800',
        'Taguig City' => '1630',
        'Mandaluyong City' => '1550',
        'San Juan City' => '1500',
        'Valenzuela City' => '1440',
        'Malabon City' => '1470',
        'Navotas City' => '1480',
        'Parañaque City' => '1700',
        'Las Piñas City' => '1740',
        'Muntinlupa City' => '1770',
        'Taguig City (BGC)' => '1634',
        'Pateros' => '1620',
        'San Mateo, Rizal' => '1850',
        'Rodriguez, Rizal' => '1860',

        // Luzon
        'Baguio City' => '2600',
        'Laoag City' => '2900',
        'Vigan City' => '2700',
        'San Fernando, La Union' => '2500',
        'Dagupan City' => '2400',
        'Tuguegarao City' => '3500',
        'Santiago City' => '3311',
        'Cabanatuan City' => '3100',
        'Angeles City' => '2000',
        'San Fernando, Pampanga' => '2000',
        'Tarlac City' => '2300',
        'Balanga City' => '2100',
        'Lucena City' => '4300',
        'Naga City' => '4400',
        'Legaspi City' => '4500',
        'Sorsogon City' => '4700',
        'Puerto Princesa City' => '5300',

        // Visayas
        'Iloilo City' => '5000',
        'Bacolod City' => '6100',
        'Victorias City' => '6119',
        'Silay City' => '6116',
        'Cadiz City' => '6121',
        'Sagay City' => '6122',
        'Kabankalan City' => '6111',
        'Bago City' => '6101',
        'Cebu City' => '6000',
        'Mandaue City' => '6014',
        'Lapu-Lapu City' => '6015',
        'Talisay City, Cebu' => '6045',
        'Toledo City' => '6038',
        'Tagbilaran City' => '6300',
        'Dumaguete City' => '6200',
        'Tacloban City' => '6500',
        'Ormoc City' => '6541',
        'Calbayog City' => '6710',
        'Borongan City' => '6800',
        'Catbalogan City' => '6700',

        // Mindanao
        'Zamboanga City' => '7000',
        'Cagayan de Oro City' => '9000',
        'Davao City' => '8000',
        'General Santos City' => '9500',
        'Iligan City' => '9200',
        'Butuan City' => '8600',
        'Pagadian City' => '7016',
        'Ozamiz City' => '7200',
        'Cotabato City' => '9600',
        'Kidapawan City' => '9400',
        'Koronadal City' => '9506',
        'Surigao City' => '8400',
        'Bislig City' => '8311',
        'Tandag City' => '8300',
        'Mati City' => '8200',
    ];

    public static function lookup(string $city): ?string
    {
        $normalizedCity = trim((string) $city);

        // Direct match first
        if (isset(self::ZIP_CODES[$normalizedCity])) {
            return self::ZIP_CODES[$normalizedCity];
        }

        // Case-insensitive match
        foreach (self::ZIP_CODES as $name => $zipCode) {
            if (strtolower($name) === strtolower($normalizedCity)) {
                return $zipCode;
            }
        }

        // Strip a trailing " City" and match again, case-insensitively,
        // so "Bacolod", "Bacolod City", "Victorias", "Victorias City"
        // all resolve to the same zip code.
        $strippedCity = preg_replace('/\s+city\s*$/i', '', $normalizedCity);
        if ($strippedCity !== $normalizedCity) {
            if (isset(self::ZIP_CODES[$strippedCity])) {
                return self::ZIP_CODES[$strippedCity];
            }
            foreach (self::ZIP_CODES as $name => $zipCode) {
                if (strtolower($name) === strtolower($strippedCity)) {
                    return $zipCode;
                }
            }
        }

        return null;
    }

    public static function all(): array
    {
        return self::ZIP_CODES;
    }
}
