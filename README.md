# Express MongoDB REST API Boilerplate

## 项目简介
Node.js REST API 模板项目，基于 Express + MongoDB + Redis，实现完整的用户认证系统（注册、登录、密码重置、邮箱验证）、文件上传、多语言支持。TypeScript 编写。

## 快速启动

### Docker 启动（推荐）

```bash
# 克隆项目
git clone https://github.com/11DingKing/solo-zj-00067-20260415
cd solo-zj-00067-20260415

# 启动所有服务
docker compose up -d

# 查看运行状态
docker compose ps
```

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 后端 API | http://localhost:8000 | Express API 服务 |
| MongoDB | localhost:27017 | 数据库 |
| Redis | localhost:6379 | 缓存/Token 存储 |
| MailHog | http://localhost:8025 | 邮件测试界面 |

### 停止服务

```bash
docker compose down
```

## 项目结构
- `src/routes/` - 路由定义
- `src/controllers/` - 控制器
- `src/models/` - 数据模型
- `src/middlewares/` - 中间件
- `src/services/` - 业务逻辑
- `src/guards/` - 认证守卫
- `src/validations/` - 请求验证

## 来源
- 原始来源: https://github.com/watscho/express-mongodb-rest-api-boilerplate
- GitHub（上传）: https://github.com/11DingKing/solo-zj-00067-20260415
