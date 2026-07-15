import DefaultTheme from 'vitepress/theme'
import './custom.css'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

// ===== 访问密码门 =====
// 改成你自己的密码，留空则不启用
const ACCESS_PASSWORD = 'cuiqu2026'

function checkPassword() {
  if (!ACCESS_PASSWORD) return
  const authKey = 'blog-access-granted'
  if (sessionStorage.getItem(authKey) === 'true') return

  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('key') === ACCESS_PASSWORD) {
    sessionStorage.setItem(authKey, 'true')
    // 去掉 URL 中的密码参数
    window.history.replaceState({}, '', window.location.pathname)
    return
  }

  // 显示密码输入界面
  document.body.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#1a1f2e;color:#e0e0e0;font-family:system-ui,sans-serif">
      <div style="text-align:center">
        <h2 style="font-size:1.5rem;margin-bottom:0.5em;letter-spacing:0.1em">萃取工坊</h2>
        <p style="color:#888;font-size:0.85rem;margin-bottom:2rem">请输入访问密码</p>
        <input id="pwd-input" type="password" placeholder="密码"
          style="padding:0.6em 1em;border:1px solid #444;border-radius:6px;background:#222;color:#fff;font-size:1rem;width:200px;text-align:center;outline:none"
          autofocus />
        <br><br>
        <button id="pwd-btn"
          style="padding:0.6em 2em;border:none;border-radius:6px;background:#2c5f8a;color:#fff;font-size:1rem;cursor:pointer;transition:background .2s">
          进入
        </button>
        <p id="pwd-error" style="color:#e74c3c;font-size:0.85rem;margin-top:1rem;visibility:hidden">密码错误</p>
      </div>
    </div>
  `

  const input = document.getElementById('pwd-input')
  const btn = document.getElementById('pwd-btn')
  const error = document.getElementById('pwd-error')

  function tryAuth() {
    if (input.value === ACCESS_PASSWORD) {
      sessionStorage.setItem(authKey, 'true')
      location.reload()
    } else {
      error.style.visibility = 'visible'
      input.value = ''
      input.focus()
    }
  }

  btn.onclick = tryAuth
  input.onkeydown = (e) => { if (e.key === 'Enter') tryAuth() }
}

export default {
  ...DefaultTheme,
  setup() {
    const route = useRoute()

    onMounted(() => {
      // 0. 密码门检查
      checkPassword()

      // 1. 阅读进度条
      const bar = document.createElement('div')
      bar.className = 'reading-progress-bar'
      bar.id = 'reading-progress-bar'
      document.body.prepend(bar)
      window.addEventListener('scroll', updateProgress, { passive: true })
      updateProgress()

      // 2. 护眼模式按钮
      addThemeToggle()

      // 3. 恢复护眼模式状态
      if (localStorage.getItem('blog-sepia') === 'true') {
        document.documentElement.classList.add('sepia')
      }

      // 4. 返回顶部按钮
      addBackToTop()

      // 5. 内容页：阅读时间徽章
      addReadingTimeBadge()

      // 6. 自定义 Footer
      addCustomFooter()

      // 7. 首页统计动画
      animateStats()
    })

    watch(() => route.path, () => {
      nextTick(() => {
        checkPassword()
        updateProgress()
        setTimeout(addThemeToggle, 300)
        setTimeout(addReadingTimeBadge, 400)
        setTimeout(addCustomFooter, 400)
        setTimeout(animateStats, 300)
      })
    })

    function updateProgress() {
      const bar = document.getElementById('reading-progress-bar')
      if (!bar) return
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      bar.style.width = Math.min(progress, 100) + '%'

      // 返回顶部按钮显隐
      const btn = document.getElementById('back-to-top-btn')
      if (btn) {
        btn.classList.toggle('visible', scrollTop > 400)
      }
    }

    function addThemeToggle() {
      if (document.getElementById('sepia-toggle-btn')) return
      const navAppearance = document.querySelector('.VPSwitchAppearance') ||
                            document.querySelector('.VPNavBarAppearance')
      if (!navAppearance) return
      const parent = navAppearance.parentElement
      if (!parent) return

      const btn = document.createElement('button')
      btn.id = 'sepia-toggle-btn'
      btn.title = '切换护眼模式'
      btn.style.cssText = `
        display:flex;align-items:center;justify-content:center;
        width:36px;height:36px;border-radius:50%;
        border:1px solid var(--vp-c-divider);background:var(--vp-c-bg-soft);
        cursor:pointer;transition:all .2s;color:var(--vp-c-text-2);
        margin-right:8px;font-size:16px;
      `
      btn.innerHTML = '☀'
      btn.onclick = () => {
        document.documentElement.classList.toggle('sepia')
        const isSepia = document.documentElement.classList.contains('sepia')
        localStorage.setItem('blog-sepia', isSepia ? 'true' : 'false')
        btn.style.borderColor = isSepia ? 'var(--vp-c-brand-1)' : 'var(--vp-c-divider)'
        btn.style.color = isSepia ? 'var(--vp-c-brand-1)' : 'var(--vp-c-text-2)'
      }

      if (document.documentElement.classList.contains('sepia')) {
        btn.style.borderColor = 'var(--vp-c-brand-1)'
        btn.style.color = 'var(--vp-c-brand-1)'
      }
      parent.insertBefore(btn, navAppearance)
    }

    function addBackToTop() {
      if (document.getElementById('back-to-top-btn')) return
      const btn = document.createElement('button')
      btn.id = 'back-to-top-btn'
      btn.className = 'back-to-top'
      btn.title = '返回顶部'
      btn.innerHTML = '↑'
      btn.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      document.body.appendChild(btn)
    }

    function addReadingTimeBadge() {
      // 只在内容页添加，跳过首页和合集页
      const contentEl = document.querySelector('.vp-doc')
      if (!contentEl) return
      // 如果已经有徽章就跳过
      if (contentEl.querySelector('.reading-time-badge')) return
      // 跳过首页和合集概览页
      if (route.path === '/' || route.path.endsWith('/')) return

      // 获取 frontmatter 中的 total_chars
      const text = contentEl.textContent || ''
      const charCount = text.replace(/\s/g, '').length
      if (charCount < 500) return

      const minutes = Math.max(1, Math.round(charCount / 500))
      let timeStr = ''
      if (minutes >= 60) {
        timeStr = `约 ${Math.floor(minutes/60)} 小时 ${minutes%60} 分钟`
      } else {
        timeStr = `约 ${minutes} 分钟`
      }

      const badge = document.createElement('div')
      badge.className = 'reading-time-badge'
      badge.innerHTML = `📖 ${timeStr} · ${charCount.toLocaleString()} 字`

      // 插入到 h1 后面
      const h1 = contentEl.querySelector('h1')
      if (h1 && h1.nextSibling) {
        h1.nextSibling.parentElement.insertBefore(badge, h1.nextSibling.nextSibling || h1.nextSibling)
      } else if (h1) {
        h1.after(badge)
      }
    }

    function addCustomFooter() {
      if (document.getElementById('custom-footer')) return
      const contentEl = document.querySelector('.vp-doc')
      if (!contentEl) return

      const footer = document.createElement('div')
      footer.id = 'custom-footer'
      footer.className = 'custom-footer'
      footer.innerHTML = '知识深意 · 结构性萃取 · 萃取工坊'
      contentEl.appendChild(footer)
    }

    function animateStats() {
      // 首页统计数字动画
      const statNums = document.querySelectorAll('.home-stat-num')
      if (!statNums.length) return

      statNums.forEach(el => {
        const target = parseInt(el.getAttribute('data-target') || '0')
        if (!target) return
        let current = 0
        const step = Math.max(1, Math.floor(target / 40))
        const interval = setInterval(() => {
          current += step
          if (current >= target) {
            current = target
            clearInterval(interval)
          }
          el.textContent = current.toLocaleString()
        }, 30)
      })
    }
  }
}
