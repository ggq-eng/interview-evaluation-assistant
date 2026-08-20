# interview-evaluation-assistant

> **分类**：来源待确认 ｜ **文件数**：6 ｜ **仓库目录**：`interview-evaluation-assistant`

## 📌 简介

构建 AI 面试评估助手网页工具。当用户需要创建用于 HR 面试场景的评估工具时使用，包括：岗位 JD

## 🎯 适用场景

适用于该技能的能力范围，详见下方「📖 使用说明」。

## 📂 目录结构

```text
  - .gitignore
  - LICENSE
  - README.md
  - SKILL.md
  - **assets/**
    - interview-assistant-template.html
    - proxy.js
```

## 🚀 安装方法

将本文件夹整体复制到 WorkBuddy 的技能目录即可启用：

```bash
# 用户级（推荐）
cp -r . ~/.workbuddy/skills/interview-evaluation-assistant

# 或项目级
cp -r . <你的项目>/.workbuddy/skills/interview-evaluation-assistant
```

复制完成后，**重启或刷新 WorkBuddy**，即可在对话中用自然语言触发该技能。

## ⚙️ 配置说明

本技能开箱即用，**无需额外配置**。若涉及外部 API 调用，请在使用时按需提供您自己的密钥（不要提交到公开仓库）。

## 📖 使用说明（完整规范）

> 以下为该技能的完整说明，涵盖核心能力、工作流程与关键规则，帮助您全面了解其运作方式。

## 概述

本 Skill 指导如何构建一个完整的「AI 面试评估助手」单页 Web 工具（Single HTML），帮助 HR 在面试流程中完成：岗位评估模型生成、简历智能评分、面试记录与报告、多候选人横向对比。

所有功能均在前端实现，无需后端，使用 `localStorage` 持久化数据，可直接用浏览器打开使用。

工具提供两种分析引擎，可在顶栏「⚙ AI 设置」中切换：
- **离线模式（默认）**：纯前端关键词规则引擎，无需联网，秒级响应。
- **在线 AI 语义模式**：调用配置的大模型接口（OpenAI 兼容）对 JD / 简历做真实语义理解，质量显著更高；接口不可达时自动回退离线引擎，保证工具不崩。

## 何时使用本 Skill

- 用户说「做一个面试评估工具」、「HR 面试助手」、「简历评分系统」
- 用户需要招聘场景下的候选人评估、对比、报告生成功能
- 用户要求输出为单一 HTML 文件，不依赖后端

## 工具功能架构

工具包含 4 个核心 Tab 页面：

### Tab 1：岗位评估模型（JD → 维度）
- 输入：职位描述（JD）文本
- 输出：5 个评估维度（如专业能力、沟通表达、团队协作等）+ 每个维度 3 道考察问题
- 实现方式：关键词匹配规则引擎（`analyze(jd)` 函数）
- 支持手动编辑维度和添加问题

### Tab 2：简历智能评分
- 输入：简历文本（支持粘贴或上传 .txt/.pdf/.docx）
- 输出：0–100 综合匹配度分数 + 各维度独立得分
- 评分算法：关键词命中计数 + 学历加权 + 工作年限加权
- 结果展示： hero 数字动画 + 各维度进度条

### Tab 3：面试记录与报告
- 输入：各维度打分（滑块+数字输入）+ 面试评语
- 输出：结构化评估报告（优势分析、不足、录用建议）
- 报告包含：候选人信息、各维度得分卡片、优势/不足列表、录用建议徽章

### Tab 4：候选人横向对比
- 支持添加多位候选人
- 表格形式展示：排名、姓名、综合得分、各维度标签、录用建议
- 自动按综合得分排序，高亮最优人选
- 系统推荐区域：自动给出录用建议

## 技术实现要点

### 文件结构
输出为**单一 HTML 文件**，内嵌 CSS 和 JavaScript，无外部依赖。

### UI 设计规范
- 主色调：`#1a73e8`（蓝色），渐变 `#0d47a1`
- 背景色：`#f5f7fa`（浅灰）
- 成功/警告/危险：`#16a34a` / `#f59e0b` / `#dc2626`
- 字体：系统字体栈（`PingFang SC`, `Microsoft YaHei`, `Segoe UI`）
- 圆角：`8px`，阴影：`0 1px 3px rgba(0,0,0,0.08)`
- 响应式：移动端适配（`@media max-width: 700px`）

### 核心 JavaScript 函数

