import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  remove,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";
import { questions } from "./questions.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let currentUser = null;
let currentRoomCode = null;
let isHost = false;
let roomData = null;
let unsubscribeRoom = null;
let timerInterval = null;
let hasAnswered = false;
let advanceInProgress = false;

// Screens
const homeScreen = document.getElementById("home-screen");
const lobbyScreen = document.getElementById("lobby-screen");
const gameScreen = document.getElementById("game-screen");
const resultsScreen = document.getElementById("results-screen");

// Home
const playerNameInput = document.getElementById("player-name");
const roomCodeInput = document.getElementById("room-code-input");
const hostBtn = document.getElementById("host-btn");
const joinBtn = document.getElementById("join-btn");
const homeError = document.getElementById("home-error");

// Lobby
const roomCodeDisplay = document.getElementById("room-code-display");
const copyRoomBtn = document.getElementById("copy-room-btn");
const shareLink = document.getElementById("share-link");
const playersList = document.getElementById("players-list");
const hostControls = document.getElementById("host-controls");
const startGameBtn = document.getElementById("start-game-btn");
const lobbyMessage = document.getElementById("lobby-message");
const leaveRoomBtn = document.getElementById("leave-room-btn");

// Game
const gameRoomCode = document.getElementById("game-room-code");
const currentQuestionNumber = document.getElementById("current-question-number");
const timerElement = document.getElementById("timer");
const progressFill = document.getElementById("progress-fill");
const questionIndexElement = document.getElementById("question-index");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const answerStatus = document.getElementById("answer-status");
const gameLeaderboard = document.getElementById("game-leaderboard");

// Results
const finalLeaderboard = document.getElementById("final-leaderboard");
const resultsHostControls = document.getElementById("results-host-controls");
const playAgainBtn = document.getElementById("play-again-btn");
const resultsLeaveBtn = document.getElementById("results-leave-btn");

// Loading
const loadingOverlay = document.getElementById("loading-overlay");
const loadingText = document.getElementById("loading-text");


// -----------------------------
// Authentication
// -----------------------------

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    hideLoading();
    checkRoomFromUrl();
  }
});

signInAnonymously(auth).catch((error) => {
  console.error("Anonymous authentication failed:", error);
  hideLoading();

  showHomeError(
    "Unable to connect to the game server. Please refresh and try again."
  );
});


// -----------------------------
// Home
// -----------------------------

hostBtn.addEventListener("click", createRoom);
joinBtn.addEventListener("click", joinRoom);

roomCodeInput.addEventListener("input", () => {
  roomCodeInput.value = roomCodeInput.value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);
});

roomCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    joinRoom();
  }
});

playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    createRoom();
  }
});


// -----------------------------
// Create Room
// -----------------------------

async function createRoom() {
  clearHomeError();

  const playerName = playerNameInput.value.trim();

  if (!playerName) {
    showHomeError("Please enter your name.");
    playerNameInput.focus();
    return;
  }

  if (!currentUser) {
    showHomeError("Still connecting. Please try again.");
    return;
  }

  setLoading("Creating room...");

  try {
    const roomCode = await generateUniqueRoomCode();

    const roomRef = ref(db, `rooms/${roomCode}`);

    await set(roomRef, {
      hostId: currentUser.uid,
      status: "lobby",
      currentQuestion: -1,
      questionStartedAt: 0,
      createdAt: serverTimestamp(),

      players: {
        [currentUser.uid]: {
          name: playerName,
          score: 0,
          joinedAt: Date.now()
        }
      },

      answers: {}
    });

    currentRoomCode = roomCode;
    isHost = true;

    startRoomListener();
  } catch (error) {
    console.error(error);
    hideLoading();
    showHomeError("Could not create the room. Please try again.");
  }
}


// -----------------------------
// Join Room
// -----------------------------

