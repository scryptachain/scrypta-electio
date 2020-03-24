<template>
  <div class="main text-left">
    <div class="container">
        <h1>Create new poll</h1>
        <hr>
        <div class="text-left">
          <div class="columns">
            <div class="column">
              <b-field label="Poll Name">
                  <b-input v-model="pollName"></b-input>
              </b-field>
            </div>
            <div class="column">
              <b-field label="Poll Visibility">
                <b-select style="width:100%" v-model="pollType" placeholder="Select a type of visibility">
                    <option
                        v-for="option in types"
                        :value="option"
                        :key="option">
                        {{ option }}
                    </option>
                </b-select>
              </b-field>
            </div>
          </div>
          <b-field label="Secret Passphrase" v-if="pollType === 'SECRET'">
              <b-input v-model="pollSecretKey" placeholder="Please choose a really strong password"></b-input>
          </b-field>
          <div class="columns">
            <div class="column">
              <b-field label="Start date">
                <b-datepicker
                    placeholder="Click to select a date"
                    v-model="pollStartDate"></b-datepicker>
              </b-field>
            </div>
            <div class="column">
              <b-field label="Start time">
                <b-timepicker
                    v-model="pollStartTime"
                    placeholder="Click to select a time"
                    :hour-format="'24'">
                </b-timepicker>
              </b-field>
            </div>
          </div>
          <div class="columns">
            <div class="column">
              <b-field label="End date">
                  <b-datepicker
                    placeholder="Click to select a date"
                    v-model="pollEndDate"></b-datepicker>
              </b-field>
            </div>
            <div class="column">
              <b-field label="End time">
                <b-timepicker
                    v-model="pollEndTime"
                    placeholder="Click to select a time"
                    :hour-format="'24'">
                </b-timepicker>
              </b-field>
            </div>
          </div>
          <b-field label="Question">
              <b-input v-model="pollQuestion" type="textarea"></b-input>
          </b-field>
          <div class="text-left">
            <div class="label">
              Answers
              <b-button v-on:click="addAnswer()" style="float:right; margin-top:-2px" size="is-small" type="is-primary">+</b-button>
            </div>
            <ul style="list-style:none; padding:0">
              <li v-for="(item, index) in pollAnswers" :key="index" style="position:relative; margin-bottom:2px;">
                <b-input v-model="item.answer" placeholder="Write an answer"></b-input>
                <b-button size="is-small" type="is-primary" style="float:right; margin-top:-32px; margin-right:4px;" v-on:click="removeAnswer(index)">Delete</b-button>
              </li>
            </ul>
          </div>
          <br>
          <div class="text-left" v-if="pollType === 'PUBLIC'">
            <b-message title="Please pay attention" type="is-danger" aria-close-label="Close message">
              This poll will be PUBLIC, anyone will see it in the platform and can send a vote.
            </b-message>
          </div>
          <div class="text-left" v-if="pollType === 'AUTHORIZED'">
            <b-message title="Please pay attention" type="is-danger" aria-close-label="Close message">
              This poll will be PUBLIC but you will authorize every account before it can send the vote.<br>
              You can even pre-authorize the accounts, if you're doing that please make double checks and include anyone because no one will be able to request an authorization later.
            </b-message>
          </div>
          <div class="text-left" v-if="pollType === 'SECRET'">
            <b-message title="Please pay attention" type="is-danger" aria-close-label="Close message">
              This poll will be PRIVATE and ENCRYPTED on the blockchain and you have to pre-authorize the addresses.
            </b-message>
          </div>
          <div class="text-left" v-if="pollType === 'AUTHORIZED' || pollType === 'SECRET'">
            <br>
            <div class="label">
              Pre-Authorized Addresses <i style="font-size:12px" v-if="pollType === 'AUTHORIZED'">(No one will be able to request authorizations later)</i>
              <b-button v-on:click="addAuthorized()" style="float:right; margin-top:-2px" size="is-small" type="is-primary">+</b-button>
            </div>
            <ul style="list-style:none; padding:0">
              <li v-for="(item, index) in pollPreAuthorized" :key="index" style="position:relative; margin-bottom:2px;">
                <b-input v-model="item.address" placeholder="Write a valid Lyra account"></b-input>
                <b-button size="is-small" type="is-primary" style="float:right; margin-top:-32px; margin-right:4px;" v-on:click="removeAuthorized(index)">Delete</b-button>
              </li>
            </ul>
          </div>
      </div>
      <div class="my-2 text-left" v-if="!isUploading && !isChecking">
        <b-button style="margin-top:10px; width:100%" v-on:click="createPoll" size="is-big" type="is-primary">CREATE POLL NOW</b-button>
      </div>
      <div class="my-2 text-center" v-if="isChecking">
        <br>
        Checking preauthorized addresses, please wait..
      </div>
      <div class="my-2 text-center" v-if="isUploading">
        <br>
        Creating poll, please wait..
      </div>
    </div>
  </div>
