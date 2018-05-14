(function() {
    var $orders = $('ul.orders');
    var orderList = [];
    var curOrder = null;
    $('#search').click(function() {
        var tel = $('#tel').val().trim();
        if (!tel || !/^1\d{10}$/.test(tel)) return alert('请填写正确的电话号码。');
        $.ajax({
            url: '/orderlist/' + tel,
            success: function(res) {
                res = JSON.parse(res);
                if (!res) $orders.html('未查到该手机号相关的订单。');
                var html = res.map(function(i) {
                    return '<li><span>' + i.name + ',' + i.area + '平,' + i.create_date + '</span><a class="comment" data-id="' +i._id+ '">评价此单</a></li>'
                }).join('');
                $orders.html(html);
                orderList = res;
            }
        });
    });

    $orders.delegate('.comment', 'click', function(e) {
        var id = $(this).attr('data-id');
        $('.comment-form').show();
        curOrder = orderList.filter(function(i) {return i._id == id})[0]
        $('.user-tel').html(curOrder.tel);
    });

    $('.submit').on('click', function(e) {
        var msg = $('textarea').val().trim();
        if (msg.length < 11) return alert('请至少写10个字～');
        $.ajax({
            url: '/user/comment',
            data: {
                tel: curOrder.tel,
                name: curOrder.name,
                msg: msg,
                create_date: new Date().getTime()
            },
            type: 'POST',
            success: function(res) {
                if (res == 'ok') {
                    alert('感谢您对我们的评价。');
                    location.reload();
                } else {
                    alert('网络繁忙，请重现提交～');
                }
            }
        })
    })
})()