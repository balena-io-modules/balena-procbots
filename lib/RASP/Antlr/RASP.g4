grammar RASP;


/*
bot(FortuneBot) {
    AddListener(github, {port: 1234, path: '/hooks'})
    AddEmitter(github, {login: 'blah'})
    
    RequestEvents({ 'issue', printIssue })

    printIssue {
        event.action is 'open' then:
            log(event 'is opened!')

    }
}
*/

init: botDefinition | EOF;

botDefinition: 'bot(' ALPHA ')' '{' botBody '}';

//innards: addListener | addEmitter | requestEvents | innards;
botBody: addListener;


addListener: 'AddListener(' serviceName (',' serviceConstructor) ')\n';


serviceName: 'github';
serviceConstructor: githubConstructor;

// Github
githubConstructor:  '{' githubConstructorType (',' githubConstructorType)* '}' |
                    '{' '}'
                    ;
githubConstructorType:  ('appId' | 'secret' | 'pem') ':' ALPHA;

/*
addEmitter: 'AddEmitter(' serviceName (',' constructor ) ')\n';
requestEvents: 'RequestEvents(' eventRegistration (',' eventRegistration)* ')\n';

serviceName: 'github';
constructor: githubConstructor;
githubConstructor:  '{' pair (',' pair)* '}' |
                    '{' '}'
                    ;

eventRegistration: '{' eventName ',' eventMethod '}';
pair: ALPHA ':' ALPHA;

eventMethod: ALPHA;
eventName: ALPHA;
*/


ALPHA:  [a-zA-Z]+;
INT  :	[0-9]+;
WS   :  [ \t\r\n]+ -> skip;
