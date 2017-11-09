var express = require('express'),
dgram = require('dgram'),
protobuf = require('protocol-buffers'),
fs = require('fs'),
sleep = require('system-sleep'),
ping = require('ping');;

var app = express();
var fileName = 'adilson.proto';
var messages = protobuf(fs.readFileSync(fileName));
var client = dgram.createSocket('udp4');
var buf;

var relogio = 0;
var desconto = "";
var lider = 0;
var tempoInicio = 0;
var intervalo = 0;
var posicaoConfigArray = 0;
var servers;

var catalogo_server = '127.0.0.1',
encomenda_server = '127.0.0.1',
front1_server = '127.0.0.1',
front2_server = '127.0.0.1',
front3_server = '127.0.0.1',
encomenda_server = '127.0.0.1',
catalogo_port = 4000,
encomenda_port = 4001;
front1_port =   5001;
front2_port = front = 5002;
front3_port = 5003;

client.bind(front2_port,front2_server);


//FRONT END NAO TEM ACESSO AO MONGODB!!!
//SOMENTE ENVIA MSG PARA OS SV DE CATALOGO E ENCOMENDA!
//OPERACOES FRONT END INPUT

//INICIA SERVER UDP
client.on('listening',function () {
var address = client.address();
console.log('Front 1 server escutando em ' + address.address + ":" + address.port);
});

client.on('message',function (message,remote) {
console.log(remote.address + ':' + remote.port + ' - ' + message);
relogio = parseInt(message);
});

app.get('/procura/:nome', function (req, res) {
var nomeUrl = req.params.nome;
if (!nomeUrl) {
res.status(404).send({error:"Nome n�o encontrado"});
} else {
//insere nome no protobuff com a funcao inserir
  buf = messages.RequestByQuery.encode({
    requestType: 0,
    query: nomeUrl
  });

  client.send(buf, 0, buf.length, catalogo_port, catalogo_server, function (err) {
    if (err) {
        res.status(200).send('Erro: Mensagem nao enviada! Fechando cliente.!');
        client.close();
        return;
    } else {
        res.status(200).send('Mensagem Enviada!');
    }
  });
}
});

app.get('/procura', function (req, res) {
res.status(200).send('Envie o nome do livro que est� procurando!');
});

app.get('/detalhes/:id', function (req, res) {
var idUrl = req.params.id;

if (!idUrl) {
res.status(404).send({error:"Id n�o encontrado"});
} else {

  buf = messages.RequestById.encode({
    requestType: 1,
    id: idUrl
  });

  client.send(buf, 0, buf.length, catalogo_port, catalogo_server, function (err) {
    if (err) {
        res.status(200).send('Erro: Mensagem nao enviada! Fechando cliente.');
        client.close();
        return;
    } else {
      res.status(200).send('Mensagem Enviada!');
    }
  });
}
});

app.get('/detalhes', function (req, res) {
res.status(200).send('Envie o ID do livro que est� procurando!');
});

app.get('/compra/:id', function (req, res) {
var idUrl = req.params.id;

if (!idUrl) {
res.status(404).send({error:"Id n�o encontrado"});
} else {

  buf = messages.RequestById.encode({
      requestType: 4,
      id: idUrl
    });

  client.send(buf, 0, buf.length, encomenda_port, encomenda_server, function (err) {
    if (err) {
        res.status(200).send('Erro: Mensagem nao enviada! Fechando cliente.');
        client.close();
        return;
    } else {
        
      res.status(200).send('Mensagem Enviada!' + desconto);
    }
  });
}
});

app.get('/compra', function (req, res) {
res.status(200).send('Envie o ID do livro que est� procurando!');
});

app.listen(3005, function () {
console.log('Frontend app server escutando na porta 3004!');
});