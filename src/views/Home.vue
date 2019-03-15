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
        <p>You're now logged as<br><b>{{ public_address }}</b> ({{ address_balance }} LYRA)</p>
        <div class="container" v-if="!votingShow && !manageShow && !votedShow">
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
                <b-card 
                  v-for="(poll, index) in activePolls" :key="index"
                  :title="poll.refID"
                  tag="article"
                  style="max-width: 20rem; text-align: center; margin-top:15px"
                >
                  <b-card-text class="text-center">
                    <span style="font-size:12px">Published at</span><br>
                    <b style="font-size:11px">{{ poll.address }}</b><br>
                    <i>Start: {{ poll.data.start_date }} at {{ poll.data.start_time }}</i><br>
                    <i>End: {{ poll.data.end_date }} at {{ poll.data.end_time }}</i><br>
                    <div v-if="poll.data.owner !== public_address">
                      <div v-if="joinedPolls.indexOf(poll.address) < 0">
                        <b-button v-on:click="selectJoinPoll(poll)" variant="primary" style="margin-top:10px">Join request</b-button>
                      </div>
                      <div v-if="joinedPolls.indexOf(poll.address) >= 0">
                        <b-button v-on:click="openSearchCard(poll)" variant="success" style="margin-top:10px">Enter</b-button>
                      </div>
                    </div>
                    <div v-if="poll.data.owner === public_address">
                      <b-button v-on:click="managePoll(poll)" variant="primary" style="margin-top:10px">Manage</b-button>
                    </div>
                  </b-card-text>
                </b-card>
                <b-modal id="voteModal" ref="voteModalRef" hide-footer title="Enter vote">
                <div class="my-2 text-center">
                  <p>
                    You're unlocking your wallet in order to search for your voting card.<br>
                    If the owner have authorized your account you'll be able to vote.<br>
                    If you voted yet you'll be able to see and verify your vote.
                  </p>
                  <b-form-input v-model="unlockPwd" class="text-center" type="password" placeholder="Enter address password first."></b-form-input><br>
                  <b-button v-if="connected" v-on:click="selectVotePoll()" variant="success">Search</b-button>
                </div>
              </b-modal>
              </div><!-- active-polls -->
              <div v-if="nextPolls.length > 0" style="margin-top:30px">
                <h3>
                  Upcoming Polls
                </h3>
                <b-card 
                  v-for="(poll, index) in nextPolls" :key="index"
                  :title="poll.refID"
                  tag="article"
                  style="max-width: 20rem; text-align: center; margin-top:15px"
                >
                  <b-card-text class="text-center">
                    <span style="font-size:12px">Published at</span><br>
                    <b style="font-size:11px">{{ poll.address }}</b><br>
                    <i>Start: {{ poll.data.start_date }} at {{ poll.data.start_time }}</i><br>
                    <i>End: {{ poll.data.end_date }} at {{ poll.data.end_time }}</i><br>
                    <div v-if="poll.data.owner !== public_address">
                      <b-button v-on:click="selectJoinPoll(poll)" variant="primary" style="margin-top:10px">Join request</b-button>
                    </div>
                    <div v-if="poll.data.owner === public_address">
                      <b-button v-on:click="managePoll(poll)" variant="primary" style="margin-top:10px">Manage</b-button>
                    </div>
                  </b-card-text>
                </b-card>
              </div><!-- upcoming-polls -->
              <b-modal id="joinModal" ref="joinModalRef" hide-footer title="Join poll">
                <div class="my-2 text-center">
                  <p>
                    By joining <b>"{{ selectedPoll.refID }}"</b> you will send a request transaction to <b>{{ selectedPoll.address }}</b> (the poll itself) and you will be authorized to participate.<br><br>
                    Your identity and your vote can't be linked, so vote sincerely.
                  </p>
                  <b-form-input v-model="unlockPwd" class="text-center" type="password" placeholder="Enter address password first."></b-form-input><br>
                  <b-button v-if="connected" v-on:click="joinPoll()" variant="success">Join</b-button>
                </div>
              </b-modal>
            </div>
          </div>
        </div> <!-- main-page -->
        <div class="container" v-if="votingShow">
          <div class="row">
            <div class="col-sm-12 text-left" style="border-top:1px solid #ccc; padding-top:15px">
              <h3>
                {{ selectedPoll.data.question }}
                <b-button v-on:click="votingShow = false" style="float:right" variant="success">Go back</b-button>
              </h3>
              <div v-for="(answer, index) in selectedPoll.data.answers" v-on:click="selectVote(index)" class="answer" :key="index">
                {{ index }}.
                {{ answer.answer }}
                <div v-if="vote === index" style="position:absolute; top:10px; font-weight:bold; right:15px;">X</div>
              </div>
              <div class="text-center">
                <b-button v-if="!isVoting" v-on:click="submitVote()" variant="success">SUBMIT VOTE NOW</b-button>
                <div v-if="isVoting">Voting now, please wait</div>
              </div>
            </div>
          </div>
        </div> <!-- voting-page -->
        <div class="container" v-if="votedShow">
          <div class="row">
            <div class="col-sm-12 text-left" style="border-top:1px solid #ccc; padding-top:15px">
              <h3>
                {{ selectedPoll.data.question }}
                <b-button v-on:click="votedShow = false" style="float:right" variant="success">Go back</b-button>
              </h3>
              <div v-for="(answer, index) in selectedPoll.data.answers" class="answer" :key="index">
                {{ index }}.
                {{ answer.answer }}
                <div v-if="voted == index" style="position:absolute; top:10px; font-weight:bold; right:15px;">X</div>
              </div>
              <h3>You voted yet, you can verify your vote in this transaction:<br><a :href="votelink" style="font-size:13px" target="_blank">{{votelink}}</a></h3>
            </div>
          </div>
        </div> <!-- voting-page -->
        <div class="container" v-if="manageShow">
          <div class="row">
            <div class="col-sm-12 text-left" style="border-top:1px solid #ccc; padding-top:15px">
              <h3>
                Manage {{ selectedPoll.refID }}
                <b-button v-on:click="votingShow = false" style="float:right" variant="success">Go back</b-button>
              </h3>
            </div>
            <div class="col-sm-12 text-left">
              <h5>
                Authorize users
              </h5>
              <div v-if="requestedCards.length === 0">
                No one is asking for a card...
              </div>
              <div v-for="(card, index) in requestedCards" :key="index" style="border:1px solid #ccc; border-radius:5px; padding:10px 0 10px 10px">
                {{ card }}
                <b-button v-on:click="showAuthorizeCard(card)" style="float:right; font-size: 12px;padding: 4px 10px;margin-right: 10px;margin-top: -2px;" variant="success">Authorize</b-button>
              </div>
              <b-modal id="authModal" ref="authModalRef" hide-footer title="Join poll">
                <div class="my-2 text-center">
                  <p>
                    You're creating a brand new address and encrypting it with the public RSA of the user.<br> 
                    You're sending even 0.002 LYRA from your balance as voting card, this address will use this funds for making the vote.
                  </p>
                  <b-form-input v-model="unlockPwd" class="text-center" type="password" placeholder="Enter address password first."></b-form-input><br>
                  <b-button v-if="connected" v-on:click="authorizeCard()" variant="success">Authorize</b-button>
                </div>
              </b-modal>
            </div>
            <div class="col-sm-12 text-left" style="margin-top:20px; padding-top:20px; border-top:1px solid #ccc">
              <h5>
                Votes
              </h5>
              {{ votes }}
              //TODO: CREATE A GRAPH AND TABLE FOR VOTES
            </div>
          </div>
        </div> <!-- voting-page -->
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
        </b-modal><!-- create-modal-->
      </div>
      <div v-if="wallet_backup === 'NO' || !wallet_backup">
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
  .card{
    float:left;
    width: 20rem!important;
    margin: 0 1rem;
  }
  .answer{
    font-size:24px; 
    padding:10px; 
    border:1px solid #ccc; 
    border-radius:5px; 
    margin-bottom:15px;
    position:relative;
  }
  .answer:hover, .answer-selected{
    cursor:pointer;
    background:#efefef;
  }
