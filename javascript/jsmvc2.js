var Jsmvc2 = function BellaJMVC2(name){
    this.Ctrl = {};
    this.CallBack = {};
    this.Var = { o: this };
    var objName = name;
    $(function(){
        if(window[objName] instanceof Jsmvc2){  //IE9以前無法抓到透過var定義的全域變數，只好用指定的
            for(var i in window[objName].Ctrl){            //自動執行控制器裡的所有函式
                if(typeof(window[objName].Ctrl[i]) === 'function'){
                    window[objName].Ctrl[i].bind(window[objName])();
                }
            }
        }
    });
};
Jsmvc2.prototype.Model = function(uri, callBack, data, extra){
    if(typeof(data) === 'undefined'){ data = {} }
    var self = this;
    $.ajax({ "type": "POST", "url": uri, "data": data, "dataType": "json",
        "success": function(json){
            if(typeof(callBack) !== 'undefined' && callBack !== null){
                if(typeof(json) !== 'object'){ json = $.parseJSON(r) }
                if(typeof(callBack) === 'function'){
                    callBack(json, extra);
                }else if(typeof(callBack) === 'string'){
                    self.CallBack[callBack].bind(self)(json, extra);
                }
            }
        },
        "error": function(r){ console.log(r); }
    });
};
Jsmvc2.prototype.View = function(uri, placeId, data, callBack){
    var self = this;
    $.ajax({ "type": "GET", "url": uri, "dataType": "html",
        "success": function(viewHtml){
            var rendered = self.Render(viewHtml, placeId, data);
            if(typeof(callBack) === 'function'){
                callBack(rendered);
            }
        },
        "error": function(r){ console.log(r); }
    });
};
Jsmvc2.prototype.Render = function(viewHtml, placeId, data){
    //清理特殊字元
    viewHtml = viewHtml.replace(/\t/g, '');
    viewHtml = viewHtml.replace(/\n/g, '');
    viewHtml = viewHtml.replace(/\r/g, '');
    if(placeId === null && data === {}){
        return viewHtml;
    }
    var viewCreateList = function(listObj, data){
        //取得清單名稱
        var listAttrValue = listObj.attr('be-list');
        //找不到對應資料就清除清單，並傳回假
        if($.isArray(data[listAttrValue] === false)){
            listObj.empty();
            return false;
        }
        //如果資料數量為零就清除清單，並傳回假
        if(data[listAttrValue].length === 0){
            listObj.empty();
            return false;
        }
        //取出清單項的HTML
        var itemHtml = listObj.html();
        //找出清單項HTML中的佔位字元
        var itemPlaceholderNames = itemHtml.match(/\{\{(.*?)\}\}/g);
        if(itemPlaceholderNames !== null){
            //清除前綴字符後，建立項目屬性列表
            itemPlaceholderNames = $.map(itemPlaceholderNames, function(val){
                var pattern = new RegExp('\\{\\{' + listAttrValue + '\\.(.*?)\\}\\}');
                val = pattern.exec(val);
                return val[1];
            });
        }
        //從第一筆資料列出資料的屬性名稱
        var keyNames = [];
        for(var listAttrValueIndex in data[listAttrValue][0]){
            keyNames.push(listAttrValueIndex);
        }
        //清除清單內容，準備用DOM填入清單
        listObj.empty();
        //迭代各筆資料
        for(var rowIndex in data[listAttrValue]){
            var rowHtml = itemHtml;
            //如果有佔位字元
            if(itemPlaceholderNames !== null){
                //迭代各屬性
                for(var key in keyNames){
                    //如果有該屬性的佔位字元，就以物件屬性值覆寫佔位字元
                    if($.inArray(keyNames[key], itemPlaceholderNames) !== -1){
                        rowHtml = rowHtml.replace(new RegExp('\\{\\{' + listAttrValue + '\\.' + keyNames[key] + '\\}\\}', 'g'),
                            data[listAttrValue][rowIndex][keyNames[key]]);
                    }
                }
            }
            //以DOM填入清單
            listObj.append(rowHtml);
            //找出先前填入的最後一個清單項
            var nowRow = listObj.children().last();
            //迭代各屬性
            for(var key in keyNames){
                //找出清單項裡指定的屬性欄位
                var itemValue = nowRow.find('[be-value=\'' + listAttrValue + '.' + keyNames[key] + '\']');
                if(itemValue.length > 0){
                    //以DOM方式填入元素內容
                    itemValue.html(data[listAttrValue][rowIndex][keyNames[key]]);
                }
            }
        }
        return true;
    };
    //找出非物件的屬性鍵值，避免陣列資料
    var valueNames = [];
    for(var dataIndex in data){
        if($.isArray(data[dataIndex]) === false){
            valueNames.push(dataIndex);
        }
    }
    //依篩選出的物件屬性值以覆寫佔位字元
    for(var valueIndex in valueNames){
        var valuePlaceholderNames = viewHtml.match(new RegExp('\\{\\{' + valueNames[valueIndex] + '\\}\\}'));
        if(valuePlaceholderNames !== null){
            viewHtml = viewHtml.replace(new RegExp('\\{\\{' + valueNames[valueIndex] + '\\}\\}', 'g'), data[valueNames[valueIndex]]);
        }
    }
    //將樣版插入區域
    if(placeId === null){
        return viewHtml;
    }
    var place = $('#' + placeId);
    place.html(viewHtml);
    //依篩選出的物件屬性值以DOM填入元素內容值
    for(var valueIndex in valueNames){
        var value = place.find('[be-value=' + valueNames[valueIndex] + ']');
        if(value.length > 0){
            value.html(data[valueNames[valueIndex]]);
        }
    }
    //找出DOM裡的列表根元素
    var listNames = [];
    var listObjs = place.find('[be-list]');
    //迭代元素清單
    listObjs.each(function(){
        var listForAttr = $(this).attr('be-list');
        //忽略同名的清單
        if($.inArray(listForAttr, listNames) === -1){
            listNames.push(listForAttr);
        }
    });
    //依照元素清單找出元素本體
    for(var listIndex in listNames){
        var listObj = place.find('[be-list=' + listNames[listIndex] + ']');
        //處理清單，同名的清單將迭代處理
        listObj.each(function(){
            viewCreateList($(this), data);
        });
    }
    return place.html();
};
Jsmvc2.prototype.Func = { o: this };
Jsmvc2.prototype.Func.enterBindBtnClick = function(selector, submitButtonId){
    $(selector).keydown(function(e){
        if(e.keyCode === 13){
            $('#' + submitButtonId).click();
        }
    });
};
//提供對舊瀏覽器的支援
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP
                                 ? this
                                 : oThis || this,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}