async function joinRoom() {
  clearHomeError();

  const playerName = playerNameInput.value.trim();
  const roomCode = roomCodeInput.value.trim().toUpperCase();

  if (!playerName) {
    showHomeError("Please enter your name.");
    playerNameInput.focus();
    return;
  }

  if (!/^[A-Z]{4}$/.test(roomCode)) {
    showHomeError("Please enter a valid 4-letter room code.");
    roomCodeInput.focus();
    return;
  }

  if (!currentUser) {
    showHomeError("Still connecting. Please try again.");
    return;
  }

  setLoading("Joining room...");

  try {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      hideLoading();
      showHomeError("Room not found.");
      return;
    }

    const room = snapshot.val();

    if (room.status !== "lobby") {
      hideLoading();
      showHomeError("This game has already started.");
      return;
    }

    await set(
      ref(db, `rooms/${roomCode}/players/${currentUser.uid}`),
      {
        name: playerName,
        score: 0,
        joinedAt: Date.now()
      }
    );

    currentRoomCode = roomCode;
    isHost = false;

    startRoomListener();
  } catch (error) {
    console.error(error);
    hideLoading();
    showHomeError("Could not join the room. Please try again.");
  }
}


// -----------------------------
// Room Listener
// -----------------------------

function startRoomListener() {
  if (unsubscribeRoom) {
    unsubscribeRoom();
  }

  const roomRef = ref(db, `rooms/${currentRoomCode}`);

  unsubscribeRoom = onValue(
    roomRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        roomData = null;
        currentRoomCode = null;
        isHost = false;

        clearTimer();
        showScreen("home");
        hideLoading();

        showHomeError("The room no longer exists.");
        return;
      }

      roomData = snapshot.val();

      hideLoading();
      updateInterface();
    },
    (error) => {
      console.error("Room listener error:", error);
      hideLoading();
      showHomeError("Lost connection to the room.");
    }
  );
}


// -----------------------------
// Main Interface
// -----------------------------

function updateInterface() {
  if (!roomData) {
    return;
  }

  if (roomData.status === "lobby") {
    renderLobby();
    showScreen("lobby");
  }

  if (roomData.status === "question") {
    renderGame();
    showScreen("game");
  }

  if (roomData.status === "finished") {
    renderResults();
    showScreen("results");
  }
}


// -----------------------------
// Lobby
// -----------------------------

function renderLobby() {
  roomCodeDisplay.textContent = currentRoomCode;

  const shareUrl =
    `${window.location.origin}${window.location.pathname}?room=${currentRoomCode}`;

  shareLink.textContent = shareUrl;

  const players = Object.values(roomData.players || {});

  playersList.innerHTML = "";

  players
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .forEach((player) => {
      const item = document.createElement("div");
      item.className = "player-item";

      const name = document.createElement("span");
      name.className = "player-name";
      name.textContent = player.name;

      const badge = document.createElement("span");

      if (
        roomData.hostId &&
        Object.keys(roomData.players || {}).find(
          (id) => id === roomData.hostId
        )
      ) {
        const playerId = Object.keys(roomData.players).find(
          (id) => roomData.players[id].name === player.name
        );

        if (playerId === roomData.hostId) {
          badge.className = "host-badge";
          badge.textContent = "HOST";
        }
      }

      item.appendChild(name);

      if (badge.textContent) {
        item.appendChild(badge);
      }

      playersList.appendChild(item);
    });

  if (isHost) {
    hostControls.classList.remove("hidden");

    if (players.length < 1) {
      startGameBtn.disabled = true;
      lobbyMessage.textContent = "Waiting for players...";
    } else {
      startGameBtn.disabled = false;
      lobbyMessage.textContent =
        players.length === 1
          ? "Share the room code to invite players."
          : `${players.length} players are ready.`;
    }
  } else {
    hostControls.classList.add("hidden");
    lobbyMessage.textContent = "Waiting for the host to start the game...";
  }
}


// -----------------------------
// Start Game
// -----------------------------

startGameBtn.addEventListener("click", startGame);

