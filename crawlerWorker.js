const { workerData, parentPort } = require('worker_threads');
const { spawn } = require('child_process');
const fs = require('fs');
const crawl_history_path = 'C:/Users/skroh/Documents/BIGMACLAB/CRAWLER/crawler_history.json'

const { scriptPath, args } = workerData;
const pythonProcess = spawn('python', ['-u', scriptPath, ...args]);

let terminationReason = 'completed'; // Default termination reason

pythonProcess.stdout.on('data', (data) => {
    parentPort.postMessage(data.toString());
});

pythonProcess.stderr.on('data', (data) => {
    parentPort.postMessage(`Error: ${data}`);
});

pythonProcess.on('close', async (code) => {
    if (code !== 0) {
        // 프로세스가 비정상적으로 종료된 경우
        return;
    }
    const newCrawlData = {
        name: args[0],
        crawl_object: args[1],
        start_day: args[2],
        end_day: args[3],
        option_select: args[4],
        keyword: args[5],
        uploadToDrive: args[6],
        timestamp: new Date().toISOString(),
    };

    fs.readFile(crawl_history_path, (err, data) => {
        let crawlDataList = [];
        if (!err) {
            try {
                crawlDataList = JSON.parse(data);
            } catch (parseError) {
                console.error('Error parsing JSON data:', parseError);
            }
        }

        crawlDataList.push(newCrawlData);

        fs.writeFile(crawl_history_path, JSON.stringify(crawlDataList, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing JSON data:', writeErr);
            }
        });
    });
});

parentPort.on('message', (message) => {
    if (message === 'terminate') {
        terminationReason = 'terminated';
        pythonProcess.kill('SIGINT');
    }
});
