$(function() {
    $('#agentFilter').on('change', function() {
        location.href="http://order.rudolf1922.com/admin/__orders__?agent=" + $('#agentFilter').val()
    });
    $('.del-order').on('click', function(e) {
        if (!window.confirm('此操作将会永久删掉一个订单信息，是否继续？')) 
            return;
        let el = $(e.target);
        $.ajax({
            url: '/api/admin_delorder/' + el.attr('data-id'),
            success: function(res) {
                if (res == 'ok') location.reload();
            }
        })
    })
})