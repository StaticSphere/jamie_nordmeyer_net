# Domain Cutover Runbook (GitHub Pages + DNSimple)

This runbook is for `jamienordmeyer.net` and `www.jamienordmeyer.net`.

## Source of truth

- GitHub Pages custom domain should be `jamienordmeyer.net`
- `public/CNAME` should contain `jamienordmeyer.net`
- `astro.config.mjs` should have `site: "https://jamienordmeyer.net"`

## Known-good DNS records

Use these records in DNSimple:

- `@` `A` `185.199.108.153`
- `@` `A` `185.199.109.153`
- `@` `A` `185.199.110.153`
- `@` `A` `185.199.111.153`
- `@` `AAAA` `2606:50c0:8000::153`
- `@` `AAAA` `2606:50c0:8001::153`
- `@` `AAAA` `2606:50c0:8002::153`
- `@` `AAAA` `2606:50c0:8003::153`
- `www` `CNAME` `jamienordmeyer.net`

Important:

- Keep only one `www` record (the CNAME above).
- Remove conflicting `www` `A`/`AAAA`/URL redirect records.
- Lower TTL before changes if you want faster rollback.

## Verification commands

Run these from macOS/zsh after updating DNS:

```zsh
dig +short jamienordmeyer.net A
dig +short jamienordmeyer.net AAAA
dig +short www.jamienordmeyer.net CNAME
dig +short www.jamienordmeyer.net A
```

Check public resolvers:

```zsh
dig +short @1.1.1.1 www.jamienordmeyer.net CNAME
dig +short @8.8.8.8 www.jamienordmeyer.net CNAME
```

Check HTTP behavior:

```zsh
curl -I https://jamienordmeyer.net
curl -I https://www.jamienordmeyer.net
curl -I http://www.jamienordmeyer.net
```

Expected outcomes:

- Apex resolves to GitHub Pages IPs.
- `www` resolves via CNAME to `jamienordmeyer.net`.
- HTTPS works for both hosts.
- One host may redirect to the other (this is fine if intentional).

## Rollback notes

If cutover breaks:

1. Revert DNS records to last known-good values.
2. Wait for TTL or test from multiple public resolvers.
3. Confirm GitHub Pages custom domain is still `jamienordmeyer.net`.
4. Confirm `public/CNAME` still contains `jamienordmeyer.net`.
5. Trigger a redeploy from GitHub Actions if needed.

## 2-minute post-deploy checklist

- [ ] `dig` shows expected apex and `www` records.
- [ ] `https://jamienordmeyer.net` returns `200`.
- [ ] `https://www.jamienordmeyer.net` resolves and serves HTTPS.
- [ ] `robots.txt` and `sitemap.xml` load.
- [ ] GitHub Pages shows custom domain + HTTPS enabled.

