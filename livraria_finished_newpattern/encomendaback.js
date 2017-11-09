var express = require('express'),
    dgram = require('dgram'),
    protobuf = require('protocol-buffers'),
    fs = require('fs');

var host = '127.0.0.1',
    port = '4001';

var catalogo_server = '127.0.0.1',
    catalogo_port = 4000;

var app = express();
var server = dgram.createSocket('udp4');
var fileName = 'adilson.proto'

var messages = protobuf(fs.readFileSync(fileName))

var buf;
var obj;

//INICIA SERVER UDP
server.on('listening',function () {
    var address = server.address();
    console.log('Encomenda Backend server escutando em ' + address.address + ":" + address.port);
});

server.on('message',function (message,remote) {
    console.log(remote.address + ':' + remote.port + ' - ' + message);

    obj = messages.Request.decode(message);
    if (obj.type == 4) {
        server.send(message, 0, message.length, catalogo_port , catalogo_server, function(err, bytes) {
            if (err) throw err;
            console.log('ENC - Mensagem de compra: ' + catalogo_server +':'+ catalogo_port);
        });
    }
});

server.bind(port,host);

//INICIA SERVER APP
app.listen(3002, function () {
  console.log('Encomenda app server escutando em porta 3002!');
});