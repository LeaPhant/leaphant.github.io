// ==UserScript==
// @name         osu! ranked score
// @namespace    https://leaphant.github.io/
// @version      0.5
// @description  adds score for nomod ss to std beatmap pages
// @author       LeaPhant
// @match        http*://osu.ppy.sh/*
// @grant        none
// @updateURL    https://leaphant.github.io/userscripts/ranked-score.user.js
// ==/UserScript==

const rankedElementSelector =
'.beatmapset-header__box.beatmapset-header__box--stats > .beatmapset-header__status > .beatmapset-status.beatmapset-status--show';

const RANKED_STATE = {
    '-2': 'Graveyard',
    '-1': 'WIP',
    '0': 'Pending',
    '1': 'Ranked',
    '2': 'Approved',
    '3': 'Qualified',
    '4': 'Loved'
};

async function pageChange() {
    const { hash } = window.location;

    if (!hash.startsWith('#osu/')) {
        return;
    }

    const mapId = hash.split('/')[1];

    const rankedStateElement = document.querySelector(rankedElementSelector);

    let rankedState = 'ranked';

    for (const childNode of rankedStateElement.childNodes) {
        if (childNode.nodeType === Node.TEXT_NODE) {
            rankedState = childNode.textContent.toLowerCase().trim();
            break;
        }
    }

    if (rankedState && !['ranked', 'qualified', 'approved', 'loved'].includes(rankedState)) {
        return;
    }

    const beatmapInfo = await (await fetch(`https://osu.lea.moe/b/${mapId}`)).json();

    const { beatmap } = beatmapInfo;

    const { max_score } = beatmap;
    let formattedScore = "";

    if (max_score >= 1000000000) {
        formattedScore =`${(max_score / 1000000000).toFixed(2)}b`;
    } else if (max_score >= 100000000) {
        formattedScore =`${Math.round(max_score / 1000000)}m`;
    } else if (max_score >= 1000000) {
        formattedScore =`${(max_score / 1000000).toFixed(1)}m`;
    } else if(max_score >= 1000) {
        formattedScore =`${Math.floor(max_score / 1000)}k`;
    }

    rankedStateElement.innerHTML = `<span title="${max_score.toLocaleString()}" style="opacity:.85">${formattedScore} </span>&nbsp;<span style="white-space:nowrap">${RANKED_STATE[beatmap.approved]} Score</span>`;
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

(new MutationObserver(check)).observe(document, {childList: true, subtree: true});

function check(changes, observer) {
    if(document.querySelector(rankedElementSelector)) {
        observer.disconnect();
        pageChange();
    }
}

window.addEventListener('hashchange', pageChange);
