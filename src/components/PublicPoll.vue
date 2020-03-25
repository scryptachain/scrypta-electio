<template>
    <div class="card">
        <div class="card-content">
            <div class="media">
                <div class="media-left">
                    <figure class="image is-48x48">
                        <v-gravatar :email="poll.data.dna.owner" />
                    </figure>
                </div>
                <div class="media-content">
                    <p class="title is-4">{{ poll.data.poll.name }}</p>
                    <p class="subtitle is-6">
                        from {{ poll.data.poll.start_date }} {{ poll.data.poll.start_time }}:00
                        till {{ poll.data.poll.end_date }} {{ poll.data.poll.end_time }}:00
                    </p>
                </div>
            </div>
            <div class="content">
                <div v-if="poll.data.owner !== address">
                    <div v-if="!isJoined && poll.data.dna.owner !== address && poll.data.dna.type === 'AUTHORIZED'">
                        <b-button v-on:click="joinRequest()" type="is-primary" class="float-btn">Join request</b-button>
                    </div>
                    <div v-if="(isJoined || poll.data.dna.type === 'PUBLIC') && poll.data.dna.owner !== address">
                        <a :href="'/#/join/' + poll.uuid"><b-button type="is-success" class="float-btn">Enter</b-button></a>
                    </div>
                    <div v-if="poll.data.dna.owner === address && !isEnded">
                        <a :href="'/#/manage/' + poll.uuid"><b-button type="is-primary" class="float-btn">Manage</b-button></a>
                    </div>
                    <div v-if="isEnded">
                        <a :href="'/#/results/' + poll.uuid"><b-button type="is-primary" class="float-btn">Show results</b-button></a>
                    </div>
                </div>
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
    
    export default {
        name: 'publicpoll',
        props: ['poll','address'],
        data() {
            return {
                scrypta: new ScryptaCore(true),
                isJoined: false,
                isEnded: false,
                wallet: {}
            }
        },
        mounted(){
            const app = this
            app.checkJoinPoll()
        },
        methods: {
            async checkJoinPoll(){
                const app = this
                let identity = await app.scrypta.returnIdentity(app.address)
                app.wallet = identity
                app.scrypta.post('/received',
                { address: app.poll.address })
                .then(function (response) {
                    var received = response.data
                    var found = false
                    for(var i=0; i < received.length; i++){
                        var tx = received[i]
                        if(tx.sender === app.address){
                            found = true
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