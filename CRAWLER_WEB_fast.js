const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { Worker } = require('worker_threads');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const python_CRAWLER_WEB = 'C:/Users/User/Documents/GitHub/BIGMACLAB/CRAWLER/CRAWLER_WEB.py';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crawl_info_fast.html'));
});

let processes = {};
let keywordProcesses = {};  // 키워드별로 프로세스 아이디 관리

function splitYears(startDate, endDate) {
    const start = new Date(startDate.substring(0, 4), startDate.substring(4, 6) - 1, startDate.substring(6, 8));
    const end = new Date(endDate.substring(0, 4), endDate.substring(4, 6) - 1, endDate.substring(6, 8));
  
    let current = new Date(start);
    const results = [];
  
    while (current <= end) {
      let startOfYear = (current.getTime() === start.getTime()) ? new Date(current) : new Date(current.getFullYear(), 0, 1);
      let endOfYear = new Date(current.getFullYear(), 11, 31);
      if (endOfYear > end) {
        endOfYear = new Date(end);
      }
  
      results.push([
        `${startOfYear.getFullYear()}${String(startOfYear.getMonth() + 1).padStart(2, '0')}${String(startOfYear.getDate()).padStart(2, '0')}`,
        `${endOfYear.getFullYear()}${String(endOfYear.getMonth() + 1).padStart(2, '0')}${String(endOfYear.getDate()).padStart(2, '0')}`
      ]);
  
      current = new Date(endOfYear.getFullYear() + 1, 0, 1);
    }
  
    return results;
}

io.on('connection', (socket) => {
    socket.on('crawlInfo_submit', (data) => {
        const { name, crawl_object, start_day, end_day, option_select, keyword, uploadToDrive } = data;
        const dateRanges = splitYears(start_day, end_day);
        const requestId = Date.now().toString();
        processes[requestId] = [];

        socket.emit('redirect', '/crawl_process_fast.html');

        dateRanges.forEach((range, index) => {
            const processId = `${requestId}-${index}`;
            const args = [name, crawl_object, range[0], range[1], option_select, keyword, uploadToDrive];

            const worker = new Worker('C:/Users/User/Documents/GitHub/BIGMACLAB_WEB/crawlerWorker.js', {
                workerData: {
                    scriptPath: python_CRAWLER_WEB,
                    args: args
                }
            });

            processes[processId] = worker;
            if (!keywordProcesses[keyword]) {
                keywordProcesses[keyword] = [];
            }
            keywordProcesses[keyword].push(processId);

            worker.on('message', (output) => {
                io.emit('crawl_progress', {
                    requestId,
                    processId,
                    output,
                    name,
                    crawl_object,
                    start_day, // overall start day
                    end_day, // overall end day
                    current_start: range[0], // current range start day
                    current_end: range[1], // current range end day
                    option_select,
                    keyword,
                    uploadToDrive,
                    output
                });
            });

            worker.on('error', error => {
                console.error(`Worker error: ${error}`);
            });

            worker.on('exit', (code) => {
                io.emit('crawl_finished', { processId, code });
            });
        });
    });

    socket.on('terminate_process', (data) => {
        const { keyword } = data;
        
        keywordProcesses[keyword].forEach(processId => {
            processes[processId].terminate();
            delete processes[processId];
        });
        delete keywordProcesses[keyword];
        io.emit('process_terminated', { keyword });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('[ CRAWLER WEB 서버 ]')
    console.log(`- 서버가 http://bigmaclab-crawler.kro.kr:3000 에서 실행 중입니다`);
});
