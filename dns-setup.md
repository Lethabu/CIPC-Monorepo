# DNS Configuration for cipcagent.co.za

## Overview

This document outlines the DNS configuration required to point cipcagent.co.za to the CIPC Agent production deployment.

## Current Deployment URLs

- **Dashboard (Host)**: <https://cipc-dashboard.vercel.app>
- **CIPC MFE (Remote)**: <https://cipc-mfe.vercel.app>
- **Railway Backend**: <https://cipc-runner-prod-production.up.railway.app>

## Required DNS Records

### 1. Root Domain (cipcagent.co.za)

```
Type: CNAME
Name: @
Value: cipc-dashboard.vercel.app
TTL: 300 (5 minutes)

Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
TTL: 3600

Type: MX
Name: @
Value: 1 ASPMX.L.GOOGLE.COM
TTL: 3600

Type: MX
Name: @
Value: 5 ALT1.ASPMX.L.GOOGLE.COM
TTL: 3600

Type: MX
Name: @
Value: 5 ALT2.ASPMX.L.GOOGLE.COM
TTL: 3600

Type: MX
Name: @
Value: 10 ALT3.ASPMX.L.GOOGLE.COM
TTL: 3600

Type: MX
Name: @
Value: 10 ALT4.ASPMX.L.GOOGLE.COM
TTL: 3600
```

### 2. Subdomain for MFE (mfe.cipcagent.co.za) - Optional

```
Type: CNAME
Name: mfe
Value: cipc-mfe.vercel.app
TTL: 300 (5 minutes)
```

### 3. Subdomain for API (api.cipcagent.co.za) - Optional

```
Type: CNAME
Name: api
Value: cipc-dashboard.workers.dev
TTL: 300 (5 minutes)
```

## SSL Certificate

SSL certificates will be automatically provisioned by Vercel and Cloudflare for all deployed domains.

## DNS Propagation

- DNS changes typically take 24-48 hours to propagate globally
- Use tools like `dig cipcagent.co.za` or `nslookup cipcagent.co.za` to check propagation
- Vercel provides real-time DNS status in their dashboard

## Verification Steps

1. **DNS Resolution**: `nslookup cipcagent.co.za` should return Vercel nameservers
2. **SSL Certificate**: HTTPS should be enabled automatically
3. **Application Access**: <https://cipcagent.co.za> should serve the dashboard
4. **CORS Headers**: MFE should load without CORS errors
5. **API Endpoints**: /api routes should work correctly

## Troubleshooting

- **DNS Not Propagating**: Wait 48 hours, check with multiple DNS servers
- **SSL Issues**: Vercel handles SSL automatically, ensure domain is added to project
- **CORS Errors**: Check Access-Control-Allow-Origin headers in Vercel config
- **Application Not Loading**: Check Vercel deployment status and logs

## Domain Registrar Setup

Point the domain's nameservers to Vercel nameservers:

- ns1.vercel-dns.com
- ns2.vercel-dns.com

This is done in your domain registrar's control panel (e.g., Namecheap, GoDaddy, etc.).

## Monitoring

- Use Vercel's DNS checker: <https://vercel.com/docs/concepts/projects/domains/dns-records>
- Monitor SSL certificate status
- Set up uptime monitoring for <https://cipcagent.co.za>
