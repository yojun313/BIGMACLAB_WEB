const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 90;

// 특정 폴더 경로 (여기에 exe 파일들이 저장되어 있어야 합니다)
const folderPath = "D:/BIGMACLAB/CRAWLER/BIGMACLAB_MANAGER";

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
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB' // 파일 크기를 MB 단위로 변환
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
  
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found.');
    }
  });
});

// HTML 파일 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manager_download.html'));
});

app.listen(PORT, () => {
});
