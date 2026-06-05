import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import './styles.css'

createApp(App).use(i18n).mount('#app')

// A friendly note for anyone who opens the console.
// eslint-disable-next-line no-console
console.log(
  '%c🪁 Kroki Editor%c\nGot a feature request or found a bug? Issues are welcome → https://github.com/yoyoys/kroki-editor/issues',
  'font-weight:600;font-size:13px',
  'color:#888',
)
