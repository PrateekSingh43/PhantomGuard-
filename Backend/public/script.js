let mouseMotions = [];
let lastMouseTime = Date.now();
const COLLECTION_DURATION = 12000;
let isCollecting = false;
let collectionTimeout = null;

const startCollection = () => {
    if (isCollecting) return;

    mouseMotions = [];
    lastMouseTime = Date.now();
    isCollecting = true;
    document.addEventListener('mousemove', onMouseMove);

    collectionTimeout = setTimeout(stopCollection, COLLECTION_DURATION);
};

const onMouseMove = (event) => {
    if (!isCollecting) return;

    const now = Date.now();
    const duration = now - lastMouseTime;
    const length = Math.sqrt(Math.pow(event.movementX, 2) + Math.pow(event.movementY, 2));

    mouseMotions.push({ length, duration, timestamp: now });
    lastMouseTime = now;
};

const stopCollection = () => {
    document.removeEventListener('mousemove', onMouseMove);
    isCollecting = false;
    clearTimeout(collectionTimeout);

    if (mouseMotions.length > 0) {
        processMouseMovements();
    }
};

const processMouseMovements = () => {
    const numSegments = mouseMotions.length;
    const distinctMouseMotions = new Set(mouseMotions.map(m => `${m.length}-${m.duration}`)).size;
    const avgLength = numSegments > 0 ? mouseMotions.reduce((sum, m) => sum + m.length, 0) / numSegments : 0;
    const avgTime = numSegments > 0 ? mouseMotions.reduce((sum, m) => sum + m.duration, 0) / numSegments : 0;
    const avgSpeed = numSegments > 0 ? mouseMotions.reduce((sum, m) => sum + (m.length / m.duration), 0) / numSegments : 0;
    const speedVariances = mouseMotions.map(m => (m.length / m.duration) - avgSpeed);
    const varSpeed = numSegments > 0 ? speedVariances.reduce((sum, v) => sum + (v ** 2), 0) / numSegments : 0;
    const accVariations = mouseMotions.map(m => ((m.length / m.duration) - avgSpeed) / (m.duration / 1000));
    const varAcc = numSegments > 0 ? accVariations.reduce((sum, v) => sum + (v ** 2), 0) / numSegments : 0;

    const data = { numSegments, distinctMouseMotions, avgLength, avgTime, avgSpeed, varSpeed, varAcc };

    fetch('/logMouseMovements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
};

document.addEventListener('mousemove', () => {
    if (!isCollecting) {
        startCollection();
    }
}, { once: true })