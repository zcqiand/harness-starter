# ===== harness-starter — Web 静态容器（agent 家族 web 段 5312；容器内 :80，host 双层）=====
# 多阶段：node 构建 Vite 产物 → nginx:alpine 静态服务。
# 纯前端应用：零后端、零 secret，无 /api/ 反代、无 env-file——
# 家族 deploy 脚本的 web-only 变体（harness-2048/snake/maze/jumper/cardbattle 同款）。
# 与 snake（React 同栈先例）的关键差异：构建段在 npm run build **之前**先跑 npm test——
# evidence-reporter 在容器内产出 evidence/latest.json（规则溯源回执），
# App.tsx import 该 JSON，随 build 烘进产物；顺序不能反（先回执后构建）。
FROM node:24-alpine AS builder
WORKDIR /app

# evidence-reporter 回执带 git short SHA：CI checkout 自带全量 .git，
# 但 node:alpine 不含 git，须自装；worktree/无 .git 场景 reporter 自退化（见 scripts/evidence-reporter.mjs）。
RUN apk add --no-cache git

COPY package.json package-lock.json ./
# 硬约束：npm 依赖一律走 npmmirror（suite root CLAUDE.md §2）。
# rollup override 4.68.5（package.json）防 musl 回归——家族指纹，勿删。
RUN npm ci --registry=https://registry.npmmirror.com --no-audit --no-fund

COPY . .
RUN npm test && npm run build

# ---------- Stage 2: runtime ----------
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
