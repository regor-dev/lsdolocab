# Project Context — lsdolocab (Laravel 13 + Inertia.js React + PostgreSQL)

Project root: C:/ProgramData/envkit/projects/lsdolocab
Hermes home: C:/Users/moril/AppData/Local/hermes (NOT ~/.hermes)

## Guardrails (turn 1 load)
- Never call `git.exe` — blocked in Hermes tools path ("Access is denied").
- Never run `npm run build`, `composer`, `php artisan test`, or global `eslint . --fix`.
- Never call `patch` — blocked by background review. Read once, edit via a single atomic Python script or one verified `write_file`.
- Never retry a failed `read_file` path twice — check exact paths below or run one `search_files` glob first.
- Verify PHP with `php -l <file>` per file; TSX/TS with `npx eslint <file>` per file (no `--fix`).
- Ignore `intelephense` "fresh diagnostics timed out" unless a real syntax/type error appears.

## Verified paths

Location & Profile:
- app/Services/Location/PhilippineLocationService.php
- routes/web.php (admin routes mounted under prefix('admin'))
- resources/js/components/location/AddressMapPicker.tsx
- app/Http/Requests/Auth/CompleteProfileRequest.php
- resources/js/pages/auth/complete-profile.tsx
- app/Http/Controllers/Settings/ProfileController.php
- app/Http/Controllers/Auth/ProfileCompletionController.php

Storefront & Checkout:
- app/Http/Controllers/CheckoutController.php
- app/Http/Controllers/ProductController.php
- app/Http/Middleware/HandleInertiaRequests.php
- resources/js/pages/storefront/index.tsx
- resources/js/pages/checkout/index.tsx
- resources/js/components/storefront/ProductCard.tsx

Admin (no Admin/ subdir on disk — controllers at app/Http/Controllers/ directly):
- app/Http/Controllers/ProductController.php
- app/Http/Controllers/BrandController.php
- app/Http/Controllers/UserController.php
- resources/js/pages/brand/{show,create,edit,index}.tsx
- resources/js/pages/user/{show,edit,create,index}.tsx
- resources/js/pages/dashboard.tsx

Seeders & Models:
- app/Models/Product.php
- app/Models/Brand.php
- app/Models/User.php
- database/seeders/DatabaseSeeder.php
- database/seeders/StorefrontCatalogSeeder.php
- database/seeders/NegrosUserSeeder.php

## Shell
MSYS/git-bash; native Windows tools need C:/ forward-slash paths; MSYS paths like /c/Users fail with "cannot change to"
