const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 80;

SECRET_KEY = "1234";

// 정적 파일 제공을 위한 디렉토리 설정
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});

app.get('/team', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'homepage_team.html'))
})

app.get('/publications', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'homepage_publications.html'))
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'homepage_login.html'))
});

function ensureAuthenticated(req, res, next) {
    console.log('Cookies:', req.cookies); // 쿠키 로깅
    const token = req.cookies.authToken;
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

app.get('/crawler_web_dashboard', (req, res) => {
    res.redirect("http://bigmaclab-crawler.kro.kr:3000")
});

app.get('/link2', ensureAuthenticated, (req, res) => {
    res.send('This is Link 2, only for authenticated users.');
});

app.get('/link3', ensureAuthenticated, (req, res) => {
    res.send('This is Link 3, only for authenticated users.');
});


app.post('/login', (req, res) => {
    const usersPath = path.join(__dirname, 'public', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = users.find(u => u.username === req.body.username && u.password === req.body.password);
    if (user) {
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.cookie('authToken', token, {
            httpOnly: true,
            sameSite: 'Lax',  // Strict 또는 Lax를 사용할 수 있음
            path: '/'
        });
        res.json({ redirect: "/homepage_dashboard.html" });
    } else {
        res.status(401).send('Authentication failed');
    }
});





// 서버 시작
app.listen(PORT, () => {
    console.log('[ 홈페이지 서버 ]')
    console.log(`서버가 http://bigmaclab.kro.kr:80/ 에서 실행 중입니다`);
});
