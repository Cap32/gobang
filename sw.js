// Service Worker for Gobang Game
const CACHE_NAME = 'gobang-v1.0.0';
const STATIC_CACHE_NAME = 'gobang-static-v1.0.0';

// 需要缓存的资源
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 强制激活新的 Service Worker
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即接管所有客户端
  self.clients.claim();
});

// 处理请求
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有匹配的响应，返回缓存的响应
        if (response) {
          return response;
        }

        // 否则，尝试从网络获取
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 如果是静态资源，添加到缓存
            if (isStaticAsset(event.request.url)) {
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch((error) => {
            console.log('Fetch failed:', error);
            // 如果网络请求失败，返回离线页面或错误响应
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// 检查是否为静态资源
function isStaticAsset(url) {
  const staticExtensions = ['.html', '.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
  const pathname = new URL(url).pathname;
  const relativePath = pathname.replace(/^\/[^\/]+/, '.'); // 将 /gobang/* 转换为 ./*

  return staticExtensions.some(ext => url.endsWith(ext)) ||
         STATIC_ASSETS.includes(relativePath) ||
         STATIC_ASSETS.includes(pathname);
}

// 处理推送消息（可选）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
