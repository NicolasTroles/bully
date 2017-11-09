var protobuf = require('protocol-buffers')
var fs = require('fs')

var fileName = 'padroes.proto'

var messages = protobuf(fs.readFileSync(fileName))

var buf = messages.Padrao.encode({
    func: 'atualizapreco',
    id: 2,
    preco: "23.90"
    })
console.log(buf) // should print a buffer

var obj = messages.Padrao.decode(buf)
console.log(obj) // should print an object similar to above



