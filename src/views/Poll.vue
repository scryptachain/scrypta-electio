<template>
  <div class="main text-left">
    <div class="container">
      <div v-if="isLoading">Loading poll from the blockchain...</div>
      <div v-if="!isLoading && !isDecrypted">
        Please decrypt the poll first...
      </div>
      <div v-if="!isLoading && isDecrypted">
        <section>
          <b-message
            v-if="userVoted && !isEnded"
            title="Attention please!"
            type="is-danger"
            aria-close-label="Close message"
          >
            You've voted yet for this poll, please remember that you can vote
            again and the last vote will be considered.
          </b-message>
          <b-message
            v-if="dna.owner === address"
            title="Attention please!"
            type="is-danger"
            aria-close-label="Close message"
          >
            You're the <b>owner</b> of this pool and you can't vote!
          </b-message>
          <v-gravatar
            :email="dna.owner"
            style="float: left; margin-right: 20px; width: 100px; height: 100px"
          />
          <h1>{{ poll.name }}</h1>
          <b>Available from</b> {{ poll.start_date }} {{ poll.start_time }}:00
          <b>till</b> {{ poll.end_date }} {{ poll.end_time }}:00
          <hr />
          <p>{{ poll.question }}</p>
          <hr />
          <apexchart
            v-if="Object.keys(votes).length > 0"
            width="100%"
            height="350px"
            type="bar"
            :options="txOptions"
            :series="txSeries"
          ></apexchart>
          <div
            class="text-center"
            v-if="canVote && !isUploading && isStarted && !isEnded"
          >
            <b-button
              v-for="(answer, index) in poll.answers"
              size="is-large"
              v-on:click="votePoll(index)"
              v-bind:key="answer.answer"
              style="margin: 0 10px"
            >
              <span v-if="parseFloat(userVote) === parseFloat(index)"> X </span
              >{{ answer.answer }}
            </b-button>
          </div>
          <div v-if="isEnded" class="text-center">
            <b-button
              v-for="(answer, index) in poll.answers"
              size="is-large"
              v-bind:class="{'is-success': parseFloat(userVote) === parseFloat(index)}"
              v-bind:key="answer.answer"
              style="margin: 0 10px"
            >
              {{ answer.answer }}:
              <span v-if="votes[index]">{{ votes[index] }}</span
              ><span v-if="!votes[index]">0</span>&nbsp;
              <span style="font-weight: normal" v-if="votes[index] === 1"
                >VOTE</span
              ><span style="font-weight: normal" v-if="votes[index] !== 1"
                >VOTES</span
              >
            </b-button>
          </div>
          <br />
          <div v-if="countingVotes" class="text-center">
            Counting votes, please wait..
          </div>
          <div v-if="!isStarted" class="text-center">
            Sorry, the poll has not started.
          </div>
          <div class="text-center" v-if="isUploading">
            Sending vote, please wait...
          </div>
          <div class="text-center" v-if="!canVote && !isEnded">
            Ops, you can't vote.
          </div>
        </section>
      </div>
    </div>
    <b-loading
      :is-full-page="true"
      :active.sync="isLoading"
      :can-cancel="false"
    ></b-loading>
  </div>
</template>

<script>
const ScryptaCore = require("@scrypta/core");
const moment = require("moment");
const NodeRSA = require("node-rsa");

