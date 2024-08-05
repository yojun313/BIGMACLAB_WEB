const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 특정 폴더 경로 (여기에 exe 파일들이 저장되어 있어야 합니다)
const folderPath = "D:/BIGMACLAB/CRAWLER/BIGMACLAB_MANAGER";

// 파일 목록 엔드포인트
app.get('/files', (req, res) => {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory.');
    }
    // .exe 파일만 필터링
    const exeFiles = files.filter(file => path.extname(file).toLowerCase() === '.exe');

    res.json(exeFiles);
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
  console.log(`Server is running on http://localhost:${PORT}`);
});
