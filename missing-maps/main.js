const OsuDBParser = require("osu-db-parser");
const _ = require('lodash');
const osuDB = new OsuDBParser();

const fileSelect = document.getElementById("file_osudb");
const reader = new FileReader();
reader.onload = loadFile;

const rankedList = document.getElementById("missing_ranked");
const qualifiedList = document.getElementById("missing_qualified");
const lovedList = document.getElementById("missing_loved");

function addEntries(element, beatmaps, truncated = false){
    for(const beatmap of beatmaps){
        const entry = document.createElement("li");

        entry.innerHTML = 
          `[<a target="_blank" href="https://osu.ppy.sh/s/${beatmap.beatmapset_id}">osu.ppy.sh</a>]`
        + ` [<a href="osu://dl/${beatmap.beatmapset_id}">osu!direct</a>]`
        + ` ${beatmap.artist} - ${beatmap.title} (${beatmap.creator})`;

        element.appendChild(entry);
    }

    if(truncated){
        const entry = document.createElement("li");
        entry.appendChild(document.createTextNode('…and more'));

        element.appendChild(entry);
    }
}

async function fetchBeatmaps(beatmaps){
    return await(
        await fetch('https://osu.lea.moe/b/', {
            method: 'POST',
            mode: 'cors',
            body: beatmaps.slice(0,2000).join(',')
        })
    ).json();
}

async function loadFile(){
    osuDB.setBuffer("osudb", Buffer.from(reader.result));

    let { beatmaps } = osuDB.getOsuDBData();

    beatmaps = beatmaps.map(a => a.beatmap_id);

    const result = await(await fetch("https://osu.lea.moe/beatmaps")).json();

    let startTime = Date.now();

    console.log('finding difference')

    const rankedMissing = _.difference(result.ranked.beatmaps, beatmaps);
    const qualifiedMissing = _.difference(result.qualified.beatmaps, beatmaps);
    const lovedMissing = _.difference(result.loved.beatmaps, beatmaps);
    
    console.log('took', (Date.now() - startTime) / 1000, 's');

    startTime = Date.now();

    console.log('fetching beatmaps');

    const rankedMaps = await fetchBeatmaps(rankedMissing);
    const qualifiedMaps = await fetchBeatmaps(qualifiedMissing);
    const lovedMaps = await fetchBeatmaps(lovedMissing);
    
    console.log('took', (Date.now() - startTime) / 1000, 's');

    startTime = Date.now();

    console.log('getting unique mapsets');

    const rankedMapsets = _.uniqBy(rankedMaps.map(a => a.beatmap), 'beatmapset_id');
    const qualifiedMapsets = _.uniqBy(qualifiedMaps.map(a => a.beatmap), 'beatmapset_id');
    const lovedMapsets = _.uniqBy(lovedMaps.map(a => a.beatmap), 'beatmapset_id');

    console.log('took', (Date.now() - startTime) / 1000, 's');

    document.getElementById('missing_ranked_text').innerText = 
        `Missing Ranked Maps (${rankedMissing.length})`;
    document.getElementById('missing_qualified_text').innerText = 
        `Missing Qualified Maps (${qualifiedMissing.length})`;
    document.getElementById('missing_loved_text').innerText = 
        `Missing Loved Maps (${lovedMissing.length})`;

    addEntries(rankedList, rankedMapsets, rankedMissing.length > 2000);
    addEntries(qualifiedList, qualifiedMapsets, qualifiedMissing.length > 2000);
    addEntries(lovedList, lovedMapsets, lovedMissing.length > 2000);

    document.getElementById("loading_text").style.visibility = 'hidden';
}

function updateFile(){
    document.getElementById("loading_text").style.visibility = 'visible';

    const file = fileSelect.files[0];

    document.getElementById("last_modified_time").innerHTML = new Date(file.lastModified).toString();

    reader.readAsArrayBuffer(file, "UTF-8");
}

fileSelect.addEventListener("change", updateFile);