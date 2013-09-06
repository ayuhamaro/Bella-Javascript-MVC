var Jmvc = function BellaJMVC(){
    this.Ctrl = { o: this };
    this.Model = function(uri, viewNameStr, data, pass){
        if(typeof(data) == 'undefined'){ data = {} }
        if(typeof(viewNameStr) == 'undefined'){ viewNameStr = null }
        var self = this;
        $.ajax({ "type": "POST", "url": uri, "data": data, "dataType": "json",
            "success": function(r){
                if(typeof(r) !== 'object'){ r = $.parseJSON(r)}
                if(viewNameStr !== null){
                    viewArray = viewNameStr.split(',');
                    for(var i in viewArray){ self.View[viewArray[i]](r, pass); }
                }},
            "error": function(r){ console.log(r); }
        });
    };
    this.View = { o: this };
    this.Func = { o: this };
    this.Var = { o: this };
    this.Init = function(ctrlNameStr){
        ctrlArray = ctrlNameStr.split(',');
        for(var i in ctrlArray){ this.Ctrl[ctrlArray[i]](); }
    };
}