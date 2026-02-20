self.addEventListener('install', function(e) {
  self.skipWaiting(); // 更新を即座に反映させる
});

self.addEventListener('activate', function(e) {
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // オフライン時にエラー画面ではなくダミーを返す（PWA必須要件のクリアのため）
  e.respondWith(
    fetch(e.request).catch(function() {
      return new Response('インターネットに接続されていません。');
    })
  );
});