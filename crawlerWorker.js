const { workerData, parentPort } = require('worker_threads');
const { spawn } = require('child_process');

const { scriptPath, args } = workerData;
const pythonProcess = spawn('python', ['-u', scriptPath, ...args]);

pythonProcess.stdout.on('data', (data) => {
    parentPort.postMessage(data.toString());
});

pythonProcess.stderr.on('data', (data) => {
    parentPort.postMessage(`Error: ${data}`);
});

pythonProcess.on('close', (code) => {
    parentPort.postMessage(`크롤링 종료`);
});
