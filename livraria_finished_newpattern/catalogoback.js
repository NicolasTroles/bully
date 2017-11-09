var MongoClient = require('mongodb').MongoClient,
    express = require('express'),
    dgram = require('dgram'),
    protobuf = require('protocol-buffers'),
    fs = require('fs');

var app = express();
var server = dgram.createSocket('udp4');
var fileName = 'adilson.proto'

var host = '127.0.0.1',
    port = '4000',
    encomenda_server = '127.0.0.1',
    encomenda_port = 4001,
    catalogo_server = '127.0.0.1',
    catalogo_port = 4000;

var messages = protobuf(fs.readFileSync(fileName))
//INICIALIZA BANCO
var firsttime = true;
//
var buf;
var obj;

//INSERÇÃO NO BANCO
var myobj = [{id: 0, name: "Harry Potter", preco: 32.90 , quantidade: 50 },
{id: 1,name: "Senhor dos Aneis", preco: 42.00 , quantidade: 20 },
{id: 2,name: "A Cabana", preco: 12.50, quantidade: 30 }];

if (firsttime == true ){
    MongoClient.connect("mongodb://localhost:27017/catalogo", function(err, db) {
        if (err) {console.log("DB nao encontrado");}
        db.collection("livros").insertMany(myobj, function(err, res) {
          if (err) throw err;
          console.log("Inseriu %j documentos!",res.insertedCount);
          db.collection("livros").createIndex({name: 1});
          db.close();
        });
    });
}

//INICIA SERVER UDP
server.on('listening',function () {
    var address = server.address();
    console.log('Catalogo Backend server escutando em ' + address.address + ":" + address.port);
});

server.on('message',function (message,remote) {
    console.log(remote.address + ':' + remote.port + ' - ' + message);

    obj = messages.Request.decode(message);

    if (obj.type == 4) {
        console.log("Tentativa de compra");
        req = messages.RequestById.decode(message);
        MongoClient.connect("mongodb://localhost:27017/catalogo", function(err, db) {
            if (err) throw err;
            var query = { id: req.id };
            db.collection("livros").findOne(query,{_id:false,id:false,name:false,preco:false}, function(err, result) {
              if (err) throw err;
              if(result.quantidade == 0) {
                  console.log("Nenhum item em estoque!")
              } else {
                  var newqtd = result.quantidade - 1;
                  MongoClient.connect("mongodb://localhost:27017/catalogo", function(err, db) {
                    if (err) throw err;
                    var myquery = { id: req.id };
                    var newvalues = {$set: {quantidade: newqtd}};
                    db.collection("livros").updateOne(myquery, newvalues, function(err, res) {
                        if (err) throw err;
                        console.log("1 document updated");
                        db.close();
                    });
                });
              }
              db.close();
            });
        });
    } else if (obj.type == 0) {
        console.log("Tentativa de verificar nome");

        req = messages.RequestByQuery.decode(message);

        MongoClient.connect("mongodb://localhost:27017/catalogo", function(err, db) {
            if (err) throw err;
            var query = { name: req.query};
            db.collection("livros").find(query,{}).toArray(function(err, result) {
              if (err) throw err;
              console.log(result);
              db.close();
            });
        });
    } else if (obj.type == 1) {
        console.log("Tentativa de verificar detalhes");

        req = messages.RequestById.decode(message);

        MongoClient.connect("mongodb://localhost:27017/catalogo", function(err, db) {
            if (err) throw err;
            var query = { id: req.id };
            db.collection("livros").find(query,{}).toArray(function(err, result) {
              if (err) throw err;
              console.log(result);
              db.close();
            });
        });
    } else if (obj.type == 2) {
        console.log("Tentativa de atualizar preco");

        req = messages.UpdateBookPrice.decode(message);

        MongoClient.connect("mongodb://localhost:27017/catalogo", function(err, db) {
            if (err) throw err;
            var myquery = { id: req.id };
            var newvalues = {$set: {preco: req.price}};
            db.collection("livros").updateOne(myquery, newvalues, function(err, res) {
                if (err) throw err;
                console.log("1 documento atualizado");
                db.close();
            });
        });
    } else if (obj.type == 3) {
        console.log("Tentativa de atualizar estoque");

        req = messages.UpdateCatalogCount.decode(message);

        MongoClient.connect("mongodb://localhost:27017/catalogo", function(err, db) {
            if (err) throw err;
            var myquery = { id: req.id };
            var newvalues = {$set: {quantidade: req.count}};
            db.collection("livros").updateOne(myquery, newvalues, function(err, res) {
                if (err) throw err;
                console.log("1 documento atualizado");
                db.close();
            });
        });
    } else {
        console.log("Nenhuma operacao realizada!");
    }
    
});

app.get('/atualizapreco/:id/:preco', function (req, res) {
    var precoUrl = req.params.preco;
    var idUrl = req.params.id;
    if (!precoUrl || !idUrl) {
      res.status(404).send({error:"Id não encontrado"});
    } else {
        //preco -> float
        var preco = parseFloat(precoUrl);

        buf = messages.UpdateBookPrice.encode({
          requestType:2,
          id: idUrl,
          price: preco
        });
  
        server.send(buf, 0, buf.length, catalogo_port, catalogo_server, function (err) {
            if (err) {
                res.status(200).send('Erro: Mensagem nao enviada! Fechando cliente.');
                server.close();
                return;
            } else {
                res.status(200).send('Mensagem Enviada!');
            }
        });
    }
});


app.get('/atualizaestoque/:id/:qtd', function (req, res) {
    var qtdUrl = req.params.qtd;
    var idUrl = req.params.id;
    if (!qtdUrl || !idUrl) {
      res.status(404).send({error:"Id não encontrado"});
    } else {
  
        buf = messages.UpdateCatalogCount.encode({
          requestType: 3,
          id: idUrl,
          count: qtdUrl
        });
  
        server.send(buf, 0, buf.length, catalogo_port, catalogo_server, function (err) {
            if (err) {
                res.status(200).send('Erro: Mensagem nao enviada! Fechando cliente.');
                server.close();
                return;
            } else {
                res.status(200).send('Mensagem Enviada!');
            }
        });
    }
});

app.get('/atualizapreco/:id', function (req, res) {
    res.status(200).send('Envie o preço do produto');
});
app.get('/atualizapreco', function (req, res) {
    res.status(200).send('Envie o ID e o preço do produto');
});

app.get('/atualizaestoque/:id', function (req, res) {
    res.status(200).send('Envie a quantidade do produto');
});
app.get('/atualizaestoque', function (req, res) {
    res.status(200).send('Envie o ID e a quantidade do produto');
});



server.bind(port,host);

//INICIA SERVER APP
app.listen(3001, function () {
  console.log('Catalogo app server escutando em porta 3001!');
});