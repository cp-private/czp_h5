(function() {
    $('#exampleModal').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget) // Button that triggered the modal
        var recipient = button.data('whatever') // Extract info from data-* attributes
        var modal = $(this)
        //modal.find('.modal-title').text('New message to ' + recipient)
        //modal.find('.modal-body input').val(recipient)
    })

    $('.submit').on('click', function() {
        let name = $('.name').val();
        let info = $('.info').val();
        if (!name || !info) return;
        $.ajax({
            url: '/api/submit/addAgent',
            method: 'POST',
            data: {
                name: name,
                info: info
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
})()