</style>

<script>
const cookies = require('browser-cookies')
const moment = require('moment')
const NodeRSA = require('node-rsa')

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
          app.checkBalance()
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
            var api_secret = response.api_secret
            var pub = response.pub
            app.axios.post('https://' + app.connected + '/init', {
                address: pub,
                api_secret: api_secret
              })
              .then(function () {
                cookies.set('wallet_backup', 'NO');
                location.reload();
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
      checkBalance(){
        var app = this
        if(app.public_address !== ''){
          app.axios.post('https://' + app.connected + '/getbalance', {
              address: app.public_address
            })
            .then(function (response) {
              app.address_balance = response.data.data
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
          var pollPubKey
          
          app.scrypta.createAddress(randpass,false).then(function (response) {

            app.pollAddress = response.pub
            pollPubKey = response.key
            pollPrivateKey = response.prv
            
            app.axios.post('https://' + app.connected + '/init', {
                address: response.pub,
                api_secret: response.api_secret
              })
              .then(function () {
                var pollData = {
                  name: app.pollName,
                  pubkey: pollPubKey,
                  privkey: pollPrivateKey,
                  owner: app.public_address,
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
                    location.reload()
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
      },
      checkJoinPoll(poll){
        const app = this
        app.axios.post('https://' + app.connected + '/received',
          { 
            address: poll.address
          })
          .then(function (response) {
            var received = response.data.data
            var found = false
            for(var i=0; i < received.length; i++){
              var tx = received[i]
              if(tx.sender === app.public_address){
                found = true
              }
            }
            if(found === true){
              app.joinedPolls.push(poll.address)
            }
            return found
          })
      },
      selectJoinPoll(poll){
        const app = this
        app.selectedPoll = poll
        app.axios.post('https://' + app.connected + '/received',
          { 
            address: app.selectedPoll.address
          })
          .then(function (response) {
            var received = response.data.data
            var found = false
            for(var i=0; i < received.length; i++){
              var tx = received[i]
              if(tx.sender === app.public_address){
                found = true
              }
            }
            if(found === false){
              app.$refs.joinModalRef.show()
            }else{
              alert('You already joined this poll!')
            }
          })
      },
      joinPoll(){
        const app = this
        if(app.selectedPoll.address !== null && app.isJoining === false){
           app.scrypta.readKey(this.unlockPwd).then(function (response) {
            if(response !== false){
              var addrPrivKey = response.prv
              app.isJoining = true
              app.axios.post('https://' + app.connected + '/send',
                { 
                  from: app.public_address, 
                  to: app.selectedPoll.address, 
                  amount: 0.001, 
                  private_key: addrPrivKey,
                  message: 'poll://AUTHREQUEST'
                })
                .then(function () {
                  app.axios.post('https://' + app.connected + '/storage/write',
                  { 
                    dapp: app.selectedPoll.address,
                    collection: 'AUTHREQUEST',
                    data: {
                      "address": app.public_address,
                      "pubkey": response.rsapub
                    }
                  })
                  .then(function () {
                    app.isJoining = false
                    app.$refs.joinModalRef.hide()
                    alert('Request sent!')
                  })
                  .catch(function () {
                    alert("Seems there's a problem, please retry or change node!")
                  })
                })
                .catch(function () {
                  alert("Seems there's a problem, please retry or change node!")
                })
            }else{
              alert('Wrong password!')
            }
          })

        } else {
          alert('Select a poll first!')
        }
      },
      openSearchCard(poll){
        const app = this
        app.selectedPoll = poll
        app.$refs.voteModalRef.show()
      },
      selectVotePoll(){
        const app = this
        app.scrypta.readKey(app.unlockPwd).then(function (response) {
          const key = new NodeRSA(response.rsaprv);
          app.axios.post('https://' + app.connected + '/read',
            { 
              address: app.selectedPoll.address,
              json: true,
              history: false,
              decrypt: false,
              protocol: 'poll://'
            })
            .then(function (response) {
              var txs = response.data.data
              var decrypted = ''
              for(var i=0; i < txs.length; i++){
                var tx = txs[i]
                if(decrypted === ''){
                  try {
                    decrypted = key.decrypt(tx.data, 'utf8');
                  } catch(err){
                    //NOTHING TO DECRYPT
                  }
                }
              }
              if(decrypted.length > 0){
                var votingCard = decrypted.split(',')
                app.votingCard = votingCard
                app.axios.post('https://' + app.connected + '/received',
                  { 
                    address: app.selectedPoll.address
                  })
                  .then(function (response) {
                    var txs = response.data.data
                    var voted = false
                    for(var i=0; i<txs.length; i++){
                      var tx=txs[i]
                      if(tx.sender === app.votingCard[0]){
                        var exp = tx.data.split(':')
                        if(exp[0] === 'poll' && exp[1] === '//VOTE'){
                          app.voted = exp[2]
                          app.votelink = 'https://chainz.cryptoid.info/lyra/tx.dws?' + tx.txid + '.htm'
                          voted = true
                        }
                      }
                    }
                    if(voted === false){
                      app.votingShow = true
                    }else{
                      app.votedShow = true
                    }
                  })
                  .catch(function(){
                    alert("Seems there's a problem, please retry or change node!")
                  })
              }
            })
            .catch(function () {
              alert("Seems there's a problem, please retry or change node!")
            })
        })
      },
      selectVote(index){
        const app = this
        app.vote = index
      },
      submitVote(){
        const app = this
        if (app.vote !== '' && app.isVoting === false){
          app.isVoting = true
          app.axios.post('https://' + app.connected + '/send',
            { 
              from: app.votingCard[0], 
              to: app.selectedPoll.address, 
              amount: 0.001, 
              private_key: app.votingCard[1],
              message: 'poll://VOTE:' + app.vote
            })
            .then(function (response) {
              if(response.data.data.success === true && response.data.data.txid.length > 0){
                alert('Vote submitted correctly!')
                app.votingShow = false
              }else{
                alert('Vote not sent, please reply!')
              }
              app.isVoting = false
            })
            .catch(function () {
              alert("Seems there's a problem, please retry or change node!")
            })
        }else{
          alert('Select an option first!')
        }
      },
      managePoll(poll){
        const app = this
        app.selectedPoll = poll
        app.requestedCards = []
        //SEARCH AUTH REQUESTS
        app.axios.post('https://' + app.connected + '/storage/read',
          { 
            dapp: app.selectedPoll.address,
            collection: 'AUTHREQUEST'
          })
          .then(function (response) {
           app.manageShow = true
           var cards = response.data.data
           for(var i=0; i < cards.length; i++){
             var card = cards[i]
             if(card['data']['address'] && card['data']['pubkey']){
               app.requestedCards.push(card['data']['address'])
               app.authRequests[card['data']['address']] = card
             }
           }
          })
          .catch(function () {
            alert("Seems there's a problem, please retry or change node!")
          })
        //SEARCH VOTES
        app.axios.post('https://' + app.connected + '/received',
          { 
            address: app.selectedPoll.address
          })
          .then(function (response) {
            var txs = response.data.data
            for(var i=0; i<txs.length; i++){
              var tx=txs[i]
              var exp = tx.data.split(':')
              if(exp[0] === 'poll' && exp[1] === '//VOTE'){
                app.voted = exp[2]
                //TODO: CHECK IF FUNDS ARE VOTE CARDS
                if(app.votes[exp[2]]){
                  app.votes[exp[2]] ++
                }else{
                  app.votes[exp[2]] = 1
                }
              }
            }
          })
          .catch(function(){
            alert("Seems there's a problem, please retry or change node!")
          })
      },
      showAuthorizeCard(card){
        const app = this
        app.selectedCard = card
        app.$refs.authModalRef.show()
      },
      authorizeCard(){
        const app = this
        if(app.selectedPoll.address !== null && app.isAuthorizing === false){
           app.scrypta.readKey(this.unlockPwd).then(function (response) {
            if(response !== false){
              app.isAuthorizing = true
              var addrPrivKey = response.prv
              var request = app.authRequests[app.selectedCard]
              var pubkey = request.data.pubkey
              const key = new NodeRSA(pubkey)
              app.scrypta.createAddress(app.createrand(), false).then(function(response){
                var newAddress = response.pub
                var newSecret = response.api_secret
                const encrypted = key.encrypt(response.pub + ',' + response.prv, 'base64')
                app.axios.post('https://' + app.connected + '/init', {
                    address: newAddress,
                    api_secret: newSecret,
                    airdrop: false
                  })
                  .then(function () {
                    app.axios.post('https://' + app.connected + '/send',
                    { 
                      from: app.public_address, 
                      to: newAddress, 
                      amount: 0.002, 
                      private_key: addrPrivKey,
                      message: 'poll://VOTECARD'
                    })
                    .then(function (response) {
                      if(response.data.data.success === true){
                        app.axios.post('https://' + app.connected + '/write',
                          { 
                            dapp_address: app.selectedPoll.address, 
                            encryption: false, 
                            private_key: app.selectedPoll.data.privkey,
                            protocol: 'poll://',
                            data: encrypted
                          })
                          .then(function (response) {
                            if(response.data.data.uuid){
                              app.axios.post('https://' + app.connected + '/storage/remove',
                                { 
                                  uuid: request._id.$oid
                                })
                                .then(function () {
                                  app.isAuthorizing = false
                                  app.authorizedCards.push(app.selectedCard)
                                  app.$refs.authModalRef.hide()
                                  app.managePoll(app.selectedPoll)
                                  alert('Authorization sent!')
                                })
                                .catch(function () {
                                  alert("Seems there's a problem, please retry or change node!")
                                })
                              }else{
                                alert('Transaction not sent, please make sure POLLS have enough funds!')
                              }
                            })
                      } else {
                        alert('Transaction not sent, please make sure have enough funds!')
                      }
                    })
                  })
              })
            }else{
              alert('Wrong password!')
            }
          })

        } else {
          alert('Select a poll first!')
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
      address_balance: '-',
      passwordShow: false,
      importShow: false,
      votingShow: false,
      votedShow: false,
      isUploading: false,
      isVoting: false,
      manageShow: false,
      isJoining: false,
      isObtaining: false,
      isAuthorizing: false,
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
      prevPolls: [],
      selectedPoll: [],
      joinedPolls: [],
      votedPolls: [],
      authRequests: [],
      requestedCards: [],
      authorizedCards: [],
      selectedCard: '',
      votingCard: [],
      vote: '',
      voted: '',
      votelink: '',
      votes: []
    }
  }
}
</script>

<style>
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
</style>