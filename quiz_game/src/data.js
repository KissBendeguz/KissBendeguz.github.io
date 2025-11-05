const DATA_URL = "./public/data.json";

export async function loadGameData() {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Nem sikerült betölteni az adatokat.");
    const json = await res.json();
    if (Array.isArray(json)) {
        return { categories: {}, questions: json };
    }
    const questions = Array.isArray(json.questions) ? json.questions : [];
    const categories = json.categories || {};
    return { categories, questions };
}

function randomInt(max) {
    if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        let rand;
        const limit = Math.floor(0xffffffff / max) * max;
        do {
            window.crypto.getRandomValues(array);
            rand = array[0];
        } while (rand >= limit);
        return rand % max;
    }
    return Math.floor(Math.random() * max);
}

export function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function pickQuestions(allQuestions, { difficulty, count, category }) {
    let filtered = allQuestions.filter(q => q.difficulty === difficulty);
    if (category && category !== "all") {
        filtered = filtered.filter(q => q.category === category);
    }

    let pool = filtered;
    if (pool.length < count) {
        pool = allQuestions.filter(q =>
            category && category !== "all" ? q.category === category : true
        );
    }
    if (pool.length < count) {
        pool = allQuestions;
    }

    const shuffled = shuffle(pool);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}
