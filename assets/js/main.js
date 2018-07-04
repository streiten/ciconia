var feather = require('feather-icons');
feather.replace();

var Vue = require('vue/dist/vue.js');
var VueSocketio = require('vue-socket.io-extended');
var io = require('socket.io-client');


Vue.use(VueSocketio, io('http://localhost:8888'));

Vue.component('signup', require('./components/signup.vue'));
Vue.component('user-list', require('./components/userList.vue'));

const app = new Vue({
  el: '#app'
})