</template>

<script>
  const ScryptaCore = require('@scrypta/core')

  export default {
    name: 'Create',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        isUploading: false,
        isChecking: false,
        address: '',
        wallet: '',
        pollAddress: '',
        pollPubKey: '',
        pollName: '',
        pollQuestion: "",
        pollType: "PUBLIC",
        pollSecretKey: '',
        types: ["PUBLIC","AUTHORIZED","SECRET"],
        pollStartDate: new Date(),
        pollStartTime: new Date(),
        pollEndDate: new Date(),
        pollEndTime: new Date(),
        pollAnswers: [
          { answer: '' },
          { answer: '' }
        ],
        pollPreAuthorized: [
          { address: '' },
          { address: '' }
        ]
      }
    },
    async mounted() {
      const app = this
      app.wallet = await app.scrypta.returnDefaultIdentity()
      let SIDS = app.wallet.split(':')
      app.address = SIDS[0]
      let identity = await app.scrypta.returnIdentity(app.address)
      app.wallet = identity
      var date = new Date();
      date.setDate(date.getDate() + 1);
      app.pollEndDate = date
    },
    methods: {
      addAnswer(){
        this.pollAnswers.push({
          answer: ""
        });
      },
      removeAnswer(index){
        const app = this
        if(app.pollAnswers.length > 2){
          var newAnswersArray = [] 
          for(var i = 0; i < app.pollAnswers.length; i++){
            if(i !== index){
              newAnswersArray.push(app.pollAnswers[i])
            }
          }
          app.pollAnswers = newAnswersArray
        }
      },
      addAuthorized(){
        this.pollPreAuthorized.push({
          address: ""
        });
      },
      removeAuthorized(index){
        const app = this
        if(app.pollPreAuthorized.length > 2){
          var newAuthorizedArray = [] 
          for(var i = 0; i < app.pollPreAuthorized.length; i++){
            if(i !== index){
              newAuthorizedArray.push(app.pollPreAuthorized[i])
            }
          }
          app.pollPreAuthorized = newAuthorizedArray
        }
      },
      async createPoll(){
        const app = this
        let valid = true
        if(app.pollPreAuthorized.length > 0){
          app.isChecking = true
          let validAddresses = []
          for(let x in app.pollPreAuthorized){
            let address = app.pollPreAuthorized[x]
            if(validAddresses.indexOf(address.address) === -1){
              if(address.address !== ''){
                let check = await app.scrypta.get('/validate/' + address.address)
                if(check.data.isvalid === false){
                  valid = false
                  app.$buefy.toast.open({
                      message: address.address + ' is an invalid address!',
                      type: 'is-danger'
                  })
                }else{
                  valid = false
                  app.$buefy.toast.open({
                      message: 'This is an empty address!',
                      type: 'is-danger'
                  })
                }
              }else{
                validAddresses.push(address)
              }
            }
          }
          app.pollPreAuthorized = validAddresses
          app.isChecking = false
        }
        if(app.pollType === 'SECRET' && app.pollPreAuthorized.length === 0){
          valid = false
          app.$buefy.toast.open({
              message: 'You must include autorhized addresses!',
              type: 'is-danger'
          })
        }
        if(valid && app.pollName !== '' && app.pollStartDate !== '' && app.pollStartTime !== '' && app.pollEndDate !== '' && app.pollEndTime !== '' && app.pollQuestion !== '' && app.pollAnswers.length > 0 && app.isUploading === false){
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
                var randomPassword = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                for (var i = 0; i < 25; i++){
                  randomPassword += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                var pollPrivateKey
                var pollPubKey
                let balance = await app.scrypta.get('/balance/' + app.address)
                let minamount = 0.001
                let autorizations = 0.002 * app.pollPreAuthorized.length
                minamount += autorizations
                if(balance.balance > minamount){
                  app.scrypta.createAddress(randomPassword,false).then(async function (response) {
                    app.pollAddress = response.pub
                    pollPubKey = response.key
                    pollPrivateKey = response.prv
                    
                    let send = await app.scrypta.post('/send',{
                      from: app.address,
                      to: response.pub,
                      amount: minamount,
                      private_key: key.prv
                    })

                    if(send.data.txid !== undefined && send.data.txid !== null && send.data.txid.length === 64){  
                      let startDate = app.pollStartDate.getFullYear() + '-' + app.pollStartDate.getMonth() + '-' + app.pollStartDate.getDate()
                      let endDate = app.pollEndDate.getFullYear() + '-' + app.pollEndDate.getMonth() + '-' + app.pollEndDate.getDate()
                      let startTime = app.pollStartTime.getHours() + ':' + app.pollStartDate.getMinutes()
                      let endTime = app.pollEndTime.getHours() + ':' + app.pollEndTime.getMinutes()
                      
                      let pollPrivateKeyEnc = await app.scrypta.cryptData(pollPrivateKey, key.prv)

                      var pollData = {
                        dna: {
                          pubkey: pollPubKey,
                          privkey: pollPrivateKeyEnc,
                          owner: app.address,
                          type: app.pollType
                        },
                        poll: {
                          name: app.pollName,
                          start_date: startDate,
                          start_time: startTime,
                          end_date: endDate,
                          end_time: endTime,
                          question: app.pollQuestion,
                          answers: app.pollAnswers
                        },
                        authorized: app.pollPreAuthorized
                      };

                      var dataToWrite = pollData
                      if(app.pollType === 'SECRET'){
                        let encrypted = await app.scrypta.cryptData(JSON.stringify(pollData.poll), app.pollSecretKey)
                        dataToWrite.poll = encrypted
                      }
                      
                      dataToWrite = JSON.stringify(dataToWrite)

                      let success = false
                      while(success === false){
                        let writeResponse = await app.scrypta.post('/write', 
                        {
                          dapp_address: app.pollAddress,
                          private_key: pollPrivateKey,
                          protocol: "poll://",
                          data: dataToWrite
                        })
                        if(writeResponse.success !== false){
                          success = true
                          app.$buefy.toast.open({
                            message: 'Poll published, it will be ready soon!',
                            type: 'is-success'
                          })
                          setTimeout(function(){
                            window.location = '/#/history'
                          },500)
                        }
                      }
                    }else{
                      app.isUploading = false
                      app.$buefy.toast.open({
                          message: "Something goes wrong, please retry.",
                          type: 'is-danger'
                      })
                    }
                  })
                }else{
                  app.isUploading = false
                  app.$buefy.toast.open({
                      message: "You need at least " + minamount + " LYRA, you have " + balance.balance + " LYRA!",
                      type: 'is-danger'
                  })
                }
              }else{
                app.$buefy.toast.open({
                    message: 'Wrong password!',
                    type: 'is-danger'
                })
              }
            }
          })
        }else{
          if(valid){
            app.$buefy.toast.open({
                message: 'Write all the required fields first!',
                type: 'is-danger'
            })
          }
        }
      }
    }
  }
</script>