Node Serial Socket
==================

This Node service is a link between the arduino and the external world. 
The service open a serial communication with arduino and keeps it open.
It also open a socket on port 7999 where other programs can send orders.
The orders are passed to the arduino and the answer is returned to the 
program.

There's a init.d script (node-serial-socket.sh) that you can use to 
automatically start and stop the service.

Everything is in a pre-alpha status but....it should work as expected!
