const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
const moment = require('moment-timezone');
const app = express();
const port = 3000;
const fastApiPort = 8000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

const classifyInteraction = async (data) => {
    try {
        const response = await axios.post(`http://localhost:${fastApiPort}/classify`, data); // Corrected API call
        return response.data.classification;
    } catch (error) {
        console.error('Error communicating with FastAPI:', error);
        return null;
    }
};

const deleteJsonLog = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting the JSON log file:', err);
        else console.log('JSON log file deleted successfully.');
    });
};

app.post('/logMouseMovements', async (req, res) => {
    const data = req.body;
    const timestamp = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss.SSS');
    data.timestamp = timestamp;

    const jsonFile = path.join(logsDir, 'mouse_movements.json');
    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

    const classification = await classifyInteraction(data);

    if (classification === 'human') {
        deleteJsonLog(jsonFile);
        res.redirect('/success');
    } else if (classification === 'bot') {
        deleteJsonLog(jsonFile);
        res.redirect('/error');
    } else {
        res.status(500).send('Error classifying interaction');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});
app.get('/error', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'error.html'));
});

app.listen(port, () => {
    console.log('Server running at http://localhost:' + port);
});