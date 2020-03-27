import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import Buefy from 'buefy'
import './assets/style.scss'
import Gravatar from 'vue-gravatar';
import SecretPoll from "./components/SecretPoll.vue"
import PublicPoll from "./components/PublicPoll.vue"
import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
var SocialSharing = require('vue-social-sharing')

Vue.use(SocialSharing)
library.add(faChevronDown)
Vue.component('vue-fontawesome', FontAwesomeIcon);
Vue.component('v-gravatar', Gravatar);
Vue.component('SecretPoll', SecretPoll);
Vue.component('PublicPoll', PublicPoll);
Vue.config.productionTip = false
Vue.use(Buefy, {
  defaultIconComponent: 'vue-fontawesome',
  defaultIconPack: 'fas',
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
