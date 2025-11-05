export const SCREENS = {
  START: "start",
  GAME: "game",
  GAME_OVER: "gameover",
  LEADERBOARD: "leaderboard"
};

const STORAGE_KEY = "quizRushLeaderboard";

const initialState = {
  screen: SCREENS.START,
  selectedCategory: "all",
  categoryBg: "",
  status: "idle",
  questions: [],
  currentIndex: 0,
  timePerQuestion: 15,
  remainingTime: 0,
  score: 0,
  playerName: "",
  lastAnswer: null,
  lastAnswerCorrect: null,
  disabledAnswers: [],
  lifelines: {
    fiftyFiftyUsed: false,
    skipUsed: false,
    extraTimeUsed: false
  },
  leaderboard: []
};

let state = {
  ...initialState,
  leaderboard: loadLeaderboard()
};

const listeners = new Set();

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLeaderboard(list) {
  try {
    const trimmed = list.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

function addScoreEntry() {
  const entry = {
    name: state.playerName || "Névtelen",
    score: state.score,
    date: new Date().toISOString()
  };
  const all = loadLeaderboard();
  all.push(entry);
  all.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.date) - new Date(a.date);
  });
  const finalList = all.slice(0, 10);
  saveLeaderboard(finalList);
  state = { ...state, leaderboard: finalList };
}

export function getState() {
  // egyszerű mély másolat
  return JSON.parse(JSON.stringify(state));
}

function emit() {
  const snapshot = getState();
  listeners.forEach((fn) => fn(snapshot));
}

export function subscribe(listener) {
  listeners.add(listener);
  listener(getState());
  return () => listeners.delete(listener);
}

function setState(patch) {
  state = { ...state, ...patch };
  emit();
}

export function initGame(questions, options = {}) {
  const timePerQuestion = options.timePerQuestion ?? 15;
  const playerName = options.playerName || "Névtelen";
  const category = options.category || "all";
  const categoryBg = options.categoryBg || "";

  state = {
    ...initialState,
    screen: SCREENS.GAME,
    status: "question",
    questions,
    timePerQuestion,
    remainingTime: timePerQuestion,
    playerName,
    selectedCategory: category,
    categoryBg,
    leaderboard: loadLeaderboard()
  };

  emit();
}

export function decrementTime() {
  if (state.screen !== SCREENS.GAME || state.status !== "question") return;
  const remaining = Math.max(0, state.remainingTime - 1);
  setState({ remainingTime: remaining });
}

export function handleTimeUp() {
  if (state.screen !== SCREENS.GAME || state.status !== "question") return;
  setState({
    lastAnswer: null,
    lastAnswerCorrect: false,
    status: "feedback"
  });
}

export function registerAnswer(optionKey) {
  if (state.screen !== SCREENS.GAME || state.status !== "question") return;

  const currentQ = state.questions[state.currentIndex];
  if (!currentQ) return;
  if (!currentQ.answers || !(optionKey in currentQ.answers)) return;

  const isCorrect = optionKey === currentQ.correct;
  const extra = isCorrect ? state.remainingTime * 10 : 0;
  const gained = isCorrect ? 100 + extra : 0;

  setState({
    score: state.score + gained,
    lastAnswer: optionKey,
    lastAnswerCorrect: isCorrect,
    status: "feedback"
  });
}

export function goToNextQuestion() {
  if (state.screen !== SCREENS.GAME) return;

  const isLast = state.currentIndex >= state.questions.length - 1;
  if (isLast) {
    endGame();
    return;
  }

  setState({
    currentIndex: state.currentIndex + 1,
    remainingTime: state.timePerQuestion,
    lastAnswer: null,
    lastAnswerCorrect: null,
    disabledAnswers: [],
    status: "question"
  });
}

function endGame() {
  addScoreEntry();
  setState({
    screen: SCREENS.GAME_OVER,
    status: "finished",
    remainingTime: 0,
    disabledAnswers: []
  });
}

export function useFiftyFifty() {
  if (
    state.screen !== SCREENS.GAME ||
    state.status !== "question" ||
    state.lifelines.fiftyFiftyUsed
  ) {
    return;
  }

  const currentQ = state.questions[state.currentIndex];
  if (!currentQ) return;

  const options = Object.keys(currentQ.answers);
  const wrong = options.filter((key) => key !== currentQ.correct);

  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  const toDisable = wrong.slice(0, 2);

  setState({
    lifelines: { ...state.lifelines, fiftyFiftyUsed: true },
    disabledAnswers: toDisable
  });
}

export function useSkip() {
  if (
    state.screen !== SCREENS.GAME ||
    state.status !== "question" ||
    state.lifelines.skipUsed
  ) {
    return;
  }

  setState({
    lifelines: { ...state.lifelines, skipUsed: true }
  });

  goToNextQuestion();
}

export function useExtraTime() {
  if (
    state.screen !== SCREENS.GAME ||
    state.status !== "question" ||
    state.lifelines.extraTimeUsed
  ) {
    return;
  }

  setState({
    lifelines: { ...state.lifelines, extraTimeUsed: true },
    remainingTime: state.remainingTime + 5
  });
}

export function showLeaderboardScreen() {
  setState({
    screen: SCREENS.LEADERBOARD,
    status: state.status === "finished" ? "finished" : state.status,
    leaderboard: loadLeaderboard()
  });
}

export function backToMenu() {
  const lastCategory = state.selectedCategory;
  const lastBg = state.categoryBg;
  state = {
    ...initialState,
    selectedCategory: lastCategory,
    categoryBg: lastBg,
    leaderboard: loadLeaderboard()
  };
  emit();
}