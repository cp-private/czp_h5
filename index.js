const Route = require('./app/middleware/router.js')

const Koa = require('koa');
const app = new Koa();

//全局配置
global.middleware_path = `${__dirname}/app/middleware`;
global.VIEW_PATH       = `${__dirname}/app/view`;
global.APP_ROOT        = __dirname;
global.mongo_url       = 'mongodb://120.92.107.209:8890';

['render', 'router'].map(i => {
  app.use(require(`${middleware_path}/${i}.js`));
});


app.listen(3000);
