const Router = require('koa-router');
var router = new Router();
router.get('/agent/:id', async (ctx, next) => {
    ctx.body = `aaa--${ctx.params.id}`;
});

module.exports = router;