(function() {
"use strict";

  // ---------- config ----------
  var QUESTION_TIME_MS = 15000;
  var REVEAL_TIME_MS = 5500;
  var QUESTIONS = [
    { cat: "Science", q: "What is the largest planet in our solar system?", options: ["Saturn", "Jupiter", "Neptune", "Earth"], correct: 1 },
    { cat: "Art", q: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], correct: 2 },
    { cat: "Geography", q: "Which ocean is the largest by area?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3 },
    { cat: "Music", q: "How many strings does a standard guitar have?", options: ["4", "5", "6", "7"], correct: 2 },
    { cat: "History", q: "In what year did the Titanic sink?", options: ["1905", "1912", "1920", "1931"], correct: 1 },
    { cat: "Chemistry", q: "What is the chemical symbol for gold?", options: ["Ag", "Go", "Au", "Gd"], correct: 2 },
    { cat: "Geography", q: "What is the tallest mountain in the world?", options: ["K2", "Kilimanjaro", "Denali", "Mount Everest"], correct: 3 },
    { cat: "Math", q: "What is the smallest prime number?", options: ["0", "1", "2", "3"], correct: 2 }
  ];
  var LETTERS = ["A", "B", "C", "D"];

  // ---------- state ----------
  var db = null;
  var playerId = null;
  var playerName = "";
  var roomCode = null;
  var isHost = false;
  var roomUnsub = null;
  var answersUnsub = null;
  var latestRoom = null;
  var latestAnswers = {};
  var hostTimerInterval = null;
  var revealTimeout = null;
  var myPick = null;
  var currentQIndexRendered = -1;
  var currentStatusRendered = null;

  // ---------- persistence helpers ----------
  function getOrMakePlayerId() {
    var id = localStorage.getItem("buzzroom_playerId");
    if (!id) {
      id = "p" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("buzzroom_playerId", id);
    }
    return id;
  }

  function randomCode() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    var out = "";
    for (var i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  // ---------- DOM refs ----------
  var el = {};
  ["screen-landing","screen-lobby","screen-question","screen-reveal","screen-end",
   "nameInput","hostBtn","codeInput","joinBtn","landingError",
   "roomChip","lobbyCodeText","lobbySub","lobbyPlayers","startBtn","lobbyWaitingNote",
   "qProgress","qCategory","timerFill","qText","qOptions","answeredNote",
   "revealBig","revealPts","revealScores",
   "endWinner","endScores","playAgainBtn"
  ].forEach(function(id){ el[id] = document.getElementById(id); });

  function showScreen(name) {
    ["landing","lobby","question","reveal","end"].forEach(function(s) {
      document.getElementById("screen-" + s).classList.toggle("hidden", s !== name);
    });
  }

  // ---------- init ----------
  async function init() {
    playerId = getOrMakePlayerId();
    var savedName = localStorage.getItem("buzzroom_name");
    if (savedName) el.nameInput.value = savedName;

    try {
      var capModule = await claude.use("db");
      db = capModule;
    } catch (e) {
      db = null;
    }

    if (!db) {
      el.landingError.textContent = "Live sync isn't available in this view — try opening the published link while signed in.";
    }

    el.hostBtn.addEventListener("click", onHost);
    el.joinBtn.addEventListener("click", onJoin);
    el.startBtn.addEventListener("click", onStart);
    el.playAgainBtn.addEventListener("click", onPlayAgain);
    el.codeInput.addEventListener("input", function() {
      el.codeInput.value = el.codeInput.value.toUpperCase().replace(/[^A-Z]/g, "");
    });

    // rejoin if we have an active room in this browser
    var savedRoom = sessionStorage.getItem("buzzroom_activeRoom");
    if (savedRoom && db) {
      try {
        var parsed = JSON.parse(savedRoom);
        enterRoom(parsed.code, parsed.isHost);
      } catch (e) { /* ignore */ }
    }
  }

  function getName() {
    var n = (el.nameInput.value || "").trim();
    return n || "Player";
  }

  async function onHost() {
    if (!db) return;
    playerName = getName();
    localStorage.setItem("buzzroom_name", playerName);
    el.hostBtn.disabled = true;
    try {
      var code = randomCode();
      var players = {};
      players[playerId] = { name: playerName, score: 0 };
      await db.doc("rooms/" + code).set({
        code: code,
        hostId: playerId,
        status: "lobby",
        qIndex: 0,
        questionStartedAt: null,
        players: players
      });
      enterRoom(code, true);
    } catch (e) {
      el.landingError.textContent = "Couldn't create a room. Try again.";
    } finally {
      el.hostBtn.disabled = false;
    }
  }

  async function onJoin() {
    if (!db) return;
    var code = (el.codeInput.value || "").trim().toUpperCase();
    if (code.length !== 4) {
      el.landingError.textContent = "Enter the 4-letter room code.";
      return;
    }
    playerName = getName();
    localStorage.setItem("buzzroom_name", playerName);
    el.joinBtn.disabled = true;
    el.landingError.textContent = "";
    try {
      var ref = db.doc("rooms/" + code);
      var snap = await ref.get();
      if (!snap.exists) {
        el.landingError.textContent = "No room found with that code.";
        el.joinBtn.disabled = false;
        return;
      }
      var data = snap.data();
      if (data.status !== "lobby") {
        el.landingError.textContent = "That game has already started.";
        el.joinBtn.disabled = false;
        return;
      }
      var patch = { players: {} };
      patch.players[playerId] = { name: playerName, score: 0 };
      await ref.update(patch);
      enterRoom(code, data.hostId === playerId);
    } catch (e) {
      el.landingError.textContent = "Couldn't join that room. Try again.";
    } finally {
      el.joinBtn.disabled = false;
    }
  }

  function enterRoom(code, host) {
    roomCode = code;
    isHost = !!host;
    sessionStorage.setItem("buzzroom_activeRoom", JSON.stringify({ code: code, isHost: isHost }));
    el.roomChip.textContent = code;
    el.roomChip.classList.remove("hidden");
    subscribeRoom();
  }

  function subscribeRoom() {
    if (roomUnsub) roomUnsub();
    roomUnsub = db.doc("rooms/" + roomCode).onSnapshot(function(snap) {
      if (!snap.exists) return;
      latestRoom = snap.data();
      renderFromRoom();
    }, function(err) {
      // connection issue — leave current screen as-is
    });
  }

  function subscribeAnswers(qIndex) {
    if (answersUnsub) { answersUnsub(); answersUnsub = null; }
    latestAnswers = {};
    answersUnsub = db.doc("rooms/" + roomCode).collection("answers").doc(String(qIndex)).onSnapshot(function(snap) {
      latestAnswers = (snap.exists && snap.data()) || {};
      renderAnsweredProgress();
      if (isHost) maybeAdvanceFromAnswers();
    });
  }

  function playerCount() {
    return latestRoom && latestRoom.players ? Object.keys(latestRoom.players).length : 0;
  }

  function renderFromRoom() {
    if (!latestRoom) return;
    var status = latestRoom.status;

    if (status === "lobby") {
      renderLobby();
      showScreen("lobby");
    } else if (status === "question") {
      if (latestRoom.qIndex !== currentQIndexRendered || currentStatusRendered !== "question") {
        enterQuestionScreen();
      }
      showScreen("question");
    } else if (status === "reveal") {
      if (currentStatusRendered !== "reveal") {
        enterRevealScreen();
      }
      showScreen("reveal");
    } else if (status === "ended") {
      renderEnd();
      showScreen("end");
    }
    currentStatusRendered = status;
  }

  function renderLobby() {
    el.lobbyCodeText.textContent = roomCode;
    el.lobbySub.textContent = isHost
      ? "Share this code with your group, then start whenever you're ready."
      : "Share this code with your group — the host will start soon.";
    var players = latestRoom.players || {};
    var ids = Object.keys(players);
    el.lobbyPlayers.innerHTML = "";
    ids.forEach(function(id) {
      var li = document.createElement("li");
      li.className = "player-row";
      var dot = document.createElement("span");
      dot.className = "dot";
      li.appendChild(dot);
      var nameSpan = document.createElement("span");
      nameSpan.textContent = players[id].name;
      li.appendChild(nameSpan);
      if (id === latestRoom.hostId) {
        var tag = document.createElement("span");
        tag.className = "host-tag";
        tag.textContent = "HOST";
        li.appendChild(tag);
      }
      if (id === playerId) {
        var you = document.createElement("span");
        you.className = "you-tag";
        you.textContent = "YOU";
        li.appendChild(you);
      }
      el.lobbyPlayers.appendChild(li);
    });
    el.startBtn.classList.toggle("hidden", !isHost);
    el.startBtn.disabled = ids.length < 1;
    el.lobbyWaitingNote.classList.toggle("hidden", isHost);
  }

  async function onStart() {
    if (!isHost || !db) return;
    el.startBtn.disabled = true;
    await beginQuestion(0);
  }

  async function beginQuestion(index) {
    await db.doc("rooms/" + roomCode).update({
      status: "question",
      qIndex: index,
      questionStartedAt: Date.now()
    });
  }

  function enterQuestionScreen() {
    currentQIndexRendered = latestRoom.qIndex;
    myPick = null;
    var q = QUESTIONS[latestRoom.qIndex];
    el.qProgress.textContent = "Question " + (latestRoom.qIndex + 1) + "/" + QUESTIONS.length;
    el.qCategory.textContent = q.cat;
    el.qText.textContent = q.q;
    el.answeredNote.classList.add("hidden");
    el.qOptions.innerHTML = "";
    q.options.forEach(function(opt, i) {
      var btn = document.createElement("button");
      btn.className = "opt-btn";
      btn.innerHTML = '<span class="letter">' + LETTERS[i] + '</span><span>' + escapeHtml(opt) + '</span>';
      btn.addEventListener("click", function() { onPick(i); });
      el.qOptions.appendChild(btn);
    });
    subscribeAnswers(latestRoom.qIndex);
    runTimer();
  }

  function runTimer() {
    if (hostTimerInterval) clearInterval(hostTimerInterval);
    var started = latestRoom.questionStartedAt || Date.now();
    function tick() {
      var elapsed = Date.now() - started;
      var remain = Math.max(0, 1 - elapsed / QUESTION_TIME_MS);
      el.timerFill.style.transform = "scaleX(" + remain + ")";
      if (isHost && elapsed >= QUESTION_TIME_MS && currentStatusRendered === "question") {
        finishQuestion();
      }
    }
    tick();
    hostTimerInterval = setInterval(tick, 200);
  }

  async function onPick(i) {
    if (myPick !== null) return;
    myPick = i;
    Array.prototype.forEach.call(el.qOptions.children, function(btn, idx) {
      btn.disabled = true;
      if (idx === i) btn.classList.add("picked");
    });
    el.answeredNote.classList.remove("hidden");
    var ref = db.doc("rooms/" + roomCode).collection("answers").doc(String(latestRoom.qIndex));
    var patch = {};
    patch[playerId] = i;
    try {
      await ref.update(patch);
    } catch (e) {
      try { await ref.set(patch); } catch (e2) { /* give up quietly */ }
    }
  }

  function renderAnsweredProgress() {
    if (document.getElementById("screen-question").classList.contains("hidden")) return;
    var answeredCount = Object.keys(latestAnswers).length;
    var total = playerCount();
    if (myPick !== null) {
      el.answeredNote.textContent = "You're in! " + answeredCount + "/" + total + " have answered…";
    }
  }

  function maybeAdvanceFromAnswers() {
    if (!latestRoom || latestRoom.status !== "question") return;
    var answeredCount = Object.keys(latestAnswers).length;
    if (answeredCount >= playerCount() && playerCount() > 0) {
      finishQuestion();
    }
  }

  async function finishQuestion() {
    if (currentStatusRendered !== "question") return;
    currentStatusRendered = "advancing";
    if (hostTimerInterval) { clearInterval(hostTimerInterval); hostTimerInterval = null; }
    var q = QUESTIONS[latestRoom.qIndex];
    var players = latestRoom.players || {};
    var scoreUpdates = {};
    var started = latestRoom.questionStartedAt || Date.now();
    Object.keys(latestAnswers).forEach(function(pid) {
      var pick = latestAnswers[pid];
      if (pick === q.correct && players[pid]) {
        var elapsedSec = Math.min(QUESTION_TIME_MS, Date.now() - started) / 1000;
        var speedBonus = Math.max(0, Math.round((1 - elapsedSec / (QUESTION_TIME_MS / 1000)) * 100));
        var gained = 100 + speedBonus;
        scoreUpdates[pid] = { score: (players[pid].score || 0) + gained };
      }
    });
    var patch = { status: "reveal" };
    if (Object.keys(scoreUpdates).length) patch.players = scoreUpdates;
    await db.doc("rooms/" + roomCode).update(patch);
  }

  function enterRevealScreen() {
    var q = QUESTIONS[latestRoom.qIndex];
    var iCorrect = myPick === q.correct;
    el.revealBig.textContent = myPick === null ? "Time's up" : (iCorrect ? "Correct!" : "Not quite");
    el.revealBig.className = "big " + (myPick === null ? "no" : (iCorrect ? "yes" : "no"));
    var correctText = q.options[q.correct];
    el.revealPts.textContent = iCorrect ? "The answer was \u201c" + correctText + "\u201d — nice one." : "The answer was \u201c" + correctText + "\u201d.";

    var players = latestRoom.players || {};
    var ranked = Object.keys(players).map(function(id) {
      return { id: id, name: players[id].name, score: players[id].score || 0 };
    }).sort(function(a, b) { return b.score - a.score; });

    el.revealScores.innerHTML = "";
    ranked.forEach(function(p, idx) {
      var li = document.createElement("li");
      li.className = "score-row" + (idx === 0 ? " top1" : "");
      li.innerHTML = '<span class="rank">' + (idx + 1) + '</span><span class="name">' + escapeHtml(p.name) + (p.id === playerId ? " (you)" : "") + '</span><span class="pts-val">' + p.score + '</span>';
      el.revealScores.appendChild(li);
    });

    if (isHost) {
      if (revealTimeout) clearTimeout(revealTimeout);
      revealTimeout = setTimeout(function() {
        var nextIndex = latestRoom.qIndex + 1;
        if (nextIndex < QUESTIONS.length) {
          beginQuestion(nextIndex);
        } else {
          db.doc("rooms/" + roomCode).update({ status: "ended" });
        }
      }, REVEAL_TIME_MS);
    }
  }

  function renderEnd() {
    var players = latestRoom.players || {};
    var ranked = Object.keys(players).map(function(id) {
      return { id: id, name: players[id].name, score: players[id].score || 0 };
    }).sort(function(a, b) { return b.score - a.score; });

    el.endWinner.textContent = ranked.length ? (ranked[0].name + " wins! \uD83C\uDFC6") : "Game over";
    el.endScores.innerHTML = "";
    ranked.forEach(function(p, idx) {
      var li = document.createElement("li");
      li.className = "score-row" + (idx === 0 ? " top1" : "");
      li.innerHTML = '<span class="rank">' + (idx + 1) + '</span><span class="name">' + escapeHtml(p.name) + (p.id === playerId ? " (you)" : "") + '</span><span class="pts-val">' + p.score + '</span>';
      el.endScores.appendChild(li);
    });
  }

  function onPlayAgain() {
    sessionStorage.removeItem("buzzroom_activeRoom");
    if (roomUnsub) { roomUnsub(); roomUnsub = null; }
    if (answersUnsub) { answersUnsub(); answersUnsub = null; }
    if (hostTimerInterval) { clearInterval(hostTimerInterval); hostTimerInterval = null; }
    if (revealTimeout) { clearTimeout(revealTimeout); revealTimeout = null; }
    roomCode = null;
    isHost = false;
    latestRoom = null;
    currentQIndexRendered = -1;
    currentStatusRendered = null;
    el.roomChip.classList.add("hidden");
    el.codeInput.value = "";
    el.landingError.textContent = "";
    showScreen("landing");
  }

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  init();
})();
