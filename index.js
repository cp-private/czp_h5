const Route = require('./app/middleware/router.js')

const Koa = require('koa');
const app = new Koa();


app
  .use(Route.routes())

app.listen(3000);