async function startGame() {
  if (!isHost || !roomData || roomData.status !== "lobby") {
    return;
  }

  startGameBtn.disabled = true;

  try {
    await update(ref(db, `rooms/${currentRoomCode}`), {
      status: "question",
      currentQuestion: 0,
      questionStartedAt: Date.now(),
      answers: {}
    });
  } catch (error) {
    console.error(error);
    startGameBtn.disabled = false;
  }
}


// -----------------------------
// Game
// -----------------------------

function renderGame() {
  const questionNumber = Number(roomData.currentQuestion);

  if (questionNumber < 0 || questionNumber >= questions.length) {
    return;
  }

  const question = questions[questionNumber];

  gameRoomCode.textContent = currentRoomCode;

  currentQuestionNumber.textContent = `${questionNumber + 1} / ${questions.length}`;
  questionIndexElement.textContent = `QUESTION ${questionNumber + 1}`;
  questionText.textContent = question.question;

  progressFill.style.width =
    `${((questionNumber + 1) / questions.length) * 100}%`;

  renderOptions(question, questionNumber);
  renderGameLeaderboard();

  startTimer();
}


// -----------------------------
// Render Options
// -----------------------------

function renderOptions(question, questionNumber) {
  optionsContainer.innerHTML = "";

  const myAnswer =
    roomData.answers &&
    roomData.answers[currentUser.uid];

  hasAnswered =
    myAnswer &&
    Number(myAnswer.questionIndex) === questionNumber;

  question.options.forEach((option, index) => {
    const button = document.createElement("button");

    button.className = "option-btn";
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

    if (hasAnswered) {
      button.disabled = true;

      if (index === Number(myAnswer.answerIndex)) {
        button.classList.add("selected");

        if (Number(myAnswer.answerIndex) === question.answer) {
          button.classList.add("correct");
        } else {
          button.classList.add("wrong");
        }
      }

      if (index === question.answer) {
        button.classList.add("correct");
      }
    }

    button.addEventListener("click", () => {
      submitAnswer(index);
    });

    optionsContainer.appendChild(button);
  });

  if (hasAnswered) {
    if (myAnswer.correct) {
      answerStatus.textContent =
        `Correct! You earned ${myAnswer.points} points.`;
    } else {
      answerStatus.textContent = "Wrong answer. Better luck next time!";
    }
  } else {
    answerStatus.textContent = "Choose an answer before time runs out.";
  }
}


// -----------------------------
// Submit Answer
// -----------------------------

async function submitAnswer(answerIndex) {
  if (
    !roomData ||
    roomData.status !== "question" ||
    hasAnswered
  ) {
    return;
  }

  const questionNumber = Number(roomData.currentQuestion);
  const question = questions[questionNumber];

  const startedAt = Number(roomData.questionStartedAt || Date.now());

  const elapsedSeconds =
    Math.max(0, Date.now() - startedAt) / 1000;

  const isCorrect = answerIndex === question.answer;

  let points = 0;

  if (isCorrect) {
    const speedBonus = Math.max(
      0,
      Math.round(500 - elapsedSeconds * 40)
    );

    points = 1000 + speedBonus;
  }

  hasAnswered = true;

  const currentScore =
    Number(roomData.players?.[currentUser.uid]?.score || 0);

  const newScore = currentScore + points;

  try {
    await update(ref(db, `rooms/${currentRoomCode}`), {
      [`answers/${currentUser.uid}`]: {
        questionIndex: questionNumber,
        answerIndex,
        correct: isCorrect,
        points,
        answeredAt: Date.now()
      },

      [`players/${currentUser.uid}/score`]: newScore
    });

    answerStatus.textContent = isCorrect
      ? `Correct! +${points} points`
      : "Wrong answer.";
  } catch (error) {
    console.error(error);
    hasAnswered = false;
    answerStatus.textContent =
      "Could not submit answer. Please try again.";
  }
}


// -----------------------------
// Timer
// -----------------------------

