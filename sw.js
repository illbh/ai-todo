// ========================================
// Service Worker - sw.js
// PWAのオフライン対応・キャッシュ管理
// ========================================

// キャッシュの名前（バージョンを変えると古いキャッシュが削除される）
const CACHE_NAME = 'todo-app-v1';

// キャッシュするファイルのリスト
// GitHub Pages のサブパス /ai-todo/ に合わせた絶対パスで指定する
const FILES_TO_CACHE = [
  '/ai-todo/',
  '/ai-todo/index.html',
  '/ai-todo/style.css',
  '/ai-todo/app.js',
  '/ai-todo/manifest.json',
  '/ai-todo/icons/icon-192.png',
  '/ai-todo/icons/icon-512.png',
  '/ai-todo/icons/icon-maskable.png',
];

// --------------------------------------------------
// インストールイベント
// Service Workerが初めて登録されたときに発生する
// ここでアプリのファイルをキャッシュに保存する
// --------------------------------------------------
self.addEventListener('install', function(event) {
  console.log('[SW] インストール開始');

  // waitUntil() でキャッシュ完了まで待機する
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] ファイルをキャッシュに保存中...');
      return cache.addAll(FILES_TO_CACHE);
    }).then(function() {
      console.log('[SW] キャッシュ完了');
      // 新しいService Workerをすぐに有効化する
      return self.skipWaiting();
    })
  );
});

// --------------------------------------------------
// アクティベートイベント
// 新しいService Workerが有効になったときに発生する
// 古いバージョンのキャッシュを削除する
// --------------------------------------------------
self.addEventListener('activate', function(event) {
  console.log('[SW] アクティベート');

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      // すべてのキャッシュ名を確認して、古いものを削除する
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // すべてのタブで新しいService Workerをすぐに使えるようにする
      return self.clients.claim();
    })
  );
});

// --------------------------------------------------
// フェッチイベント
// アプリがネットワークリクエストを行うたびに発生する
// 戦略: キャッシュ優先（Cache First）
//   1. まずキャッシュを確認する
//   2. キャッシュにあればキャッシュから返す（オフラインでも動作）
//   3. キャッシュになければネットワークから取得する
// --------------------------------------------------
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      // キャッシュにファイルがある場合はキャッシュから返す
      if (cachedResponse) {
        return cachedResponse;
      }

      // キャッシュにない場合はネットワークから取得する
      return fetch(event.request).then(function(networkResponse) {
        // 有効なレスポンスのみキャッシュに追加する
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          // レスポンスはストリームなのでクローンしてキャッシュに保存する
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function() {
        // ネットワークもキャッシュもない場合（HTMLリクエストのフォールバック）
        if (event.request.destination === 'document') {
          return caches.match('/ai-todo/index.html');
        }
      });
    })
  );
});
