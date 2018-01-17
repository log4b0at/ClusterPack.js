/*jshint esversion: 6*/

import Cluster from '../cluster';


export default class Component extends HTMLElement{

    constructor(options={}){
        super();
        this.options = options;

        Component.count++;
        Component.list.push(this);
    }

    addClass(classname){
        var list = this.className.split(' ');
        if(list.indexOf(classname) == -1){
            list.push(classname);
            this.className = list.join(' ');
        }
    }

    remClass(classname){
        var list = this.className.split(' ');
        var index = list.indexOf(classname);
        if(index != -1){
            let part1 = list.slice(0, index);
            let part2 = list.slice(index+1, list.length);

            list = part1.concat(part2);

            this.className = list.join(' ');
        }
    }

    static get observedAttributes(){
        let e= [];
        for(let i in this.attributes_registered){ e.push(i); }
        return e;
    }

    connectedCallback(){
        //this.setAttribute('tabindex', Component.count);
    }

    disconnectedCallback(){  }

    attributeChangedCallback(name, old, value) {
        if(this.constructor.attributes_registered[name]){
            this.constructor.attributes_registered[name](this, old, value);
        }
    }

    static registerAttribute(name, callback){
        this.attributes_registered[name] = callback;
    }

    static get path(){
        return '/cluster-ui/cluster-ui-' + this.tag;
    }

    set theme( value ){
        this.setAttribute('theme', value);
    }

    get theme(){
        return this.getAttribute('theme');
    }

    static set theme ( value ){
        Component.list.forEach( (element, index) => {
            element.theme = value;
        });
    }


    static get tag () {
        return this.name.toLowerCase();
    }

    static define(){
        Cluster.Ui.define(this);
    }

    /**
     * @static css - Append css file in stylesheets folder of the component to document.
     *
     * @param  {type} path File path without 'stylesheets' folder
     *
     */
    static css (path){
        Cluster.css(this.path + ('/stylesheets/'+path).replace(/\/\//, '/'));
    }
}

Component.attributes_registered = {};


Component.count = 0;
Component.list = [];

Component.define();
