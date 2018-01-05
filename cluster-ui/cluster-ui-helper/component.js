 /* jshint esversion:6*/

import Cluster from '../../cluster';
import Component from '../component';


/**
 * @class Helper
 * @desc A helper popup component
 * @extends Component
 */
export default class Helper extends Component {

    constructor(){
        super();

        this.events   = [];

        this.events.mousedown = (e) => {e.stopPropagation(); e.preventDefault()};

    }

    connectedCallback(){
        this.align = this.align || "vertical";
        this.addEventListener("mousedown", this.events.mousedown);
    }

    disconnectedCallback(){
        this.removeEventListener("focus", this.events.focus);
        this.removeEventListener("blur", this.events.blur);
    }

    attributeChangedCallback(name, oldvalue, newvalue){
        if(name == 'ALIGN'){
            //this.showAt(this.lastShowAt);
        }
    }


    /**
     * showAt
     * @desc Displays the component at a position relative to a specified element
     *       and handles the obstacle that is the borders of the window.
     * @memberof Helper
     * @param  {HTMLElement|Array|Object} at An HTML element, a table including the coordinates (x and y), or an object including the properties x and y.
     * @return {void}
     */
    showAt(at) {
        if (at instanceof HTMLElement){

            let storePosition = this.style.position;

            this.style.position = "";

            let top = at.offsetTop,     // Top position of the element
                left = at.offsetLeft,   // Left position of the element
                atw = at.offsetWidth,   // Width of the element
                ath = at.offsetHeight,  // Height of the element

                w = this.hiddenProperty('offsetWidth'), //  Width of the this, getting with little hack, cluster.js@hiddenProperty
                h = this.hiddenProperty('offsetHeight'), // Same for the height

                arrowpos = ""; // A variable to store the determination of the "arrow-position" attribute

            this.style.position = storePosition;

            /*
            The component is displayed before calculating its position, for technical reasons.
            */
            Helper.animateShow( this, 100 );


            /*
            First, we distinguish cases for calculating the position of the component.
            1st - is the horizontal alignment
            2nd - is the vertical alignment.
            */
            if(this.align == 'horizontal'){

                let ctop  = top +(ath + 14),
                    cleft = left + (atw/2)-(w/2);

                if(ctop+h+10 > window.innerHeight){
                    this.style.top = "";
                    this.style.bottom = window.innerHeight - top + 10 + "px";
                    arrowpos = "bottom-";
                }
                else{
                    this.style.top = ctop + "px";
                    this.style.bottom = "";
                    arrowpos = "top-";
                }

                if(cleft < 0){
                    this.style.left = Helper.bordmin(left, 10) + "px";
                    this.style.right = "";
                    arrowpos+= "left";
                }
                else if(cleft+w > window.innerWidth){
                    this.style.left = "";
                    this.style.right = Helper.bordmin(window.innerWidth - left - atw, 10) + "px";
                    arrowpos+= "right";
                }
                else{
                    this.style.left = cleft + "px";
                    this.style.right = "";
                    arrowpos+= "center";
                }
            }
            else if(this.align == 'vertical'){

                let ctop    = top - (h/2)+(ath/2),
                    cleft   = left + atw + 20;

                if(cleft+w+10 > window.innerWidth){
                    this.style.left = "";
                    this.style.right = (window.innerWidth - left + 15) + "px";
                    arrowpos = "right-";
                }
                else{
                    this.style.left = cleft + "px";
                    this.style.right = "";
                    arrowpos = "left-";
                }

                if(ctop+h+10 > window.innerHeight){
                    this.style.top = "";
                    this.style.bottom = (window.innerHeight - top - 10) + "px";
                    arrowpos += "bottom";
                }
                else if(ctop-10 < 0){
                    this.style.top = Helper.bordmin(top-8, 10) + "px";
                    this.style.bottom = "";
                    arrowpos += "top";
                }
                else{
                    this.style.top = ctop + "px";
                    this.style.bottom = "";
                    arrowpos += "center";
                }
            }

            this.arrowPosition = arrowpos;

            this.lastShowAt = at;
        }
        else if(at instanceof Array){
            this.lastShowAt = at;
        }
        else if (at instanceof Object) {

        }
        else {
            throw new TypeError('Argument 1 should be HTMLElement, Array or Object');
        }
    }


    /**
     * set align - A attribute-linked property for alignment
     *
     * @param  {string} value enum, 'vertical' or 'horizontal'
     * @memberof Helper
     * @return {void}
     */
    set align(value){
        this.setAttribute('align', value);
    }


    /**
     * get align - A attribute-linked property for alignment
     * @memberof Helper
     * @return {string} Value of 'align' attribute.
     */
    get align(){
        return this.getAttribute('align');
    }




    /**
     * set arrowPosition - A attribute-linked property for arrow position
     *
     * @param  {type} value struct in 2 part 'XXXXX-XXXXX', Example: 'top-center', 'right-bottom'
     * @memberof Helper
     * @return {void}
     */
    set arrowPosition(value){
        this.setAttribute('arrow-position', value);
    }


    /**
     * get arrowPosition - A attribute-linked property for arrow position
     * @memberof Helper
     * @return {type}
     */
    get arrowPosition(){
        return this.getAttribute('arrow-position');
    }


    /**
     * show - Apply a fade in display on the component
     * @public
     *
     * @param  {number} [time] The time that the animation must take
     * @memberof Helper
     * @return {void}
     */
    show(time){
        Helper.animateShow(this, time);
    }

    /**
     * hide - Apply a fade out hide on the component
     *
     * @param  {number} [time] The time that the animation must take
     * @memberof Helper
     * @return {void}
     */
    hide(time){
        Helper.animateHide(this, time);
    }

    /**
     * @static animateShow - Starts a fade in CSS animation and adds the specified element to the document element.
     * @memberof Helper
     *
     * @param  {type} element   A HTML Element
     * @param  {type} [time]      The time that the animation must take
     * @return {void}
     */
    static animateShow(element, time=100){
        element.style.opacity = "0";
        element.style.transition = "opacity "+time+"ms linear";

        try{document.documentElement.appendChild(element);}catch(e){}

        setTimeout( () => element.style.opacity = "1" , 50);
    }


    /**
     * @static animateHide - Starts a fade out CSS animation and try to remove the specified element.
     * @memberof Helper
     *
     * @param  {HTMLElement}  element A HTML element
     * @param  {number}       [time] The time that the animation must take
     * @return {void}
     */
    static animateHide(element, time=100){
        element.style.transition = "opacity "+time+"ms linear";
        element.style.opacity = "0";
        setTimeout( () => {
          try{
            element.remove();
          }
          catch(e){}
        }, time+50);
    }


    /**
     * @static bordmin - Respect a borders
     * @memberof Helper
     *
     * @param  {number} value description
     * @param  {number} min   description
     * @return {number}
     */
    static bordmin(value, min){
        return ((value < min) ? min : value);
    }

}


Helper.tag = "helper";

Cluster.css(Helper.path+'/stylesheets/component.css');

Cluster.Ui.define(Helper);