export default {
  name: "Manage",
  data() {
    return {
      scrypta: new ScryptaCore(true),
      address: "",
      wallet: "",
      pollAddress: "",
      isLoading: true,
      isStarted: false,
      userVoted: false,
      isEnded: false,
      userVote: "",
      isDecrypted: true,
      isUploading: false,
      isFuture: false,
      countingVotes: false,
      canVote: true,
      isPast: false,
      poll: {},
      authorized: {},
      dna: {},
      results: {},
      voteCard: "",
      votes: {},
      answers: [],
      activeSeriesIndex: 0,
      txOptions: {
        chart: {
          id: "chart-votes",
        },
        xaxis: {
          categories: [],
        },
      },
      txSeries: [
        {
          name: "Votes",
          data: [],
        },
      ],
    };
  },
  async mounted() {
    const app = this;
    app.scrypta.staticnodes = true;
    app.scrypta.mainnetIdaNodes = [
      "https://idanodejs01.scryptachain.org",
      "https://idanodejs02.scryptachain.org",
      "https://idanodejs03.scryptachain.org",
      "https://idanodejs04.scryptachain.org",
      "https://idanodejs05.scryptachain.org",
      "https://idanodejs06.scryptachain.org",
    ];
    app.wallet = await app.scrypta.returnDefaultIdentity();
    let SIDS = app.wallet.split(":");
    app.address = SIDS[0];
    let identity = await app.scrypta.returnIdentity(app.address);
    app.wallet = identity;
    app.isLogging = false;
    let response = await app.scrypta.post("/read", {
      uuid: app.$route.params.uuid,
    });
    app.poll = response.data[0].data.poll;
    app.dna = response.data[0].data.dna;
    app.authorized = response.data[0].data.authorized;
    app.pollAddress = response.data[0].address;
    if (app.dna.type === "SECRET") {
      app.isDecrypted = false;
      if (
        localStorage.getItem("pollPwD") !== null &&
        localStorage.getItem("pollPwD") !== ""
      ) {
        let decrypted = await app.scrypta.decryptData(
          app.poll,
          localStorage.getItem("pollPwD")
        );
        localStorage.setItem("pollPwD", "");

        if (decrypted !== false) {
          app.poll = JSON.parse(JSON.parse(decrypted));
          app.isDecrypted = true;
          app.checkCanVote();
        } else {
          app.decryptPoll();
        }
      } else {
        app.decryptPoll();
      }
    } else {
      app.checkCanVote();
    }

    app.isLoading = false;
  },
  methods: {
    normalizeNumber(number) {
      let normalized = "";
      if (parseFloat(number) < 10 && parseFloat(number) > 0) {
        normalized += "0" + number.replace("0", "");
      } else {
        normalized += number;
      }
      return normalized;
    },
    normalizeDate(date) {
      let exp = date.split("-");
      let m = this.normalizeNumber(exp[1]);
      let d = this.normalizeNumber(exp[2]);
      return exp[0] + "-" + m + "-" + d;
    },
    normalizeTime(time) {
      let exp = time.split(":");
      let h = this.normalizeNumber(exp[0]);
      let m = this.normalizeNumber(exp[1]);
      return h + ":" + m + ":00";
    },
    async checkCanVote() {
      const app = this;
      let start_date = app.normalizeDate(app.poll.start_date);
      let start_time = app.normalizeTime(app.poll.start_time);
      let start = moment(start_date + "T" + start_time);
      let end_date = app.normalizeDate(app.poll.end_date);
      let end_time = app.normalizeTime(app.poll.end_time);
      let end = moment(end_date + "T" + end_time);

      if (moment().isBefore(start)) {
        app.canVote = false;
      }
      if (moment().isAfter(end)) {
        app.canVote = false;
        app.isEnded = true;
      }

      if (app.dna.votetype === "PUBLIC") {
        app.isStarted = true;
      } else {
        app.isStarted = false;
      }

      let authorizedCount = 0;
      let votesCount = 0;
      app.countingVotes = true;
      app.txOptions.xaxis.categories = [];
      app.txSeries.data = [];
      await app.scrypta
        .post("/received", {
          address: app.pollAddress,
        })
        .then(function (response) {
          var txs = response.data;
          let votes = {};
          for(let k in app.poll.answers){
            app.answers[k] = app.poll.answers[k].answer
            app.txSeries[0].data[k] = 0
            app.txOptions.xaxis.categories.push(app.poll.answers[k].answer);
          }
          for (let i in txs) {
            var tx = txs[i];
            var exp = tx.data.split(":");
            if (exp[0] === "poll" && exp[1] === "//START") {
              if (app.dna.type !== "PUBLIC") {
                app.isStarted = true;
              }
            }
            if (exp[0] === "poll" && exp[1] === "//VOTE") {
              votesCount++;
              if (votes[exp[2]] === undefined) {
                votes[exp[2]] = 0;
              }
              if (votes[exp[2]] !== undefined) {
                votes[exp[2]]++;
              } else {
                votes[exp[2]] = 1;
              }
              app.txSeries[0].data[exp[2]] = votes[exp[2]]
            }
            if (
              exp[3] !== undefined &&
              exp[2] === app.address &&
              exp[1] === "//AUTH" &&
              tx.sender === app.dna.owner
            ) {
              app.canVote = true;
              app.voteCard = exp[3];
              authorizedCount++;
            }
            if (
              exp[2] === app.address &&
              exp[1] === "//AUTH" &&
              tx.sender === app.dna.owner
            ) {
              app.canVote = true;
              authorizedCount++;
            }
            if (
              tx.sender === app.address &&
              exp[1] === "//VOTE" &&
              app.dna.votetype === "PUBLIC"
            ) {
              app.userVoted = true;
              app.userVote = exp[2];
            }
            if (
              authorizedCount === votesCount &&
              authorizedCount > 0 &&
              votesCount > 0 &&
              app.dna.type !== "PUBLIC"
            ) {
              app.isEnded = true;
            }
          }
          app.votes = votes;
          app.countingVotes = false;
        });
    },
    decryptPoll() {
      const app = this;
      app.$buefy.dialog.prompt({
        message: `Enter poll passphrase`,
        inputAttrs: {
          type: "password",
        },
        trapFocus: true,
        onConfirm: async (password) => {
          const app = this;
          let decrypted = await app.scrypta.decryptData(app.poll, password);
          if (decrypted !== false) {
            app.$buefy.toast.open({
              message: "Decrypted correctly!",
              type: "is-success",
            });
            app.isDecrypted = true;
            app.poll = JSON.parse(JSON.parse(decrypted));
            app.checkCanVote();
            let start = moment(
              app.poll.start_date + "T" + app.poll.start_time + ":00"
            );
            let end = moment(
              app.poll.end_date + "T" + app.poll.end_time + ":00"
            );
            var visible = moment().isAfter(start);
            if (visible === true) {
              var next = moment().isBefore(end);
              if (next === true) {
                app.isFuture = true;
              }
            } else {
              app.isPast = true;
            }
          } else {
            app.$buefy.toast.open({
              message: "Wrong passphrase!",
              type: "is-danger",
            });
            app.decryptPoll();
          }
        },
      });
    },
    async votePoll(index) {
      const app = this;
      app.$buefy.dialog.prompt({
        message: `Enter wallet password`,
        inputAttrs: {
          type: "password",
        },
        trapFocus: true,
        onConfirm: async (password) => {
          let walletstore = app.wallet.wallet;
          let key = await app.scrypta.readKey(password, walletstore);
          if (key !== false) {
            let voteCard = false;
            let voteCardPrivKey = "";
            if (app.dna.votetype === "PUBLIC") {
              voteCard = app.address;
              voteCardPrivKey = key.prv;
            } else if (app.voteCard !== "") {
              let encrypted = app.voteCard;
              let identity = await app.scrypta.returnIdentity(app.address);
              let rsaprivkey = await app.scrypta.decryptData(
                identity.rsa.prv,
                password
              );
              if (rsaprivkey !== false) {
                let rsakey = new NodeRSA(rsaprivkey);
                let decrypted = rsakey.decrypt(encrypted, "utf8");
                let voteCardExp = decrypted.split(",");
                voteCard = voteCardExp[0];
                voteCardPrivKey = voteCardExp[1];
              }
            }
            if (voteCard !== false) {
              let balance = await app.scrypta.get("/balance/" + voteCard);
              if (balance.balance >= 0.0011) {
                app.isUploading = true;
                let sendsuccess = false;
                let send;
                let yyy = 0;
                while (!sendsuccess) {
                  send = await app.scrypta.post("/send", {
                    from: voteCard,
                    to: app.pollAddress,
                    amount: 0.0001,
                    private_key: voteCardPrivKey,
                    message: "poll://VOTE:" + index,
                  });
                  if (
                    send.data.txid !== undefined &&
                    send.data.txid !== null &&
                    send.data.txid.length === 64
                  ) {
                    sendsuccess = true;
                  }
                  if (yyy > 19) {
                    sendsuccess = true;
                    send = false;
                  }
                  yyy++;
                }

                if (sendsuccess) {
                  app.$buefy.toast.open({
                    message:
                      "Voted sent correctly, you will see the results when the poll is ended!",
                    type: "is-success",
                  });
                } else {
                  app.$buefy.toast.open({
                    message: "Something goes wrong!",
                    type: "is-danger",
                  });
                }
                app.isUploading = false;
              } else {
                app.$buefy.toast.open({
                  message:
                    "You need at least 0.0011 LYRA, you have " +
                    balance.balance +
                    " LYRA!",
                  type: "is-danger",
                });
              }
            } else {
              app.$buefy.toast.open({
                message: "You have no vote card!",
                type: "is-danger",
              });
            }
          } else {
            app.$buefy.toast.open({
              message: "Wrong password!",
              type: "is-danger",
            });
            app.isUploading = false;
          }
        },
      });
    },
  },
};
</script>