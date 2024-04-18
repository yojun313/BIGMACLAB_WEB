const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const PORT = 100;
const jwt = require('jsonwebtoken')

SECRET_KEY = "1234"

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

function authenticateToken(req, res, next) {
  const token = req.query.token;  // URL 파라미터에서 토큰 추출
  if (!token) {
      return res.status(401).send("Access Denied: No token provided.");
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
          return res.status(403).send("Access Denied: Invalid token.");
      }
      req.user = decoded;
      next();
  });
}

app.post('/login', (req, res) => {
  const usersPath = path.join(__dirname, 'public', 'users.json');
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const user = users.find(u => u.username === req.body.username && u.password === req.body.password);
  if (user) {
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token: token, redirect: "/Dashboard.html" });  // JWT 토큰과 리디렉션 URL을 응답으로 보냄
  } else {
      res.status(401).send('Authentication failed');
  }
});




app.get('/crawler_web_dashboard', authenticateToken, (req, res) => {
    res.redirect("http://bigmaclab-crawler.kro.kr:3000")
});

app.get('/link2', authenticateToken, (req, res) => {
    res.send('This is Link 2, only for authenticated users.');
});

app.get('/link3', authenticateToken, (req, res) => {
    res.send('This is Link 3, only for authenticated users.');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});