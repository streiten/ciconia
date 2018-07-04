<template lang="pug">
  
form.signup(v-on:submit.prevent="onSubmit")
    div.form-group(v-if="!success")
        input(type='email', name='email', value='',class="email form-control",placeholder="Your Email",v-model="email")
    
    div.form-group(v-if="!success")
        button(type='submit', class="form-control") Sign up

    div.form-group
        span.lead(v-if="message") {{ message }}

</template>

<script>

module.exports = { // This is important, I got errors when using `export default`
    data () {
        return {
            email: '',
            message: '',
            success : false
        }
    },
    mounted () {},
    methods: {
        onSubmit () {
            this.message = '';
            this.$socket.emit('createUser', this.email );
        }
    },

    sockets: {
        connect() {
          //console.log('connected');
        },
        disconnect() {
          //console.log('disconnected');
        },
        createUserResult : function (data) {
            this.message = data.msg;
            this.success = data.success;
        },
    }
}

</script>

<style scoped>
</style>