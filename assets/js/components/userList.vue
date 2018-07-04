<template lang="pug">
  
    table.table.table-striped.table-hover
        tbody
            tr
                th Email
                th Opt-In
                th Onboarded
                th Tester
                th Active
                th Actions

            userListItem(v-for="user in users",:key="user.email"
                        :user="user"
                        @setStatus="setStatus")

</template>

<script>

const userListItem = require('./userListItem.vue');

module.exports = { // This is important, I got errors when using `export default`
    components : {
        userListItem
    },
    data () {
        return {
            users: []
        }
    },
    methods: {
        setStatus (user,status) {

            // should be moved to setUserStatusResult, wait for update success
            user.active = status;
            this.$socket.emit('setUserStatus', { email : user.email, status : status });
        },
        getUsers () {
            this.$socket.emit('getUsers');
        }
    },
    
    sockets: {
        
        connect() {
          this.getUsers();
        },
        onGetUsers : function (users) {
            this.users = users;
        },
        setUserStatusResult : function (data) {
            //console.log(data.email);
            //console.log(this.users);
        }
    }
}

</script>