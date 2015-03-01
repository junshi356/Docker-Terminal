window.docker = (function() {
  var docker = {};
  docker.terminal = {
    startTerminalForContainer: function(host, container) {
      var term = new Terminal(150, 40);
      term.open();

      var wsUri = "ws://" +
        host +
        "/v1.6/containers/" +
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
        term.write("Session started\r\n");
      }

      function onClose(evt) {
        term.write("Session terminated\r\n");
      }

      function onMessage(evt) {
        term.write(evt.data);
      }

      function onError(evt) {
      }
    }
  };


  return docker;
})();

function containername (container) {
  if (container.Names != undefined && container.Names.length > 0) {
    return container.Names[0].replace('/','') + ' (' + container.Id.slice(0,6) + ')';
  } else if (container.Name != undefined) {
    // This was obtained with a call to /containers/<ID>/json, note ID is different to Id
    return container.Name.replace('/','') + ' (' + container.ID.slice(0,6) + ')';
  } else {
    return container.Id.slice(0,6);
  }
}
window.initHandlers = function () {
  $('#refresh_containers').on('click', function () {
    $('#setting_container').empty();
    $.get(ApiUrl() + '/v1.6/containers/json', function (d) {
      d.map(function (container) {
        var e = $('<option>').text(containername(container) + ' - ' + container.Image).val(container.Id);
        $(e).data(container);
        $('#setting_container').append(e);
      });
    });
  });

  $('#attach_container').on('click', function () {
    $('.terminal').remove();
    var container = $('#setting_container option:selected').data();
    docker.terminal.startTerminalForContainer($('#setting_host').val(), container.Id);
    $('#container_id').text(containername(container));
  });
};

//$(function() {
//  $("[data-docker-terminal-container]").each(function(i, el) {
//    var container = $(el).data('docker-terminal-container');
//    var host = $(el).data('docker-terminal-host');
//    docker.terminal.startTerminalForContainer(host, container);
//  });
//});
