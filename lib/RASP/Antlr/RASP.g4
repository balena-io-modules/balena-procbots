grammar RASP;

init: botDefinition | comment | EOF;

comment: COMMENT | LINE_COMMENT;
botDefinition: 'bot(' ALPHA ')' '{' botBody (botBody)* '}';

// The bot body.
botBody: comment | addListener | addEmitter | requestServiceEvents | listenerMethod;

// Add a ServiceListener, with appropriate constructor.
addListener: (ALPHA '=')? 'AddListener(' serviceName (',' serviceConstructor)* ')';

// Add a ServiceEmitter, with appropriate constructor.
addEmitter: (ALPHA '=')? 'AddEmitter(' serviceName (',' serviceConstructor) ')';

serviceName: 'github' | 'flowdock';
serviceConstructor: '{' serviceConstructorPair (',' serviceConstructorPair)* '}';
serviceConstructorPair: ALPHA ':' (ALPHA | INT | HEX | path | serviceConstructor);

// Request an event for a listener.
requestServiceEvents: 'RequestEvents(' serviceName ',' eventRegistration ')';
// Event registration is a block with an array of event names and a listener.
eventRegistration: events ',' listenerMethodName;
events: '[' ALPHANUMERIC (',' ALPHANUMERIC)* ']';

// Listener methods.
listenerMethodName: ALPHA;
listenerMethod: ALPHA '{' listenerBody '}';
listenerBody: ;

// General rules.
envvar: 'envar' '(' ALPHA ')';
path: '/' ALPHA?;

INT     : [0-9]+;
ALPHA   : [a-zA-Z]+;
HEX     : [a-fA-F0-9]+;
ALPHANUMERIC: [a-zA-Z0-9|_-]+;
COMMENT: '/*' .*? '*/' -> skip;
LINE_COMMENT: '//' .*? '\r'? '\n' -> skip;
WS   :  [ \t\r\n]+ -> skip;
