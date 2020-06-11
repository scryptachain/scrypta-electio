<template>
  <div class="main text-left">
    <div class="container">
        <h1>Polls you've created</h1>
        <hr>
        <div v-if="secretPolls.length > 0">
          <h3 class="title is-4">Secret polls</h3>
          <div v-for="poll in secretPolls" v-bind:key="poll.uuid"><SecretPoll :poll="poll" :address="address" /></div>
        </div>
        <div v-if="activePolls.length > 0">
          <h3 class="title is-4">Active polls</h3>
          <div v-for="poll in activePolls" v-bind:key="poll.uuid"><PublicPoll :poll="poll" :address="address" /></div>
        </div>
        <div v-if="nextPolls.length > 0">
          <h3 class="title is-4">Next polls</h3>
          <div v-for="poll in nextPolls" v-bind:key="poll.uuid"><PublicPoll :poll="poll" :address="address" /></div>
        </div>
        <div v-if="prevPolls.length > 0">
          <h3 class="title is-4">Past polls</h3>
          <div v-for="poll in prevPolls" v-bind:key="poll.uuid"><PublicPoll :poll="poll" :address="address" /></div>
        </div>
        <div v-if="votedPolls.length > 0">
          <h1>Polls you've voted</h1><hr>
          <div v-for="poll in votedPolls" v-bind:key="poll.uuid"><PublicPoll :poll="poll" :address="address" /></div>
        </div>
        <div v-if="searchingParticipated">Searching for polls you've voted...</div>
        <div v-if="isLoading">Loading polls from the blockchain...</div>
        <div class="text-center" v-if="activePolls.length === 0 && nextPolls.length === 0 && prevPolls.length === 0 && secretPolls.length === 0 && !isLoading">
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
        searchingParticipated: false,
        activePolls: [],
        secretPolls: [],
        nextPolls: [],
        prevPolls: [],
        votedPolls: [],
        votedPollsCheck: []
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
      app.fetchAllPolls()
    },
    methods: {
      normalizeNumber(number){
        let normalized = ''
        if(parseFloat(number) < 10 && parseFloat(number) > 0){
          normalized += '0' + number.replace('0','')
        }else{
          normalized += number
        }
        return normalized
      },
      normalizeDate(date){
        let exp = date.split('-')
        let m = this.normalizeNumber(exp[1])
        let d = this.normalizeNumber(exp[2])
        return exp[0] +'-'+ m +'-'+ d
      },
      normalizeTime(time){
        let exp = time.split(':')
        let h = this.normalizeNumber(exp[0])
        let m = this.normalizeNumber(exp[1])
        return h + ':' + m + ':00'
      },
      checkIfVoted(address, poll, dna){
        const app = this
        return new Promise(prom => {
          app.scrypta.post('/received',
            { 
              address: address
            })
            .then(function (response) {
              if(response !== undefined){
              let txs = response.data
                for(let i in txs){
                  let tx=txs[i]
                  let exp = tx.data.split(':')
                  if(tx.sender === app.address && exp[1] === '//VOTE' && dna.votetype === 'PUBLIC'){
                    if(app.votedPollsCheck.indexOf(address) === -1){
                      app.votedPollsCheck.push(address)
                      app.votedPolls.push(poll)
                    }
                  }
                }
                prom(true)
              }else{
                prom(false)
              }
            })
        })
      },
      async fetchAllPolls(){
        const app = this
        let response = await app.scrypta.post('/read',{ protocol: 'poll://' })
        var polls = response.data
        for (let i=0; i < polls.length; i++){
          let poll = polls[i].data.poll
          let dna = polls[i].data.dna
          var authorized = polls[i].data.authorized
          if(dna !== undefined && dna.owner === app.address){
            let start_date = app.normalizeDate(poll.start_date)
            let start_time = app.normalizeTime(poll.start_time)
            let start = moment(start_date + 'T' + start_time)
            let end_date = app.normalizeDate(poll.end_date)
            let end_time = app.normalizeTime(poll.end_time)
            let end = moment(end_date + 'T' + end_time)
            if(dna.type !== 'SECRET'){
              var visible = moment().isAfter(start)
              if(visible === true){
                var next = moment().isBefore(end)
                if(next === true){
                  app.activePolls.push(polls[i])
                } else {
                  app.prevPolls.push(polls[i])
                }
              } else {
                  app.nextPolls.push(polls[i])
              }
            }else{
              if(authorized !== undefined && authorized.length > 0){
                app.secretPolls.push(polls[i])
              }
            }
          }
        }
        app.isLoading = false
        app.searchingParticipated = true
        for (let i=0; i < polls.length; i++){
          let dna = polls[i].data.dna
          await app.checkIfVoted(polls[i].address, polls[i], dna)
        }
        app.searchingParticipated = false
      }
    }
  }
</script>