const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const app = express();
const port = 3001; // Separate port for the bot server

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true }); // Ensure the directory is created if it doesn't exist
}

// Endpoint to handle mouse movement data from the bot
app.post('/logBotMouseMovements', (req, res) => {
    try {
        const data = req.body;
        const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss.SSS');

        // Append timestamp to the data
        data.timestamp = timestamp;

        // CSV file for bot movements
        const logFile = path.join(logsDir, 'botMouse_movements.csv');
        // JSON file for bot movements
        const jsonFile = path.join(logsDir, 'botMouse_movements.json');

        // If file does not exist, create and add header for CSV
        if (!fs.existsSync(logFile)) {
            fs.writeFileSync(logFile, 'timestamp,numSegments,distinctMouseMotions,avgLength,avgTime,avgSpeed,varSpeed,varAcc,label\n');
        }

        // Log the data in CSV format
        const logData = `${data.timestamp},${data.numSegments},${data.distinctMouseMotions},${data.avgLength},${data.avgTime},${data.avgSpeed},${data.varSpeed},${data.varAcc},1\n`;
        fs.appendFile(logFile, logData, (err) => {
            if (err) {
                console.error('Failed to log CSV data', err);
                return res.status(500).send('Error logging data');
            }
        });

        // Log the same data in JSON format (No raw data, just the sub-parameters)
        const jsonData = JSON.stringify({
            timestamp: data.timestamp,
            numSegments: data.numSegments,
            distinctMouseMotions: data.distinctMouseMotions,
            avgLength: data.avgLength,
            avgTime: data.avgTime,
            avgSpeed: data.avgSpeed,
            varSpeed: data.varSpeed,
            varAcc: data.varAcc,
            label: 1
        }, null, 2); // Pretty-print JSON

        fs.appendFile(jsonFile, jsonData + ',\n', (err) => {
            if (err) {
                console.error('Failed to log JSON data', err);
                return res.status(500).send('Error logging JSON data');
            }
            res.status(200).send('Data logged successfully');
        });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Server error');
    }
});

// Start the bot server
app.listen(port, () => {
    console.log(`Bot server is running on http://localhost:${port}`);
});
