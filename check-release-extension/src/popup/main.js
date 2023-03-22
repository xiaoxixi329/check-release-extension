/* eslint-disable no-undef */
import Vue from 'vue';
import ElementUI from 'element-ui';
import App from './App.vue';
import 'element-ui/lib/theme-chalk/index.css';
import { track } from '@/assets/js/track.js'
Vue.config.productionTip = false;

Vue.use(ElementUI);

new Vue({
  el: '#app',
  components: { App },
  render: (h) => h(App),
});

Vue.prototype.$track = track
track({ eventName: "check-release-popup" });