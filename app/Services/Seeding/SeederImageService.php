<?php

namespace App\Services\Seeding;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class SeederImageService
{
    public function fetchAndStoreProductImage(string $query, string $slug, string $directory = 'products'): string
    {
        $path = "{$directory}/{$slug}.jpg";

        if (Storage::disk('public')->exists($path)) {
            return $path;
        }

        $targetDirectory = dirname($path);
        if (! Storage::disk('public')->exists($targetDirectory)) {
            Storage::disk('public')->makeDirectory($targetDirectory, 0755, true);
        }

        $bytes = $this->downloadImage($query);

        if (is_string($bytes) && strlen($bytes) > 0) {
            Storage::disk('public')->put($path, $bytes);
            return $path;
        }

        // Completely offline: always leave a valid local fallback image behind.
        Storage::disk('public')->put($path, $this->generateFallbackImage($query));

        return $path;
    }

    private function downloadImage(string $query): ?string
    {
        $pexelsKey = config('services.pexels.key');

        if (! empty($pexelsKey)) {
            $imageUrl = $this->pexelsImageUrl($query);

            if ($imageUrl !== null) {
                try {
                    $response = Http::withoutVerifying()->timeout(10)->get($imageUrl);

                    if ($response->successful() && strlen($response->body()) > 0) {
                        return $response->body();
                    }
                } catch (\Throwable $e) {
                    // Fall through to the Wikimedia Commons fallback.
                }
            }
        }

        $imageUrl = $this->wikimediaImageUrl($query);

        if ($imageUrl !== null) {
            try {
                $response = Http::withoutVerifying()->timeout(10)->get($imageUrl);

                if ($response->successful() && strlen($response->body()) > 0) {
                    return $response->body();
                }
            } catch (\Throwable $e) {
                // Offline or unreachable — fall through to the local fallback generator.
            }
        }

        return null;
    }

    private function pexelsImageUrl(string $query): ?string
    {
        $url = 'https://api.pexels.com/v1/search?query='.urlencode($query).'&orientation=landscape&per_page=3';

        try {
            $response = Http::withoutVerifying()->timeout(10)->withToken(config('services.pexels.key'))->get($url);

            if (! $response->successful()) {
                return null;
            }

            $photos = $response->json('photos', []);

            if (empty($photos)) {
                return null;
            }

            $photo = $photos[0];

            return $photo['src']['medium'] ?? $photo['src']['large'] ?? $photo['src']['original'] ?? null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function wikimediaImageUrl(string $query): ?string
    {
        $url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:bitmap+'.urlencode($query).'&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json';

        try {
            $response = Http::withoutVerifying()->timeout(10)->get($url);

            if (! $response->successful()) {
                return null;
            }

            $pages = $response->json('query.pages', []);

            foreach ($pages as $page) {
                $imageInfo = $page['imageinfo'][0] ?? null;

                if (! is_array($imageInfo)) {
                    continue;
                }

                $imageUrl = $imageInfo['thumburl'] ?? $imageInfo['url'] ?? null;

                if (! empty($imageUrl)) {
                    return $imageUrl;
                }
            }

            return null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function generateFallbackImage(string $query): string
    {
        if (function_exists('imagecreatetruecolor')) {
            return $this->drawStudioCard($query);
        }

        return $this->renderSvgStudioCard($query);
    }

    private function drawStudioCard(string $query): string
    {
        $width = 900;
        $height = 600;

        $image = imagecreatetruecolor($width, $height);

        $studioGray = imagecolorallocate($image, 230, 230, 235);
        $softGray = imagecolorallocate($image, 200, 200, 210);
        $darkGray = imagecolorallocate($image, 120, 120, 130);
        $white = imagecolorallocate($image, 255, 255, 255);
        $accent = imagecolorallocate($image, 90, 130, 200);

        imagefilledrectangle($image, 0, 0, $width, $height, $studioGray);

        // Floor plane.
        imagefilledrectangle($image, 0, (int) ($height * 0.78), $width, $height, $softGray);

        $centerX = (int) ($width * 0.42);
        $centerY = (int) ($height * 0.56);

        // Sneaker silhouette (side profile).
        imagefilledellipse($image, $centerX - 95, $centerY + 12, 60, 34, $darkGray); // heel
        imagefilledellipse($image, $centerX + 55, $centerY + 12, 52, 32, $darkGray); // toe
        imagefilledrectangle($image, $centerX - 80, $centerY - 42, $centerX + 50, $centerY + 38, $darkGray); // upper
        imagefilledellipse($image, $centerX + 10, $centerY - 48, 76, 38, $white); // toe cap
        imagefilledrectangle($image, $centerX - 75, $centerY - 24, $centerX + 45, $centerY - 4, $accent); // laces panel
        imagefilledrectangle($image, $centerX - 85, $centerY + 10, $centerX + 55, $centerY + 36, $softGray); // midsole
        imagefilledrectangle($image, $centerX - 85, $centerY + 30, $centerX + 55, $centerY + 38, $darkGray); // outsole

        imagerectangle($image, 0, 0, $width - 1, $height - 1, $softGray); // studio border

        $label = 'STUDIO CARD: '.strtoupper((string) $query);
        imagestring($image, 5, 40, 40, $label, $darkGray);
        imagestring($image, 3, 40, 72, 'LS DOLOCAB - SEEDING FALLBACK IMAGE', $darkGray);

        ob_start();
        imagejpeg($image, null, 85);
        $bytes = ob_get_clean();
        imagedestroy($image);

        return $bytes;
    }

    private function renderSvgStudioCard(string $query): string
    {
        $escaped = htmlspecialchars((string) $query, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $width = 900;
        $height = 600;

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="{$width}" height="{$height}" viewBox="0 0 {$width} {$height}">
  <rect width="{$width}" height="{$height}" fill="#e6e6eb"/>
  <rect y="468" width="{$width}" height="132" fill="#c8c8d2"/>
  <path d="M 220 360 Q 250 320 340 340 T 460 360 L 440 420 L 240 420 Z" fill="#787882"/>
  <rect x="240" y="338" width="190" height="24" fill="#5a82c8"/>
  <circle cx="275" cy="346" r="8" fill="#787882"/>
  <text x="40" y="80" font-family="sans-serif" font-size="24" fill="#4a4a55">STUDIO CARD: {$escaped}</text>
  <text x="40" y="115" font-family="sans-serif" font-size="16" fill="#4a4a55">LS DOLOCAB - SEEDING FALLBACK IMAGE</text>
</svg>
SVG;
    }
}
