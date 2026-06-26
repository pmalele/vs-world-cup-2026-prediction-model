import fs from 'fs';
import path from 'path';
import { predictMatch } from './predict.mjs';

const inputFilePath = path.join(process.cwd(), 'data', 'wc2026-results.json');
const outputFilePath = path.join(process.cwd(), 'data', 'export-predictions.json');

function exportUnifiedFlatPredictions() {
    try {
        if (!fs.existsSync(inputFilePath)) {
            console.error(`❌ Input data file not found at: ${inputFilePath}`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));
        const matches = data.matches;

        if (!Array.isArray(matches)) {
            console.error("❌ Invalid JSON format: 'matches' array is missing.");
            return;
        }

        console.log(`⏳ Evaluating and flattening all ${matches.length} tournament fixtures...`);

        // Process all games unconditionally
        const processedMatches = matches.map((match) => {
            const isFinished = match.status === 'FT';

            const homeSlug = match.t1 || match.team1.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const awaySlug = match.t2 || match.team2.toLowerCase().replace(/[^a-z0-9]/g, '-');

            // Base flat match layout using strict dot path notation keys
            const flatMatch = {
                "date": match.date || 'TBD',
                "time": match.time || '12:00', // Capture UTC baseline
                "round": match.round || '',
                "group": match.group || null,
                "status": match.status,

                // Team structures flattened via dots
                "team1.fullName": match.team1,
                "team1.slug": homeSlug,
                "team2.fullName": match.team2,
                "team2.slug": awaySlug,

                // Real-world performance results data points
                "realResults.g1": isFinished ? match.g1 : null,
                "realResults.g2": isFinished ? match.g2 : null,
                "realResults.pens1": isFinished ? match.pens1 : null,
                "realResults.pens2": isFinished ? match.pens2 : null,
                "realResults.winner": isFinished ? match.winner : null,

                // Algorithmic simulation probabilities & expectations 
                "prediction.xG1": null,
                "prediction.xG2": null,
                "prediction.prob.t1Win": null,
                "prediction.prob.draw": null,
                "prediction.prob.t2Win": null,
                "prediction.error": null
            };

            // Ingest prediction variables out of the active Elo matrix
            try {
                const prediction = predictMatch(homeSlug, awaySlug);

                flatMatch["prediction.xG1"] = parseFloat(prediction.xG1.toFixed(2));
                flatMatch["prediction.xG2"] = parseFloat(prediction.xG2.toFixed(2));
                flatMatch["prediction.prob.t1Win"] = parseFloat((prediction.prob1 * 100).toFixed(1));
                flatMatch["prediction.prob.draw"] = parseFloat((prediction.probDraw * 100).toFixed(1));
                flatMatch["prediction.prob.t2Win"] = parseFloat((prediction.prob2 * 100).toFixed(1));
            } catch (mathError) {
                flatMatch["prediction.error"] = "Slugs not recognized in active model calibration.";
            }

            return flatMatch;
        });

        // Sort systematically: Latest matches first, descending down to the oldest
        processedMatches.sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}:00Z`);
            const dateTimeB = new Date(`${b.date}T${b.time}:00Z`);
            return dateTimeB - dateTimeA;
        });

        // Encapsulate structural package array inside root data block
        const outputEnvelope = {
            exportedAt: new Date().toISOString(),
            totalMatchesExported: processedMatches.length,
            matches: processedMatches
        };

        // Save and write the JSON schema payload string
        fs.writeFileSync(outputFilePath, JSON.stringify(outputEnvelope, null, 2), 'utf-8');
        console.log(`✅ Compilation successful! Flat JSON generated at: ${outputFilePath}`);

    } catch (error) {
        console.error("❌ Critical processing failure:", error.message);
    }
}

exportUnifiedFlatPredictions();