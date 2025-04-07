addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const KV_NAMESPACE = LINKS;

const ALLOWED_IPS = ["192.158.1.0", "192.168.1.2"]; // Add allowed IPs here

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only apply restriction to POST requests to /api
    if (request.method === 'POST' && path.startsWith('/api')) {
        const ip = request.headers.get('CF-Connecting-IP') || "UNKNOWN_IP";

        if (!ALLOWED_IPS.includes(ip)) {
            return new Response(JSON.stringify({ error: 'Unauthorized access' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let userUrl;
        let expirationDays = 7; // Default to 7 days
        try {
            const json = await request.json();
            userUrl = json.url;
            if (json.expiration && Number.isInteger(json.expiration)) {
                expirationDays = json.expiration;
            }
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!userUrl) {
            return new Response(JSON.stringify({ error: 'A valid URL is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const key = generateKey();
        const expirationTtl = expirationDays * 24 * 60 * 60; // Convert days to seconds
        await KV_NAMESPACE.put(key, userUrl, { expirationTtl });

        return new Response(JSON.stringify({
            url: `${url.origin}/${key}`,
            code: key
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Handle GET requests or other paths
    if (path.length > 1) {
        const key = path.slice(1);
        const storedUrl = await KV_NAMESPACE.get(key);
        if (storedUrl) {
            return Response.redirect(storedUrl, 302);
        } else {
            // Return an HTML response for expired links with a base64 icon
            return new Response(`
                <html>
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <title>Link Expired</title>
                <style>
                    body {
                        margin: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        flex-direction: column;
                        height: 100vh;
                        background-color: #ffff;
                        overflow: hidden;
                        font-family: Arial, sans-serif;
                        color: #333;
                    }
                    .icon {
                        max-width: 100%;
                        max-height: 100%;
                        width: 179.2px;
                        height: 142.8px;
                    }
                    .text {
                        margin-top: 20px;
                        font-size: 24px;
                        text-align: center;
                    }
                </style>
                </head>
                <body>
                    <div>
                        <img class="icon" src="data:image/png;base64,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" />
                        <div class="text">This link has expired.</div>
                    </div>
                </body>
                </html>`,
                {
                    headers: { 'Content-Type': 'text/html' }
                }
            );
        }
    }

    return new Response('Not Found', { status: 404 });
}

function generateKey(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
