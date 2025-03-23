function log(...args) {
    console.log(`[WORKER] ${args}`)
}

self.addEventListener("fetch", (e) => {
    // Don't cache API requests as that data is already saved locally anyways
    if (e.request.method == "GET" && !e.request.url.includes('/api/')) {
        e.waitUntil(e.respondWith((async () => {
            const request = e.request
            const cache = await caches.open("app-cache")
    
            const network_response = await fetch(request).catch(() => undefined) // Catch used for fallback value
            if (network_response) {
                log('Loaded resource from network')
                cache.put(request, network_response.clone())
                return network_response
            }
    
            const cached_response = await cache.match(request)
            if (cached_response) {
                log('Loaded resource from cache')
                return cached_response
            }
            
            log('Failed loading resource')
            return Response.error()
        })()))
    }
})
