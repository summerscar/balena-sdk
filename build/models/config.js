
/**
 * @module resin.models.config
 */

(function() {
  var auth, resinRequest, settings;

  resinRequest = require('resin-request');

  settings = require('../settings');

  auth = require('../auth');


  /**
   * getAll callback
   * @callback module:resin.models.config~getAllCallback
   * @param {(Error|null)} error - error
   * @param {Object} config - the configuration
   */


  /**
   * @summary Get all configuration
   * @public
   * @function
   *
   * @param {module:resin.models.config~getAllCallback} callback - callback
   *
   * @example
   *	resin.models.config.getAll (error, config) ->
   *		throw error if error?
   *		console.log(config)
   */

  exports.getAll = function(callback) {
    return auth.getToken(function(error, token) {
      if (error != null) {
        return callback(error);
      }
      return resinRequest.request({
        method: 'GET',
        url: settings.get('urls.config'),
        remoteUrl: settings.get('remoteUrl'),
        token: token
      }, function(error, response, config) {
        if (error != null) {
          return callback(error);
        }
        return callback(null, config);
      });
    });
  };


  /**
   * getPubNubKeys callback
   * @callback module:resin.models.config~getPubNubKeys
   * @param {(Error|null)} error - error
   * @param {Object} pubnubKeys - pubnub keys
   */


  /**
   * @summary Get PubNub keys
   * @public
   * @function
   *
   * @param {module:resin.models.config~getPubNubKeys} callback - callback
   *
   * @example
   *	resin.models.config.getPubNubKeys (error, pubnubKeys) ->
   *		throw error if error?
   *		console.log(pubnubKeys.subscribe_key)
   *		console.log(pubnubKeys.publish_key)
   */

  exports.getPubNubKeys = function(callback) {
    return exports.getAll(function(error, config) {
      if (error != null) {
        return callback(error);
      }
      return callback(null, config.pubnub);
    });
  };


  /**
   * getDeviceTypes callback
   * @callback module:resin.models.config~getDeviceTypes
   * @param {(Error|null)} error - error
   * @param {Object[]} deviceTypes - the device types
   */


  /**
   * @summary Get device types
   * @public
   * @function
   *
   * @param {module:resin.models.config~getDeviceTypes} callback - callback
   *
   * @example
   *	resin.models.config.getDeviceTypes (error, deviceTypes) ->
   *		throw error if error?
   *		console.log(deviceTypes)
   */

  exports.getDeviceTypes = function(callback) {
    return exports.getAll(function(error, config) {
      if (error != null) {
        return callback(error);
      }
      return callback(null, config.deviceTypes);
    });
  };

}).call(this);
