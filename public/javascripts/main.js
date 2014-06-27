$(function() {
  var socket = io()
    , $body = $('body')
    , synced = false
    , mobile = navigator.userAgent.match(/Android/i)
               || navigator.userAgent.match(/webOS/i)
               || navigator.userAgent.match(/iPhone/i)
               || navigator.userAgent.match(/iPad/i)
               || navigator.userAgent.match(/iPod/i)
               || navigator.userAgent.match(/BlackBerry/i)
               || navigator.userAgent.match(/Windows Phone/i);

  if (mobile) {
    $body.addClass('mobile');
    $('input:first').focus();
  }

  socket.on('token', function(data) {
    $('h1 span').html(data.token);
  });

  socket.on('synced', function(data) {
    if (data.success) {
      synced = true;

      $body.addClass('synced');
      $('input').blur();

    } else {
      alert('Opps! Token errado.');
    }
  });

  socket.on('clicked', function(data) {
    $body.css('background-color', data.background);
  });

  socket.on('synced-server', function(data) {
    $body.addClass('synced');
  });

  socket.on('logout', function(data) {
    $body.removeClass('synced');
  });

  socket.on('touched', function(data) {
    if (data.background) {
      $body.css('background-color', data.background);
    }
  });

  $('form').submit(function(e) {
    var $input = $('input', e.target);

    if ($input.val().length) {
      socket.emit('sync', {
        token: $input.val()
      });
    }

    $input.val('');

    return false;
  });

  $('button').click(function(e) {
    var color = $(e.target).data('color');

    $body.css('background-color', color);

    socket.emit('click', {
      background: color
    })
  });

  if (mobile) {
    var l = 50
      , h = parseInt(Math.random() * 360, 10)
      , s = parseInt(Math.random() * 100, 10)
      , w = $(window).width()
      , he = $(window).height();

    $(window).on('touchmove', function(e) {
      e.preventDefault();

      if (!synced) {
        return;
      }

      var x = e.originalEvent.touches[0].clientX
        , y = e.originalEvent.touches[0].clientY;

      h = Math.min(360, parseInt((x / w) * 360, 10));
      s = 100 - Math.min(100, parseInt((y / he) * 100, 10));
      $('body').css('background-color', 'hsl('+h+','+s+'%,'+l+'%)');

      socket.emit('touch', {
        background: $body.css('background-color')
      });
    });
  }
});
