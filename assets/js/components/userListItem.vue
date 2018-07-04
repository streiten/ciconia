<template lang="pug">
  
    tr
        td {{ user.email }}
        
        onoff(:bool="user.subscribed")
        onoff(:bool="user.onboarded")
        onoff(:bool="user.tester")
        onoff(:bool="user.active")

        td
            a(v-if="!user.active",@click="$emit('setStatus',user,true)") Activate
            a(v-if="user.active",@click="$emit('setStatus',user,false)") Deactivate

</template>

<script>

const onoff = require('./onoff.vue');

module.exports = {
    
    components: {
        onoff
    },

    props: {
        user: {
            type: Object,
            required: true
        }
   }
}

</script>