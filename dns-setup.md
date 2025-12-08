# DNS Configuration for cipcagent.co.za

## Overview

This document outlines the DNS configuration required to point cipcagent.co.za to the CIPC Agent production deployment.

## Current Deployment URLs

- **Railway Backend**: <https://cipc-runner-prod-production.up.railway.app>

## Required DNS Records

### 1. Root Domain (cipcagent.co.za)

```
Type: CNAME
Name: @
Value: <your-dashboard-cname>
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
Value: <your-mfe-cname>
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

SSL certificates will be automatically provisioned by your hosting provider.

## DNS Propagation

- DNS changes typically take 24-48 hours to propagate globally
- Use tools like `dig cipcagent.co.za` or `nslookup cipcagent.co.za` to check propagation

## Verification Steps

1. **DNS Resolution**: `nslookup cipcagent.co.za` should return the correct IP address.
2. **SSL Certificate**: HTTPS should be enabled automatically.
3. **Application Access**: <https://cipcagent.co.za> should serve the dashboard.
4. **CORS Headers**: MFE should load without CORS errors.
5. **API Endpoints**: /api routes should work correctly.

## Troubleshooting

- **DNS Not Propagating**: Wait 48 hours, check with multiple DNS servers.
- **SSL Issues**: Check with your hosting provider.
- **CORS Errors**: Check Access-Control-Allow-Origin headers in your server configuration.
- **Application Not Loading**: Check your deployment status and logs.

## Domain Registrar Setup

Point your domain's nameservers to your hosting provider's nameservers. This is done in your domain registrar's control panel (e.g., Namecheap, GoDaddy, etc.).

## Monitoring

- Monitor SSL certificate status.
- Set up uptime monitoring for <https://cipcagent.co.za>.
