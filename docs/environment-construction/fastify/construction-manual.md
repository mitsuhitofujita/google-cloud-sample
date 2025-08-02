


## 静的ファイル配信

```bash
pnpm i @fastify/static
```

```typescript
// packages/backend/src/index.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ... */

server.register(fastifyStatic, {
	root: path.join(__dirname, "../../frontend/dist"),
	prefix: "/",
});

/* ... */
```


## Google認証

```bash
pnpm --filter backend add fastify-plugin
pnpm --filter backend add @fastify/jwt
pnpm --filter backend add @fastify/cors
```
