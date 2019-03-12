<template>
  <div class="home">
    <div class="node-badge" v-if="connected">{{ connected }}</div>

    <div v-if="!public_address">
      <img style="margin: 30px 0 20px 0" src="../assets/logo.png"><br>
      <h1>Scrypta Polls System</h1>
      <p>
        This is a public polls system based on Scrypta Blockchain.<br>
        It is intended as an MVP product / case study so use it only for research purposes.
      </p>
      <br>
      <b-button v-if="connected" v-b-modal.loginModal variant="success">Enter the platform</b-button>
      <b-modal id="loginModal" hide-footer title="Enter the platform">
        <div class="my-2 text-center">
          <h4><b>Login</b> with ScryptaID</h4>
          <div style="display:inline-block; width:102px; margin-top:5px">
            <input type="file" class="custom-file-input" @change="loadWalletFromFile">
          </div>
          <br><i>- or -</i><br><br>
          <h4><b>Create</b> a ScryptaID</h4>
          <b-form-input v-model="createPwd" class="text-center" type="password" placeholder="Enter a strong password."></b-form-input>
          <b-form-input v-model="createPwdConfirm" class="text-center" style="margin-bottom:20px" type="password" placeholder="Repeat your password."></b-form-input>
          <b-button v-if="connected" v-on:click="createWallet" variant="success">Create ScryptaID</b-button>
        </div>
      </b-modal>
      <div v-if="!connected">
        Connecting to the first available node..
      </div>
    </div> <!-- public -->

    <div v-if="public_address">
      <div v-if="wallet_backup === 'YES'">
        <img style="margin: 30px 0 20px 0" height="40" src="../assets/logo.png"><br>
        <p>You're now logged as<br><b>{{ public_address }}</b></p>
        <div class="container">
          <div class="row">
            <div class="col-sm-12 text-left" style="border-top:1px solid #ccc; padding-top:15px">
              <h3>
                Active Polls
                <b-button v-b-modal.createModal style="float:right" variant="success">Create new</b-button>
              </h3>
              <div v-if="activePolls.length === 0">
                No polls to show..
              </div>
              <div v-if="activePolls.length > 0">

              </div>
            </div>
          </div>
        </div>
         <b-modal id="createModal" hide-footer title="Create new poll">
          <div class="text-left">
            Poll name:<br>
            <b-form-input v-model="pollName" type="text" placeholder="Poll name"></b-form-input><br>
            <div class="row">
              <div class="col-6">
                Start date:<br>
                <b-form-input v-model="pollStartDate" type="date" placeholder="Start date"></b-form-input>
                At:<br>
                <b-form-input v-model="pollStartTime" type="text" pattern="([01]?[0-9]{1}|2[0-3]{1}):[0-5]{1}[0-9]{1}" placeholder="Start time (HH:mm)"></b-form-input><br>
              </div>
              <div class="col-6">
                End date:<br>
                <b-form-input v-model="pollEndDate" type="date" placeholder="End date"></b-form-input>
                At:<br>
                <b-form-input v-model="pollEndTime" type="text" pattern="([01]?[0-9]{1}|2[0-3]{1}):[0-5]{1}[0-9]{1}" placeholder="End time (HH:mm)"></b-form-input><br>
              </div>
            </div>
            Question:<br>
            <b-form-textarea
              v-model="pollQuestion"
              placeholder="Poll question"
              rows="6"
              max-rows="6"
            /><br>
            <div class="text-left">
              Answers:
              <a href="#" v-on:click="addAnswer()"><v-icon name="plus" style="float:right; cursor:pointer"/></a>
              <br>
              <ul style="list-style:none; padding:0">
                <li v-for="(item, index) in pollAnswers" :key="index" style="position:relative; margin-bottom:2px;">
                  <b-form-input v-model="item.answer" type="text" placeholder="Write an answer"></b-form-input>
                  <a href="#" v-on:click="removeAnswer(index)"><v-icon name="trash" style="position:absolute; top:10px; right:10px"/></a>
                </li>
              </ul>
            </div>
          </div>
          <div class="my-2 text-left" v-if="!isUploading">
            <b-button v-if="connected" style="margin-top:10px; width:100%" v-on:click="createPoll" variant="success">Create</b-button>
          </div>
          <div class="my-2 text-center" v-if="isUploading">
            Creating poll, please wait..
          </div>
        </b-modal>
      </div>
      <div v-if="wallet_backup === 'NO'">
        <img style="margin: 30px 0 20px 0" src="../assets/logo.png"><br>
        <h1>Scrypta Polls System</h1><br><br><br>
        <v-icon name="lock" scale="4"/><br><br>
        <i>You've to make a backup.</i><br>
        Please remind, you are the ONLY responsible for this .sid file or the password associated.<br>
        No one will have a copy or will be able to rescue it, so keep it safe.<br><br>
        <b-button v-if="connected" v-on:click="makeBackup" variant="success">Download it now</b-button>
        <a id="downloadsid" style="display:none"></a>
      </div>
    </div> <!-- platform -->

  </div>
