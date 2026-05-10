# 技术规范：图片去水印工具

## 技术栈
| 层级 | 技术 | 说明 |
|------|------|------|
| 结构 | HTML5 | 语义化标签 |
| 样式 | CSS3 + CSS Variables | 零依赖，淡粉主题 |
| 交互 | Vanilla JavaScript (ES6+) | 无框架 |
| 图像处理 | Canvas API | 原生浏览器能力 |
| AI填充 | OpenCV.js 4.8.0 | CDN加载，Telea inpainting |
| 部署 | GitHub Pages | 静态文件托管 |

## 浏览器兼容性
- Chrome 90+（WebAssembly支持）
- Firefox 90+
- Safari 15+（iOS 15+）
- Edge 90+

## 性能指标
| 指标 | 目标值 |
|------|--------|
| 首次内容渲染 | < 2秒 |
| OpenCV.js 加载 | < 10秒（首次）/ < 1秒（缓存） |
| 图像上传渲染 | < 500ms（5MB以下图片） |
| 去水印处理 | < 2秒（2000px边以内） |
| 下载触发 | < 1秒 |

## 代码规范
- 无外部 CSS/JS 框架依赖
- JS 文件按功能拆分（app / drawing / inpaint / utils）
- CSS 变量统一管理颜色和间距
- 所有函数添加 JSDoc 注释
- 不使用 `var`，只用 `const` 和 `let`

## 安全
- 图片全在浏览器端处理，不上传任何服务器
- 无第三方追踪、无埋点
- HTTPS 部署（GitHub Pages 默认）
