export const request_queue = $state(JSON.parse(window.localStorage?.getItem("request_queue")) || [])

/**
 * @returns {Promise<{[string: number | string]} | {[string: number | string]}[] | null | undefined>}
 */
function api(item, method, body) {
    return new Promise((resolve) => {
        fetch(`${window.location.protocol}//${window.location.host}/api/${item}`, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        })
            .then(async (response) => {
                if (response.status == 204) {
                    resolve({})
                }
                else {
                    resolve(await response.json())
                }

                // Request was successful, so we can process the queue as well
                if (request_queue.length > 0) {
                    let request = request_queue.pop()
                    // Recurses through queue
                    await api(request.item, request.method, request.body)

                    // If that was the last queue item
                    if (request_queue.length == 0) {
                        // Reload so it actually properly displays our new changes,
                        // as their promises are already long rejected
                        window.location.reload()
                    }
                }
            })
            .catch((err) => {
                // Local caching avoids the need for repeating GET requests
                // and there would be nowhere to return the result to anyways
                if (method !== "GET") {
                    request_queue.push({item, method, body})
                }

                resolve(null)
            })
    })
}


export const get = item => api(item, 'GET')

export const post = item => ({
    with: data => api(item, 'POST', data)
})

export const put = item => ({
    with: data => api(item, 'PUT', data)
})

export const remove = item => api(item, 'DELETE')
