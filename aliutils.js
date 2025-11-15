require('dotenv').config();

/**
 * Search AliExpress products by keyword using RapidAPI
 * @param {Object} options - Search options
 * @param {string} options.q - Search query/keyword (required)
 * @param {number} options.page - Page number (default: 1)
 * @param {string} options.sort - Sort method: 'default', 'orders', 'newest', 'price_low', 'price_high' (default: 'default')
 * @param {string|string[]} options.rapidApiKey - RapidAPI key(s) - can be a single key or array of keys (defaults to RAPIDAPI_KEY from .env)
 * @returns {Promise<Object>} Search results
 */
async function searchAliExpress(options) {
    const {
        q,
        page = 1,
        sort = 'default',
        rapidApiKey = process.env.RAPIDAPI_KEY
    } = options;

    // Validate required parameters
    if (!q) {
        throw new Error('Search query (q) is required');
    }
    if (!rapidApiKey) {
        throw new Error('RapidAPI key is required. Set RAPIDAPI_KEY in .env file');
    }

    // Convert to array: handle comma-separated string from .env or array
    let apiKeys;
    if (Array.isArray(rapidApiKey)) {
        apiKeys = rapidApiKey;
    } else if (typeof rapidApiKey === 'string') {
        // Split by comma and trim whitespace from each key
        apiKeys = rapidApiKey.split(',').map(key => key.trim());
    } else {
        apiKeys = [rapidApiKey];
    }
    
    // Build request URL
    const url = new URL('https://aliexpress-datahub.p.rapidapi.com/item_search_2');
    url.searchParams.append('q', q);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('sort', sort);

    let lastError = null;

    // Try each API key until one succeeds
    for (let i = 0; i < apiKeys.length; i++) {
        const currentKey = apiKeys[i];
        console.log(`Trying API key ${i + 1} of ${apiKeys.length}`);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com',
                    'x-rapidapi-key': currentKey
                }
            });

            // If 403, try next key
            if (response.status === 403) {
                console.warn(`API key ${i + 1} returned 403, trying next key...`);
                lastError = new Error(`API key ${i + 1} returned 403 Forbidden`);
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response status:', response.status);
                console.error('Response headers:', Object.fromEntries(response.headers.entries()));
                console.error('Response body:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const data = await response.json();
            
            // Check for API errors
            if (data.error) {
                throw new Error(`API Error: ${data.error}`);
            }

            // Extract only the first 3 results with specific fields
            const results = data.result?.resultList?.slice(0, 3).map(item => ({
                title: item.item?.title,
                price: item.item?.sku?.def?.promotionPrice,
                image: item.item?.image ? `https:${item.item.image}` : item.item?.image,
                url: item.item?.itemUrl ? `https:${item.item.itemUrl}` : item.item?.itemUrl
            })) || [];

            console.log(`Successfully retrieved results using API key ${i + 1}`);
            return results;
        } catch (error) {
            lastError = error;
            // If this is not the last key and error is not 403-related, try next key
            if (i < apiKeys.length - 1) {
                console.warn(`Error with API key ${i + 1}: ${error.message}. Trying next key...`);
                continue;
            }
        }
    }

    // All keys failed
    throw new Error(`Failed to search AliExpress with all ${apiKeys.length} API key(s). Last error: ${lastError.message}`);
}

module.exports = {
    searchAliExpress
};
