# Wild Model X Studio

Interactive 3D Tesla Model X studio with a circular display platform, component descriptions, individual-piece isolation, and a progressive explosion slider covering all 334 mesh pieces.

## Local development

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run dev -- --port 3015
```

Open `/` for the Model X demo. Open `/authoring` for the low-code explosion asset console.

## Authoring console (`/authoring`)

Foolproof backend for non-IT operators to build explosion packs:

1. Upload **GLB / glTF / FBX / OBJ** (no STEP in phase 1)
2. Auto-split into mesh pieces (warns on solid/合模 models; no server-side split yet)
3. Assign OEM systems (default template: 车身 / 开闭件 / 三电 / 底盘 / 车轮与制动 / 内饰 / 外饰 / 其他 — fully CRUD-configurable)
4. Export/import **CSV index** to fill `system_id` / `label` / `business_key` in Excel, then re-import
5. Preview explode/isolate and publish `model.glb` + `manifest.json`

Data persists in **browser SQLite (sql.js)** via IndexedDB. You can export the `.sqlite` file. `business_key` is optional in phase 1.

## Vercel

Import this repository into Vercel with the repository root as the project root. The checked-in `vercel.json` builds the browser application with `npm run build:vercel` and serves `dist/vercel`. No environment variables or database are required.

The Vercel entry point reuses the same React page, styles, component library, Three.js scene and local model assets as the existing development app. The original `npm run build` remains available for the Vinext / Cloudflare output. `/authoring` is rewritten to the SPA shell.

Configuration reference: https://vercel.com/docs/project-configuration/vercel-json

## Validation

```sh
npx tsc --noEmit
node --experimental-strip-types scripts/validate-explosion.mjs
npm run build:vercel
```

The geometry check verifies 334 distinct layout slots and camera coverage at three viewport proportions. It is not a browser frame-rate measurement.

## Model source and scope

The Model X asset is by [cgi Moon on BlendKit](https://www.blendkit.com/asset-gallery-detail/983e8f94-5a56-44a4-94d9-eed5e4cdcd6c/), used under the [BlendKit Royalty Free license](https://www.blendkit.com/docs/licenses/). Asset redistribution is subject to that license; this repository is private and the asset is embedded in the application.

This source depicts a pre-refresh Model X, with an unverified exact model year. The 334 pieces are artist-authored mesh islands, not verified Tesla service-part identifiers. Battery, drive units and suspension are illustrative geometry. This is an independent educational project, not a complete OEM parts catalog or a Tesla-affiliated product.
