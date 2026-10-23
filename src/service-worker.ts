import { assets, immutable } from '$app/manifest';
import { version } from '$app/env';
import { asset, resolve } from '$app/paths';
import { self } from '$app/service-worker';
const CACHE = `spendwise-static-${version}`;
const OFFLINE_PATH = resolve('/offline');
const STATIC_ASSETS = [...immutable.map(({ path }) => path), ...assets.map(({ path }) => asset(path)), OFFLINE_PATH];
self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
	self.skipWaiting();
});
self.addEventListener('activate', (event) => {
	event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('spendwise-static-') && key !== CACHE).map((key) => caches.delete(key)))));
	self.clients.claim();
});
self.addEventListener('fetch', (event) => {
	const request = event.request;
	const url = new URL(request.url);
	if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
	if (request.mode === 'navigate') {
		event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE_PATH)) ?? Response.error()));
		return;
	}
	const isStatic = STATIC_ASSETS.some((asset) => new URL(asset, self.location.origin).pathname === url.pathname);
	if (isStatic) event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
});
