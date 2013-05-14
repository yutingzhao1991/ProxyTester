var EventDeliver = require('./eventDeliver');
var proxy = require('./proxy');

/**
 * @param {String} a name for this unit
 * @param {Express} express()
 * @param [{Array}] array of Service
 */
var Unit = function(name, services) {
    this._eventDeliver = new EventDeliver();
    this._name = name;
    this._proxy = proxy;
    this._servicesMap = {};
    console.log('init unit: ' + name);
    if(services) {
        for(var i=0; i<services.length; i++) {
            this._registerService(services[i]);
        }
    }
};

// private methods
Unit.prototype._registerService = function(service) {
    console.log('register service: ' + service.name);
    if(this._servicesMap[service.name]) {
        this._dispatchEvent('error', {
            message: 'service ' + service.name + ' already exist'
        });
        return;
    }
    this._servicesMap[service.name] = service;
    service._onRegister(this);
};

Unit.prototype._dispatchEvent = function(type, data) {
    console.log(type);
    console.log(data);
    this._eventDeliver.dispatchEvent(type, data);
};

Unit.prototype._onJudge = function(service, type, message) {
    message = message || '';
    console.log('unit _onJudge');
    if(type == 'error') {
        this._dispatchEvent('failure', {
            message: 'service ' + service.name + ' test failed: ' + message
        });
    } else {
        this._dispatchEvent('success', {
            message: 'service ' + service.name + ' test success: ' + message
        });
    }
};

Unit.prototype.start = function() {
    console.log('start unit: ' + this._name);
    for(var i in this._servicesMap) {
        this._servicesMap[i]._start();
    }
};
Unit.prototype.stop = function() {
    for(var i in this._servicesMap) {
        this._servicesMap[i]._stop();
    }
};
Unit.prototype.registerService = function(service) {
    this._registerService(service);
};
Unit.prototype.unregisterService = function(service) {};

Unit.prototype.addListener = function(type, handler) {
    this._eventDeliver.addEventListener(type, handler);
};
Unit.prototype.removeListener = function(type, handler) {
    this._eventDeliver.removeEventListener(type, handler);
};

module.exports = Unit;