<template>
  <div id="app">
    <div v-if="!isLogging && !needsRSA && wallet">
      <b-navbar>
        <template slot="brand">
          <b-navbar-item tag="router-link" :to="{ path: '/' }">
            <img src="/logo.png" />
          </b-navbar-item>
        </template>
        <template slot="start">
          <b-navbar-item href="/#/">Home</b-navbar-item>
          <b-navbar-item href="/#/create">Create poll</b-navbar-item>
          <b-navbar-item href="/#/history">My History</b-navbar-item>
        </template>

        <template slot="end">
          <b-navbar-item tag="div">
            <div class="buttons">
              <a v-on:click="logout" class="button is-primary">
                <strong>Logout</strong>
              </a>
            </div>
          </b-navbar-item>
        </template>
      </b-navbar>
      <router-view />
      <hr />Scrypta Electio is an
      <a
        href="https://github.com/scryptachain/scrypta-polls"
        target="_blank"
      >open-source</a> project by
      <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
      <br />
      <br />
    </div>
    <div v-if="needsRSA && wallet">
      <section class="hero">
        <div class="hero-body">
          <div class="container">
            <b-button
              size="is-medium"
              style="position: absolute; top: 0; right: 0;"
              type="is-primary"
              v-on:click="logout"
            >Logout</b-button>
            <img src="/logo.png" width="100" />
            <br />
            <br />
            <h1 class="title">Scrypta Electio</h1>
            <h2 class="subtitle">
              Poll system will allow you to create and manage polls, linked forever to the Scrypta Blockchain.
              <br />
              Your address is {{ address }} but we need an RSA key before start.
              <br />
              <br />
              <b-button size="is-medium" type="is-primary" v-on:click="showCreate">Create Poll Keys</b-button>
            </h2>
            <hr />Scrypta Electio is an
            <a
              href="https://github.com/scryptachain/scrypta-polls"
              target="_blank"
            >open-source</a> project by
            <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
            <br />
            <br />
          </div>
        </div>
      </section>
    </div>
    <div v-if="!wallet">
      <section class="hero">
        <div class="hero-body" style="padding: 0;">
          <div style="min-height: 100vh; background-image: url('bg-home.jpg');">
            <div class="container" style="min-height: 100vh;">
              <div class="center-home">
                <div class="columns">
                  <div class="column is-three-fifths is-offset-one-fifth">
                    <img src="/logo.png" width="350" style="margin-top: 50px;" />
                    <h1 style="margin-top: 20px;">Poll system over the blockchain</h1>
                    <h2 class="subtitle">
                      <i>
                        Electio è una piattaforma creata per il voto elettronico. La blockchain decentralizzata e permissionless
                        di Scrypta permette un alto livello di trasparenza, sicurezza e affidabilità in tutte le fasi del voto.
                      </i>
                    </h2>
                  </div>
                </div>
              </div>
              <div style="width: 100%; position: absolute; bottom: 0; left: 0;">
                <p style="margin-top:30px;">ESPLORA</p>
                <a href="#create">
                  <b-icon pack="fas" icon="chevron-down"></b-icon>
                </a>
              </div>
            </div>
          </div>

          <div class="section" style="min-height: 100vh; background-color: white;" id="create">
            <div class="middle">
              <h1>VOTO CON AUTORIZZAZIONE</h1>
              <br />
              <div class="columns is-centered">
                <div class="column is-5">
                  <div class="card">
                    <div class="card-image">
                      <figure class="image is-4by3">
                        <img
                          src="auth1.png"
                          alt="Placeholder image"
                        />
                      </figure>
                    </div>
                    <div class="card-content">
                      <div class="media">
                        <div class="media-content">
                          <p class="title text-center">Quesito pubblico / Voto Segreto</p>
                        </div>
                      </div>

                      <div class="content">
                        Il quesito della votazione è visualizzabile solo attraverso password dedicata, il voto dell’elettore,
                        che viene autorizzato a votare dal creatore del quesito, è segreto.
                      </div>
                    </div>
                  </div>
                </div>
                <div class="column is-5">
                  <div class="card">
                    <div class="card-image">
                      <figure class="image is-4by3">
                        <img
                          src="auth2.png"
                          alt="Placeholder image"
                        />
                      </figure>
                    </div>
                    <div class="card-content">
                      <div class="media">
                        <div class="media-content">
                          <p class="title text-center">Quesito pubblico / Voto palese</p>
                        </div>
                      </div>
                      <div class="content">
                        Il quesito della votazione è visualizzabile in chiaro; il voto dell’elettore,
                        che viene autorizzato a votare dal creatore del quesito, è palese
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section" style="min-height: 100vh; background-color: white">
            <div class="container">
              <h1>QUESITO PUBBLICO</h1>
              <div class="subtitle"><i>Sondaggistica</i></div>
              <div class="columns">
                <div class="column is-10 is-offset-1">
                  <div class="card is-horizontal center">
                    <div class="card-image">
                      <figure class="image is-4by3">
                        <img
                          src="sondaggio.png"
                          alt="Placeholder image"
                        />
                      </figure>
                    </div>
                    <div class="card-stacked">
                      <div class="card-content">
                        <div class="media">
                          <div class="media-content">
                            <p class="title text-center">Quesito pubblico / Voto Palese</p>
                          </div>
                        </div>
                        <div class="content">
                          Il quesito della votazione è visualizzabile in chiaro, il voto dell’elettore è in chiaro e
                          tutti possono votare senza autorizzazione. utile per fini di sondaggio.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section" style="min-height: 100vh; background-color: white">
            <div class="middle">
              <h1>QUESITO SEGRETO</h1>
              <br />
              <div class="columns is-centered">
                <div class="column is-5">
                  <div class="card">
                    <div class="card-image">
                      <figure class="image is-4by3">
                        <img
                          src="secret1.png"
                          alt="Placeholder image"
                        />
                      </figure>
                    </div>
                    <div class="card-content">
                      <div class="media">
                        <div class="media-content">
                          <p class="title text-center">Quesito segreto / Voto Palese</p>
                        </div>
                      </div>

                      <div class="content">
                        Il quesito della votazione è visualizzabile solo attraverso password dedicata,
                        il voto dell’elettore, che viene pre-autorizzato a votare dal creatore del quesito, è palese (non segreto).
                      </div>
                    </div>
                  </div>
                </div>
                <div class="column is-5">
                  <div class="card">
                    <div class="card-image">
                      <figure class="image is-4by3">
                        <img
                          src="secret2.png"
                          alt="Placeholder image"
                        />
                      </figure>
                    </div>
                    <div class="card-content">
                      <div class="media">
                        <div class="media-content">
                          <p class="title text-center">Quesito segreto / Voto Segreto</p>
                        </div>
                      </div>
                      <div class="content">
                        Il quesito della votazione è visualizzabile solo attraverso password dedicata, il voto dell’elettore,
                        che viene pre-autorizzato a votare dal creatore del quesito, è segreto.<br><br>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    <b-loading :is-full-page="true" :active.sync="isLogging" :can-cancel="false"></b-loading>
  </div>
