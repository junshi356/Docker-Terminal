window.docker = (function(docker) {
  docker.terminal = {
    startTerminalForContainer: function(host, container) {
      var term = new Terminal(150, 40);
      term.open();

      var wsUri = "ws://" + 
        host + 
        "/v1.5/containers/" + 
        container + 
        "/attach/ws?logs=1&stderr=1&stdout=1&stream=1&stdin=1";

      var websocket = new WebSocket(wsUri);
      websocket.onopen = function(evt) { onOpen(evt) };
      websocket.onclose = function(evt) { onClose(evt) };
      websocket.onmessage = function(evt) { onMessage(evt) };
      websocket.onerror = function(evt) { onError(evt) };

      term.on('data', function(data) {
        websocket.send(data);
      });

      function onOpen(evt) { 
        term.write("Session started");
      }  

      function onClose(evt) { 
        term.write("Session terminated");
      }  

      function onMessage(evt) { 
        term.write(evt.data);
      }  

      function onError(evt) { 
      }  
    }
  };


  return docker;
})(window.docker || {});

function ApiUrl () {
  return 'http://' + /*'myserver/docker/host/' +*/ $('#setting_host').val();
}

$(function () {
  $('#refresh_images').on('click', function () {
    $('#setting_image').empty();
    $.get(ApiUrl() + '/v1.5/images/json', function (d) {
      d.map(function (image) {
        var e = $('<option>').text(image.Tag).val(image.Id);
        $('#setting_image').append(e);
      });
    });
  });

  $('#start_image').on('click', function () {
    $('.terminal').remove();
    $.post(
      ApiUrl() + '/v1.5/containers/create',
      JSON.stringify({ "AttachStdin": true, "AttachStdout": true, "AttachStderr": true, "Tty": true,
        "OpenStdin": true, "StdinOnce": true, "Cmd":["/bin/bash"], "Hostname":"test1",
        "Image": $('#setting_image').val() }),
      function (container) {
        $.post(ApiUrl() + '/v1.5/containers/' + container.Id + '/start', function () {
          docker.terminal.startTerminalForContainer($('#setting_host').val(), container.Id);
          $('#container_id').text(container.Id.slice(0,8));
        });
      }
    );
  });

  $('#refresh_containers').on('click', function () {
    $('#setting_container').empty();
    $.get(ApiUrl() + '/v1.5/containers/json', function (d) {
      d.map(function (container) {
        var e = $('<option>').text(container.Id.slice(0,8) + ' - ' + container.Image).val(container.Id);
        $('#setting_container').append(e);
      });
    });
  });

  $('#attach_container').on('click', function () {
    $('.terminal').remove();
    docker.terminal.startTerminalForContainer($('#setting_host').val(), $('#setting_container').val());
    $('#container_id').text($('#setting_container').val().slice(0,8));
  });

});

//$(function() {
//  $("[data-docker-terminal-container]").each(function(i, el) {
//    var container = $(el).data('docker-terminal-container');
//    var host = $(el).data('docker-terminal-host');
//    docker.terminal.startTerminalForContainer(host, container);
//  });
//});
