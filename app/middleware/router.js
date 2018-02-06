const Router = require('koa-router');
const router = new Router();
const mongo = require('./mongo.js');
const koaBody = require('koa-body');

const request = require('request');


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
        }

        //验证码是否正确

        let db = await mongo.db('orders');
        let ret = await db.col.insert(body);
        db.client.close();
        if (ret.result.ok > 0) {
            ctx.body = 'ok';
        } else {
            ctx.body = 'faild';
        }
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