function startTimer() {
  clearTimer();

  const startedAt = Number(
    roomData.questionStartedAt || Date.now()
  );

  updateTimerDisplay(startedAt);

  timerInterval = setInterval(() => {
    if (!roomData || roomData.status !== "question") {
      clearTimer();
      return;
    }

    updateTimerDisplay(startedAt);
  }, 100);

  if (isHost) {
    setTimeout(() => {
      if (
        roomData &&
        roomData.status === "question" &&
        Number(roomData.currentQuestion) === Number(roomData.currentQuestion)
      ) {
        checkAdvance();
      }
    }, 10100);
  }
}


function updateTimerDisplay(startedAt) {
  const elapsed = (Date.now() - startedAt) / 1000;
  const remaining = Math.max(0, 10 - elapsed);

  timerElement.textContent = `${remaining.toFixed(1)}s`;

  if (remaining <= 0) {
    timerElement.textContent = "0.0s";

    if (isHost) {
      checkAdvance();
    }
  }
}


function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}


// -----------------------------
// Advance Question
// -----------------------------

async function checkAdvance() {
  if (
    !isHost ||
    advanceInProgress ||
    !roomData ||
    roomData.status !== "question"
  ) {
    return;
  }

  advanceInProgress = true;

  try {
    const players = roomData.players || {};
    const answers = roomData.answers || {};

    const playerIds = Object.keys(players);

    const everyoneAnswered =
      playerIds.length > 0 &&
      playerIds.every(
        (id) =>
          answers[id] &&
          Number(answers[id].questionIndex) ===
            Number(roomData.currentQuestion)
      );

    const questionNumber = Number(roomData.currentQuestion);

    const timeExpired =
      Date.now() -
        Number(roomData.questionStartedAt || Date.now()) >=
      10000;

    if (!everyoneAnswered && !timeExpired) {
      advanceInProgress = false;
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const nextQuestion = questionNumber + 1;

    if (nextQuestion >= questions.length) {
      await update(ref(db, `rooms/${currentRoomCode}`), {
        status: "finished"
      });
    } else {
      await update(ref(db, `rooms/${currentRoomCode}`), {
        status: "question",
        currentQuestion: nextQuestion,
        questionStartedAt: Date.now(),
        answers: {}
      });
    }
  } catch (error) {
    console.error("Advance error:", error);
  }

  advanceInProgress = false;
}


// -----------------------------
// Game Leaderboard
// -----------------------------

function renderGameLeaderboard() {
  const players = Object.entries(roomData.players || {});

  players.sort((a, b) => {
    return Number(b[1].score || 0) - Number(a[1].score || 0);
  });

  gameLeaderboard.innerHTML = "";

  players.forEach(([id, player], index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = `${index + 1}.`;

    const name = document.createElement("span");
    name.className = "leaderboard-player";
    name.textContent =
      id === currentUser.uid
        ? `${player.name} (You)`
        : player.name;

    const score = document.createElement("span");
    score.className = "score";
    score.textContent = `${Number(player.score || 0)} pts`;

    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(score);

    gameLeaderboard.appendChild(row);
  });
}


// -----------------------------
// Results
// -----------------------------

function renderResults() {
  clearTimer();

  const players = Object.entries(roomData.players || {});

  players.sort((a, b) => {
    return Number(b[1].score || 0) - Number(a[1].score || 0);
  });

  finalLeaderboard.innerHTML = "";

  players.forEach(([id, player], index) => {
    const row = document.createElement("div");
    row.className = "final-row";

    const rank = document.createElement("span");
    rank.className = "final-rank";

    if (index === 0) {
      rank.textContent = "🥇";
    } else if (index === 1) {
      rank.textContent = "🥈";
    } else if (index === 2) {
      rank.textContent = "🥉";
    } else {
      rank.textContent = `${index + 1}`;
    }

    const name = document.createElement("span");
    name.className = "final-name";
    name.textContent =
      id === currentUser.uid
        ? `${player.name} (You)`
        : player.name;

    const score = document.createElement("span");
    score.className = "final-score";
    score.textContent = `${Number(player.score || 0)} pts`;

    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(score);

    finalLeaderboard.appendChild(row);
  });

  if (isHost) {
    resultsHostControls.classList.remove("hidden");
  } else {
    resultsHostControls.classList.add("hidden");
  }
}


// -----------------------------
// Play Again
// -----------------------------

playAgainBtn.addEventListener("click", playAgain);

async function playAgain() {
  if (!isHost || !roomData) {
    return;
  }

  playAgainBtn.disabled = true;

  try {
    const updates = {
      status: "question",
      currentQuestion: 0,
      questionStartedAt: Date.now(),
      answers: {}
    };

    Object.keys(roomData.players || {}).forEach((id) => {
      updates[`players/${id}/score`] = 0;
    });

    await update(ref(db, `rooms/${currentRoomCode}`), updates);
  } catch (error) {
    console.error(error);
  }

  playAgainBtn.disabled = false;
}


// -----------------------------
// Copy Room Link
// -----------------------------

copyRoomBtn.addEventListener("click", async () => {
  const shareUrl =
    `${window.location.origin}${window.location.pathname}?room=${currentRoomCode}`;

  try {
    await navigator.clipboard.writeText(shareUrl);

    copyRoomBtn.textContent = "Copied!";

    setTimeout(() => {
      copyRoomBtn.textContent = "Copy Link";
    }, 1500);
  } catch (error) {
    console.error(error);
  }
});


// -----------------------------
// Leave Room
// -----------------------------

leaveRoomBtn.addEventListener("click", leaveRoom);
resultsLeaveBtn.addEventListener("click", leaveRoom);

async function leaveRoom() {
  if (!currentRoomCode) {
    showScreen("home");
    return;
  }

  const roomCode = currentRoomCode;

  try {
    if (isHost) {
      await remove(ref(db, `rooms/${roomCode}`));
    } else if (currentUser) {
      await remove(
        ref(db, `rooms/${roomCode}/players/${currentUser.uid}`)
      );
    }
  } catch (error) {
    console.error(error);
  }

  cleanupRoom();

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );

  playerNameInput.value = "";
  roomCodeInput.value = "";

  showScreen("home");
}


