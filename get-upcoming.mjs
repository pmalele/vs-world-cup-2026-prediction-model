import fs from 'fs';
import path from 'path';

// Define the path to your results JSON file
const filePath = path.join(process.cwd(), 'data', 'wc2026-results.json');

function getUpcomingGames() {
    try {
        // 1. Read and parse the JSON data
        if (!fs.existsSync(filePath)) {
            console.error(`Error: Could not find file at ${filePath}`);
            return;
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(rawData);

        // FIX: Point directly to the .matches array inside the root object
        const matchArray = data.matches;

        if (!Array.isArray(matchArray)) {
            console.error("Error: The 'matches' property is missing or is not an array.");
            return;
        }

        // 2. Filter for upcoming games (status is not 'FT')
        const upcomingMatches = matchArray.filter(match => match.status !== 'FT');

        // 3. Display the upcoming schedule
        console.log(`====================================================`);
        console.log(`         UPCOMING WORLD CUP 2026 FIXTURES           `);
        console.log(`         (${upcomingMatches.length} unplayed matches remaining)`);
        console.log(`====================================================\n`);

        if (upcomingMatches.length === 0) {
            console.log("No upcoming matches found! The tournament might be complete.");
            return;
        }

        upcomingMatches.forEach((match, index) => {
            const date = match.date || 'Unknown Date';
            const round = match.round || '';
            const group = match.group ? `(${match.group})` : '';

            console.log(`${index + 1}. [${date}] ${round} ${group}`);
            console.log(`   👉 ${match.team1} vs ${match.team2}`);
            console.log(`      Slugs: ${match.t1} 🆚 ${match.t2}`);
            console.log(`----------------------------------------------------`);
        });

    } catch (error) {
        console.error("An error occurred while parsing the match data:", error.message);
    }
}

// Execute the function
getUpcomingGames();