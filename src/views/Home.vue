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
      <img style="margin: 30px 0 20px 0" src="../assets/logo.png"><br>
      <p>You're now logged as<br><b>{{ public_address }}</b></p>

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
          app.checkBalance()
        }
      },
      checkUser(){
        if(this.scrypta.keyExsist()){
          this.$emit('onFoundUser', this.scrypta.keyExsist(), this.scrypta.RAWsAPIKey)
          this.public_address = this.scrypta.PubAddress
          this.encrypted_wallet = this.scrypta.RAWsAPIKey
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
      checkBalance(){
        var app = this
        if(app.public_address !== ''){
          app.axios.post('https://' + app.connected + '/getbalance', {
                address: app.public_address
              })
              .then(function (response) {
                app.address_balance = response.data.data + ' LYRA'
              })
              .catch(function () {
                alert("Seems there's a problem, please retry or change node!")
              });
        }
      },
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
      importShow: false
    }
  }
}
</script>

<style>
  .node-badge{
    position:fixed; bottom:-3px; font-size:10px; padding:8px; right:10px; z-index:9999;
  }
</style>