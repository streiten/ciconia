<template lang="pug">

  td
    i(v-if="bool").fa.fa-check
    i(v-if="!bool").fa.fa-times

</template>

<script>

  module.exports = {
     props:['bool']
  }

</script>

<style scoped>

  .fa-times {
    color: red;
  }

  .fa-check {
    color: green;
  }

</style>
