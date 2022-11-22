const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config/key');
const { auth } = require('./middleware/auth');
const { User } = require("./models/User");

// application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

//application/json
app.use(bodyParser.json());
app.use(cookieParser());

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log('에러!' + err))

// 메인화면 이동 시
app.get('/', (req, res) => {
    res.send('connecting normally')
})

// 회원가입 이동 시
app.post('/api/users/register', (req, res) => {

    // 회원 가입 할 때 필요한 정보들을 client에서 가져오면 그것들을 database에 넣어준다.
    const user = new User(req.body)

    // 몽고db save 메서드
    user.save((err, userInfo) => {
        if(err) return res.json({success: false, err})
        return res.status(200).json({
            success: true
        })
    })
})

app.post('/login', (req, res) => {

    // 요청된 이메일을 데이터베이스에서 있는지 찾는다.
    User.findOne({email: req.body.email}, (err, user)=>{
        if(!user){
            return res.json({
                loginSuccess: false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            })
        }
        // 요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호 인지 확인.
        user.comparePassword(req.body.password, (err, isMatch)=>{
            if(!isMatch)
                return res.json({loginSuccess: false, message: "비밀번호가 틀렸습니다."})

        // 비밀번호까지 맞다면 토큰을 생성하기.
            user.generateToken((err, user) =>{
                if(err) return res.status(400).send(err);

                // 토큰을 저장한다. 어디에 ? 쿠키, 로컬스토리지
                res.cookie("x_auth", user.token)
                    .status(200)
                    .json({loginSuccess: true, userId: user._id})
            })
        })
    })
})

app.get('/api/users/auth', (req, auth, res) => {

    // 여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication 이 true 라는 말
    // auth 에서 user를 찾아서 return 해주기 때문에 정보를 불러올 수 있음
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    })
})

// 로그아웃은 사용자 id로 db의 token을 조회해서 db의 token을 삭제한다.
app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({_id: req.user._id},
        {token: ""},
        (err, user) => {
        if(err) return res.json({success: false, err});
        return res.status(200).send({
            success: true
        })
    })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})