```
analyze(jdText)          // 离线：JD 文本 → 评估维度
doScore(resume, dims)    // 离线：简历文本 → 各维度得分 + 总分 + factors
profile(resume)          // 离线：简历画像（学历/大厂/年限/职级/量化成果）
aiGenModel(jd)           // 在线：JD → 结构化评估维度（调用大模型）
aiScore(resume, dims)    // 在线：简历 → 语义评分 + factors + summary（调用大模型）
callAI(system, user, opt)// OpenAI 兼容 SSE 流式请求封装（流式解析+自动重试3次，直连失败自动回退本地代理）
extractJSON(text)        // 容错解析模型输出（兼容 ```json 围栏 / 纯文本夹 JSON / <think>包裹）
genReport()              // 面试记录 → 结构化报告 HTML
renderCompare()          // 候选人列表 → 对比表格
```

### 评分算法说明

`doScore(resume, dims)` 函数实现逻辑：
1. 预定义 8 个维度的关键词集合
2. 对简历文本逐关键词正则匹配，累计命中次数
3. 学历加权：博士 +15，硕士 +10，本科 +6，大专 +3
4. 工作年限加权：每年 +3，上限 +18
5. 领导力关键词加权：「负责」+5，「主导/带领/指导」+5
6. 最终得分 = min(命中×4 + 学历 + 年限 + 领导力, 96)，下限 30
7. 根据简历长度进行归一化，最终范围 30–98

### localStorage 数据格式

```json
{
  "ia_state": {
    "jd": "职位描述文本",
    "dims": [{"name":"专业能力","weight":20,"questions":[...]}],
    "candidates": [
      {"name":"张三","total":85,"details":[{"name":"专业能力","score":90}],"date":"2026/6/24","recommend":"推荐录用"}
    ],
    "lastScore": {"total":85,"details":[...]},
    "lastReport": {"name":"张三","total":85,"details":[...],"notes":"...","recommend":"推荐录用"}
  }
}
```

## 完整模板

完整的可运行 HTML 模板位于 `assets/interview-assistant-template.html`。基于此模板构建时，直接复制该文件并根据用户需求进行定制调整。

## 定制指南

### 修改评分维度
编辑 `analyzeJD()` 函数中的 `dimDB` 数组，增减维度或调整关键词。

### 修改评分算法
编辑 `calcMatch()` 函数中的加权逻辑，调整各因素权重。

### 修改配色
编辑 CSS `:root` 中的变量，或替换 `.header` 的渐变背景。

### 添加新功能
常见扩展方向：
- 导出 Word/PDF 报告（引入 docx.js 或 jsPDF）
- 在线 AI 语义模式已内置：顶栏「⚙ AI 设置」可配置接口地址 / Key / 模型，并支持本地代理（`assets/proxy.js`，`node proxy.js` 后勾选「通过本地代理访问」绕过 CORS）
- 添加候选人状态管理（待定/已面试/已发Offer）

> 注：离线引擎函数为 `analyze()` / `doScore()` / `profile()`，在线引擎为 `aiGenModel()` / `aiScore()`，二者在 `genModel()` / `scoreResume()` / `batchScoreAll()` 中按模式分支，调用方已做失败回退。

## 开发流程

按以下步骤构建工具：

1. 从 `assets/interview-assistant-template.html` 复制基础模板
2. 根据用户需求调整功能范围（是否需要所有 4 个 Tab？）
3. 调整 UI 配色以匹配企业品牌
4. 测试 localStorage 持久化和数据导出功能
5. 验证移动端响应式显示效果
6. 交付单一 HTML 文件

## 💡 命令示例

```bash
analyze(jdText)          // 离线：JD 文本 → 评估维度
doScore(resume, dims)    // 离线：简历文本 → 各维度得分 + 总分 + factors
profile(resume)          // 离线：简历画像（学历/大厂/年限/职级/量化成果）
aiGenModel(jd)           // 在线：JD → 结构化评估维度（调用大模型）
aiScore(resume, dims)    // 在线：简历 → 语义评分 + factors + summary（调用大模型）
callAI(system, user, opt)// OpenAI 兼容 SSE 流式请求封装（流式解析+自动重试3次，直连失败自动回退本地代理）
extractJSON(text)        // 容错解析模型输出（兼容
```

```bash
### 评分算法说明

`doScore(resume, dims)` 函数实现逻辑：
1. 预定义 8 个维度的关键词集合
2. 对简历文本逐关键词正则匹配，累计命中次数
3. 学历加权：博士 +15，硕士 +10，本科 +6，大专 +3
4. 工作年限加权：每年 +3，上限 +18
5. 领导力关键词加权：「负责」+5，「主导/带领/指导」+5
6. 最终得分 = min(命中×4 + 学历 + 年限 + 领导力, 96)，下限 30
7. 根据简历长度进行归一化，最终范围 30–98

### localStorage 数据格式
```

## ⚠️ 注意事项

- 本技能从本地 WorkBuddy 环境导出，**所有真实密钥 / 凭据 / 个人数据均已脱敏为占位符**，重新使用前请配置您自己的 Key。
- 如为原创技能，可自由使用、修改与再分发；若对外分享请保留作者与来源信息。
- 技能提供的是自动化辅助能力，不替代专业判断；涉及交易、法律、医疗等高风险场景请谨慎并自担风险。

## 📄 许可证

MIT License —— 详见仓库内 `LICENSE` 文件。
