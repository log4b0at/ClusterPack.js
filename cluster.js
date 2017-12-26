/*jshint esversion: 6*/
var Cluster = {
    'version': '0.0.1',
    'versiontype': 'alpha',
    'className': 'cluster',
    'path': 'cluster/',
    'mainFileName': 'cluster.js',
    'Utils': {
        uppath(path, level) {
            var r = path.split('/'), f='';
            r.forEach( (e, i) => {
                if(i<level){
                    f+=e;
                }
            });
            return f;
        },
        downpath(path, level) {
            var r = path.split('/').reverse(), f='';
            r.forEach( (e, i) => {
                if(i<level){
                    f=e+'/'+f;
                }
            });
            return f;
        },

        goodTime(ms){
            if(ms >= 1000) return (ms/1000).toFixed(3)+'s';
            else if(ms < 1 && ms > 0.001) return (ms*1000).toFixed(3)+'µs';
            else if(ms <= 0.001) return (ms*1000000).toFixed(3)+'ns';
            else return ms.toFixed(3)+'ms';
        }
    }
};

Cluster.whereShouldBe = function(needed){
    var parsed_propertie, result='', ppath;
    parsed_propertie = needed.split('.');
    var last = Cluster[parsed_propertie[0]];
    if(last){
        parsed_propertie.forEach( (e) => {
            if(last){
                ppath = (last.path + last.mainFileName )|| e;
                result+= '/'+ppath;
                last = last[e];
            } else return false;
        });
    } else return false;
    return result;
};

Cluster.Benchmark = class Benchmark{
    constructor(options={}){
        this.iterations = options.iterations;

        this.ms_start = options.start;
        this.ms_end = options.end;
        this.ms_delta = options.end-options.start;
        this.ms_average = this.ms_delta/this.iterations;

        this.delta = Cluster.Utils.goodTime(this.ms_delta);
        this.average = Cluster.Utils.goodTime(this.ms_average);
        this.mode = options.mode;
    }
};

Cluster.randomHash = function(len=32, security=true){
    var saltAlpha = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
        "abcdefghijklmnopqrstuvwxyz"+ (security ? './-+_%*£\\ç^äâëêùàèé$§!()[]{}:,?\'"' : '');

    var salt = 'rh$';
    for(var i = 0; i < len; ++i) {
        salt += saltAlpha.charAt(
        Math.floor(Math.random() * saltAlpha.length));
    }

    return salt;
};

Cluster.benchmark = function (callback, options={}) {
    var dc = // default config
    {
        iterations: 1,
        mode: 'simple'
    };
    var it=1, bt=0, at=0, mode ;
    if(typeof options == 'number'){
        it = options;
        mode = dc.mode;
    }
    else{
        if(typeof options.iterations == 'number') it = options.iterations;
        else it = dc.iterations;
        if(typeof options.mode == 'string') mode = options.mode;
        else mode = dc.mode;
    }

    if(mode == 'simple'){
        bt = performance.now();
        for(let i = 0; i < it ; i++){
            callback();
        }
        at = performance.now();
    }

    return new Cluster.Benchmark({
        iterations: it,
        start: bt,
        end: at,
        mode: mode
    });

};

Cluster.NeedError = class NeedError extends Error{
    constructor(needed='some unknow', message=''){
        super(message);
        this.name = 'ClusterNeedError';
        this.splittedStack = this.stack.split('\n');
        this.fileOriginPath = this.splittedStack[this.splittedStack.length-1].replace(/at | /g,'');
        this.fileOriginName = Cluster.Utils.downpath(this.fileOriginPath, 2).replace(/:[0-9]+:[0-9]+/,'');
        this.stack = this.splittedStack[this.splittedStack.length-1];
        this.needed = needed;
        var whereis = needed+" should be in \'"+Cluster.whereShouldBe(needed)+"\'\n";
        this.message = 'A cluster object in \''+this.fileOriginName+'\' need '+this.needed+' element...\n'+whereis+message;
    }
};

Cluster.need = function(needed, message){
    var parsed_propertie;
    parsed_propertie = needed.split('.');
    if(parsed_propertie.length == 1){
        if(!Cluster[parsed_propertie[0]]) throw new Cluster.NeedError(needed, message);
    }
    else if(parsed_propertie.length == 2){
        if(Cluster[parsed_propertie[0]]){
            if(!Cluster[parsed_propertie[0]][parsed_propertie[1]]) throw new Cluster.NeedError(needed, message);
        }
        else{
            throw new Cluster.NeedError(parsed_propertie[0], message);
        }
    }
};

Cluster.Ui = {
    'classSuffix': 'ui',
    'path': Cluster.path+"cluster-ui/",
    'mainFileName': "component.js",
    'define': function (object){
        if(window.customElements){
            window.customElements.define('cluster-'+object.tag, object);
        }
        else{
            document.registerElement('cluster-'+object.tag, object);
        }
    }
};

Cluster.Ui.className = Cluster.className+'-'+Cluster.Ui.classSuffix;
