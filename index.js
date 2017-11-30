#!/usr/bin/env node

'use strict';

const openOptions = {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    buffersize: 1024
};

const portDevice = '/dev/ttyUSB0';
const SerialPort = require('serialport');
const port = new SerialPort(portDevice, openOptions);
const Readline = SerialPort.parsers.Readline;
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

const app = require('express')();
const http = require('http').Server(app);
const httpPort = 7999;
var globalResponse = false;

const sleep = require('sleep');

var serialOut = 'System ready!';
var commandType = '';

//process.stdin.resume();
//process.stdin.setRawMode(true);

parser.on('data', function(data) {
    serialOut = data.trim();

    if(globalResponse !== false) {
        switch (commandType) {
            case 'i':
                globalResponse.send({'msg': serialOut, 'success': true});
                break;
            case 'r':
                globalResponse.send(parseTemperatureString());
                break;
            default:
                break
        }
        globalResponse = false;
        commandType = '';
    }
});

port.on('error', function(err) {
    console.log('Error', err);
    process.exit(1);
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/exec/:command', function(req, res){
    var quit = false;
    res.header('Content-Type', 'application/json');

    switch (req.params.command) {
        case 'status':
            port.write('i');
            commandType = 'i';
            globalResponse = res;
            break;
        case 'turn-off':
            port.write('s');
            res.send({'msg': 'Relay turned off', 'success': true});
            break;
        case 'turn-on':
            port.write('o');
            res.send({'msg': 'Relay turned on', 'success': true});
            break;
        case 'read-temperature':
            port.write('r');
            commandType = 'r';
            globalResponse = res;
            break;
        case 'quit':
            port.close();
            quit = true;
            res.send({'msg': 'Quitting. Bye bye!'});
            break;
        default:
            break;
    }

    if(quit) {
        process.exit(0);
    }
});

http.listen(httpPort, function(){
    console.log('listening on *:'+httpPort);
});

/**
 * Parse the temperature string sent by the arduino.
 * The format is the following:
 * H_30.00-CT_26.00-CTI_25.44-FT_78.80-FTI_77.79
 * H => Humidity
 * CT => Celsius Temp.
 * CTI => Celsius Temp. Indexed
 * FT => Fahrenheit Temp.
 * FTI => Fahrenheit Temp. Indexed
 *
 * returns
 * {
 *  'h': 30.00,
 *  'ct': 26.00,
 *  'cti': 25.44,
 *  'ft': 78.80,
 *  'fti': 77.79
 * }
 */
function parseTemperatureString() {
    if(! serialOut.match(/H_[\d.]{5}-CT_[\d.]{5}-CTI_[\d.]{5}-FT_[\d.]{5}-FTI_[\d.]{5}/)) {
        sleep.sleep(1);
        return parseTemperatureString();
    }
    var tokens = serialOut.split("-");
    if(tokens.length !== 5) {
        console.log(Date.now()+"Non sono riuscito a fare il parsing di "+serialOut);
        return {
            'msg': 'Unable to read temperature string',
            'success': false
        }
    }
    return {
        'success': true,
        'h': tokens[0].substr(2),
        'ct': tokens[1].substr(3),
        'cti': tokens[2].substr(4),
        'ft': tokens[3].substr(3),
        'fti': tokens[4].substr(4)
    }
}
