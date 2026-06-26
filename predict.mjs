#!/usr/bin/env node
// Predict any head-to-head from the calibrated ratings.
//   node predict.mjs brazil argentina            (neutral venue)
//   node predict.mjs usa mexico usa               (3rd arg = home team)
import { readFileSync } from "node:fs";
import { matchProb } from "./elo.mjs";

const { ratings } = JSON.parse(readFileSync(new URL("./data/elo-calibrated.json", import.meta.url), "utf8"));

/**
 * Programmatic export function to let other scripts tap into the math engine.
 * @param {string} a - First team slug
 * @param {string} b - Second team slug
 * @param {string} [home] - Optional home team slug
 * @returns {object} Probabilities and expected goals
 */
export function predictMatch(a, b, home) {
    const ra = ratings[a];
    const rb = ratings[b];

    if (ra == null || rb == null) {
        throw new Error(`Unknown team lookup: a=${a} (${ra}), b=${b} (${rb})`);
    }

    const hb = home === a ? 75 : home === b ? -75 : 0;
    const p = matchProb(ra, rb, hb);

    return {
        ra,
        rb,
        hb,
        home,
        prob1: p.winA,
        probDraw: p.draw,
        prob2: p.winB,
        xG1: p.expectedGoalsA,
        xG2: p.expectedGoalsB
    };
}

// --- CLI Block Execution Guard ---
// This block only runs if the script is invoked directly in the terminal via `node predict.mjs`
if (process.argv[1] && (process.argv[1].endsWith('predict.mjs') || process.argv[1] === import.meta.url)) {
    const [a, b, home] = process.argv.slice(2);

    if (!a || !b) {
        console.log("Usage: node predict.mjs <teamA> <teamB> [homeTeam]\n");
        console.log("Teams:\n  " + Object.keys(ratings).sort().join(", "));
        process.exit(0);
    }

    if (ratings[a] == null || ratings[b] == null) {
        console.error(`Unknown team: ${ratings[a] == null ? a : b}\nAvailable: ${Object.keys(ratings).sort().join(", ")}`);
        process.exit(1);
    }

    try {
        const res = predictMatch(a, b, home);
        const bar = (x) => "█".repeat(Math.round(x * 30));

        console.log(`\n  ${a} (Elo ${res.ra})  vs  ${b} (Elo ${res.rb})${res.hb ? `   [${res.home} at home]` : "   [neutral]"}\n`);
        console.log(`  ${a.padEnd(16)} win  ${(res.prob1 * 100).toFixed(1).padStart(5)}%  ${bar(res.prob1)}`);
        console.log(`  ${"draw".padEnd(16)}      ${(res.probDraw * 100).toFixed(1).padStart(5)}%  ${bar(res.probDraw)}`);
        console.log(`  ${b.padEnd(16)} win  ${(res.prob2 * 100).toFixed(1).padStart(5)}%  ${bar(res.prob2)}`);
        console.log(`\n  expected goals:  ${res.xG1.toFixed(2)} – ${res.xG2.toFixed(2)}\n`);
        console.log("  Full 48-team tournament title odds (50,000 sims, conditioned on real results): https://cup26matches.com");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}