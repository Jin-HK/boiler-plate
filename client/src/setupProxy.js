const { createProxyMiddleware } = require('http-proxy-middleware');

// 프록시 사용하여 node 서버는 5000이고 react 는 3000번 포트여서 발생하는 CORS 이슈를 해결한다.
module.exports = function(app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
        })
    );
};