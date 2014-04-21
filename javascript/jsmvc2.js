var Jsmvc2 = function BellaJMVC2(){
    this.Ctrl = { o: this };
    this.CallBack = { o: this };
    this.Model = function(uri, callBack, data, extra){
        if(typeof(data) == 'undefined'){ data = {} }
        if(typeof(callBack) == 'undefined'){ callBack = null }
        var self = this;
        $.ajax({ "type": "POST", "url": uri, "data": data, "dataType": "json",
            "success": function(json){
                if(typeof(json) !== 'object'){ json = $.parseJSON(r) }
                if(callBack !== null){ self.CallBack[callBack](json, extra); }},
            "error": function(r){ console.log(r); }
        });
    };
    this.View = function(uri, placeId, data, callBack){
        $.ajax({ "type": "GET", "url": uri, "dataType": "html",
            "success": function(viewHtml){
                //清理特殊字元
                viewHtml = viewHtml.replace(/\t/g, '');
                viewHtml = viewHtml.replace(/\n/g, '');
                viewHtml = viewHtml.replace(/\r/g, '');
                if(placeId === null || data === {}){
                    callBack(viewHtml);
                    return false;
                }
                var viewCreateList = function(listObj, data){
                    //取得清單名稱
                    var listAttrValue = listObj.attr('be-list');
                    //找不到對應資料就清除清單，並傳回假
                    if(typeof(data[listAttrValue]) !== 'object'){
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
                        itemPlaceholderNames = itemPlaceholderNames.map(function(val){
                            var pattern = new RegExp('\\{\\{' + listAttrValue + '\\.(.*?)\\}\\}', 'g');
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
                                if(itemPlaceholderNames.indexOf(keyNames[key]) !== -1){
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
                    if(typeof(data[dataIndex]) !== 'object'){
                        valueNames.push(dataIndex);
                    }
                }
                //依篩選出的物件屬性值以覆寫佔位字元
                for(var valueIndex in valueNames){
                    var valuePlaceholderNames = viewHtml.match(new RegExp('\\{\\{' + valueNames[valueIndex] + '\\}\\}', 'g'));
                    if(valuePlaceholderNames !== null){
                        viewHtml = viewHtml.replace(new RegExp('\\{\\{' + valueNames[valueIndex] + '\\}\\}', 'g'), data[valueNames[valueIndex]]);
                    }
                }
                //將樣版插入區域
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
                    if(listNames.indexOf(listForAttr) === -1){
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
                if(typeof(callBack) !== 'undefined'){
                	callBack(place.html());
                }
            },
            "error": function(r){ console.log(r); }
        });
    };
    this.Func = { o: this };
    this.Var = { o: this };
    this.Init = function(){
        for(var i in this.Ctrl){
            if(i.substring(0,2) == '__'){ this.Ctrl[i](); }
        }
    };
}
