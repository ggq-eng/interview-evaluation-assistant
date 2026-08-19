/**
 * AI 面试评估助手 · 本地代理（流式转发版）
 * ----------------------------------------------------------------
 * 用途：
 *   1) 浏览器直连大模型接口遇到 CORS / 跨域限制时，用本机 Node 做转发；
 *   2) 给每一次响应补上 Access-Control-Allow-Origin，彻底消除浏览器跨域读取失败；
 *   3) 原样流式转发 SSE（stream:true），前端可渐进显示、且不会因为上游未结束而卡住。
 *
 * 运行（无需任何依赖，Node 内置模块即可）：
 *   node proxy.js
 *
 * 前端调用：POST http://localhost:8787/proxy
 *   请求体：{ "url": "真实Chat地址", "key": "API Key", "payload": { OpenAI chat 请求体，含 stream:true } }
 *
 * 注意：仅用于本机演示 / 内网环境。公网部署请改为后端转发。
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 8787;

function writeHead(res, status, extra) {
  res.writeHead(status, Object.assign({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
  }, extra || {}));
}

const server = http.createServer((req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    writeHead(res, 204);
    return res.end();
  }
  if (req.method === 'GET') {
    writeHead(res, 200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('AI proxy OK');
  }

  if (req.method === 'POST' && req.url === '/proxy') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(body); }
      catch (e) {
        writeHead(res, 400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '请求体不是合法 JSON：' + e.message }));
      }
      const { url, key, payload } = parsed;
      if (!url || !payload) {
        writeHead(res, 400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '缺少 url 或 payload' }));
      }
      let target;
      try { target = new URL(url); }
      catch (e) {
        writeHead(res, 400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '目标 URL 非法：' + url }));
      }

      const lib = target.protocol === 'https:' ? https : http;
      const data = JSON.stringify(payload);
      const upstream = lib.request(
        target,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (key || ''),
            'Content-Length': Buffer.byteLength(data),
          },
        },
        (upResp) => {
          // 流式转发：把上游响应头（含 CORS）写回，再把数据流 pipe 给浏览器
          writeHead(res, upResp.statusCode, {
            'Content-Type': upResp.headers['content-type'] || 'application/json; charset=utf-8',
          });
          upResp.pipe(res);
        }
      );
      upstream.on('error', (e) => {
        writeHead(res, 502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '上游请求失败：' + e.message }));
      });
      upstream.write(data);
      upstream.end();
    });
    return;
  }

  writeHead(res, 404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('✅ AI 本地代理已启动： http://localhost:8787/proxy');
  console.log('   在「AI 设置」中勾选「通过本地代理访问」即可使用。Ctrl+C 退出。');
});
