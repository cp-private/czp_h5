const Router = require('koa-router');
const router = new Router();
const mongo = require('./mongo.js');
const koaBody = require('koa-body');
const request = require('request');
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment');


module.exports = async function(ctx, next) {
    router.get('/user/say', async (ctx, next) => {
        ctx.render('say');
    });

    router.get('/agent/:id', async (ctx, next) => {
        ctx.pug.locals.agentId = ctx.params.id;
        let db = await mongo.db('agents');
        let ret = await db.col.find({_id: ObjectId(ctx.params.id)}).toArray();
        ctx.pug.locals.agentName = ret[0] ? ret[0].name: '无代理商';
        db.client.close();
        ctx.render('index');
    });

    router.get('/send/validcode/:tel', async (ctx, next) => {
        //ALI_KEY
    });

    router.get('/order/:type', async (ctx, next) => {
        ctx.pug.locals.type = ctx.params.type;
        ctx.pug.locals.agent = ctx.query.agent;
        ctx.render('order');
    });

    router.get('/orderlist/:tel', async (ctx, next) => {
        let db = await mongo.db('orders');
        let ret = await db.col.find({tel: ctx.params.tel}).toArray();
        db.client.close();
        ctx.body = JSON.stringify(ret);
    });

    router.post('/user/comment', async (ctx, next) => {
        let body = ctx.request.body;
        body.create_date = moment(Number(body.create_date)).format('YYYY-MM-DD hh:mm:ss');
        let db = await mongo.db('comments');
        let ret = await db.col.insert(body);
        db.client.close();
        if (ret.result.ok > 0) {
            ctx.body = 'ok';
        } else {
            ctx.body = 'faild';
        }
    })

    router.get('/admin/__users__', async(ctx, next) => {
        let db = await mongo.db('users');
        let ret = await db.col.find({}).toArray();
        db.client.close();
        ctx.pug.locals.list = ret;
        ctx.render('admin-users');
    })

    router.get('/admin/__orders__', async(ctx, next) => {
        let db = await mongo.db('orders');
        let ret = await db.col.find({}).toArray();
        db.client.close();
        ctx.pug.locals.list = ret;
        ctx.render('admin-orders');
    })

    router.get('/admin/__comments__', async(ctx, next) => {
        let db = await mongo.db('comments');
        let ret = await db.col.find({}).toArray();
        db.client.close();
        ctx.pug.locals.list = ret;
        ctx.render('admin-comments');
    })

    router.get('/admin/__agents__', async(ctx, next) => {
        let db = await mongo.db('agents');
        let ret = await db.col.find({}).toArray();
        db.client.close();
        ctx.pug.locals.list = ret;
        ctx.render('admin-agents');
    })

    router.get('/admin/__port__', async(ctx, next) => {
        ctx.render('admin');
    })

    //http://api.map.baidu.com/location/ip?ak=9c052a5be4c17b6d9e87a23db4fad4c7&ip=203.195.235.76&coor=bd09ll
    //http://api.map.baidu.com/geocoder/v2/?output=json&ak=9c052a5be4c17b6d9e87a23db4fad4c7&location=22.54605355,114.02597366
    router.post('/api/submit/order', async (ctx, next) => {
        let body = ctx.request.body;
        let clientIp = getClientIp(ctx.req);
        if (body.lat && body.lng) {
            let data = await fetch(`http://api.map.baidu.com/geocoder/v2/?output=json&ak=${BAIDU_API_KEY}&location=${body.lat},${body.lng}`)
            body.addr = data.result.formatted_address;
        } else {
            let data = await fetch(`http://api.map.baidu.com/location/ip?ak=${BAIDU_API_KEY}&ip=${clientIp}&coor=bd09ll`)
            try {
                body.addr = data.content.address;
                body.lat = data.content.point.x;
                body.lng = data.content.point.y;
            } catch(e) {
                body.addr = '无名地';
                body.lat = 0;
                body.lng = 0;
            }

            let data = await fetch(`http://api.map.baidu.com/geocoder/v2/?output=json&ak=${BAIDU_API_KEY}&location=${body.lat},${body.lng}`)
            body.addr = data.result.formatted_address;
        }

        //验证码是否正确

        body.create_date = moment(+body.create_date).format('YYYY-MM-DD hh:mm:ss');
        let db = await mongo.db('orders');
        let ret = await db.col.insert(body);

        db.client.close();
        if (ret.result.ok > 0) {
            ctx.body = 'ok';
        } else {
            ctx.body = 'faild';
        }

        let user = {
            tel: body.tel,
            name: body.name,
            addr: body.addr
        }
        db = await mongo.db('users');
        ret = await db.col.insert(user);
        db.client.close();
    });

    ctx.app.use(koaBody());
    ctx.app.use(router.routes());
    ctx.app.use(router.allowedMethods());

    await next();
};

/**
 * 获取客户端ip 
 */
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
};

function fetch(url) {
    console.log(url);
    return new Promise((resolve, reject) => {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                return resolve(JSON.parse(body));
            }
            reject(error);
        });
    });
    
}