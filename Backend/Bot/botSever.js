const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const axios = require('axios');  // Required for sending data to FastAPI

const app = express();
const port = 3001; // Separate port for the bot server

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Correct logs directory to 'backend/logs'
const logsDir = path.join(__dirname, '../logs');  // Corrected path to 'backend/logs'
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true }); // Ensure the directory is created if it doesn't exist
}

// Function to delete JSON log file after classification
const deleteJsonLog = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting the JSON log file:', err);
        } else {
            console.log('JSON log file deleted successfully.');
        }
    });
};

// Endpoint to handle mouse movement data from the bot
app.post('/logBotMouseMovements', async (req, res) => {
    try {
        const data = req.body;
        const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss.SSS');
        data.timestamp = timestamp;

        // Correct JSON file path for bot movements, stored in 'backend/logs'
        const jsonFile = path.join(logsDir, `botMouse_movements_${Date.now()}.json`); // Use unique file name

        // Log the data in JSON format
        const jsonData = JSON.stringify({
            timestamp: data.timestamp,
            numSegments: data.numSegments,
            distinctMouseMotions: data.distinctMouseMotions,
            avgLength: data.avgLength,
            avgTime: data.avgTime,
            avgSpeed: data.avgSpeed,
            varSpeed: data.varSpeed,
            varAcc: data.varAcc
        }, null, 2); // Pretty-print JSON

        fs.writeFileSync(jsonFile, jsonData); // Write the JSON file

        // Send data to FastAPI for classification
        const response = await axios.post('http://localhost:8000/classify', data);

        console.log('Classification result from FastAPI:', response.data.classification);

        // Delete the JSON log file after classification
        deleteJsonLog(jsonFile);

        res.status(200).send('Data logged and classified successfully');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Server error');
    }
});

// Start the bot server
app.listen(port, () => {
    console.log('Bot server is running on http://localhost:' + port);
});