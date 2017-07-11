grammar RASP;

init: botDefinition | EOF;

botDefinition: BOT '(' ID ')' botBody*;

// The bot body.
// Methods can *only* be defined as part of the botBody, which differentiates them from calls to
// a method inside the listenerBody.
botBody: addListener | addEmitter | requestServiceEvents | listenerMethod | listenerError | method | assignment;

// Add a ServiceListener, with appropriate constructor.
// Any options are set as an object or a variable declaring an object.
addListener: setServiceAs? EVENT RECEIVER FROM serviceName (object | variable)?;

// Add a ServiceEmitter, with appropriate constructor.
addEmitter: setServiceAs? SEND QUERIES TO serviceName (object | variable)?;

// Request an event for a listener.
requestServiceEvents: SEND events EVENTS FROM serviceName TO ID;

// Event registration is a block with an array of event names and a listener.
events: '[' ID (',' ID)* ']';

setServiceAs: SET ID AS;
setIdFrom: SET ID FROM;

// Listener methods.
listenerMethod: METHOD ID (RECEIVES listenerEventReceiver (',' listenerEventReceiver)*)? statement*;
listenerEventReceiver: events EVENTS FROM serviceName; // This needs to get shared with requestServiceEvents
listenerError: ERRORMETHOD ID statement*;

statement: method |
           assignment |
           r_if |
           r_while |
           loop |
           print |
           sendQuery |
           end;

assignment: 'set' variable 'as' expr;
r_if: 'if' expr statement ('else' statement)*;
r_while: 'while' expr statement;
loop: 'loop' 'from' expr 'to' expr;
print: 'print' expr;
end: 'end';
sendQuery: setIdFrom? QUERY ID* object;

expr: expr MULTIPLIED BY expr |
      expr DIVIDED BY expr |
      expr ADDED TO expr |
      expr SUBTRACTED BY expr |
      expr AND expr |
      expr OR expr |
      expr IS expr |
      expr IS NOT expr|
      array |
      method |
      stringMethod |
      variable |
      object |
      //precedence |
      NUMBER |
      STRING |
      BOOLEAN;

serviceName: ID;
// Bugger, this doesn't work, but it should. Suspect issue with the TS parser generation code
// is not allowing for parentheses in the parser because of mistaking it for TS. grun happily accepts
// it (as expected).
//precedence: '(' expr+ ')';
variable: ID ('.' ID)*;
object: '{' property (',' property)* '}';
array: ID? '[' expr (',' expr)* ']';
property: ID (':' expr)*;

// This needs work, we want to be able to call methods without parentheses, as if they were properties
method: variable '(' methodList* ')';
methodList: expr (',' expr)*;
stringMethod: STRING '.' method;

// Type rules.§
envvar: 'envar' ID;

// Keywords
BOT         : 'bot';
EVENT       : 'event';
EVENTS      : 'events';
RECEIVER    : 'receiver';
RECEIVES    : 'receives';
FROM        : 'from';
SEND        : 'send';
QUERIES     : 'queries';
TO          : 'to';
SET         : 'set';
AS          : 'as';
ADDED       : 'added';
SUBTRACTED  : 'subtracted';
MULTIPLIED  : 'multiplied';
DIVIDED     : 'divided';
BY          : 'by';
AND         : 'and';
OR          : 'or';
IS          : 'is';
NOT         : 'not';
QUERY       : 'query';
METHOD      : 'listenerMethod';
ERRORMETHOD : 'listenerErrorMethod';

fragment DIGIT   : [0-9];
fragment ALPHA   : [a-zA-Z];
fragment HEX     : [a-fA-F0-9];

STRING      : '\'' (ESC|.)*? '\'';
ESC         : '\\' [btnr'\\];
ID          : ALPHA (ALPHA | DIGIT | '_' | '-')*;
BOOLEAN     : 'true' | 'false';
NUMBER      : INT | FLOAT | HEXNUMBER;
FLOAT       : DIGIT+ '.' DIGIT+ |
              '.' DIGIT+;
INT         : DIGIT+;
HEXNUMBER   : HEX+;
COMMENT     : '/*' .*? '*/' -> skip;
LINE_COMMENT: '//' .*? '\n' -> skip;
WS          :  [ \t\r\n]+ -> skip;
