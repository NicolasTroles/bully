var protobuf = require('protocol-buffers')
var fs = require('fs')

var fileName = 'adilson.proto'

var messages = protobuf(fs.readFileSync(fileName))

var buf = messages.RequestById.encode({
    requestType: 1,
    id: 30
    })
console.log(buf) // should print a buffer

var request = messages.Request.decode(buf)
console.log(request)

var obj = messages.RequestById.decode(buf)
console.log(obj) // should print an object similar to above



