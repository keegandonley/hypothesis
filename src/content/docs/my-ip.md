# my ip

Look up your current public IP address and geolocation details.

## Overview

`my ip` calls `/api/my-ip`, an in-house API route that reads headers injected by Vercel's edge network on every incoming request. No third-party geolocation service is involved.

## Fields

| Field | Source header | Description |
| --- | --- | --- |
| **IP Address** | `x-vercel-forwarded-for` | Your public-facing IP address as seen by the edge |
| **City** | `x-vercel-ip-city` | Approximate city based on IP geolocation |
| **Region** | `x-vercel-ip-country-region` | ISO 3166-2 region/state code |
| **Country** | `x-vercel-ip-country` | ISO 3166-1 alpha-2 country code |
| **Latitude** | `x-vercel-ip-latitude` | Approximate latitude |
| **Longitude** | `x-vercel-ip-longitude` | Approximate longitude |
| **Timezone** | `x-vercel-ip-timezone` | IANA timezone identifier (e.g. `America/New_York`) |

## API Usage

The endpoint returns JSON and can be called directly:

```bash
curl https://hypothesis.sh/api/my-ip
```

Example response:

```json
{
  "ip": "203.0.113.42",
  "city": "San Francisco",
  "region": "CA",
  "country": "US",
  "latitude": "37.7749",
  "longitude": "-122.4194",
  "timezone": "America/Los_Angeles"
}
```

## Accuracy

Geolocation is approximate and provided by Vercel's edge infrastructure. VPNs and proxies will show the location of the exit node rather than your physical location. In local development the location fields will be absent.

## Refresh

Click **Refresh** to re-fetch without reloading the page — useful after switching networks or toggling a VPN.

## Copy

Click **Copy** in the IP panel header to copy your IP address to the clipboard.
