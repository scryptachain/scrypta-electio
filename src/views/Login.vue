<template>
  <div class="main text-left">
    <div class="container" style="margin-top:50px;">
      <div class="card">
        <div style="padding: 50px 20px;">
          <h1 class="title is-1">Start Now</h1>
          <br />
          <h2 class="subtitle">
            Scrypta Electio ti permette di creare e gestire votazioni e sondaggi utilizzando la blockchain di Scrypta
            <br />Puoi accedere con Scrypta ID extension o creando una nuova identità
            <br />
            <br />Accedi con Scrypta ID Extension o crea un nuovo wallet con
            <a
              href="https://web.manent.app"
            >Manent Web</a> e fai l'upload del file .sid qui.
            <br />
            <br />
            <b-upload v-model="file" v-on:input="loadWalletFromFile" drag-drop>
              <section class="section">
                <div class="content has-text-centered">
                  <p>Trascina il tuo file .sid here or clicca su upload</p>
                </div>
              </section>
            </b-upload>
          </h2>
        </div>
      </div>
      <br />Scrypta Electio is an
      <a
        href="https://github.com/scryptachain/scrypta-polls"
        target="_blank"
      >open-source</a> project by
      <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
      <br />
      <br />
    </div>

    <b-modal :active.sync="showCreateModal" has-modal-card trap-focus aria-role="dialog" aria-modal>
      <form action>
        <div class="modal-card" style="width: auto">
          <header class="modal-card-head">
            <p v-if="!wallet" class="modal-card-title">Create new Identity</p>
            <p v-if="wallet" class="modal-card-title">Update Identity</p>
          </header>
          <section class="modal-card-body">
            <b-field label="Insert Password">
              <b-input
                type="password"
                v-model="password"
                password-reveal
                placeholder="Your main password"
                required
              ></b-input>
            </b-field>

            <b-field v-if="!wallet" label="Repeat password">
              <b-input
                type="password"
                v-model="passwordrepeat"
                password-reveal
                placeholder="Repeat password"
                required
              ></b-input>
            </b-field>
          </section>
          <footer v-if="!isCreating && !isUpdating" class="modal-card-foot">
            <button
              v-if="!wallet"
              class="button is-primary"
              style="width:100%"
              v-on:click="createUser"
            >CREATE</button>
            <button
              v-if="wallet"
              class="button is-primary"
              style="width:100%"
              v-on:click="updateUser"
            >UPDATE</button>
          </footer>
          <footer v-if="isCreating" class="modal-card-foot">
            <div style="text-align:center">Creating identity, please wait...</div>
          </footer>
          <footer v-if="isUpdating" class="modal-card-foot">
            <div style="text-align:center">Updating identity, please wait...</div>
          </footer>
        </div>
      </form>
    </b-modal>
  </div>
</template>

<script>
  const ScryptaCore = require('@scrypta/core')

  export default {
    name: 'Login',
    data(){ 
      return {
        scrypta: new ScryptaCore(true),
        isLoading: true,
        address: "",
        wallet: "",
        isLogging: true,
        file: [],
        needsRSA: false,
        isCreating: false,
        isUpdating: false,
        showCreateModal: false,
        password: "",
        passwordrepeat: ""
      }
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
  }
</script>