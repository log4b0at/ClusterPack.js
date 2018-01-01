/*jshint esversion: 6*/

import Cluster from '../cluster';

export default class Component extends HTMLElement{
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


Component.count = 0;

Component.tag = 'component';
Cluster.Ui.define(Component);
