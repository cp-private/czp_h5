const Router = require('koa-router');
const router = new Router();
const mongo = require('./mongo.js');

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

    ctx.app.use(router.routes());
    ctx.app.use(router.allowedMethods());

    await next();
};