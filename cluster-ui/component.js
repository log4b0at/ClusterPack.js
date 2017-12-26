/*jshint esversion: 6*/

Cluster.Ui.Component = class Component extends HTMLElement{
    constructor(options={}){
        super();
        this.options = options;
        this._init();
        Component.count++;
    }
    _init(){

    }

    connectedCallback(){
        this.setAttribute('tabindex', Component.count);
    }
    disconnectedCallback(){  }
    attributeChangedCallback() { }
}


var Component = Cluster.Ui.Component;
Component.count = 0;

Component.tag = 'component';
Cluster.Ui.define(Component);
