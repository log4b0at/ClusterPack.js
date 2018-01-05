/* jshint esversion:6*/

import Cluster from '../../cluster';
import Component from '../component';
import Helper from '../cluster-ui-helper/component';

//Cluster.need('Ui.Helper');

export default class Termhelp extends Component {

    constructor(){
        super();

        this.events       = [];
        this.events.focus = () => this.helper.showAt( this );
        this.events.blur  = () => this.helper.hide();

        this.elements = [];

        this.elements.title = document.createElement('span');
        this.elements.definition = document.createElement('div');
        this.elements.title.className = "title";
        this.elements.definition.className = "definition";

        this.helper             = document.createElement('cluster-helper');
        this.helper.className   = "termhelp-helper";
        for (var i in this.elements) {
            this.helper.appendChild(this.elements[i]);
        }
    }

    set definition(value){
        this.elements.definition.textContent = value;
    }

    get definition(){
        return this.elements.definition.textContent;
    }

    set title(value){
        this.elements.title.textContent = value;
    }

    get title(){
        return this.elements.title.textContent;
    }

    connectedCallback(){
        this.tabIndex = "-1";
        this.title = this.textContent;
        this.addEventListener("focus", this.events.focus);
        this.addEventListener("blur", this.events.blur);
    }

    disconnectedCallback(){
        this.removeEventListener("focus", this.events.focus);
        this.removeEventListener("blur", this.events.blur);
    }

}

Termhelp.tag = "termhelp";

Cluster.css('stylesheets/component.css');

Cluster.Ui.define(Termhelp);
