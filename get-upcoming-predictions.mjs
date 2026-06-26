import fs from 'fs';
import path from 'path';
import { predictMatch } from './predict.mjs';

const filePath = path.join(process.cwd(), 'data', 'wc2026-results.json');

function displayFixtures() {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ Data file not found at: ${filePath}`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const matches = data.matches;

        if (!Array.isArray(matches)) {
            console.error("❌ Invalid JSON format: 'matches' array is missing.");
            return;
        }

        // 1. Check for command line flags (--all)
        const showAll = process.argv.includes('--all');

        // 2. Filter matches based on the active flag
        const filteredMatches = showAll ? matches : matches.filter(match => match.status !== 'FT');

        console.log(`====================================================================`);
        console.log(`             WORLD CUP 2026 FIXTURES & MODEL PREDICTIONS            `);
        console.log(`             Scope: ${showAll ? 'ALL MATCHES' : 'UPCOMING ONLY'} (${filteredMatches.length} fixtures)`);
        console.log(`====================================================================\n`);

        if (filteredMatches.length === 0) {
            console.log("No matches found matching the criteria.");
            return;
        }

        // 3. Process the matches
        filteredMatches.forEach((match, index) => {
            const date = match.date || 'TBD';
            const round = match.round || '';
            const group = match.group ? `(${match.group})` : '';
            const isFinished = match.status === 'FT';

            console.log(`${index + 1}. [${date}] ${round} ${group} ${isFinished ? '🏁 [FINISHED]' : '⏳ [UPCOMING]'}`);

            // If the match is already finished, show its actual real-world result
            if (isFinished) {
                console.log(`   👉 Real Score: ${match.team1} ${match.g1} – ${match.g2} ${match.team2}`);
            } else {
                console.log(`   👉 Matchup:    ${match.team1} vs ${match.team2}`);
            }

            // Generate the model's statistical expectation
            try {
                const homeId = match.t1 || match.team1;
                const awayId = match.t2 || match.team2;
                const prediction = predictMatch(homeId, awayId);

                console.log(`      📊 Expected Goals (xG):`);
                console.log(`         - ${match.team1}: ${prediction.xG1.toFixed(2)}`);
                console.log(`         - ${match.team2}: ${prediction.xG2.toFixed(2)}`);
                console.log(`      🎲 Win Probabilities:`);
                console.log(`         - ${match.team1}: ${(prediction.prob1 * 100).toFixed(1)}%`);
                console.log(`         - Draw: ${(prediction.probDraw * 100).toFixed(1)}%`);
                console.log(`         - ${match.team2}: ${(prediction.prob2 * 100).toFixed(1)}%`);

            } catch (mathError) {
                console.log(`      ⚠️  Prediction engine skipped: Slugs not recognized.`);
            }

            console.log(`--------------------------------------------------------------------`);
        });

    } catch (error) {
        console.error("❌ Script execution failure:", error.message);
    }
}

displayFixtures();