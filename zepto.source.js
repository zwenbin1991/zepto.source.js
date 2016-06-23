// 项目信息，包括开发者，遵循什么协议
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

// Zepto包裹在闭包iife中，提供了命名空间组织方式，避免代码冲突风险
var Zepto = (function () {
    // 检测是否是html标签包括注释html开头
    var fragmentRE = /^\s*<(\w+|!)[^>]*>/;

    // 检测是否空html标签，没有属性节点和子节点的标签
    var singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/;

    // 检测是否是自定义闭合标签，过滤掉固有闭合标签<input /> <br /> <hr />
    var tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig;

    // 容器对象
    var containers = {
        'tr': document.createElement('tbody'),
        'tbody': table, 'thead': table, 'tfoot': table,
        'td': tableRow, 'th': tableRow,
        '*': document.createElement('div')
    };

    var emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter;

    // 具有快捷方法的集合
    var methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'];

    // 数据类型对象
    var class2type = {};
    var toString = class2type.toString;

    // zepto构造器
    var $;

    // zepto -内部辅助方法对象
    var zepto = {};

    // 内部包含selector和length属性的并且以元素索引为属性的类
    var Z = function (dom, selector) {
        var i, len = dom ? dom.length : 0;

        for (i = 0; i < len; i++)
            this[i] = dom[i];

        this.length = len;
        this.selector = selector || '';
    };

    zepto.Z = function (dom, selector) {
        return new Z(dom, selector);
    };

    // 根据html标签字符串，及其属性对象生成dom节点和属性节点
    zepto.fragment = function (html, name, properties) {
        var dom, nodes, container;

        // 如果是简单html标签，没有属性节点和子节点
        if (singleTagRE.test(html))
            dom = $(document.createElement(RegExp.$1));

        // 如果是复杂html标签
        if (!dom) {
            if (html.replace)
                // 如果是不规范的html标签，例如<div wjj="xxoo" /> 转换成 <div wjj="xxoo"></div>
                html = html.replace(tagExpanderRE, '<$1></$2>');

            if (name === undefined)
                name = fragmentRE.test(html) && RegExp.$1;

            if (!(name in containers)) name = '*';

            container = containers[name];
            container.innerHTML = '' + html;
            dom = $.each(slice.call(container.childNodes), function () {
                container.removeChild(this);
            });

            if (isPlainObject(properties)) {
                nodes = $(dom);

                $.each(properties, function (key, value) {
                    if (methodAttributes.indexOf(key) > -1)
                        nodes[key](value);
                    else
                        nodes.attr(key, value);
                });
            }

            return dom;
        }
    };

    // 对应jquery的$.fn.init方法，目的将传入的选择器构建出dom，最终返回一个带有selector和length属性的并且以元素索引为属性的对象
    zepto.init = function (selector, context) {
        // 解析选择器生成DOM过程
        var dom;

        // 如果没传入参数
        if (!selector)
            return zepto.Z();

        // selector参数是字符串
        if (typeof selector === 'string') {
            // 清除字符串选择器左右空白字符
            selector = selector.trim();

            // 如果是html标签
            if (selector[0] === '<' && fragmentRE.test(selector))
                dom = zepto.fragment(selector, RegExp.$1, context), selector = null;
        }

        // selector是函数，就是dom状态监听器
        else if (isFunction(selector))
            return $(document).ready(selector);

        // selector是zepto的实例
        else if (zepto.isZ(selector)) return selector;

        else {
            if (isArray(selector))
                dom = compact(selector);
            else if (isObject(selector))
                dom = [selector], selector = null;

            /* 下面这3块是不会触发 */
            else if (fragmentRE.test(selector))
                dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null;
            else if (context !== undefined) return $(context).find(selector);
            else dom = zepto.qsa(document, selector);
        }

        return zepto.Z(dom, selector);
    };

    // 返回一个数组元素不为空的新数组
    function compact (array) {
        return filter.call(array, function (item) { return item != null; })
    }

    // 判断集合是否具有length属性
    function likeArray (obj) {
        return typeof obj.length === 'number';
    }

    // 获取变量数据类型
    function type (obj) {
        return obj == null ? String(obj) :
        class2type[toString.call(obj)] || 'object';
    }

    function isArray (array) {
        return type(array) === 'array';
    }

    // 是否是函数
    function isFunction (value) {
        return type(value) === 'function';
    }

    // 是否是对象
    function isObject (obj) {
        return type(obj) === 'object';
    }

    // 是否是window对象
    function isWindow (obj) {
        return obj != null && obj === obj.window;
    }

    // 判断是否是纯对象
    function isPlainObject (obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) === Object.prototype;
    }

    // zepto构造器
    $ = function (selector, context) {
        return zepto.init(selector, context);
    };

    // 集合遍历器
    $.each = function (elements, callback) {
        var i, key;

        if (likeArray(elements)) {
            for (i = 0; i < elements.length; i++)
                if (callback.call(elements[i], i, elements[i]) === false)
                    return elements;
        } else {
            for (key in elements)
                if (callback.call(elements[key], key, elements[key]) === false)
                    return elements;
        }

        return elements;
    };

    // 填充数据类型对象
    $.each('Boolean Number String Function Array Date RegExp Object Error'.split(' '), function (i, name) {
        class2type['[object '+ name +']'] = name.toLowerCase();
    });

    return $;
})();

// 赋予window对象，提升为全局作用域
// 如果在zepto之前没有使用$标示符，则同时创建别名