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

        fs.writeFileSync(jsonFile, jsonData);
        console.log('Data logged to JSON file:', jsonFile);

        // Send data to the FastAPI model
        const fastApiResponse = await axios.post('http://localhost:8000/your-model-endpoint', data);

        // Determine if the classification result indicates bot or human
        const classification = fastApiResponse.data.result; // Assuming the result contains 'human' or 'not_human'

        // Respond to the bot with the classification result
        res.status(200).json({ classification: classification });
        
        // Optionally delete the log after processing
        deleteJsonLog(jsonFile);
    } catch (error) {
        console.error('Error processing bot mouse movements:', error);
        res.status(500).json({ error: 'Failed to log bot mouse movements' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Bot server listening at http://localhost:${port}`);
});
