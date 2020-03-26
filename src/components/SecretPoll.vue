<template>
    <div class="card">
        <div class="card-content">
            <div class="media">
                <div class="media-left">
                    <figure class="image is-48x48">
                        <v-gravatar :email="poll.data.dna.owner" />
                    </figure>
                </div>
                <div class="media-content" v-if="!isDecrypted">
                    <p class="title is-4">Published at</p>
                    <p class="subtitle is-6">{{ poll.address }}</p>
                </div>
                <div class="media-content" v-if="isDecrypted">
                    <p class="title is-4">{{ decrypted.name }}</p>
                    <p class="subtitle is-6">{{ poll.address }}</p>
                </div>
            </div>
            <div v-if="poll.data.owner !== address">
                <div v-if="!isJoined && poll.data.dna.owner !== address && !hasRequested && poll.data.dna.votetype === 'SECRET'">
                    <b-button v-on:click="joinRequest()" type="is-primary" class="float-btn">Join request</b-button>
                </div>
                <div v-if="!isJoined && hasRequested && poll.data.dna.votetype === 'SECRET'">
                    <div class="float-btn" style="margin-top:-10px">Wait for card.</div>
                </div>
                <div v-if="isJoined && poll.data.dna.owner !== address">
                    <b-button type="is-success" v-on:click="decryptPoll()" class="float-btn">Enter</b-button>
                </div>
                <div v-if="poll.data.dna.votetype === 'PUBLIC' && poll.data.dna.owner !== address">
                    <b-button type="is-success" v-on:click="decryptPoll()" class="float-btn">Enter</b-button>
                </div>
                <div v-if="isEnded">
                    <a :href="'/#/results/' + poll.uuid"><b-button type="is-primary" class="float-btn">Show results</b-button></a>
                </div>
            </div>
            <div v-if="poll.data.dna.owner === address">
                <b-button v-if="!isDecrypted" v-on:click="decryptPoll()" type="is-primary" class="float-btn">Manage</b-button>
            </div>
        </div>
    </div>
</template>
<style scoped>
    .card{
        margin-bottom:30px;
    }
    .float-btn{
        position:absolute; top: 50%; right:40px; margin-top:-17.5px;
    }
    .card .media:not(:last-child){
        margin-bottom:0
    }
</style>
<script>
    const ScryptaCore = require('@scrypta/core')
    const moment = require('moment')
    
    export default {
        name: 'secretpoll',
        props: ['poll','address'],
        data() {
            return {
                scrypta: new ScryptaCore(true),
                isDecrypted: false,
                decrypted: {},
                isJoined: false,
                isEnded: false,
                hasRequested: false
            }
        },
        mounted() {
            const app = this
            app.checkJoinPoll()
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
                        let decrypted = await app.scrypta.decryptData(app.poll.data.poll, password)
                        if(decrypted !== false){
                            app.$buefy.toast.open({
                                message: 'Decrypted correctly!',
                                type: 'is-success'
                            })
                            app.isDecrypted = true
                            app.decrypted = JSON.parse(decrypted)
                            app.isEnded = moment().isAfter(decrypted.start_date + ' ' + decrypted.start_time)
                            localStorage.setItem('pollPwD', password)
                            if(app.address === app.poll.data.dna.owner){
                                window.location = '/#/manage/' + app.poll.uuid
                            }else{
                                window.location = '/#/poll/' + app.poll.uuid
                            }
                        }else{
                            app.$buefy.toast.open({
                                message: 'Wrong passphrase!',
                                type: 'is-danger'
                            })
                        }
                    }
                })
            },
            async checkJoinPoll(){
                const app = this
                let identity = await app.scrypta.returnIdentity(app.address)
                app.wallet = identity
                let authorizedCount = 0
                let votesCount = 0
                app.scrypta.post('/received',
                    { address: app.poll.address })
                .then(function (response) {
                    var received = response.data
                    var found = false
                    for(var i=0; i < received.length; i++){
                        var tx = received[i]
                        var exp = tx.data.split(':')
                        if(exp[3] !== undefined && exp[2] === app.address && exp[1] === '//AUTH' && tx.sender === app.poll.data.dna.owner){
                            found = true
                            authorizedCount++
                        }
                        if(exp[1] === '//AUTHREQUEST' && tx.sender === app.address){
                            app.hasRequested = true
                        }
                        if(exp[0] === 'poll' && exp[1] === '//VOTE'){
                            votesCount++
                        }
                        if(authorizedCount === votesCount && authorizedCount > 0 && votesCount > 0 && app.poll.data.dna.type !== 'PUBLIC'){
                            app.isEnded = true
                        }
                    }
                    if(found === true){
                        app.isJoined = true
                    }
                    return found
                })
            },
            async joinRequest(){
                const app = this
                if(app.isJoined === false){
                    let balance = await app.scrypta.get('/balance/' + app.address)
                    if(balance.balance > 0.001){
                        app.$buefy.dialog.prompt({
                            message: `Enter wallet password`,
                            inputAttrs: {
                                type: 'password'
                            },
                            trapFocus: true,
                            onConfirm: async (password) => {
                                let walletstore = app.wallet.wallet
                                let key = await app.scrypta.readKey(password,walletstore)
                                let identity = await app.scrypta.returnIdentity(app.address)

                                if(key !== false){
                                    app.isUploading = true
                                    let send = await app.scrypta.post('/send',{
                                        from: app.address,
                                        to: app.poll.address,
                                        amount: 0.0001,
                                        private_key: key.prv,
                                        message: 'poll://AUTHREQUEST:' + identity.rsa.pub
                                    })

                                    if(send.data.txid !== undefined && send.data.txid !== null && send.data.txid.length === 64){  
                                        app.$buefy.toast.open({
                                            message: 'Request sent correctly, if the owner send the request you\'ll be able to enter and vote!',
                                            type: 'is-success'
                                        })
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
                    }else{
                        app.$buefy.toast.open({
                            message: 'You need at least 0.001 LYRA to make the request!',
                            type: 'is-danger'
                        })
                    }
                }else{
                    app.$buefy.toast.open({
                        message: 'You\'ve joined yet!',
                        type: 'is-danger'
                    })
                }
            }
        }
    }
</script>
