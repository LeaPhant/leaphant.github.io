const OsuDBParser = require("osu-db-parser");
const _ = require('lodash');
const osuDB = new OsuDBParser();

const fileSelect = document.getElementById("file_osudb");
const reader = new FileReader();
reader.onload = loadFile;

const list = {
    ranked: document.getElementById("missing_ranked"),
    qualified: document.getElementById("missing_qualified"),
    loved: document.getElementById("missing_loved")
};

let currentBeatmaps;

const fetchBeatmapsPromise = new Promise(async (resolve, reject) => {
    try{
        currentBeatmaps = await(await fetch("https://osu.lea.moe/beatmaps")).json();
        resolve();
    }catch(e){
        reject(e);
    }
});

function addEntries(section, beatmaps, pages){
    const element = list[section];

    element.innerHTML = "";

    for(const beatmap of beatmaps){
        const entry = document.createElement("li");

        entry.innerHTML = 
          `[<a target="_blank" href="https://osu.ppy.sh/s/${beatmap.beatmapset_id}">osu.ppy.sh</a>]`
        + ` [<a href="osu://dl/${beatmap.beatmapset_id}">osu!direct</a>]`
        + ` ${beatmap.artist} - ${beatmap.title} (${beatmap.creator})`;

        element.appendChild(entry);
    }

    if(pages > 1){
        const currentPage = page[section];
        const entry = document.createElement("p");

        const prevPage = document.createElement('a');
        const nextPage = document.createElement('a');

        prevPage.innerHTML = 'prev';
        nextPage.innerHTML = 'next';

        entry.appendChild(prevPage);
        entry.appendChild(document.createTextNode(` • Page ${currentPage + 1} / ${pages} • `));
        entry.appendChild(nextPage);

        if (currentPage > 0) {
            prevPage.href = '#';
            prevPage.addEventListener('click', e => {
                element.innerHTML = "Loading new page...";
                element.appendChild(entry);
                e.preventDefault();
                page[section]--;
                loadSection(section).catch(console.error);
            }, { once: true });
        } else {
            prevPage.style.color = 'rgba(255,255,255,0.5)';
        }

        if ((currentPage + 1) < pages){
            nextPage.href = '#';
            nextPage.addEventListener('click', e => {
                element.innerHTML = "Loading new page...";
                element.appendChild(entry);
                e.preventDefault();
                page[section]++;
                loadSection(section).catch(console.error);
            }, { once: true });
        } else {
            nextPage.style.color = 'rgba(255,255,255,0.5)';
        }

        element.appendChild(entry);
    }
}

async function fetchBeatmaps(beatmaps, page){
    return await(
        await fetch('https://osu.lea.moe/b/', {
            method: 'POST',
            mode: 'cors',
            body: beatmaps.slice(0 + 2000 * page, 2000 + 2000 * page).join(',')
        })
    ).json();
}

const SECTIONS = ['ranked', 'qualified', 'loved'];
const missing = {}, page = {};
let loading = 0;

async function loadSection(section) {
    document.getElementById("loading_text").style.visibility = 'visible';
    loading++;

    startTime = Date.now();

    const currentPage =  page[section];
    const pages = Math.ceil(missing[section].length / 2000);

    console.log(`fetching ${section} beatmaps (page ${currentPage + 1} / ${pages})`);

    const maps = await fetchBeatmaps(missing[section], currentPage);
    
    console.log('took', (Date.now() - startTime) / 1000, 's');

    const mapsets = _.uniqBy(maps.map(a => a.beatmap), 'beatmapset_id');

    document.getElementById(`missing_${section}_text`).innerText = 
        `Missing ${_.upperFirst(section)} Maps (${missing[section].length})`;

    addEntries(section, mapsets, pages);
    loading--;

    if (loading == 0) document.getElementById("loading_text").style.visibility = 'hidden';
}

async function loadFile(){
    osuDB.setBuffer("osudb", Buffer.from(reader.result));

    let { beatmaps } = osuDB.getOsuDBData();

    beatmaps = beatmaps.map(a => a.beatmap_id);

    await fetchBeatmapsPromise;

    for (const section of SECTIONS) {
        missing[section] = _.difference(currentBeatmaps[section].beatmaps, beatmaps);
        page[section] = 0;
        loadSection(section).catch(console.error);
    }
}

function updateFile(){
    document.getElementById("loading_text").style.visibility = 'visible';

    const file = fileSelect.files[0];

    document.getElementById("last_modified_time").innerHTML = new Date(file.lastModified).toString();

    reader.readAsArrayBuffer(file, "UTF-8");
}

fileSelect.addEventListener("change", updateFile);

window.addEventListener("load", () => {
    fetchBeatmapsPromise.then(() => {
        document.getElementById("ranked_map_count").innerHTML = currentBeatmaps.ranked.amount.toLocaleString();
    }).catch(console.error);
});