</template>

<style>
  #app{
    text-align: center;
    font-family: 'karmillaregular';
  }
  .custom-file-input {
    color: transparent;
    display: inline-block;
    opacity: 1!important;
  }
  .custom-file-input::-webkit-file-upload-button {
    visibility: hidden;
  }
  .custom-file-input::before {
    content: 'Select .sid file';
    color: black;
    display: inline-block;
    background: -webkit-linear-gradient(top, #f9f9f9, #e3e3e3);
    border: 1px solid #999;
    border-radius: 3px;
    padding: 5px 8px;
    outline: none;
    white-space: nowrap;
    -webkit-user-select: none;
    cursor: pointer;
    text-shadow: 1px 1px #fff;
    font-weight: 700;
    font-size: 10pt;
  }
  .custom-file-input:hover::before {
    border-color: black;
  }
  .custom-file-input:active {
    outline: 0;
  }
  .custom-file-input:active::before {
    background: -webkit-linear-gradient(top, #e3e3e3, #f9f9f9); 
  }
</style>

<script>
const cookies = require('browser-cookies');
const moment = require('moment')

export default {
  name: 'home',
  mounted : function(){
    this.checkIdaNodes()
    this.checkUser()
  },
  methods: {
      checkIdaNodes(){
        var checknodes = this.scrypta.returnNodes()
        const app = this
        for(var i = 0; i < checknodes.length; i++){
          this.axios.get('https://' + checknodes[i] + '/check')
          .then(function (response) {
             app.nodes.push(response.data.name)
             if(i == checknodes.length){
               app.connectToNode()
             }
          });
        }
      },
      connectToNode(){
        var app = this
        if(app.connected == ''){
          app.connected = app.nodes[Math.floor(Math.random()*app.nodes.length)];
          app.connected = 'idanode01.scryptachain.org'
          app.checkBalance(app.public_address)
          app.fetchPolls()
        }
      },
      checkUser(){
        if(this.scrypta.keyExsist()){
          this.$emit('onFoundUser', this.scrypta.keyExsist(), this.scrypta.RAWsAPIKey)
          this.public_address = this.scrypta.PubAddress
          this.encrypted_wallet = this.scrypta.RAWsAPIKey
          this.wallet_backup = cookies.get('wallet_backup');
        }
      },
      openImportWallet(){
        this.importShow = true
      },
      loadWalletFromFile (ev) {
        const file = ev.target.files[0]
        const reader = new FileReader()
        var app = this
        reader.onload = function () {
          var dataKey = reader.result
          app.scrypta.saveKey(dataKey).then(function () {
            setTimeout(function () { location.reload() }, 1000)
          })
        }
        reader.readAsText(file)
      },
      createWallet(){
        var app = this
        if(this.createPwd !== '' && this.createPwdConfirm === this.createPwd){
          app.scrypta.createAddress(this.createPwd,true).then(function (response) {
            app.axios.post('https://' + app.connected + '/init', {
                address: response.pub,
                api_secret: response.api_secret
              })
              .then(function () {
                cookies.set('wallet_backup', 'NO');
                location.reload()
              })
              .catch(function () {
                alert("Seems there's a problem, please retry or change node!")
              });
          })
        }else{
          alert('Insert a password first and validate it!')
        }
      },
      openUnlockWallet(){
        this.passwordShow = true
      },
      unlockWallet(){
        if(this.unlockPwd !== ''){
          var app = this
          app.decrypted_wallet = 'WALLET LOCKED'
          app.scrypta.readKey(this.unlockPwd).then(function (response) {
            if(response !== false){
              app.decrypted_wallet = JSON.stringify(response)
              app.passwordShow = false
            }else{
              alert('Wrong password!')
            }
          })
        }else{
          alert('Write your password first')
        }
      },
      async checkBalance(address){
        var app = this
        if(app.public_address !== ''){
          app.axios.post('https://' + app.connected + '/getbalance', {
              address: address
            })
            .then(function (response) {
              return response.data.data
            });
        }
      },
      makeBackup(){
        var a = document.getElementById("downloadsid");
          var file = new Blob([this.public_address+':'+this.encrypted_wallet], {type: 'sid'});
          a.href = URL.createObjectURL(file);
          a.download = this.public_address+'.sid';
          var clickEvent = new MouseEvent("click", {
              "view": window,
              "bubbles": true,
              "cancelable": false
          });
          a.dispatchEvent(clickEvent);
          cookies.set('wallet_backup', 'YES');
          this.wallet_backup = 'YES'
      },
      fetchPolls(){
        const app = this
        app.axios.post('https://' + app.connected + '/read', {
            protocol: 'poll://',
            json: true,
            history: false,
            decrypt: false
          })
          .then(function (response) {
            var polls = response.data.data
            
            for (var i=0; i < polls.length; i++){
              var poll = polls[i].data
              var visible = moment().isBetween(poll.start_date + ' ' + poll.start_time, poll.end_date + ' ' + poll.start_time)
              if(visible === true){
                app.activePolls.push(polls[i])
              } else {
                var next = moment().isBefore(poll.start_date + ' ' + poll.start_time)
                if(next === true){
                  app.nextPolls.push(polls[i])
                } else {
                  app.prevPolls.push(polls[i])
                }
              }
            }

          });
      },
      createrand() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 25; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
      },
      createPoll(){
        const app = this
        if(app.pollName !== '' && app.pollStartDate !== '' && app.pollStartTime !== '' && app.pollEndDate !== '' && app.pollEndTime !== '' && app.pollQuestion !== '' && app.pollAnswers.length > 0 && app.isUploading === false){
          app.isUploading = true
          var randpass = app.createrand()
          var pollPrivateKey

          app.scrypta.createAddress(randpass,false).then(function (response) {

            app.pollAddress = response.pub
            app.pollPubKey = response.key
            pollPrivateKey = response.prv
            
            app.axios.post('https://' + app.connected + '/init', {
                address: response.pub,
                api_secret: response.api_secret
              })
              .then(function () {
                var pollData = {
                  name: app.pollName,
                  start_date: app.pollStartDate,
                  start_time: app.pollStartTime,
                  end_date: app.pollEndDate,
                  end_time: app.pollEndTime,
                  question: app.pollQuestion,
                  answers: app.pollAnswers
                };
                var dataToWrite = JSON.stringify(pollData);
                var formData = new FormData();
                formData.append("dapp_address", app.pollAddress);
                formData.append("private_key", pollPrivateKey);
                formData.append("encryption", false);
                formData.append("protocol", "poll://");
                formData.append("data", dataToWrite);
                formData.append("refID", app.pollName);
                
                app.axios.post('https://' + app.connected + '/write', formData)
                .then(function (response) {
                  if(response.data.data.txs !== undefined){
                    alert('Poll published, it will be ready soon!')
                    app.$refs.createModal.hide()
                    app.isUploading = false
                    app.pollAddress = ''
                    app.pollPubKey = ''
                    app.pollName = ''
                    app.pollQuestion = ""
                    app.pollStartDate = ''
                    app.pollStartTime = ''
                    app.pollEndDate = ''
                    app.pollEndTime = ''
                    app.pollAnswers = [
                      { answer: '' },
                      { answer: '' }
                    ]
                  }else{
                    alert(app.data.data)
                  }
                })
              })
              .catch(function () {
                alert("Seems there's a problem, please retry or change node!")
              })
          })

        }else{
          alert('Please write the form correctly')
        }
      },
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
      }
  },
  data () {
    return {
      scrypta: window.ScryptaCore,
      axios: window.axios,
      nodes: [],
      connected: '',
      encrypted_wallet: 'NO WALLET',
      decrypted_wallet: 'WALLET LOCKED',
      unlockPwd: '',
      createPwd: '',
      createPwdConfirm: '',
      public_address: '',
      address_balance: 'BALANCE UNKNOWN',
      passwordShow: false,
      importShow: false,
      isUploading: false,
      wallet_backup: '',
      pollAddress: '',
      pollPubKey: '',
      pollName: '',
      pollQuestion: "",
      pollStartDate: '',
      pollStartTime: '',
      pollEndDate: '',
      pollEndTime: '',
      pollAnswers: [
        { answer: '' },
        { answer: '' }
      ],
      activePolls: [],
      nextPolls: [],
      prevPolls: []
    }
  }
}
</script>

<style>
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
</style>