// Legacy /[locale]/marketingx route — permanently retired.
// Returns HTTP 410 Gone so Google removes it from the index faster than 404.
// X-Robots-Tag noindex is a defence-in-depth signal in case any CDN cache
// still serves a stale 2xx for this path.

export async function GET() {
    return new Response('Gone', {
        status: 410,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow',
            'Cache-Control': 'public, max-age=0, must-revalidate',
        },
    })
}

export const HEAD = GET
