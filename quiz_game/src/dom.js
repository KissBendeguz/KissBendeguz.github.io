let elements = {};
let handlers = {};

export function initDom(passedHandlers) {
    handlers = passedHandlers;

    elements = {
        app: document.querySelector(".app"),
        categorySelect: document.getElementById("categorySelect"),
        uiLayer: document.getElementById("ui-layer"),
        screens: {
            start: document.getElementById("screen-start"),
            gameover: document.getElementById("screen-gameover"),
            leaderboard: document.getElementById("screen-leaderboard")
        },

        startForm: document.getElementById("start-form"),
        playerNameInput: document.getElementById("playerNameInput"),
        difficultySelect: document.getElementById("difficultySelect"),
        btnShowLeaderboardFromStart: document.getElementById("btnShowLeaderboardFromStart"),

        finalScore: document.getElementById("final-score"),
        btnRestart: document.getElementById("btnRestart"),
        btnShowLeaderboard: document.getElementById("btnShowLeaderboard"),

        btnBackToMenu: document.getElementById("btnBackToMenu"),
        leaderboardBody: document.getElementById("leaderboard-body")
    };

    bindEvents();
}

function bindEvents() {
    elements.startForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = elements.playerNameInput.value.trim();
        const difficulty = elements.difficultySelect.value || "normal";
        const category = elements.categorySelect?.value || "all";

        handlers.onStartGame && handlers.onStartGame({ name, difficulty, category });
    });

    elements.btnShowLeaderboardFromStart.addEventListener("click", () => {
        handlers.onShowLeaderboard && handlers.onShowLeaderboard();
    });

    elements.btnRestart.addEventListener("click", () => {
        handlers.onRestart && handlers.onRestart();
    });

    elements.btnShowLeaderboard.addEventListener("click", () => {
        handlers.onShowLeaderboard && handlers.onShowLeaderboard();
    });

    elements.btnBackToMenu.addEventListener("click", () => {
        handlers.onBackToMenu && handlers.onBackToMenu();
    });

    window.addEventListener("keydown", (e) => {
        const key = e.key;
        if (["1", "2", "3", "4"].includes(key)) {
            const map = { "1": "A", "2": "B", "3": "C", "4": "D" };
            handlers.onAnswer && handlers.onAnswer(map[key]);
        } else if (key === " " || key === "Spacebar") {
            e.preventDefault();
            handlers.onSpace && handlers.onSpace();
        }
    });
}

export function render(state) {
    if (!elements.app) return;

    if (state.screen === "game") {
        elements.app.classList.add("app--in-game");
    } else {
        elements.app.classList.remove("app--in-game");
    }

    updateScreens(state);

    if (state.screen === "gameover") {
        renderGameOver(state);
    } else if (state.screen === "leaderboard") {
        renderLeaderboard(state);
    }
}

function updateScreens(state) {
    Object.values(elements.screens).forEach((el) => el.classList.remove("active"));

    if (state.screen === "start") {
        elements.screens.start.classList.add("active");
    } else if (state.screen === "gameover") {
        elements.screens.gameover.classList.add("active");
    } else if (state.screen === "leaderboard") {
        elements.screens.leaderboard.classList.add("active");
    }
}

function renderGameOver(state) {
    elements.finalScore.textContent = state.score;
}

function renderLeaderboard(state) {
    const tbody = elements.leaderboardBody;
    tbody.innerHTML = "";

    if (!state.leaderboard || state.leaderboard.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = "Még nincs elmentett eredmény.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    const TOP_ICONS = ["bi-shield-fill", "bi-shield-shaded", "bi-shield"];

    state.leaderboard.forEach((entry, index) => {
        const tr = document.createElement("tr");

        const rank = document.createElement("td");
        if (index < 3) {
            const i = document.createElement("i");
            i.className = `bi ${TOP_ICONS[index]}`;
            i.setAttribute("aria-hidden", "true");
            i.style.marginRight = "0.4rem";
            rank.appendChild(i);
            rank.appendChild(document.createTextNode(String(index + 1)));
        } else {
            rank.textContent = index + 1;
        }

        const name = document.createElement("td");
        name.textContent = entry.name || "Névtelen";

        const score = document.createElement("td");
        score.textContent = entry.score;

        const date = document.createElement("td");
        const d = new Date(entry.date);
        date.textContent = isNaN(d.getTime())
            ? "-"
            : d.toLocaleString("hu-HU", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            });

        tr.appendChild(rank);
        tr.appendChild(name);
        tr.appendChild(score);
        tr.appendChild(date);

        tbody.appendChild(tr);
    });
}

export function setAvailableCategories(categoryNames = []) {
    if (!elements.categorySelect) return;
    elements.categorySelect.innerHTML = "";

    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "Összes kategória";
    elements.categorySelect.appendChild(optAll);

    categoryNames.forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        elements.categorySelect.appendChild(opt);
    });
}
