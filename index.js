export default {
  async fetch(request) {
    const ua = request.headers.get("User-Agent") || "";

    // 限制 OTT Player 访问
    const allowed = /OTTPlayer|SmartIPTV|SSIPTV/i.test(ua);
    if (!allowed) {
      return new Response("403 Forbidden - OTT Player Only", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const targetBase = "https://on-ott.github.io/py";
    const url = new URL(request.url);
    let path = url.pathname;
    if (!path.startsWith("/")) path = "/" + path;
    const targetUrl = targetBase + path + url.search;

    const cache = caches.default;

    try {
      // 尝试从缓存获取
      let response = await cache.match(request);
      if (response) return response;

      // 缓存没有则去源站获取
      response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      // 请求失败或 404 返回自定义错误
      if (!response.ok) {
        return new Response(
          "⚠️ Resource not found on source server.",
          { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } }
        );
      }

      // 缓存响应（1 小时）
      const responseClone = response.clone();
      responseClone.headers.append("Cache-Control", "public, max-age=3600");
      await cache.put(request, responseClone);

      return response;
    } catch (err) {
      return new Response(
        "⚠️ Error fetching resource: " + err.message,
        { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }
  },
};
