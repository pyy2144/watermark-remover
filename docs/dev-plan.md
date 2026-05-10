# 执行计划：图片去水印工具

## Phase 1：静态页面骨架
- [ ] index.html 结构搭建
- [ ] css/style.css 淡粉主题 + 响应式布局
- [ ] 所有UI元素就位（不可交互）

## Phase 2：图片上传 + 涂鸦绘制
- [ ] js/utils.js 图片加载/下载工具
- [ ] js/drawing.js 涂鸦遮罩绘制
- [ ] js/app.js 主控制器
- [ ] js/inpaint.js 简单径向填充

## Phase 3：OpenCV.js 专业去水印
- [ ] 接入 OpenCV.js CDN
- [ ] 重写 inpaint.js 使用 Telea 算法
- [ ] 加载状态指示器 + 降级方案

## Phase 4：交互优化 + 移动端打磨
- [ ] 撤销/重做
- [ ] 橡皮擦模式
- [ ] 加载反馈 + 错误提示
- [ ] 前后对比切换
- [ ] favicon + meta标签

## Phase 5：GitHub Pages 部署
- [ ] 创建 GitHub 仓库
- [ ] 部署验证
- [ ] 跨浏览器测试
