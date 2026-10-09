# Staging smoke (Playwright)

Minimal gate after deploy-staging: login → Tasks → create a record.

## Local

```bash
cd smb/deploy/smoke
npm install
npx playwright install chromium
STAGING_URL=https://dev.crm-systems-ai.ru \
STAGING_BASIC_AUTH_USER=staging \
STAGING_BASIC_AUTH_PASSWORD=... \
SMOKE_LOGIN=... \
SMOKE_PASSWORD=... \
npm test
```

## CI

Job `smoke-staging` in `.github/workflows/fork-release.yaml` runs only when:

- repository variable `SMOKE_STAGING_ENABLED=true`
- `deploy-staging` succeeded
- secrets `SMOKE_LOGIN`, `SMOKE_PASSWORD` (and basic-auth secrets if Caddy requires them)

Until cutover of `dev.crm-systems-ai.ru`: **NOT RUN**.
