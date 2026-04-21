# 🚀 投手训练记录系统 - 部署指南

## 项目结构

```
pitcher-training/
├── index.html    # 主页面
├── style.css     # 样式文件
├── app.js        # 核心逻辑
└── README.md     # 本文件
```

---

## 方式一：GitHub Pages（推荐 ⭐）

### 步骤

1. **创建 GitHub 仓库**
   - 登录 [GitHub](https://github.com)
   - 点击右上角 `+` → `New repository`
   - 仓库名称填写 `pitcher-training`
   - 选择 `Public`（免费部署需要公开）
   - 点击 `Create repository`

2. **上传文件**
   - 在仓库页面点击 `uploading an existing file`
   - 将 `index.html`、`style.css`、`app.js` 三个文件拖入上传区域
   - 点击 `Commit changes`

3. **启用 GitHub Pages**
   - 进入仓库 `Settings` → `Pages`
   - `Source` 选择 `Deploy from a branch`
   - `Branch` 选择 `main`，文件夹选择 `/ (root)`
   - 点击 `Save`
   - 等待 1-2 分钟，刷新页面

4. **访问你的网站**
   - 地址格式：`https://你的用户名.github.io/pitcher-training/`
   - 示例：`https://lawson194.github.io/pitcher-training/`

---

## 方式二：Vercel（适合 GitHub 受限地区）

### 步骤

1. **注册 Vercel 账号**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 `New Project`
   - 选择 `Import Git Repository`
   - 授权 Vercel 访问你的 GitHub

3. **部署**
   - 选择 `pitcher-training` 仓库
   - 点击 `Deploy`
   - 等待 30 秒左右完成

4. **获取访问地址**
   - Vercel 会分配一个免费域名，如：
   - `https://pitcher-training.vercel.app/`

---

## 方式三：Netlify

### 步骤

1. **注册 Netlify 账号**
   - 访问 [netlify.com](https://netlify.com)
   - 使用 GitHub 账号登录

2. **拖拽部署**
   - 进入 `Sites` 页面
   - 直接将 `pitcher-training` 文件夹拖入页面
   - 自动部署，即时生效

3. **获取访问地址**
   - Netlify 会生成随机域名，如：
   - `https://random-name.netlify.app/`
   - 可在 `Site settings` 中自定义子域名

---

## 方式四：蓝奏云（仅限 HTML 单文件或打包）

> ⚠️ 蓝奏云适合分享单文件或压缩包，不适合作为持续访问的网站

### 步骤

1. 将三个文件压缩为 `pitcher-training.zip`
2. 上传到蓝奏云
3. 生成分享链接（设置永久有效）
4. 下载后解压到本地使用

---

## 📱 手机端适配

所有部署方式均支持手机端访问：
- 响应式设计，适配手机屏幕
- 触摸点击标记进垒点
- 可随时导出 PDF 保存

---

## 🔧 本地调试

如果你想在本地运行：

```bash
# 方法1：直接打开
双击 index.html 用浏览器打开

# 方法2：使用 Python 简易服务器
cd pitcher-training
python -m http.server 8080
# 然后浏览器访问 http://localhost:8080

# 方法3：使用 Node.js 的 serve
npx serve .
```

---

## ✅ 功能清单

| 功能 | 状态 |
|------|------|
| 九宫格进垒区 | ✅ |
| 点击标记投球位置 | ✅ |
| 粉点标记 + 编号 | ✅ |
| 好球/坏球计数 | ✅ |
| 自动计算好球率 | ✅ |
| 三振/安打记录 | ✅ |
| 训练名称/日期 | ✅ |
| PDF 导出 | ✅ |
| 响应式设计 | ✅ |
| 本地无需服务器 | ✅ |

---

## 📝 自定义修改

如需修改样式或功能，直接编辑对应文件：
- `style.css` - 修改颜色、布局
- `app.js` - 修改逻辑、添加功能

修改后重新上传覆盖即可。

---

## 🎯 快速开始

```
1. 下载项目 → 2. 创建 GitHub 仓库 → 3. 上传文件 → 4. 启用 Pages → 5. 访问！
```

预计耗时：10-15 分钟

---

*如有疑问请随时联系！* ⚾