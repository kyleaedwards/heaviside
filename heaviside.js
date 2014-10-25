/**
 * Heaviside
 * General-purpose pub/sub usable in-window and cross-domain.
 *
 * @author Kyle Edwards <edwards.kyle.a@gmail.com>
 * @version 0.1.0
 */

"use strict";

var Heaviside,
    _listeners,
    _run,
    _extractParams,
    _UID = 0;

/**
 * Store of subscriber queues.
 * @private
 */
_listeners = {};

/**
 * Runs through callbacks and executes with payload data.
 *
 * @param {string}     key            Pub/sub message channel key
 * @param {?any}       params         Data payload for subscribers
 * @return {void}
 * @private
 */
_run = function (key, params) {

  var listeners,
      llen;

  if (!key || 'undefined' === typeof _listeners[key])
    return;

  listeners = _listeners[key];
  llen = listeners.length;

  while (llen--)
    listeners[llen](params);

};

/**
 * Extracts and standardizes function parameters from
 * payload data.
 *
 * @param {?any}       data           Data payload for subscribers
 * @return {array}
 * @private
 */
_extractParams = function (data) {

  var params = [];

  if ('string' === typeof data) {
    params = [data];
  } else if (Object.prototype.toString.call(data) === '[object Array]') {
    params = data;
  } else if ('object' === typeof data && data.messageKey) {
    params = [data.messageKey, data];
  }

  return params;

};

Heaviside = {

  /**
   * Publishes a Heaviside event to a target Window object
   * or, if not provided, to the current Heaviside event
   * listeners.
   *
   * @param {Window}   targetWindow   Target Iframe Window object
   * @param {string}   key            Pub/sub message channel key
   * @param {?any}     data           Data payload for subscribers
   * @param {?string}  targetOrigin   Optional origin for x-domain messaging
   * @return {void}
   */
  publish: function (targetWindow, key, data, targetOrigin) {

    if (typeof targetWindow !== 'object' ||
        typeof targetWindow.postMessage !== 'function') {

      targetOrigin = data;
      data = key;
      key = targetWindow;
      _run(key, data);

    } else {

      if (typeof key === 'string')
        key = [key];

      if (typeof data !== 'undefined')
        key.push(data);

      if (typeof targetOrigin === 'undefined')
        targetOrigin = '*';

      key._isHeaviside = true;
      targetWindow.postMessage(key, targetOrigin);

    }

  },

  /**
   * Subscribes to a Heaviside event with a function callback.
   *
   * @param {string}   key            Pub/sub message channel key
   * @param {function} data           Data payload for subscribers
   * @return {boolean|integer}
   */
  subscribe: function (key, callback) {

    if (typeof callback !== 'function')
      return false;

    if ('undefined' === typeof _listeners[key])
      _listeners[key] = [];

    callback.uid = _UID;
    _listeners[key].push(callback);
    return _UID++;

  },

  /**
   * Removes a subscribed callback from the queue.
   *
   * @param {integer}  uid            Callback id returned upon subscription
   * @return {boolean}
   */
  unsubscribe: function (uid) {

    var key,
        llen;

    for (var key in _listeners) {

      if (!_listeners.hasOwnProperty(key))
        continue;

      llen = _listeners[key].length;
      while (llen--) {
        if (_listeners[key][llen].uid === uid) {
          _listeners[key].splice(llen, 1);
          return true;
        }
      }

    }

    return false;

  }

};

/**
 * Initialize message reciever for x-domain Heaviside exchanges.
 */
window.addEventListener('message', function (e) {

  var key;

  /* If message is not an intended Heaviside array, return. */
  if (!e.data._isHeaviside)
    return;

  var key = e.data.shift(),
      params = _extractParams(params);
  _run(key, params);

});

modules.exports = Heaviside;
