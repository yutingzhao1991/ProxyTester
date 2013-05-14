//EventDeliver
//
//EventDeliver is a tool Class what you can use it custom your events
//It always be used at messages diliver betweent several modules
//depends on seajs , Q.Class
//
//Author: Yu Tingzhao
//Date: 2013 01 16
//Version: 1.0.0
//TODO: 提供更完善的事件分发机制，包括异步同步请求设置，消息独占，消息冒泡，消息捕获，是否丢弃监听之前的事件等等
//


var EventDeliver = function() {
    this.listeners = {};
};

//Custom event util methods for adplayer or video to listen and dispatch event
EventDeliver.prototype.addEventListener = function(type, handler) {
    if (!type) {
        //'type' parameters can't for empty.
        return;
    };

    if (typeof handler != 'function') {
        //'handler' parameters must be function types.
        return;
    };

    if (type instanceof Array) {
        var i = type.length;
        while (i--) {
            this.addEventListener(type[i], handler)
        }
        return;
    };

    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].unshift(handler);
};

EventDeliver.prototype.removeEventListener = function(type, handler) {
    if (!type) {
        //'type' parameters can't for empty.
        return;
    };

    if (typeof handler != 'function') {
        //'handler' parameters must be function types.
        return;
    };

    if (type instanceof Array) {
        var i = type.length;
        while (i--) {
            this.removeEventListener(type[i], handler)
        }
        return;
    };

    var listener = this.listeners[type],
        i;
    if (!listener) {
        return;
    };
    i = listener.length;
    while (i--) {
        if (listener[i] === handler) {
            listener.splice(i, 1);
        };
    }
};
//触发事件
EventDeliver.prototype.dispatchEvent = function(type, data) {
    var listener = this.listeners[type],
        i;
    if (!listener) {
        return;
    };
    i = listener.length;
    while (i--) {
        //用setTimeout触发，采用非阻塞方式，模拟事件驱动。
        //防止错误导致的javascript线程阻塞
        setTimeout((function(handler) {
            return function() {
                try {
                    handler({
                        data: data,
                        type: type
                    })
                } catch (ex) {
                    //error
                }
            }
        })(listener[i]), 0);
    }
};

module.exports = EventDeliver;