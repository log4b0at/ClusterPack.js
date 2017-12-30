/*jshint esversion: 6*/

Cluster.need('Ui.Component');

function createRange(node, chars, range) {
    if (!range) {
        range = document.createRange()
        range.selectNode(node);
        range.setStart(node, 0);
    }

    if (chars.count === 0) {
        range.setEnd(node, chars.count);
    } else if (node && chars.count >0) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.length < chars.count) {
                chars.count -= node.textContent.length;
            } else {
                 range.setEnd(node, chars.count);
                 chars.count = 0;
            }
        } else {
            for (var lp = 0; lp < node.childNodes.length; lp++) {
                range = createRange(node.childNodes[lp], chars, range);

                if (chars.count === 0) {
                   break;
                }
            }
        }
   }

   return range;
};

function setCurrentCursorPosition(element,chars) {
    if (chars >= 0) {
        var selection = window.getSelection();


        range = createRange(element, { count: chars });

        if (range) {
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
};

function isChildOf(node, parent) {
    while (node !== null) {
        if (node === parent) {
            return true;
        }
        node = node.parentNode;
    }

    return false;
};

function getCurrentCursorPosition(parent) {
    //var parentId = parent.id;
    var selection = window.getSelection(),
        charCount = -1,
        node;

    if (selection.focusNode) {
        if (isChildOf(selection.focusNode, parent)) {
            node = selection.focusNode;
            charCount = selection.focusOffset;

            while (node) {
                if (node === parent) {
                    break;
                }

                if (node.previousSibling) {
                    node = node.previousSibling;
                    charCount += node.textContent.length;
                } else {
                     node = node.parentNode;
                     if (node === null) {
                         break;
                     }
                }
           }
      }
   }

    return charCount;
};


Cluster.Ui.Input = class Input extends Cluster.Ui.Component{
    constructor(){
        super();
        this.compiled = null;
    }

    connectedCallback(){
        this._initInput();
        this._initConfig();
    }

    _initConfig(){
        this.options = {
            typename: 'math',
            knowMethods: [
                'sin',
                'cos',
                'asin',
                'acos',
                'log',
                'sqrt',
                'random',
                'round'
            ],
            knowVariables:{
                'pi': {
                    symbol: 'π',
                    value: 3.141592653589793
                },
                'phi': {
                    symbol: 'φ',
                    value: 1.618033988749894
                },
                'euler':{
                    symbol: 'ℇ',
                    value: 2.718281828459045
                },
                'tau':{
                    symbol: 'τ',
                    value: 6.283185307179586
                }
            },
            knowAtoms: [
                'infinity',
                'null',
                'not',
                'and',
                'or',
                'xor'
            ]
        };
        this.setKnowVariables(this.options.knowVariables);
        this.setKnowAtoms(this.options.knowAtoms);
    }

    _initInput(){
        var build = this;
        this.spellcheck = false;
        this.setAttribute('contenteditable', true);
        this.addEventListener('input', (e) => this.update(e));
        this.addEventListener('keydown', (e) => this.keydown(e));
        this.addEventListener('blur', (e) => this._checkChange(e));
        this.addEventListener('change', (e) => {
            this.value_last_change = this.textContent;
            this.compile();
        });
        this.addEventListener('error', (e) => this.className = "error");
        this.addEventListener('success', (e) => this.className = "");
    }

    keydown(e){
        if(e.keyCode == 13){
            this._checkChange();
            this.blur();
        }
        else if(e.key == '('){
            document.execCommand('insertHTML', false, ')');
            setCurrentCursorPosition(this, getCurrentCursorPosition(this) - 1);
        }
        else if(e.key == '['){
            document.execCommand('insertHTML', false, ']');
            setCurrentCursorPosition(this, getCurrentCursorPosition(this) - 1);
        }
    }

    _checkChange(){
        if(this.value_last_change != this.textContent){
            this.dispatchEvent(new Event('change'));
        }
    }

    update(e, v){
        var pos = getCurrentCursorPosition(this);
        var length = this.textContent.length;

        this.contentUpdate(v);

        if(pos-1 <= this.textContent.length){
            if(this.textContent.length == 0 || pos == 0) return;
            pos = pos - (length - this.textContent.length);
            setCurrentCursorPosition(this, pos);
        }
        else{
            setCurrentCursorPosition(this, this.textContent.length);
        }
    }

    contentUpdate(v){
        var a = v || this.textContent;
        if(this.knowVariablesReg) {
            a = a.replace(new RegExp(this.knowVariablesAliasReg,"gi"), (m,r) => this.getSymbolKnowAlias(m));
            a = a.replace(new RegExp(this.knowVariablesReg,"gi"), (m,r) => this._getHighlightKnowVariables(m));
        }
        if(this.knowAtomsReg) a = a.replace(new RegExp(this.knowAtomsReg,"gi"), (m,r,c) => this._getHighlightKnowAtoms(m, r,c));
        a = a.replace(/([0-9]+)/g,'<span class="cui-number">$1</span>');
        a = a.replace(/([a-zA-Z]+)\(/g, (m,r) => this._getHighlightKnowMethods(r));
        this.innerHTML = a;
    }

    _getHighlightKnowMethods(r){
        if(this.options.knowMethods){
            if(this.options.knowMethods.indexOf(r)!=-1){
                return '<span class="cui-method know">'+r+'</span>(';
            }
        }
        return '<span class="cui-method unknow">'+r+'</span>(';
    }

    getSymbolKnowAlias(alias){
        alias = alias.toLowerCase();
        if(this.options.knowVariables[alias]){
            return this.options.knowVariables[alias].symbol;
        }
        return false;
    }

    getVariableKnowAlias(alias){
        alias = alias.toLowerCase();
        var r;
        if(r = this.options.knowVariables[alias]) return r;
        return false;
    }

    getVariableKnowSymbol(symbol){
        var knowVariables = this.options.knowVariables;
        for (var i in knowVariables){
            if(knowVariables[i].symbol == symbol){
                return knowVariables[i];
            }
        }
        return false;
    }

    getAliasKnowSymbol(symbol){
        var knowVariables = this.options.knowVariables;
        for (var i in knowVariables){
            if(knowVariables[i].symbol == symbol){
                return i;
            }
        }
        return false;
    }

    _getHighlightKnowVariables(r){
        if(this.options.knowVariables){
            if(this.getAliasKnowSymbol(r)){
                return '<span class="cui-var">'+r+'</span>';
            }
        }
        return false;
    }

    _getHighlightKnowAtoms(m,r,c){
        if(this.options.knowAtoms){
            return m[0]+'<span class="cui-atom">'+m.substring(1, m.length-1)+'</span>'+m[m.length-1];
        }
        return false;
    }

    setKnowVariables(list){
        if(list){
            var knowVariablesReg=[], knowVariablesAliasReg=[];
            for ( var i in list ) {
                knowVariablesReg.push(/*'([^a-zA-Z])'+*/list[i].symbol);
                knowVariablesAliasReg.push(i);
            }
            this.knowVariablesReg = knowVariablesReg.join('|');
            this.knowVariablesAliasReg = knowVariablesAliasReg.join('|');
        }
        else{
            this.knowVariablesReg = false;
            this.knowVariablesAliasReg = false;
        }
        this.options.knowVariables = list;
        this.update();
    }


    /**
     * setKnowAtoms - set know "atom" keywords to highlight
     *
     * @param  {array} list A formatted list of know atoms
     * @return {void}
     */
    setKnowAtoms(list){
        if(list){
            var knowAtomsReg=[];
            for ( var i in list ) {
                knowAtomsReg.push(list[i]);
            }
            this.knowAtomsReg = "([^a-zA-Z])("+knowAtomsReg.join('|')+")([^a-zA-Z]|\b)";
        }
        else{
            this.knowAtomsReg = false;
        }
        this.options.knowAtoms = list;
        this.update();
    }



    /**
     * compile -
     * @description After each change of the input field, this function is called and compiles the entered expression.
         If it returns an error the event "error" is launched, otherwise if all happens normally the event "success" is launched.
         The method will store a value in "this.compiled" that can be evaluated by the getter "value",
         thus offering a much higher computation speed.
         The method will check the entered unit and if it does not match the quantity entered in the "type" attribute,
         it will return an "invalid measure" error.
     *
     * @return {void}
     */
    compile(){

        try{
            var build = this;
            // "out" is a pre-compiled value for Math library can compile
            var out;
            // "compiled" store the compiled returned by Math library
            var compiled;
            // "_eval" store the evaluation of Math Library, here he is use for error debugging
            var _eval;

            console.log(this.type, this.unit, this.textContent);
            // If the field is empty
            if(this.textContent == ""){
                // If a default value is define, compile and store it.
                if(this.default && this.default != "false") {
                    compiled = math.compile(this.default);
                    _eval = compiled.eval();
                }
                else{ // Else throw error
                    throw new Error("The field is empty but no default value has been set.");
                }
            }
            else{
                // Precompile, Compile and Eval for debugging
                out = this.textContent.replace(new RegExp(this.knowVariablesReg, 'gi'), (r) => build.getVariableKnowSymbol(r).value);
                compiled = math.compile(out);
                _eval = compiled.eval();
            }

            if(compiled){

                // Check if the compiled its unit hashmap
                if(_eval.units){
                    // Store the type key of the compiled, example: "length", "power", "energi"...
                    var typekey = _eval.units[0].unit.base.key.toLowerCase();
                    if(this.type == 'number'){
                        throw new TypeError('Invalid measure: Need "number" but the entry is "'+typekey+'"');
                    }
                    else if( typekey != this.type.toLowerCase() ) {
                        // If the key not matches, throw error message
                        throw new TypeError('Invalid measure: Need "'+this.type.toLowerCase()+'" but the entry is "'+typekey+'"');
                    }
                }

                // Otherwise if the compiled value is a unit while the expected type is a number, throw an error.
                else if( typeof(_eval) != 'number' ){
                    throw new TypeError('Invalid measure: Need "'+this.type.toLowerCase()+'" but the entry is "number"');
                }
            }

            // Dispatch a Success event
            this.dispatchEvent(new Event('success'));
            // Store the compiled for the getter "value" of this object for future evaluations.
            this.compiled = compiled;
            // Set error message to false
            this.error = false;
            this.title = '';

            // Dispatch a Compile event
            this.dispatchEvent(new Event('compile'));
        }
        catch(e){
            // If a error is throw, the message is store in this.error
            this.error = e.message;

            // And a "error" event is dispatch
            this.dispatchEvent(new Event('error', {
                cancelable: true,
                details:{
                    message: e.message,
                    type: e.type
                }
            }));

            // Set the title according to the error message to give the user a return of his error.
            this.title = this.error;

            // Dispatch compile event
            this.dispatchEvent(new Event('compile'));
        }
    }

    set type(v){
        this.setAttribute('type', v || 'number');
        this.compile();
    }

    get type(){
        return this.getAttribute('type') || number;
    }

    set unit(v){
        this.setAttribute('unit', v || false);
        this.compile();
    }

    get unit(){
        return this.getAttribute('unit') || 'number';
    }


    /**
     * get value - Return a evaluation of the compiled expression
     *
     * @return {object, number}  The evaluated value
     */
    get value(){
        // If the compiled is store
        if(this.compiled){
            // If a unit is define, try to convert value
            if(this.unit != 'number' || !this.unit && this.unit != 'false'){
                try{
                    return this.compiled.eval().to(this.unit);
                }
                catch(e){
                    this.error = "Conversion failed: Unable to convert to "+this.unit;
                    this.dispatchEvent(new Event('error', {
                        cancelable: true,
                        details:{
                            message: e.message,
                            type: e.type
                        }
                    }));
                    this.title = this.error;
                }
            }
            // [Else without block] return evaluated value or false
            return this.compiled.eval() || false;
        }
    }

    set value(v){
        this.update(false, v);
        this._checkChange();
    }

    get default(){
        return this.getAttribute('default') || false;
    }

    set default(v){
        this.setAttribute('default', v || false);
        // Update the compilation
        this.compile();
    }

}

Cluster.Ui.Input.tag = 'input';

Cluster.Ui.define(Cluster.Ui.Input);

var Input = Cluster.Ui.Input;

Input.classSuffix = 'input';
Input.className = Cluster.Ui.className+'-'+Input.classSuffix;
