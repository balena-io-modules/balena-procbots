# RASP Work

## Prereqs

1. Install Java
2. Install ANTLR, and set up the classpaths:

```
cd /usr/local/lib
sudo curl -O http://www.antlr.org/download/antlr-4.7-complete.jar
export CLASSPATH=".:/usr/local/lib/antlr-4.7-complete.jar:$CLASSPATH"
alias antlr4='java -jar /usr/local/lib/antlr-4.7-complete.jar'
alias grun='java org.antlr.v4.gui.TestRig'
```

This lets you use the visitor that actually generates the TS parser/lexer files in `lib/RASP/Antlr`. If you don't want/need to generate these files and just want to use the pre-compiled ones, there's no need to install Antlr.

## Running
```
gulp build; node build/RASP/parser.js
```

Builds the main RASP files (and ProcBots) and then runs the parser app. Currently this is hardcoded to parse the `fortuneNoComments.rasp` file.

## More Info

The grammar is currently defined in `lib/RASP/Antlr/RASP.g4`. Running it in `antlr4ts` generates the parser/lexers in the `lib/RASP/Antlr` directory that is included by `lib/RASP/parser.ts` to actually walk a source file. The grammar shows the rules used to create the language.

The parser uses a set of ANTLR listeners to walk through the file to parse and lex/parse it. It creates a top level structure defined in the interfaces of `lib/RASP/parser-types.d.ts` which defines the bot to be created, as well as:

* An array of ServiceListeners to include
* An array of ServiceEmitters to include
* The events to register with each ServiceListener, along with the ListenerMethod to pass events to
* An array of ListenerMethods called with events from particular listeners
* Global variables for the Bot (currently just via assigned statements)
* An array of statements in each ListenerMethod, in order, to compile

Expressions are generic, and run the gamit from arithmetic and logical operations to assignments, method calls, loops, etc.

The default parsing of `fortuneNoComments.rasp` outputs the final bot AST generated from the parsing of the source file. There is currently more to do, including the bulk of the statements. However, it gives an observer a good idea of what the final structure will be.