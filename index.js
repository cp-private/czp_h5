const Route = require('./app/middleware/router.js')

const Koa = require('koa');
const app = new Koa();

//全局配置
global.middleware_path = `${__dirname}/app/middleware`;
global.VIEW_PATH       = `${__dirname}/app/view`;
global.APP_ROOT        = __dirname;
global.mongo_url       = 'mongodb://localhost:27017';
global.BAIDU_API_KEY   = '9c052a5be4c17b6d9e87a23db4fad4c7';
global.ALI_KEY         = process.env.ALI_KEY;

['render', 'router'].map(i => {
  app.use(require(`${middleware_path}/${i}.js`));
});


app.listen(3000);
