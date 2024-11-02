const famousMovies: string[] = [
    "the-godfather",
    "the-shawshank-redemption",
    "schindlers-list",
    "raging-bull",
    "casablanca",
    "citizen-kane",
    "gone-with-the-wind",
    "the-wizard-of-oz",
    "one-flew-over-the-cuckoos-nest",
    "lawrence-of-arabia",
    "vertigo",
    "psycho",
    "the-dark-knight",
    "12-angry-men",
    "star-wars-episode-iv-a-new-hope",
    "goodfellas",
    "forrest-gump",
    "fight-club",
    "the-lord-of-the-rings-the-return-of-the-king",
    "the-silence-of-the-lambs",
    "saving-private-ryan",
    "pulp-fiction",
    "the-good-the-bad-and-the-ugly",
    "the-lord-of-the-rings-the-fellowship-of-the-ring",
    "inception",
    "the-empire-strikes-back",
    "gladiator",
    "interstellar",
    "the-lord-of-the-rings-the-two-towers",
    "back-to-the-future",
    "braveheart",
    "raiders-of-the-lost-ark",
    "toy-story",
    "the-green-mile",
    "a-beautiful-mind",
    "the-departed",
    "django-unchained",
    "the-lion-king",
    "the-shining",
    "terminator-2-judgment-day",
    "jaws",
    "fargo",
    "american-beauty",
    "the-sixth-sense",
    "alien",
    "the-truman-show",
    "memento",
    "a-clockwork-orange",
    "the-great-dictator",
    "avengers-infinity-war",
    "et-the-extra-terrestrial",
    "apocalypse-now",
    "the-bourne-identity",
    "the-big-lebowski",
    "casino-royale",
    "mad-max-fury-road",
    "whiplash",
    "rocky",
    "american-history-x",
    "the-hurt-locker",
    "taxi-driver",
    "full-metal-jacket",
    "the-social-network",
    "shutter-island",
    "the-wolf-of-wall-street",
    "the-pianist",
    "the-intouchables",
    "the-grand-budapest-hotel",
    "blade-runner",
    "12-years-a-slave",
    "joker",
    "harry-potter-and-the-philosophers-stone",
    "beauty-and-the-beast",
    "slumdog-millionaire",
    "toy-story-3",
    "finding-nemo",
    "spider-man-into-the-spider-verse",
    "dead-poets-society",
    "singin-in-the-rain",
    "jurassic-park",
    "heat",
    "the-matrix",
    "the-great-gatsby",
    "the-usual-suspects",
    "no-country-for-old-men",
    "there-will-be-blood",
    "la-la-land",
    "moonlight",
    "the-shape-of-water",
    "the-avengers",
    "the-lobster",
    "edward-scissorhands",
    "glory",
    "the-french-connection",
    "true-grit",
    "gone-girl",
    "the-kings-speech",
    "the-bfg",
    "scent-of-a-woman",
    "the-life-of-pi",
    "les-miserables",
    "big-fish",
    "the-fifth-element",
    "city-of-god",
    "batman-begins",
    "the-dark-knight-rises",
    "man-of-steel",
    "gravity",
    "edge-of-tomorrow",
    "blade-runner-2049",
    "the-artist",
    "the-birdcage",
    "donnie-darko",
    "the-blair-witch-project",
    "spotlight",
    "children-of-men",
    "the-big-short",
    "argo",
    "black-panther",
    "life-is-beautiful",
    "dances-with-wolves",
    "the-last-samurai",
    "schindlers-list",
    "se7en",
    "logan",
    "dr-strangelove",
    "platoon",
    "groundhog-day",
    "the-princess-bride",
    "amadeus",
    "before-sunrise",
    "finding-forrester",
    "cool-hand-luke",
    "the-maltese-falcon",
    "the-thin-red-line",
    "a-few-good-men",
    "catch-me-if-you-can",
    "the-deer-hunter",
    "the-butterfly-effect",
    "witness",
    "ghostbusters",
    "inside-out",
    "rango",
    "trainspotting",
    "hidden-figures",
    "pacific-rim",
    "the-terminal",
    "the-great-escape",
    "mad-max",
    "one-hundred-and-one-dalmatians",
    "the-fault-in-our-stars",
    "the-hunger-games",
    "an-education",
    "juno",
    "babe",
    "superbad",
    "easy-a",
    "ferris-buellers-day-off",
    "good-will-hunting",
    "stand-by-me",
    "close-encounters-of-the-third-kind",
    "ben-hur",
    "for-a-few-dollars-more",
    "the-bridge-on-the-river-kwai",
    "north-by-northwest",
    "freaky-friday",
    "mystic-river",
    "the-imitation-game",
    "law-abiding-citizen",
    "the-mission",
    "truman",
    "the-naked-gun",
    "annie-hall",
    "the-last-emperor",
    "rebecca",
    "a-streetcar-named-desire",
    "the-english-patient",
    "serpico",
    "hannah-and-her-sisters",
    "the-bourne-supremacy",
    "black-swan",
    "the-road",
    "mr-smith-goes-to-washington",
    "doubt",
    "notorious",
    "sin-city",
    "pretty-woman",
    "rain-man",
    "war-horse",
    "all-the-presidents-men",
    "sense-and-sensibility",
    "the-last-crusade",
    "dog-day-afternoon",
    "the-day-the-earth-stood-still",
    "the-gold-rush",
    "the-lives-of-others",
    "the-sweet-hereafter",
    "harry-potter-and-the-deathly-hallows",
    "in-the-heat-of-the-night"
];

import { v4 as uuidv4 } from 'uuid';

export function createRandomCallId(): [roomId: string, callId: string] {
    const roomId = famousMovies[Math.floor(Math.random() * famousMovies.length)];
    return [roomId, `${roomId}-${uuidv4().substring(0, 8)}`];
}

export function cmpUuids(uuid1: string, uuid2: string): number {
    const uuid1Parts = uuid1.split('-');
    const uuid2Parts = uuid2.split('-');

    for (let i = 0; i < 5; i++) {
        const uuid1Part = parseInt(uuid1Parts[i], 16);
        const uuid2Part = parseInt(uuid2Parts[i], 16);

        if (uuid1Part < uuid2Part) {
            return -1;
        } else if (uuid1Part > uuid2Part) {
            return 1;
        }
    }

    return 0;
}