</template>

<script>
let ScryptaCore = require("@scrypta/core");

export default {
  data() {
    return {
      scrypta: new ScryptaCore(true),
      address: "",
      wallet: "",
      isLogging: true
    };
  },
  async mounted() {
    const app = this;
    app.wallet = await app.scrypta.importBrowserSID();
    app.wallet = await app.scrypta.returnDefaultIdentity();
    if (app.wallet.length > 0) {
      let SIDS = app.wallet.split(":");
      app.address = SIDS[0];
      let identity = await app.scrypta.returnIdentity(app.address);
      if (identity.rsa === undefined) {
        app.needsRSA = true;
      }
      app.wallet = identity;
      app.isLogging = false;
    } else {
      app.isLogging = false;
    }
  },
  methods: {
    loadWalletFromFile() {
      const app = this;
      const file = app.file;
      const reader = new FileReader();
      reader.onload = function() {
        var dataKey = reader.result;

        app.$buefy.dialog.prompt({
          message: `Enter wallet password`,
          inputAttrs: {
            type: "password"
          },
          trapFocus: true,
          onConfirm: async password => {
            let key = await app.scrypta.readKey(password, dataKey);
            if (key !== false) {
              app.scrypta.importPrivateKey(key.prv, password);
              localStorage.setItem("SID", dataKey);
              location.reload();
            } else {
              app.$buefy.toast.open({
                message: "Wrong password!",
                type: "is-danger"
              });
            }
          }
        });
      };
      reader.readAsText(file);
    },
    showCreate() {
      const app = this;
      app.showCreateModal = true;
    },
    logout() {
      localStorage.setItem("SID", "");
      location.reload();
    },
    async createUser() {
      const app = this;
      if (app.password !== "") {
        if (app.passwordrepeat === app.password) {
          app.isCreating = true;
          setTimeout(async function() {
            let id = await app.scrypta.createAddress(app.password, true);
            await app.scrypta.createRSAKeys(id.pub, app.password);
            let identity = await app.scrypta.returnIdentity(id.pub);
            app.needsRSA = false;
            app.address = id.pub;
            app.wallet = identity;
            localStorage.setItem("SID", id.walletstore);
            app.showCreateModal = false;
            app.password = "";
            app.passwordrepeat = "";
            let tx = await app.scrypta.post("/init", {
              address: id.pub,
              airdrop: true
            });
            if (tx.airdrop_tx === false) {
              app.$buefy.toast.open({
                message: "Sorry, airdrop was not successful!",
                type: "is-danger"
              });
            }
            app.isCreating = false;
          }, 500);
        } else {
          app.$buefy.toast.open({
            message: "Passwords doesn't matches.",
            type: "is-danger"
          });
        }
      } else {
        app.$buefy.toast.open({
          message: "Write a password first!",
          type: "is-danger"
        });
      }
    },
    async updateUser() {
      const app = this;
      if (app.password !== "") {
        let walletstore = app.wallet.wallet;
        let key = await app.scrypta.readKey(app.password, walletstore);
        if (key !== false) {
          app.isUpdating = true;
          setTimeout(async function() {
            let res = await app.scrypta.createRSAKeys(
              app.wallet.wallet,
              app.password
            );
            if (res !== false) {
              let identity = await app.scrypta.returnIdentity(app.address);
              let balance = await app.scrypta.get("/balance/" + app.address);
              if (balance.balance === 0) {
                await app.scrypta.post("/init", {
                  dapp_address: app.address,
                  airdrop: true
                });
              }
              app.needsRSA = false;
              app.wallet = identity;
              app.showCreateModal = false;
              app.password = "";
              app.passwordrepeat = "";
              app.isUpdating = false;
            } else {
              app.isUpdating = false;
              app.$buefy.toast.open({
                message: "Password is wrong!",
                type: "is-danger"
              });
            }
          }, 500);
        } else {
          app.$buefy.toast.open({
            message: "Wrong password!",
            type: "is-danger"
          });
        }
      } else {
        app.$buefy.toast.open({
          message: "Write a password first!",
          type: "is-danger"
        });
      }
    }
  }
};
</script>

<style>
#app {
  font-family: "Sen";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

.center-home {
  position: absolute;
  top: 45%;
  -moz-transform: translateY(-45%);
  -webkit-transform: translateY(-45%);
  transform: translateY(-45%);
}

.center {
  margin: 0;
  position: absolute;
  top: 36%;
}

.section {
  display: flex;
}

.middle {
  margin: auto;
}

.is-horizontal {
  display: flex;
}
.card-image {
  width: 100%;
  height: 100%;
}
.card-stacked {
  flex-direction: column;
  flex: 1 1 auto;
  display: flex;
  position: relative;
}
.card-content {
  flex-grow: 1;
}
</style>
