import antlr4 from 'antlr4';
import Message from '../components/utils/Message';

export default class ProtoErrorListener extends antlr4.error.ErrorListener {
    /**
    * Create an ANTLR listener for the output of the 1st phase parser.
    * 
    * @param {{}} config The configuration to use.
    * @param {{success: boolean, output: Array}} log The logger for errors,
    *   warnings, and other messages.
    */
    constructor(config, log) {
        super();

        this.config = config;
        this.log = log;
    }

    syntaxError(recognizer, offendingSymbol, line, column, msg, err) {
        this.log.success = false;
        this.log.output.push(<Message type="error">{`${offendingSymbol} line ${line}, col ${column}: ${msg}`}</Message>);
    }
}
