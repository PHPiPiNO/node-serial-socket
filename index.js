#!/usr/bin/env node

'use strict';

const openOptions = {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1
};

const portDevice = '/dev/ttyUSB0';

const SerialPort = require('serialport');
const port = new SerialPort(portDevice, openOptions);

process.stdin.resume();
process.stdin.setRawMode(true);

process.stdin.on('data', function(s) {
    /**
     * Quit on q or Ctrl+c
     */
    if (s[0] === 113 || s[0] === 0x03) {
        port.close();
        process.exit(0);
    }
    port.write(s);
});

port.on('data', function(data) {
    process.stdout.write(data.toString());
});

port.on('error', function(err) {
    console.log('Error', err);
    process.exit(1);
});