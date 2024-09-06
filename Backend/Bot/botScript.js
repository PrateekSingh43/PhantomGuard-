const axios = require('axios');
const puppeteer = require('puppeteer');

const MIN_TOTAL_DURATION = 2000; // Minimum total time for all pages (2 seconds)
const MAX_TOTAL_DURATION = 7000; // Maximum total time for all pages (7 seconds)
let mouseMotions = [];

// Pages to visit on localhost:3000 (human interaction demo site)
const pages = [
    'http://localhost:3000/',
    'http://localhost:3000/home_page/index.html',
    'http://localhost:3000/Aadhaar_home_page/index.html',
    'http://localhost:3000/login_page/index.html'
];

// Function to generate a random 12-digit Aadhaar number
const generateAadhaarNumber = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

// Function to simulate mouse movement
const simulateMouseMovement = async (page, timeToSpend) => {
    console.log(`Simulating mouse movement for ${timeToSpend} ms`);

    const startTime = Date.now();
    while (Date.now() - startTime < timeToSpend) {
        const length = Math.random() * 105.3987492837 * Math.random(); // Random length for movement
        const now = Date.now();
        const duration = Math.random() * 103.937334235 * Math.random(); // Simulate 100ms intervals

        mouseMotions.push({
            length: length,
            duration: duration,
            timestamp: now
        });

        await page.mouse.move(Math.random() * 500, Math.random() * 500); // Move mouse randomly on the page
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
    }

    console.log(`Mouse movement simulation ended for ${timeToSpend} ms`);
};

// Function to process mouse movements and send data to the bot server
const processMouseMovements = () => {
    if (mouseMotions.length === 0) {
        console.log('No mouse movements recorded.');
        return;
    }

    const numSegments = mouseMotions.length;
    const distinctMouseMotions = new Set(mouseMotions.map(m => `${m.length}-${m.duration}`)).size;
    const avgLength = mouseMotions.reduce((sum, m) => sum + m.length, 0) / numSegments;
    const avgTime = mouseMotions.reduce((sum, m) => sum + m.duration, 0) / numSegments;
    const avgSpeed = mouseMotions.reduce((sum, m) => sum + (m.length / m.duration), 0) / numSegments;
    const speedVariances = mouseMotions.map(m => (m.length / m.duration) - avgSpeed);
    const varSpeed = speedVariances.reduce((sum, v) => sum + (v ** 2), 0) / numSegments;
    const accVariations = mouseMotions.map(m => ((m.length / m.duration) - avgSpeed) / (m.duration / 1000));
    const varAcc = accVariations.reduce((sum, v) => sum + (v ** 2), 0) / numSegments;

    const data = {
        label: 1,  // Updated from humanInteraction to botInteraction
        numSegments: numSegments,
        distinctMouseMotions: distinctMouseMotions,
        avgLength: avgLength,
        avgTime: avgTime,
        avgSpeed: avgSpeed,
        varSpeed: varSpeed,
        varAcc: varAcc
    };

    console.log('Sending combined sub-parameters to server:', data);

    axios.post('http://localhost:3001/logBotMouseMovements', data)
        .then(response => console.log('Server response:', response.data))
        .catch(error => console.error('Error sending data to server:', error));
};

// Function to generate random time distribution between pages, ensuring total is between 2 and 7 seconds
const generateRandomTimes = (numPages, minTime, maxTime) => {
    let totalTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime; // Total time between min and max
    let times = Array(numPages).fill(0);

    for (let i = 0; i < numPages - 1; i++) {
        // Allocate random time to each page, but ensure the remaining time for the last page is valid
        times[i] = Math.floor(Math.random() * (totalTime - (numPages - i - 1)));
        totalTime -= times[i];
    }
    times[numPages - 1] = totalTime; // Assign the remaining time to the last page

    return times;
};

// Function to visit each page, simulate mouse movements, input Aadhaar number, and click login
const visitPages = async () => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1586, height: 990 } });

    console.log('Generating log for single iteration');

    const page = await browser.newPage();
    const randomTimes = generateRandomTimes(pages.length, MIN_TOTAL_DURATION, MAX_TOTAL_DURATION);
    let remainingTime = randomTimes.reduce((a, b) => a + b, 0); // Total time allocated for all pages

    for (let i = 0; i < pages.length; i++) {
        const url = pages[i];
        console.log(`Visiting ${url}`);
        await page.goto(url, { waitUntil: 'load', timeout: 0 });
        console.log(`Navigated to ${url}`);

        // Simulate mouse movement for the randomly allocated time for this page
        const timeForPage = randomTimes[i];
        console.log(`Time allocated for page ${i + 1}: ${timeForPage} ms`);
        await simulateMouseMovement(page, timeForPage);

        // If on the login page, input the Aadhaar number and click login
        if (url === 'http://localhost:3000/login_page/index.html') {
            const aadhaarNumber = generateAadhaarNumber();
            console.log(`Generated Aadhaar Number: ${aadhaarNumber}`);
            await page.type('#aadhaarNumber', aadhaarNumber);
            await page.click('button[type="submit"]');
        }
    }

    console.log('Closing page session.');
    await page.close();

    // Process the collected mouse movements once all pages have been visited
    processMouseMovements();

    console.log('Closing browser session.');
    await browser.close();
};

// Initialize the process
visitPages();
