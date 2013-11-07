window.docker = (function(docker) {
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
function imagename (image) {
  if (image.Tag && image.Repository) {
    return image.Tag + ' - ' + image.Repository + ' (' + image.Id.slice(0,6) + ')';
  } else {
    return image.Id.slice(0,6);
  }

}

$(function () {
  $('#refresh_images').on('click', function () {
    $('#setting_image').empty();
    $.get(ApiUrl() + '/v1.6/images/json', function (d) {
      d.map(function (image) {
        var e = $('<option>').text(imagename(image));
        $(e).data(image);
        $('#setting_image').append(e);
      });
    });
  });

  $('#start_image').on('click', function () {
    $('.terminal').remove();
    $.ajax({
      type: 'POST',
      dataType: "json",
      contentType: "application/json",
      url: ApiUrl() + '/v1.6/containers/create',
      data: JSON.stringify({ "AttachStdin": true, "AttachStdout": true, "AttachStderr": true, "Tty": true,
        "OpenStdin": true, "StdinOnce": true, "Cmd":["/bin/bash"], "Hostname":"test1",
        "Image": $('#setting_image option:selected').data().Id }),
      success: function (containerid) {
        containerid = containerid.Id; // there's no other data in this object
        $.ajax({
          type: 'POST',
          dataType: "json",
          contentType: "application/json",
          url: ApiUrl() + '/v1.6/containers/' + containerid + '/start',
          data: "{}",
          success: function () {
            docker.terminal.startTerminalForContainer($('#setting_host').val(), containerid);
            $.get(ApiUrl() + '/v1.6/containers/' + containerid + '/json', function (container) {
              $('#container_id').text(containername(container));
            });
          }
        });
      }
      });
  });

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

});

//$(function() {
//  $("[data-docker-terminal-container]").each(function(i, el) {
//    var container = $(el).data('docker-terminal-container');
//    var host = $(el).data('docker-terminal-host');
//    docker.terminal.startTerminalForContainer(host, container);
//  });
//});
