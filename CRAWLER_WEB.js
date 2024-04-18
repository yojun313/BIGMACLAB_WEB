const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { Worker } = require('worker_threads');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const python_CRAWLER_WEB = 'C:/Users/User/Documents/GitHub/BIGMACLAB/CRAWLER/CRAWLER_WEB.py'

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crawl_info.html'));
});

let processes = {};

io.on('connection', (socket) => {
    
    socket.on('crawlInfo_submit', (data) => {
        const processId = Date.now().toString();
        const { name, crawl_object, start_day, end_day, option_select, keyword, uploadToDrive } = data;
        console.log(option_select)
        socket.emit('redirect', '/crawl_process.html');

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
            delete processes[processId];
            io.emit('process_terminated', processId);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('[ CRAWLER WEB 서버 ]')
    console.log(`- 서버가 http://bigmaclab-crawler.kro.kr:3000 에서 실행 중입니다`);
});
