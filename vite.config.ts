import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    vue(),
    // 将所有 JS/CSS/图片等资源全部内嵌进 index.html，
    // 生成真正的"单文件 HTML"，双击 file:// 协议直开无 CORS 问题
    viteSingleFile()
  ],
  // singlefile 下 base 相对路径保留，兼容外部文件分发
  base: './',
  build: {
    // 放宽体积警告并确保内联能一次性装下
    target: 'es2020',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
