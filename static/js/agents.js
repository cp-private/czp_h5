(function() {
    $('#exampleModal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget) // Button that triggered the modal
        var recipient = button.data('whatever') // Extract info from data-* attributes
        var modal = $(this)
        $('#exampleModalLabel').html('添加代理商');
        //modal.find('.modal-title').text('New message to ' + recipient)
        //modal.find('.modal-body input').val(recipient)
    })

    $('.submit').on('click', function() {
        let name = $('.name').val();
        let info = $('.info').val();
        let phone = $('.phone').val();
        if (!name || !info || !phone) return alert('请填写所有项');
        $.ajax({
            url: '/api/submit/addAgent',
            method: 'POST',
            data: {
                name: name,
                info: info,
                userId: $('.user-id').val(),
                phone: phone
            },
            success: function(res) {
                console.log(res);
                if (res == 'ok') location.reload();
            }
        })
    })

    $('.qrcode').each(function(index, item) {
        let $el = $(item);
        $el.qrcode({text: $el.attr('data-link')})
    })

    $('.edit-agent').on('click', function(e) {
        $el = $(e.target);
        $('.user-id').val($el.attr('data-id'));
        $('.name').val($el.attr('data-name'));
        $('.info').val($el.attr('data-info'));
        $('#exampleModalLabel').html('编辑代理商');
    });

    $('.del-agent').on('click', function(e) {
        $el = $(e.target);
        if(window.confirm('是否要删除此代理商？')) {
            $.ajax({
                url: '/api/submit/deleteAgent',
                method: 'POST',
                data: {
                    userId: $el.attr('data-id')
                },
                success: function(res) {
                    if (res == 'ok') location.reload();
                }
            })
        } else {

        }
    })
})()