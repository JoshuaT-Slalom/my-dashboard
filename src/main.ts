import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import router from './router'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './style.css'
import App from './App.vue'

const vuetify = createVuetify({
	icons: {
		defaultSet: 'mdi',
		aliases,
		sets: { mdi },
	},
})

createApp(App).use(vuetify).use(router).mount('#app')
