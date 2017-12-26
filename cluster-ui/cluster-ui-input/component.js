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
            this.value_last_change = this.value;
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
            console.log(e);
            document.execCommand('insertHTML', false, ')');
            setCurrentCursorPosition(this, getCurrentCursorPosition(this) - 1);
        }
        else if(e.key == '['){
            console.log(e);
            document.execCommand('insertHTML', false, ']');
            setCurrentCursorPosition(this, getCurrentCursorPosition(this) - 1);
        }
    }

    _checkChange(){
        if(this.value_last_change != this.value){
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
        console.log(m,r,c);
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

    get value(){
        return this.textContent;
    }

    set value(v){
        this.update(false, v);
        this._checkChange();
    }

    compile(){
        try{
            var build = this;
            var out = this.textContent.replace(new RegExp(this.knowVariablesReg, 'gi'), (r) => build.getVariableKnowSymbol(r).value);
            var compiled = math.compile(out);
            compiled.eval();
            this.dispatchEvent(new Event('success'));
            this.compiled = compiled;
            this.error = false;
        }
        catch(e){
            this.error = e.message;
            this.dispatchEvent(new Event('error', {
                cancelable: true,
                details:{
                    message: e.message,
                    type: e.type
                }
            }));

        }
    }

    exec(){
        if(this.compiled){
            return this.compiled.eval() || false;
        }
    }



    set type(type){
        if(type == 'math'){
            this.options = {
                typename: 'math',
                knowMethods: [
                    'sin',
                    'cos',
                    'asin',
                    'acos',
                    'log',
                    'ln',
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
        }
        else{
            this.options = {
                knowMethods:[],
                knowVariables:{},
                knowAtoms:[]
            }
        }
    }

    get type(){
        return this.options.type || 'unknow';
    }

}

Cluster.Ui.Input.tag = 'input';

Cluster.Ui.define(Cluster.Ui.Input);

var Input = Cluster.Ui.Input;

Input.classSuffix = 'input';
Input.className = Cluster.Ui.className+'-'+Input.classSuffix;
