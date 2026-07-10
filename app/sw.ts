import { defaultCache } from "@serwist/next/worker";
import { NetworkFirst, Serwist } from "serwist";

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
    ...defaultCache,

    {
      matcher: ({ url, request }) =>
        request.method === "GET" && url.pathname.startsWith("/api/"),

      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        plugins: [
            {
                cacheWillUpdate: async ({ response }) => {
                    if (response && response.status === 200) {
                        return response;
                    }
                    return null;
                },
            },
        ],
      }),
    },
    {
      matcher: ({ request }) => request.destination === "font",
      handler: new NetworkFirst({
        cacheName: "font-cache",
      }),
    },
    {
        matcher: ({ request }) => request.destination === "image",
        handler: new NetworkFirst({
            cacheName: "image-cache",
        }),
    },
  ],
});


serwist.addEventListeners();