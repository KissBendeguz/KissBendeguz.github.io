import { loadGameData, pickQuestions } from "./data.js";
import {
    SCREENS,
    getState,
    subscribe,
    initGame,
    decrementTime,
    handleTimeUp,
    registerAnswer,
    goToNextQuestion,
    useFiftyFifty,
    useSkip,
    useExtraTime,
    showLeaderboardScreen,
    backToMenu
} from "./state.js";
import { initDom, render, setAvailableCategories } from "./dom.js";
import { initCanvas } from "./canvas.js";

let timerId = null;
let feedbackTimeoutId = null;
let gameData = { categories: {}, questions: [] };

function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
        const state = getState();
        if (state.screen !== SCREENS.GAME) return;

        decrementTime();

        const updated = getState();
        if (
            updated.screen === SCREENS.GAME &&
            updated.status === "question" &&
            updated.remainingTime <= 0
        ) {
            handleTimeUp();
            scheduleAutoNext();
        }
    }, 1000);
}

function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function scheduleAutoNext() {
    clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = setTimeout(() => {
        const state = getState();
        if (state.screen === SCREENS.GAME && state.status === "feedback") {
            goToNextQuestion();
        }
    }, 1500);
}

async function handleStartGame({ name, difficulty, category }) {
  let timePerQuestion = 15;
  if (difficulty === "easy") timePerQuestion = 20;
  else if (difficulty === "normal") timePerQuestion = 15;
  else if (difficulty === "hard") timePerQuestion = 10;

  try {
    const all = gameData.questions;

    const selected = pickQuestions(all, {
      difficulty: difficulty,
      count: 10,
      category: category
    });

    const bg = (gameData.categories?.[category]?.bg) || "";

    initGame(selected, {
      playerName: name,
      timePerQuestion,
      category: category,
      categoryBg: bg
    });
    startTimer();
  } catch (err) {
    console.error(err);
    alert("Hiba történt a kérdések betöltésekor.");
  }
}


function handleAnswer(optionKey) {
    const state = getState();
    if (state.screen !== SCREENS.GAME || state.status !== "question") return;

    registerAnswer(optionKey);
    scheduleAutoNext();
}

function handleLifeline(type) {
    switch (type) {
        case "fifty":
            useFiftyFifty();
            break;
        case "skip":
            useSkip();
            break;
        case "extraTime":
            useExtraTime();
            break;
    }
}

function handleNextQuestion() {
    const state = getState();
    if (state.screen === SCREENS.GAME && state.status === "feedback") {
        goToNextQuestion();
    }
}

function handleRestart() {
    stopTimer();
    backToMenu();
}

function handleShowLeaderboard() {
    stopTimer();
    showLeaderboardScreen();
}

function handleBackToMenu() {
    backToMenu();
}

function handleSpace() {
    const state = getState();
    if (state.screen === SCREENS.GAME && state.status === "feedback") {
        goToNextQuestion();
    }
}

async function init() {
    try {
        gameData = await loadGameData();
    } catch (err) {
        console.error(err);
        alert("Hiba történt az adatok betöltésekor.");
        return;
    }


    // HTML overlay
    initDom({
        onStartGame: handleStartGame,
        onAnswer: handleAnswer,
        onLifeline: handleLifeline,
        onNextQuestion: handleNextQuestion,
        onRestart: handleRestart,
        onShowLeaderboard: handleShowLeaderboard,
        onBackToMenu: handleBackToMenu,
        onSpace: handleSpace
    });

    // Kategóriák listázása a start képernyőn
    const categoryNames = Object.keys(gameData.categories || {});
    setAvailableCategories(categoryNames);

    // Canvas – az egész játék UI-ja
    const canvas = document.getElementById("quizCanvas");
    initCanvas(canvas, getState, {
        onAnswer: handleAnswer,
        onLifeline: handleLifeline,
        onNextQuestion: handleNextQuestion
    });

    // State → DOM (csak overlay képernyők)
    subscribe((state) => {
        render(state);

        if (state.screen !== SCREENS.GAME) {
            stopTimer();
        } else if (!timerId && state.status === "question") {
            startTimer();
        }
    });
}

init();
