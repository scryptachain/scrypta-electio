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
                  <b>Opened:</b> from {{ poll.start_date }} {{ poll.start_time }}:00 <b>till</b> {{ poll.end_date }} {{ poll.end_time }}:00<br>
                  <b>Type:</b> {{ dna.type }}
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
                  <div v-if="authorized.length > 0">
                    <div class="card" v-for="authorizedaddress in authorized" v-bind:key="authorizedaddress">
                      <div class="card-content">
                        <div class="content">
                          <v-gravatar :email="authorizedaddress" style="width:25px; height:25px; float:left; margin-right:20px;" />
                          {{ authorizedaddress }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="authorized.length === 0">
                    No authorized accounts, please go to "Manage" and start the poll.
                  </div>
                </b-tab-item>

                <b-tab-item label="Manage">
                  <br>
                  <div v-if="dna.type !== 'PUBLIC' && !isStarted">
                    <h3 class="title is-3">Start poll</h3>
                    <div v-if="Object.keys(pubkeys).length > 0">
                      <div v-if="authorized.length === 0">
                        This will send the voting cards to all the selected participants. You will not be able to accept other participants after the start.<br>
                        <div class="card" v-for="requestedcard in requestedCards" v-bind:key="requestedcard">
                          <div class="card-content">
                            <div class="content">
                              <v-gravatar :email="requestedcard" style="width:25px; height:25px; float:left; margin-right:20px;" />
                              {{ requestedcard }}
                              <b-checkbox v-model="accepted[requestedcard]" style="float:right"></b-checkbox>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-if="authorized.length > 0">
                        This will send the voting cards to all pre-authorized participants.
                      </div><br>
                      <b-button v-if="!isStarting" v-on:click="startPoll" type="is-danger" size="is-medium">START NOW</b-button>
                      <div v-if="isStarting"><br>Starting poll, please wait...</div>
                      <br><br>
                    </div>
                    <div v-if="Object.keys(pubkeys).length === 0">
                      No one requested the access, nothing to start now.
                    </div>
                    <hr>
                  </div>
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
  const NodeRSA = require('node-rsa')

  export default {
    name: 'Manage',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        address: '',
        wallet: '',
        pollAddress: '',
        isLoading: true,
        isStarting: false,
        isStarted: false,
        isDecrypted: true,
        poll: {},
        authorized: {},
        dna: {},
        results: {},
        requestedCards: [],
        pubkeys: [],
        accepted: {},
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
                if(send.success !== undefined && send.success === true && send.txid !== null && send.txid.length === 64){  
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
      shuffle(array) {
          for (var i = array.length - 1; i > 0; i--) {
              var j = Math.floor(Math.random() * (i + 1));
              var temp = array[i];
              array[i] = array[j];
              array[j] = temp;
          }
          return array
      },
      async startPoll(){
        const app = this
        if(!app.isStarted){
          let selected = []
          for(let x in app.accepted){
            if(app.accepted[x]){
              selected.push(x)
            }
          }
          if(selected.length > 0){
            app.isStarting = true
            let balance = await app.scrypta.get('/balance/' + app.address)
            let amountneeded = 0.001
            let amountvotingcards = 0.001 * selected.length
            amountneeded += amountvotingcards
            let pubkeys = app.shuffle(app.pubkeys)
            if(balance.balance >= amountneeded){
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
                      let success = true
                      for(let x in selected){
                        let pubkey = ''
                        for(let y in pubkeys){
                          if(pubkeys[y].address === selected[x]){
                            pubkey = pubkeys[y].key
                          }
                        }
                        if(pubkey.length > 0){
                          let newaddress = await app.scrypta.createAddress('000000', false)
                          const rsakey = new NodeRSA(pubkey)
                          let encrypted = rsakey.encrypt(newaddress.pub + ',' + newaddress.prv, 'base64')
                          let sendcard = false
                          let yy = 0
                          while(sendcard === false){
                            let send = await app.scrypta.post('/send',{
                              from: app.address,
                              to: app.pollAddress,
                              amount: 0.0001,
                              private_key: key.prv,
                              message: 'poll://AUTH:' +  selected[x] + ':' + encrypted
                            })
                            if(send.data.txid !== undefined && send.data.txid.length === 64){
                              sendcard = true
                            }
                            if(yy > 19){
                              success = false
                              sendcard = true
                            }
                            yy++
                          }
                        }else{
                          success = false
                        }
                      }
                      if(success === true){
                        let sendstart = false
                        let yy = 0
                        while(sendstart === false){
                          let send = await app.scrypta.post('/send',{
                            from: app.address,
                            to: app.pollAddress,
                            amount: 0.0001,
                            private_key: key.prv,
                            message: 'poll://START'
                          })
                          if(send.data.txid !== undefined && send.data.txid !== null && send.data.txid.length === 64){
                            sendstart = true
                          }
                          if(yy > 19){
                            success = false
                            sendstart = true
                          }
                          yy++
                        }
                        if(success === true){
                          app.$buefy.toast.open({
                            message: 'Poll started correctly, please wait at least 2 minutes!',
                            type: 'is-success'
                          })
                          app.isStarted = true
                        }else{
                          app.$buefy.toast.open({
                            message: 'Something goes wrong!',
                            type: 'is-danger'
                          })
                        }
                      }
                      app.isStarting = false
                    }else{
                      app.isStarting = false
                      app.$buefy.toast.open({
                        message: 'Wrong password!',
                        type: 'is-danger'
                      })
                    }
                  }
              })
            }else{
              app.$buefy.toast.open({
                message: 'You need at least '+ amountneeded +' LYRA, you have ' + balance.balance + ' LYRA!',
                type: 'is-danger'
              })
              app.isStarting = false
            }
          }else{
            app.$buefy.toast.open({
              message: 'You must accept at least 1 address!',
              type: 'is-danger'
            })
            app.isStarting = false
          }
        }else{
          app.$buefy.toast.open({
            message: 'This poll has started yet!',
            type: 'is-danger'
          })
          app.isStarting = false
        }
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
            if(exp[0] === 'poll' && exp[1] === '//START'){
              if(tx.sender === app.dna.owner){
                app.isStarted = true
              }
            }

            if(exp[0] === 'poll' && exp[1] === '//VOTE'){
              app.voted = exp[2]
              if(app.votes[exp[2]]){
                app.votes[exp[2]] ++
              }else{
                app.votes[exp[2]] = 1
              }
            }
            if(exp[0] === 'poll' && exp[1].indexOf('AUTHREQUEST') !== -1 && app.dna.type === 'AUTHORIZED'){
              app.requestedCards.push(tx.sender)
              app.pubkeys.push({
                address: tx.sender,
                key: exp[2]
              })
              app.accepted[tx.sender] = true
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