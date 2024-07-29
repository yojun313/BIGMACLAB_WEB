const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const python_CRAWLER_WEB = 'C:/Users/User/Documents/GitHub/BIGMACLAB/CRAWLER/CRAWLER_WEB.py'
const crawl_history_json = `C:/Users/User/Documents/GitHub/crawler_history.json`

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crawl_process.html'));
});

app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crawl_history.html'));
});

app.get('/add_crawler', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crawl_process.html'));
});

app.get('/getHistoryData', (req, res) => {
    fs.readFile(crawl_history_json, (err, data) => {
        if (err) {
            console.error('Failed to read file', err);
            res.status(500).send('Server error');
            return;
        }
        res.json(JSON.parse(data));
    });
});

app.delete('/deleteHistory', (req, res) => {
    const { index } = req.query; // Get index from query string
    fs.readFile(crawl_history_json, (err, data) => {
        if (err) {
            console.error('Failed to read file', err);
            res.status(500).send('Server error');
            return;
        }
        let history = JSON.parse(data);
        if (index >= 0 && index < history.length) {
            history.splice(index, 1); // Remove the item at the specified index
            fs.writeFile(crawl_history_json, JSON.stringify(history, null, 2), (err) => {
                if (err) {
                    console.error('Failed to write file', err);
                    res.status(500).send('Server error');
                    return;
                }
                res.json({ success: true });
            });
        } else {
            res.status(400).send('Invalid index');
        }
    });
});

let processes = {};

io.on('connection', (socket) => {
    
    socket.on('crawlInfo_submit', (data) => {
        const processId = Date.now().toString();
        const { name, crawl_object, start_day, end_day, option_select, keyword, uploadToDrive } = data;
        socket.emit('redirect', '/crawl_process');

        const worker = new Worker('C:/Users/User/Documents/GitHub/BIGMACLAB_WEB/crawlerWorker.js', {
            workerData: {
                scriptPath: python_CRAWLER_WEB,
                args: [name, crawl_object, start_day, end_day, option_select, keyword, uploadToDrive]
            }
        });

        processes[processId] = worker;

        worker.on('message', (output) => {
            io.emit('crawl_progress', { processId, output, name, crawl_object, start_day, end_day, option_select, keyword, uploadToDrive, output });
        });

        worker.on('error', error => {
            console.error(`Worker error: ${error}`);
        });

        worker.on('exit', (code) => {
        });
    });

    socket.on('terminate_process', (data) => {
        const processId = data.processId;
        if (processes[processId]) {
            processes[processId].terminate();
            processes[processId].postMessage('terminate');
            delete processes[processId];
            io.emit('process_terminated', processId);
        }
    });
});

const PORT = 80;
server.listen(PORT, () => {
});
