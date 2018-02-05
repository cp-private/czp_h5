const Router = require('koa-router');
var router = new Router();

module.exports = async function(ctx, next) {
    router.get('/agent/:id', async (ctx, next) => {
        ctx.pug.locals.agentId = ctx.params.id;
        ctx.render('index');
    });

    ctx.app.use(router.routes());
    ctx.app.use(router.allowedMethods());

    await next();
};