<template>
  <div class="main text-left">
    <div class="container">
         <v-gravatar :email="address" style="float:left; margin-right:20px; width:75px; height:75px;"/>
         <h1>Welcome back</h1>
        <h3>{{ address }}</h3>
        <hr>
        <div v-if="activePolls.length > 0">
          <h3 class="title is-4">Active polls</h3>
          <div v-for="poll in activePolls" v-bind:key="poll.uuid"><PublicPoll :poll="poll" :address="address" /></div>
        </div>
        <div v-if="nextPolls.length > 0">
          <h3 class="title is-4">Next polls</h3>
          <div v-for="poll in nextPolls" v-bind:key="poll.uuid"><PublicPoll :poll="poll" :address="address" /></div>
        </div>
        <div v-if="secretPolls.length > 0">
          <h3 class="title is-4">Secret polls you're invited</h3>
          <div v-for="poll in secretPolls" v-bind:key="poll.uuid"><SecretPoll :poll="poll" :address="address" /></div>
        </div>
        <div v-if="isLoading">Loading polls from the blockchain...</div>
        <div class="text-center" v-if="activePolls.length === 0 && secretPolls.length === 0  && nextPolls.length === 0 && !isLoading">
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
        prevPolls: [],
        secretPolls: []
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
        var poll = polls[i].data.poll
        var dna = polls[i].data.dna
        var authorized = polls[i].data.authorized
        if(poll !== undefined && dna !== undefined && dna.type !== undefined && dna.type !== 'SECRET'){
          let start = moment(poll.start_date + 'T' + poll.start_time + ':00+01:00')
          let end = moment(poll.end_date + 'T' + poll.end_time + ':00+01:00')
          if(moment().isAfter(start)){
            if(moment().isBefore(end)){
              app.activePolls.push(polls[i])
            }
            if(moment().isAfter(end)){
              app.prevPolls.push(polls[i])
            }
          } else {
            app.nextPolls.push(polls[i])
          }
        }

        if(poll !== undefined && dna !== undefined && dna.type !== undefined && dna.type === 'SECRET'){
          for(let x in authorized){
            if(app.address === authorized[x].address){
              app.secretPolls.push(polls[i])
            }
          }

        }
      }
      app.isLoading = false
    }
  }
</script>