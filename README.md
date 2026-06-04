# nestjs-server

uniapp-framework 的后端服务，当前主要承载 AI 命理问答接口（通义千问 / DeepSeek / OpenAI），未来可扩展其它业务。

## 启动

```bash
npm install
cp .env.example .env   # 然后填入 QWEN_API_KEY 等
npm run start:dev
```

默认端口 `3000`，所有接口前缀 `/api`。

## 云服务器部署

以下示例基于 Linux 云服务器 + Nginx + PM2，适合单机部署。

### 1. 服务器准备

安装 Node.js 20、Nginx、PM2：

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs nginx
npm install -g pm2
```

如果是 Ubuntu：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
```

### 2. 上传代码并安装依赖

```bash
git clone <your-repository-url>
cd nestServer
npm install
cp .env.example .env
```

然后编辑 `.env`，至少确认这些值：

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
DEFAULT_PROVIDER=qwen
QWEN_API_KEY=your-qwen-api-key
```

### 3. 构建并用 PM2 启动

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

查看运行状态：

```bash
pm2 status
pm2 logs nestjs-server
curl http://127.0.0.1:3000/api/health
```

### 4. 配置 Nginx

项目根目录提供了示例文件 `nginx.conf.example`，可以复制到 Nginx 配置目录：

```bash
sudo cp nginx.conf.example /etc/nginx/conf.d/nestjs-server.conf
sudo nginx -t
sudo systemctl reload nginx
```

如果服务器启用了防火墙或云安全组，请放通 `80`、`443`，以及内部应用端口 `3000`。

### 5. HTTPS

如果已经绑定域名，建议配合 Certbot 或云厂商证书服务启用 HTTPS。启用后，前端的 `CORS_ORIGIN` 请填写正式 `https` 域名。

### 6. 更新发布

```bash
git pull
npm install
npm run build
pm2 restart nestjs-server
```

### 7. 流式接口注意项

`POST /api/chat/stream` 使用 SSE，反向代理必须关闭缓冲；示例里的 `nginx.conf.example` 已经包含：

```nginx
proxy_buffering off;
proxy_cache off;
```

## 接口

### `GET /api/health`
健康检查。

### `GET /api/chat/models`
列出已注册的模型 provider 及其可用状态。

```json
{
  "providers": [
    { "name": "qwen", "defaultModel": "qwen-turbo", "available": true },
    { "name": "deepseek", "defaultModel": "deepseek-chat", "available": false },
    { "name": "openai", "defaultModel": "gpt-4o-mini", "available": false }
  ]
}
```

### `POST /api/chat/completions`
非流式，一次性返回。

```jsonc
// 请求
{
  "provider": "qwen",          // 可选，缺省读 .env DEFAULT_PROVIDER
  "model": "qwen-turbo",       // 可选
  "messages": [
    { "role": "system", "content": "你是命理助手。" },
    { "role": "user", "content": "今年我事业运势如何？" }
  ],
  "temperature": 0.7,
  "maxTokens": 2048
}
```

### `POST /api/chat/stream`
SSE 流式。请求体与上面一致，响应为 `text/event-stream`：

```
event: delta
data: {"content":"今年"}

event: delta
data: {"content":"你的事业…"}

event: done
data: {"ok":true}
```

前端用 `fetch` + `ReadableStream` 解析即可（uniapp H5 已示例）。

## 增加新的 Provider

1. 在 `src/chat/providers/` 新建 `xxx.provider.ts`，继承 `OpenAICompatibleProvider`（OpenAI 协议）或直接实现 `IChatProvider`（非 OpenAI 协议）。
2. 在 `chat.module.ts` 注册 + 在 `chat.service.ts` 构造函数注入。
3. 在 `.env` 增加对应 `XXX_API_KEY` / `XXX_BASE_URL`。

## 千问 API Key 申请

[阿里云百炼 DashScope](https://bailian.console.aliyun.com/?apiKey=1) → 开通 → 拿到 sk-xxx，填入 `.env` 的 `QWEN_API_KEY`。

DashScope 的 OpenAI 兼容模式入口：`https://dashscope.aliyuncs.com/compatible-mode/v1`，可直接调用 `chat-completions`，无需特殊改造。
