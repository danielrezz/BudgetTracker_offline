console.log("Service worker at your service!"); 

const FILES_TO_CACHE = [
    "/",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/index.html",
    "/styles.css",
    "/db.js",
    "/index.js",
    "/manifest.webmanifest"
  ];

  const CACHE_NAME = "static-cache-v2";
  const DATA_CACHE_NAME = "data-cache-v1";

  //install

  self.addEventListener("install", function(event) {

      const cacheResources = async () => {
          const resourceCache = await caches.open(CACHE_NAME);
          return resourceCache.addAll(FILES_TO_CACHE);
      }

      self.skipWaiting();

      event.waitUntil(cacheResources());

      console.log("CHA-CHING!");
  });

  //activate

  self.addEventListener("activate", function(evt) {
    console.log("activated!");

    const removeOldCache = async () => {
      const cacheKeyArray = await caches.keys();
    
      const cacheResultPromiseArray = cacheKeyArray.map(key => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log("Removing old cache data", key);
          return caches.delete(key);
        }
      });  
      return Promise.all(cacheResultPromiseArray);
    }

    evt.waitUntil(removeOldCache()); 

    self.clients.claim();
  });

  //fetch

  self.addEventListener('fetch', function(evt) {

    const handleAPIDataRequest = async (event) => {
        try {
          const response = await fetch(event.request);
          // If the response was good, clone it and store it in the cache.
          if (response.status === 200) {
            console.log(`Adding API request to cache now: ${event.request.url}`);
    
            const apiCache = await caches.open(DATA_CACHE_NAME);
            await apiCache.put(event.request.url, response.clone());
    
            return response;
          }
        } catch(error) {
          // Network request failed, try to get it from the cache.
          console.log(`Network error occurred with API request. Now retrieving it from the cache: ${event.request.url}`)
          return await caches.match(event.request);
        }
      }
    // code to handle requests goes here
    const handleResourceRequest = async (evt) => {
        const matchedCache = await caches.match(evt.request);
        return matchedCache ||  await fetch(evt.request);
      }

      if (evt.request.url.includes("/api/")) {
        evt.respondWith(handleAPIDataRequest(evt));
      } else {
    
      evt.respondWith(handleResourceRequest(evt));
      }

    });