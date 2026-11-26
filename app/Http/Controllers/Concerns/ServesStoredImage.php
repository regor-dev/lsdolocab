<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

trait ServesStoredImage
{
    /**
     * Serve a base64 data-URI stored in `$column` as a real, cacheable image.
     * Mirrors the pattern already used in UserController::avatar().
     */
    protected function serveStoredImage(Request $request, $model, string $column = 'img'): Response
    {
        $raw = $model->{$column} ?? null;

        if (! is_string($raw) || ! preg_match('#^data:(image/(?:jpeg|png|webp));base64,(.+)$#s', $raw, $m)) {
            abort(404);
        }

        $etag = md5($model->getKey().'|'.$model->updated_at?->timestamp.'|'.$column);

        $response = response('', 200, [
            'Content-Type' => $m[1],
            'Cache-Control' => 'private, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ])->setEtag($etag);

        if ($response->isNotModified($request)) {
            return $response; // 304, no decode, no body
        }

        return $response->setContent(base64_decode($m[2]));
    }
}
