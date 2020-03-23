<template>
  <div class="main text-left">
    <div class="container">
        <h1>Welcome back</h1>
        <h3>{{ address }}</h3>
        <hr>
        <div v-if="activePolls.length > 0">
          {{ activePolls }}
        </div>
        <div class="text-center" v-if="activePolls.length === 0">
          Nothing to show here, do you want to create a new poll?<br><br>
          <a href="/#/create"><b-button size="is-medium" type="is-primary">Create a Poll Now!</b-button></a>
        </div>
    </div>
    <b-loading :is-full-page="true" :active.sync="isLoading" :can-cancel="false"></b-loading>
  </div>
</template>

<script>
  const ScryptaCore = require('@scrypta/core')
  const moment = require('moment')

  export default {
    name: 'Home',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        address: '',
        wallet: '',
        isLoading: true,
        activePolls: [],
        nextPolls: [],
        prevPolls: []
      }
    },
    async mounted() {
      const app = this
      app.wallet = await app.scrypta.returnDefaultIdentity()
      let SIDS = app.wallet.split(':')
      app.address = SIDS[0]
      let identity = await app.scrypta.returnIdentity(app.address)
      app.wallet = identity
      app.isLogging = false
      let response = await app.scrypta.post('/read',{ protocol: 'poll://' })
      var polls = response.data
      for (var i=0; i < polls.length; i++){
        var poll = polls[i].data
        if(polls[i].data !== null && poll.start_date !== undefined){
          var visible = moment().isAfter(poll.start_date + ' ' + poll.start_time)
          if(visible === true){
            var next = moment().isBefore(poll.end_date + ' ' + poll.end_time)
            if(next === true){
              app.activePolls.push(polls[i])
              app.checkJoinPoll(polls[i])
            } else {
              app.prevPolls.push(polls[i])
            }
          } else {
              app.nextPolls.push(polls[i])
              app.checkJoinPoll(polls[i])
          }
        }
      }
      app.isLoading = false
    }
  }
</script>