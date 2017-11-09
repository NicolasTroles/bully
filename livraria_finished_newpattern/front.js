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
front1_port = front =  5001;
front2_port =  5002;
front3_port = 5003;

client.bind(front1_port,front1_server);

fs.readFile('config.txt', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  data.toString();
  servers = data.split("\n");
  intervalo = servers.length * 5;

  for (var i = 0; i < servers.length; i++) {
    if (servers[i] == front) {
      posicaoConfigArray = i;
      tempoInicio = i*5;
    }
  }

  if (servers[servers.length - 1] == front) {
    console.log("LÍDER");
  } else {
    lider = servers[servers.length - 1];
    executaAreYouAlive();
  }
});

function executaAreYouAlive(){
  // Inicialização de Server
  // sleep(tempoInicio*1000);
  sleep(0);

  // Ping para R U ALIVE?
  var intervalId = setInterval(function(){
    var host = front3_server + ":" + lider;

    ping.sys.probe(host, function(isAlive){
      var msg = isAlive ? true : false;
      if (!msg) {
        // Roda eleição pois o Lider morreu
        realizaEleicaoNovoLider();
        clearInterval(intervalId);
      }
    });
  }, 1000 /*intervalo*/);
}

function realizaEleicaoNovoLider() {
  console.log("port");
  var host;
  var cfg = {
      timeout: 10,
      // WARNING: -i 2 may not work in other platform like window 
      extra: ["-i 2"],
  };
  servers.forEach(function(port){
    console.log(port);
    host = front3_server + ":" + port;
    
    ping.sys.probe(host, function(isAlive){
        var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
        console.log(msg);
    }, cfg);
    sleep(500);
  });

  // for(var i = servers.length - 1; i >= 0; i--) {
  //   setTimeout(function(){
  //     host = front3_server + ":" + servers[i];
  //     ping.sys.probe(host, function(isAlive){
  //       var msg = isAlive ? true : false;
  //       if (msg) {
  //         console.log("Ta vivo");
  //       } else {
  //         console.log(host);
  //         console.log("Ta morto");
  //       }
  //     });
  //   }, 500 /*intervalo*/);
}

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

app.listen(3004, function () {
console.log('Frontend app server escutando na porta 3004!');
});