// -----------------------------
// URL Room Code
// -----------------------------

function checkRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room");

  if (roomCode) {
    roomCodeInput.value = roomCode.toUpperCase();
    playerNameInput.focus();
  }
}


// -----------------------------
// Generate Room Code
// -----------------------------

async function generateUniqueRoomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";

  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";

    for (let i = 0; i < 4; i++) {
      code += letters[Math.floor(Math.random() * letters.length)];
    }

    const snapshot = await get(ref(db, `rooms/${code}`));

    if (!snapshot.exists()) {
      return code;
    }
  }

  throw new Error("Could not generate room code.");
}


// -----------------------------
// UI Helpers
// -----------------------------

function showScreen(screen) {
  homeScreen.classList.remove("active");
  lobbyScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultsScreen.classList.remove("active");

  if (screen === "home") {
    homeScreen.classList.add("active");
  }

  if (screen === "lobby") {
    lobbyScreen.classList.add("active");
  }

  if (screen === "game") {
    gameScreen.classList.add("active");
  }

  if (screen === "results") {
    resultsScreen.classList.add("active");
  }
}


function setLoading(message) {
  loadingText.textContent = message;
  loadingOverlay.classList.remove("hidden");
}


function hideLoading() {
  loadingOverlay.classList.add("hidden");
}


function showHomeError(message) {
  homeError.textContent = message;
}


function clearHomeError() {
  homeError.textContent = "";
}


function cleanupRoom() {
  clearTimer();

  if (unsubscribeRoom) {
    unsubscribeRoom();
    unsubscribeRoom = null;
  }

  currentRoomCode = null;
  isHost = false;
  roomData = null;
  hasAnswered = false;
  advanceInProgress = false;
}