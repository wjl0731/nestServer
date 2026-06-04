# nestjs-server

uniapp-framework 的后端服务，当前主要承载 AI 命理问答接口（通义千问 / DeepSeek / OpenAI），未来可扩展其它业务。

## 启动

```bash
npm install
cp .env.example .env   # 然后填入 QWEN_API_KEY 等
npm run start:dev
```

默认端口 `3000`，所有接口前缀 `/api`。

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
