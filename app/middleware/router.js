const Router = require('koa-router');
const router = new Router();
const mongo = require('./mongo.js');
const koaBody = require('koa-body');

module.exports = async function(ctx, next) {
    router.get('/agent/:id', async (ctx, next) => {
        ctx.pug.locals.agentId = ctx.params.id;
        let db = await mongo.db('users');
        db.col.find({}).toArray((err, ret) => {
            console.log(ret);
            db.client.close();
        });
        ctx.render('index');
    });

    router.post('/api/submit/order', async (ctx, next) => {
        let body = ctx.request.body;
        //http://api.map.baidu.com/location/ip?ak=9c052a5be4c17b6d9e87a23db4fad4c7&ip=203.195.235.76&coor=bd09ll
        //http://api.map.baidu.com/geocoder/v2/?output=json&ak=9c052a5be4c17b6d9e87a23db4fad4c7&location=22.54605355,114.02597366
    });

    ctx.app.use(koaBody());
    ctx.app.use(router.routes());
    ctx.app.use(router.allowedMethods());

    await next();
};