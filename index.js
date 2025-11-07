export default {
  async fetch(request) {
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

      // 创建可修改的响应对象
      const responseWithCache = new Response(response.body, response);
      responseWithCache.headers.set("Cache-Control", "public, max-age=3600");

      // 写入缓存
      await cache.put(request, responseWithCache.clone());

      return responseWithCache;
    } catch (err) {
      return new Response(
        "⚠️ Error fetching resource: " + err.message,
        { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }
  },
};
