# Cloudflare Worker URL Shortener

A serverless URL shortener built with Cloudflare Workers and KV storage, featuring IP-based access control and customizable link expiration.

## Features

- **URL shortening**: Create short links that redirect to original URLs
- **IP restriction**: Limit API access to specific IP addresses
- **Custom expiration**: Set expiration time for links (default: 7 days)
- **Simple API**: Easy-to-use JSON API for creating short links
- **Automatic cleanup**: Expired links are automatically removed
- **User-friendly expired link page**: Clean HTML response for expired links

## How It Works

1. POST a URL to the `/api` endpoint with valid JSON
2. The worker generates a short code and stores the URL in KV storage
3. Visiting the short URL redirects to the original URL
4. Expired links show a friendly expiration message


### setup
- Create clourflare worker 
- paste the worker.js code
- Create a KV namespace named LINKS in your Cloudflare dashboard
- Bind the KV namespace to your worker from worker settings
- Update ALLOWED_IPS in the worker code with your authorized IP addresses

## API Documentation

### usage

```bash
curl -X POST "https://your-workerApiLink.com/api" \
     -H "Content-Type: application/json" \
     -d '{"url": "http://example.com"}'
```
