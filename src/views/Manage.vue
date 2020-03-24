<template>
  <div class="main text-left">
    <div class="container">
        <h1>Manage poll</h1>
        <h3>{{ pollAddress }}</h3>
        <hr>
        <div v-if="isLoading">Loading poll from the blockchain...</div>
        <div v-if="!isLoading && !isDecrypted">
          Please decrypt the poll first...
        </div>
        <div v-if="!isLoading && isDecrypted">
          <section>
            <b-tabs :animated="false">
                <b-tab-item label="Recap">
                  <br>
                  <h3 class="title is-3">{{ poll.name }}</h3>
                  <b>Available from</b> {{ poll.start_date }} {{ poll.start_time }}:00 <b>till</b> {{ poll.end_date }} {{ poll.end_time }}:00
                  <hr>
                  <p>{{ poll.question }}</p>
                  <hr>
                  <h5 class="title is-5">Answers</h5>
                  <ul>
                    <li v-for="answer in poll.answers" disabled size="is-medium" v-bind:key="answer.answer" style="margin: 0 10px;">- {{ answer.answer }}</li>
                  </ul>
                </b-tab-item>

                <b-tab-item v-if="dna.type !== 'PUBLIC'" label="Authorizations">
                  <br>
                  <h3 class="title is-3">Authorized accounts</h3>
                  {{ authorized }}
                  <br><br>
                  <h3 class="title is-3">Authorization requests</h3>
                  {{ authorized }}
                </b-tab-item>

                <b-tab-item label="Manage">
                  <br>
                  <h3 class="title is-3">Invalidate poll</h3>
                  This will delete this poll from the dApp and no one will be able to find or vote inside it, please use it at your own risk.<br><br>
                  <b-button v-on:click="invalidatePoll" type="is-danger" size="is-medium">INVALIDATE</b-button>
                </b-tab-item>

            </b-tabs>
        </section>
        </div>
    </div>
    <b-loading :is-full-page="true" :active.sync="isLoading" :can-cancel="false"></b-loading>
  </div>
</template>

<script>
  const ScryptaCore = require('@scrypta/core')
  const moment = require('moment')

  export default {
    name: 'Manage',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        address: '',
        wallet: '',
        pollAddress: '',
        isLoading: true,
        isDecrypted: true,
        poll: {},
        authorized: {},
        dna: {},
        results: {},
        requestedCards: [],
        votes: []
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
      let response = await app.scrypta.post('/read',{ uuid: app.$route.params.uuid })
      if(response.data[0] !== undefined){
        app.poll = response.data[0].data.poll
        app.dna = response.data[0].data.dna
        app.authorized = response.data[0].data.authorized
        app.pollAddress = response.data[0].address
        if(app.dna.owner === app.address){
          if(app.dna.type === "SECRET"){
            app.isDecrypted = false
            if(localStorage.getItem('pollPwD') !== null && localStorage.getItem('pollPwD') !== ''){
              console.log(localStorage.getItem('pollPwD'))
              let decrypted = await app.scrypta.decryptData(app.poll, localStorage.getItem('pollPwD'))
              localStorage.setItem('pollPwD','')

              if(decrypted !== false){
                app.poll = JSON.parse(decrypted)
                app.isDecrypted = true
                app.fetchStats()
              }else{
                app.decryptPoll()
              }
            }else{
              app.decryptPoll()
            }
          }else{
            app.fetchStats()
          }
        }else{
          window.location = '/#/join/' + app.$route.params.uuid
        }
        app.isLoading = false
      }else{
        app.$buefy.toast.open({
          message: 'Poll not found.',
          type: 'is-danger'
        })
        window.location = '/#/history'
      }
    },
    methods: {
      decryptPoll(){
        const app = this
        app.$buefy.dialog.prompt({
            message: `Enter poll passphrase`,
            inputAttrs: {
                type: 'password'
            },
            trapFocus: true,
            onConfirm: async (password) => {
                const app = this
                let decrypted = await app.scrypta.decryptData(app.poll, password)
                if(decrypted !== false){
                    app.$buefy.toast.open({
                        message: 'Decrypted correctly!',
                        type: 'is-success'
                    })
                    app.isDecrypted = true
                    app.poll = JSON.parse(decrypted)
                    let start = moment(app.poll.start_date + 'T' + app.poll.start_time + ':00')
                    let end = moment(app.poll.end_date + 'T' + app.poll.end_time + ':00')
                    var visible = moment().isAfter(start)
                    if(visible === true){
                      var next = moment().isBefore(end)
                      if(next === true){
                        app.isFuture = true
                      } 
                    } else {
                        app.isPast = true
                    }
                }else{
                    app.$buefy.toast.open({
                        message: 'Wrong passphrase!',
                        type: 'is-danger'
                    })
                    app.decryptPoll()
                }
            }
        })
      },
      invalidatePoll(){
        const app = this
        app.$buefy.dialog.prompt({
            message: `Enter wallet password`,
            inputAttrs: {
                type: 'password'
            },
            trapFocus: true,
            onConfirm: async (password) => {
              let walletstore = app.wallet.wallet
              let key = await app.scrypta.readKey(password,walletstore)
              if(key !== false){
                app.isUploading = true
                let privkey = await app.scrypta.decryptData(app.dna.privkey, key.prv)
                let send = await app.scrypta.post('/invalidate',{
                  uuid: app.$route.params.uuid,
                  dapp_address: app.pollAddress,
                  private_key: privkey
                })
                if(send.success !== undefined && send.success === false && send.txid !== null && send.txid.length === 64){  
                  app.$buefy.toast.open({
                    message: 'Poll ended correctly, will disappear soon!',
                    type: 'is-success'
                  })
                  window.location = '/#/history'
                }else{
                  app.$buefy.toast.open({
                    message: 'Something goes wrong!',
                    type: 'is-danger'
                  })
                }
                app.isUploading = false
              }
            }
        })
      },
      fetchStats(){
        const app = this
        
        app.scrypta.post('/received',
        { 
          address: app.pollAddress
        })
        .then(function (response) {
          var txs = response.data
          for(let i in txs){
            var tx=txs[i]
            var exp = tx.data.split(':')
            if(exp[0] === 'poll' && exp[1] === '//VOTE'){
              app.voted = exp[2]
              if(app.votes[exp[2]]){
                app.votes[exp[2]] ++
              }else{
                app.votes[exp[2]] = 1
              }
            }
            if(exp[0] === 'poll' && exp[1] === '//AUTHREQUEST'){
              app.requestedCards.push(tx.sender)
            }
            if(exp[0] === 'poll' && exp[1] === '//AUTH'){
              if(exp[2] !== undefined && exp[2] !== 'undefined'){
                app.authorized.push(exp[2])
              }
            }
          }
        })
      }
    }
  }
</script>