
/**
 * @module resin.auth
 */

(function() {
  var async, data, errors, resinRequest, settings, token, _;

  async = require('async');

  _ = require('lodash-contrib');

  errors = require('resin-errors');

  resinRequest = require('resin-request');

  token = require('./token');

  data = require('./data');

  settings = require('./settings');


  /**
   * authenticate callback
   * @callback module:resin.auth~authenticateCallback
   * @param {(Error|null)} error - error
   * @param {String} token - session token
   * @param {String} username - username
   */


  /**
   * @summary Authenticate with the server
   * @protected
   * @function
   *
   * @description You should use {@link module:resin.auth.login} when possible,
   * as it takes care of saving the token and username as well.
   *
   * Notice that if `credentials` contains extra keys, they'll be discarted
   * by the server automatically.
   *
   * @param {Object} credentials - in the form of username, password
   * @param {String} credentials.username - the username
   * @param {String} credentials.password - the password
   * @param {module:resin.auth~authenticateCallback} callback - callback
   *
   * @example
   *	resin.auth.authenticate credentials, (error, token, username) ->
   *		throw error if error?
   *		console.log("My username is: #{username}")
   *		console.log("My token is: #{token}")
   */

  exports.authenticate = function(credentials, callback) {
    return exports.getToken(function(error, token) {
      if (error != null) {
        return callback(error);
      }
      return resinRequest.request({
        method: 'POST',
        url: settings.get('urls.authenticate'),
        remoteUrl: settings.get('remoteUrl'),
        json: credentials,
        token: token
      }, function(error, response) {
        var savedToken;
        if (error != null) {
          return callback(error);
        }
        savedToken = response != null ? response.body : void 0;
        return callback(null, savedToken, credentials.username);
      });
    });
  };


  /**
   * login callback
   * @callback module:resin.auth~loginCallback
   * @param {(Error|null)} error - error
   */


  /**
   * @summary Login to Resin.io
   * @public
   * @function
   *
   * @description If the login is successful, the token is persisted between sessions.
   * This function saves the token to the directory configured in dataPrefix
   *
   * @param {Object} credentials - in the form of username, password
   * @param {String} credentials.username - the username
   * @param {String} credentials.password - the password
   * @param {module:resin.auth~loginCallback} callback - callback
   *
   * @example
   *	resin.auth.login credentials, (error) ->
   *		throw error if error?
   *		console.log('I\'m logged in!')
   */

  exports.login = function(credentials, callback) {
    return async.waterfall([
      function(callback) {
        return exports.authenticate(credentials, callback);
      }, function(authToken, username, callback) {
        return token.saveToken(authToken, callback);
      }
    ], callback);
  };


  /**
   * login callback
   * @callback module:resin.auth~loginWithTokenCallback
   * @param {(Error|null)} error - error
   */


  /**
   * @summary Login to Resin.io with a token
   * @public
   * @function
   *
   * @description
   *
   * This function saves the token to the directory configured in dataPrefix
   *
   * @param {String} token - the auth token
   * @param {module:resin.auth~loginWithTokenCallback} callback - callback
   *
   * @example
   *	resin.auth.loginWithToken token, (error) ->
   *		throw error if error?
   *		console.log('I\'m logged in!')
   */

  exports.loginWithToken = token.saveToken;


  /**
   * isLoggedIn callback
   * @callback module:resin.auth~isLoggedInCallback
   * @param {Boolean} isLoggedIn - is logged in
   */


  /**
   * @summary Check if you're logged in
   * @public
   * @function
   *
   * @param {module:resin.auth~isLoggedInCallback} callback - callback
   *
   * @example
   *	resin.auth.isLoggedIn (isLoggedIn) ->
   *		if isLoggedIn
   *			console.log('I\'m in!')
   *		else
   *			console.log('Too bad!')
   */

  exports.isLoggedIn = function(callback) {
    return token.hasToken(callback);
  };


  /**
   * getToken callback
   * @callback module:resin.auth~getTokenCallback
   * @param {(Error|null)} error - error
   * @param {String} token - session token
   */


  /**
   * @summary Get current logged in user's token
   * @public
   * @function
   * @borrows module:resin.data.token.getToken as getToken
   *
   * @param {module:resin.auth~getTokenCallback} callback - callback
   *
   * @description This will only work if you used {@link module:resin.auth.login} to log in.
   *
   * @example
   *	resin.auth.getToken (error, token) ->
   *		throw error if error?
   *		console.log(token)
   */

  exports.getToken = token.getToken;


  /**
   * logout callback
   * @callback module:resin.auth~logoutCallback
   * @param {(Error|null)} error - error
   */


  /**
   * @summary Logout from Resin.io
   * @public
   * @function
   *
   * @param {module:resin.auth~logoutCallback} [callback=_.noop] - callback
   *
   * @example
   *	resin.auth.logout (error) ->
   *		throw error if error?
   *		console.log('I\'m out!')
   *
   * @todo Maybe we should post to /logout or something to invalidate the token on the server?
   */

  exports.logout = function(callback) {
    if (callback == null) {
      callback = _.noop;
    }
    return token.clearToken(callback);
  };


  /**
   * register callback
   * @callback module:resin.auth~registerCallback
   * @param {(Error|null)} error - error
   * @param {String} token - session token
   */


  /**
   * @summary Register to Resin.io
   * @public
   * @function
   *
   * @param {Object} [credentials={}] - in the form of username, password and email
   * @param {String} credentials.username - the username
   * @param {String} credentials.password - the password
   * @param {String} credentials.email - the email
   * @param {module:resin.auth~registerCallback} callback - callback
   *
   * @example
   *	resin.auth.register {
   *		username: 'johndoe'
   *		password: 'secret'
   *		email: 'johndoe@gmail.com'
   *	}, (error, token) ->
   *		throw error if error?
   *		console.log(token)
   */

  exports.register = function(credentials, callback) {
    if (credentials == null) {
      credentials = {};
    }
    if (credentials.username == null) {
      return callback(new errors.ResinMissingCredential('username'));
    }
    if (credentials.password == null) {
      return callback(new errors.ResinMissingCredential('password'));
    }
    if (credentials.email == null) {
      return callback(new errors.ResinMissingCredential('email'));
    }
    return async.waterfall([
      function(callback) {
        return exports.getToken(callback);
      }, function(token, callback) {
        return resinRequest.request({
          method: 'POST',
          url: settings.get('urls.register'),
          remoteUrl: settings.get('remoteUrl'),
          token: token,
          json: credentials
        }, callback);
      }, function(response, body, callback) {
        return callback(null, body);
      }
    ], callback);
  };

}).call(this);
