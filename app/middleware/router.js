const Router = require('koa-router');
const router = new Router();
const mongo = require('./mongo.js');
const koaBody = require('koa-body');
const request = require('request');
const ObjectId = require('mongodb').ObjectID;
const moment = require('moment');

const SMSClient = require('@alicloud/sms-sdk')
// ACCESS_KEY_ID/ACCESS_KEY_SECRET 根据实际申请的账号信息进行替换
const accessKeyId = 'LTAI7FFDYVmCX9yF';
const secretAccessKey = 'NY2RvuD0jtuQnks3cIp38BIQaGL3cj';
//初始化sms_client
let smsClient = new SMSClient({accessKeyId, secretAccessKey})


module.exports = async function(ctx, next) {
    router.get('/user/say', async (ctx, next) => {
        ctx.render('say');
    });

    router.get('/agent/:id', async (ctx, next) => {
        ctx.pug.locals.agentId = ctx.params.id;
        let db = await mongo.db('agents');
        let ret = await db.col.find({_id: ObjectId(ctx.params.id)}).toArray();
        ctx.pug.locals.agentName = ret[0] ? ret[0].name: '无代理商';
        ctx.pug.locals.agentInfo = ret[0] ? ret[0].info: '';
        db.client.close();
        ctx.render('index');
    });

    router.get('/send/validcode/:tel', async (ctx, next) => {
        let tel = ctx.params.tel;
        let validCode = await genValidCode(tel);
        if (validCode.isNew) {
            saveCodeToDb({tel: tel, code: validCode.code, insert_time: new Date().getTime()});
        }
        if (!/^1\d{10}$/.test(tel)) return ctx.body = '手机号错误';
        let res = await new Promise((resolve, reject) => {
            smsClient.sendSMS({
                PhoneNumbers: tel,
                SignName: '鲁道夫净化',
                TemplateCode: 'SMS_125017263',
                TemplateParam: `{"code":"${validCode.code}"}`
            }).then(function (res) {
                resolve(res);
            }, function (err) {
                console.log(err)
                reject(err);
            })
        });

        let {code} = res;
        if (code === 'OK') {
            ctx.body = 'ok';
        }
        next();
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
	let agent = ctx.query.agent;
        let db = await mongo.db('orders');
	let filters = agent ? {"agent": agent}: {};
        let ret = await db.col.find(filters).sort([['create_date', -1]]).toArray();
        db.client.close();
        ctx.pug.locals.list = ret;
console.log(filters)

        let db1 = await mongo.db('agents');
        let ret1 = await db1.col.find({}).toArray();
        db1.client.close();
        ctx.pug.locals.agents = ret1;
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
        ctx.pug.locals.list = ret.map(i => {
            i.link = `http://${ctx.request.header.host}/agent/${i._id}`
            return i;
        });
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

        //验证码是否正确
        let validCode = await getValidCodeDB(body.tel);
        if (validCode != body.code) {
            ctx.body = '验证码错误或失效';
            return;
        }

        if (body.lat && body.lng) {
            let data = await fetch(`http://api.map.baidu.com/geocoder/v2/?output=json&ak=${BAIDU_API_KEY}&location=${body.lng},${body.lat}`)
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

            data = await fetch(`http://api.map.baidu.com/geocoder/v2/?output=json&ak=${BAIDU_API_KEY}&location=${body.lng},${body.lat}`)
            body.addr = data.result.formatted_address;
        }

        body.create_date = moment(+body.create_date).format('YYYY-MM-DD hh:mm:ss');
        let db = await mongo.db('orders');
        let ret = await db.col.insert(body);

        db.client.close();
        if (ret.result.ok > 0) {
            ctx.body = 'ok';
        } else {
            ctx.body = '网络忙，请稍后重试';
        }

        let user = {
            tel: body.tel,
            name: body.name,
            addr: body.addr
        }
        db = await mongo.db('users');
        ret = await db.col.insert(user);
        db.client.close();

        //发送短信给用户
        let res = await new Promise((resolve, reject) => {
            smsClient.sendSMS({
                PhoneNumbers: body.tel,
                SignName: '鲁道夫净化',
                TemplateCode: 'SMS_135801995',
                TemplateParam: JSON.stringify({
                    orderInfo: `${body.name.slice(0, 5)},${body.tel.slice(0, 12)}`
                })
            }).then(function (res) {
                resolve(res);
            }, function (err) {
                console.log(err)
                reject(err);
            })
        });
        
        let agentPhone = await getAgentPhone({name: body.agent});
        smsClient.sendSMS({
            PhoneNumbers: agentPhone,
            SignName: '鲁道夫净化',
            TemplateCode: 'SMS_135801992',
            TemplateParam: JSON.stringify({
                orderType: body.order_type,
                orderInfo: `${body.name.slice(0, 5)}, ${body.tel.slice(0, 12)}`
            })
        }).then(function (res) {
            resolve(res);
        }, function (err) {
            console.log(err)
            reject(err);
        })

        let {code} = res;
        if (code === 'OK') {
            ctx.body = 'ok';
        }

    });

    ctx.app.use(koaBody());
    ctx.app.use(router.routes());
    ctx.app.use(router.allowedMethods());

    await next();
};

