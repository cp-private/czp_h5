(function() {
    var orderList = $('#orderList');
    var itemHeight = $('#orderList li').eq(0).height();
    var count = 0;

    /**
     * 滚动订单列表
     */
    (function scroll() {
        var height = itemHeight * ++count;
        if (count == $('#orderList li').length - 10) count = 0;
        orderList.css({
            '-webkit-transform': 'translate(0, -' + height + 'px)',
            'transform': 'translate(0, -' + height + 'px)'
        });

        setTimeout(function() {
            scroll();
        }, Math.random() * 2000);
    })();


    //表单提交验证
    $('.submit').on('click', function() {
        var form = $('#orderId')[0];
        var items = {
            product: {
                msg: '请选择产品'
            },
            tel: {
                msg: '请填写正确的电话号吗',
                parttern: /^1\d{10}$/
            },
            code: {
                msg: '请填写正确的短信验证码',
                parttern: /^\d{5}$/
            },
            cost: {
                msg: '请填写数字金额',
                parttern: /^[1-9](\d+)?$/
            },
            count: {
                msg: '请填写数字数量',
                parttern: /^[1-9](\d+)?$/
            }
        };
        Object.keys(items).map(function(key) {
            var item = items[key];
            var value = form[key].value.trim();
            var $el = $('.form .item.' + key);
            var $msg = $el.find('.msg');
            if (!value || item.parttern && !item.parttern.test(value)) {
                $el.addClass('error');
                $msg.html(item.msg);
            } else {
                $el.removeClass('error');
            }
        });

        if ($('.form .item.error').length) {
            return;
        }

        var data = {};
        Object.keys(items).forEach(function(i) {
            data[i] = form[i].value.trim();
        });
        $.ajax({
            url: '/api/submit/order',
            data: data,
            method: 'POST',
            success: function(res) {
                console.log(res);
            }
        })
    });

    //发送短信验证码
    $('#sendMsg').on('click', function(e) {
        var i = 30, timmer;
        var el = $(e.target);
        var txt = el.html();
        if (el.attr('is-click')) return;
        el.attr('is-click', 'clicked');
        
        timmer = setInterval(function() {
            el.html(i + '秒后可重发');
            if (i-- != 0) return;
            clearInterval(timmer);
            el.attr('is-click', '');
            el.html(txt); 
        }, 1000);

        $.ajax({
            url: '/api/sendmsg'
        }).then(function(res) {
            console.log(res);
        })

    })

})();