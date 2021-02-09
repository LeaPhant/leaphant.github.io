// ==UserScript==
// @name         osu! ranked score
// @namespace    https://leaphant.github.io/
// @version      0.1
// @description  adds score for nomod ss to std beatmap pages
// @author       LeaPhant
// @match        http*://osu.ppy.sh/*
// @grant        none
// @run-at      document-idle
// ==/UserScript==

async function pageChange() {
    const { hash } = window.location;

    if (!hash.startsWith('#osu/')) {
        return;
    }

    const mapId = hash.split('/')[1];

    const beatmapInfo = await (await fetch(`https://osu.lea.moe/b/${mapId}`)).json();

    const rankedStateElement =
    document.querySelector('.beatmapset-header__box.beatmapset-header__box--stats > .beatmapset-status.beatmapset-status--show');

    let rankedState = 'Ranked';

    for (const childNode of rankedStateElement.childNodes) {
        if (childNode.nodeType === Node.TEXT_NODE) {
            rankedState = childNode.textContent;
            break;
        }
    }

    rankedStateElement.innerHTML = `<span style="opacity:.85">${beatmapInfo.beatmap.max_score.toLocaleString()} </span>${rankedState}<span> Score</span>`;
}

const pushState = history.pushState;

history.pushState = function(){
    pushState.apply(history, arguments);
    pageChange();
};

const replaceState = history.replaceState;

history.replaceState = function(){
    replaceState.apply(history, arguments);
    pageChange();
};

(() => {
    pageChange();
})();
