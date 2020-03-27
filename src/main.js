import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import Buefy from 'buefy'
import './assets/style.scss'
import Gravatar from 'vue-gravatar';
import SecretPoll from "./components/SecretPoll.vue"
import PublicPoll from "./components/PublicPoll.vue"


Vue.component('v-gravatar', Gravatar);
Vue.component('SecretPoll', SecretPoll);
Vue.component('PublicPoll', PublicPoll);
Vue.config.productionTip = false
Vue.use(Buefy)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
