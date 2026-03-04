# Visual Regression QA

Baseline visual test menggunakan Playwright untuk matrix berikut:

- Desktop Light (`1440x980`)
- Desktop Dark (`1440x980`)
- Mobile Light (`iPhone 13`)
- Mobile Dark (`iPhone 13`)

View yang di-snapshot:

- `dashboard`
- `history`
- `report`

## Command

```bash
npm run test:visual:update
npm run test:visual
npm run test:visual:report
```

## Release Gate (disarankan)

1. Jalankan `npm run test:unit`.
2. Jalankan `npm run test:visual`.
3. Jika ada update UI intentional, regenerate baseline dengan `npm run test:visual:update` lalu review diff screenshot.
4. Lengkapi smoke test manual di `SMOKE_TEST_CHECKLIST.md`.