router.post('/api/submit/addAgent', async (ctx, next) => {
    let body = ctx.request.body;
    console.log(body);
    body.create_date = moment(new Date().getTime()).format('YYYY-MM-DD hh:mm:ss')
    let db = await mongo.db('agents');
    let ret = {};
    if (body.userId) {
        ret = await db.col.updateOne(
            { _id : ObjectId(body.userId) }
            , { 
                $set: { 
                    name : body.name,
                    info: body.info,
                    phone: body.phone
                } 
            }
        ); 
    } else {
        ret = await db.col.insert(body);
    }
    db.client.close();
    if (ret.result.ok > 0) {
        ctx.body = 'ok';
    } else {
        ctx.body = '网络忙，请稍后重试';
    }
});

router.post('/api/submit/deleteAgent', async (ctx, next) => {
    let body = ctx.request.body;
    let db = await mongo.db('agents');
    let ret = await db.col.deleteOne(
        { _id : ObjectId(body.userId) }
    ); 
    if (ret.result.n == 1) {
        ctx.body = 'ok';
    } else {
console.log(ret)
        ctx.body = '网络忙，请稍后重试';
    }
})

router.get('/api/admin_delorder/:id', async (ctx, next) => {
    let db = await mongo.db('orders');
    let ret = await db.col.deleteOne(
        { _id : ObjectId(ctx.params.id) }
    ); 
    if (ret.result.n == 1) {
        ctx.body = 'ok';
    } else {
console.log(ret)
        ctx.body = '网络忙，请稍后重试';
    }
})

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

async function genValidCode(tel) {
    let oldCode = await getValidCodeDB(tel);
    return {
        code: oldCode || Math.random().toString().slice(2, 7),
        isNew: !oldCode
    }
}

async function getValidCodeDB(tel) {
    let db = await mongo.db('code');
    let ret = await db.col.find({tel: tel}).sort({insert_time: -1}).toArray();
    console.log(tel, ret);
    if (ret.length && new Date().getTime() - ret[0].insert_time <= 5 * 60 * 1000 ) {
        return ret[0].code;
    }
    return '';
}

async function saveCodeToDb(params) {
    let db = await mongo.db('code');
    let ret = await db.col.insert(params);
    db.client.close();
    if (ret.result.ok > 0) console.log(ret);
    return ret.result.ok > 0;
}


async function getAgentPhone(obj) {
    let db = await mongo.db('agents');
    let ret = await db.col.find(obj).toArray();
    if (ret.length) return ret[0].phone;
    return '';
}
