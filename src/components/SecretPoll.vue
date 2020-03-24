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
            <div class="content" v-if="isDecrypted">
                <div v-if="poll.data.owner !== address">
                    <div v-if="!isJoined && poll.data.dna.owner !== address">
                        <b-button v-on:click="selectJoinPoll(poll)" type="is-primary" class="float-btn">Join request</b-button>
                    </div>
                    <div v-if="isJoined && poll.data.dna.owner !== address">
                        <b-button v-on:click="openSearchCard(poll)" type="is-success" class="float-btn">Enter</b-button>
                    </div>
                    <div v-if="poll.data.dna.owner === address && !isEnded">
                        <a :href="'/#/manage/' + poll.uuid"><b-button type="is-primary" class="float-btn">Manage</b-button></a>
                    </div>
                    <div v-if="isEnded">
                        <a :href="'/#/results/' + poll.uuid"><b-button type="is-primary" class="float-btn">Show results</b-button></a>
                    </div>
                </div>
            </div>
            <b-button v-if="!isDecrypted" v-on:click="decryptPoll()" type="is-primary" class="float-btn">Manage</b-button>
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
                isEnded: false
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
                        let decrypted = await app.scrypta.decryptData(app.poll.data.poll, password)
                        if(decrypted !== false){
                            app.$buefy.toast.open({
                                message: 'Decrypted correctly!',
                                type: 'is-success'
                            })
                            app.isDecrypted = true
                            app.decrypted = JSON.parse(decrypted)
                            app.isEnded = moment().isAfter(decrypted.start_date + ' ' + decrypted.start_time)
                            if(app.address === app.poll.data.dna.owner){
                                localStorage.setItem('pollPwD', password)
                                window.location = '/#/manage/' + app.poll.uuid
                            }
                        }else{
                            app.$buefy.toast.open({
                                message: 'Wrong passphrase!',
                                type: 'is-danger'
                            })
                        }
                    }
                })
            }
        }
    }
</script>
