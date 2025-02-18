const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const https = require('https');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const app = express();
const PORT = 90;

// 특정 폴더 경로 (여기에 exe 파일들이 저장되어 있어야 합니다)
const folderPath = "D:/BIGMACLAB/BIGMACLAB_MANAGER/Output";

// 정적 파일 제공을 위한 디렉토리 설정
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression()); // GZIP 압축 활성화

var options = {
    key: fs.readFileSync(path.join(__dirname, 'public', 'ssl.key'), 'utf8'),
    cert: fs.readFileSync(path.join(__dirname, 'public', 'ssl.crt'), 'utf8'),
    ca: [
        fs.readFileSync(path.join(__dirname, 'public', 'chain_ssl.crt'), 'utf8'),
        fs.readFileSync(path.join(__dirname, 'public', 'chain_all_ssl.crt'), 'utf8')
    ],
    passphrase: 'bigmaclab2022!'
};

app.get('/files', (req, res) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory.');
        }

        // .exe 파일만 필터링
        const exeFiles = files.filter(file => path.extname(file).toLowerCase() === '.exe');

        // 파일 정보 배열
        const fileInfoArray = exeFiles.map(file => {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath); // 파일의 상태 정보 가져오기
            return {
                name: file,
                size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB', // 파일 크기를 MB 단위로 변환
                created: stats.birthtime.toISOString().split('T')[0] // 파일 생성 날짜만 추가 (YYYY-MM-DD 형식)
            };
        });

        // 버전 비교 함수
        const compareVersions = (a, b) => {
            const versionA = a.name.match(/(\d+\.\d+\.\d+)/)[0].split('.').map(Number);
            const versionB = b.name.match(/(\d+\.\d+\.\d+)/)[0].split('.').map(Number);

            for (let i = 0; i < versionA.length; i++) {
                if (versionA[i] > versionB[i]) return -1;
                if (versionA[i] < versionB[i]) return 1;
            }
            return 0;
        };

        // 버전 순으로 정렬
        fileInfoArray.sort(compareVersions);
        res.json(fileInfoArray);
    });
});

// 파일 다운로드 엔드포인트
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(folderPath, filename);

    fs.stat(filePath, (err, stats) => {
        if (err) {
            return res.status(404).send('File not found.');
        }

        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': stats.size,
            'Cache-Control': 'public, max-age=31536000'
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

// HTML 파일 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manager_download.html'));
});

https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS server is running on port ${PORT}`);
});
