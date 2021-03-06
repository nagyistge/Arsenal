'use strict'; // eslint-disable-line strict

const errors = require('../../index').errors;

const AuthInfo = require('./AuthInfo');
const backend = require('./in_memory/backend');

const client = backend;

/** vaultSignatureCb parses message from Vault and instantiates
 * @param {object} err - error from vault
 * @param {object} userInfo - info from vault
 * @param {object} log - log for request
 * @param {function} callback - callback to authCheck functions
 * @return {undefined}
 */
function vaultSignatureCb(err, userInfo, log, callback) {
    // vaultclient API guarantees that it returns:
    // - either `err`, an Error object with `code` and `message` properties set
    // - or `err == null` and `info` is an object with `message.code` and
    //   `message.message` properties set.
    if (err) {
        log.error('received error message from vault', { errorMessage: err });
        return callback(err);
    }

    log.debug('received user info from Vault', { userInfo });
    return callback(null, new AuthInfo(userInfo.message.body));
}

const vault = {};

/**
 * authenticateV2Request
 *
 * @param {string} accessKey - user's accessKey
 * @param {string} signatureFromRequest - signature sent with request
 * @param {string} stringToSign - string to sign built per AWS rules
 * @param {string} algo - either SHA256 or SHA1
* @param {RequestContext} requestContext - an instance of a RequestContext
 * object containing information for policy authorization check
 * @param {object} log - Werelogs logger
 * @param {function} callback - callback with either error or user info
 * @return {undefined}
 */
vault.authenticateV2Request = (accessKey, signatureFromRequest,
    stringToSign, algo, requestContext, log, callback) => {
    log.debug('authenticating V2 request');
    client.verifySignatureV2(stringToSign, signatureFromRequest, accessKey,
        { algo, reqUid: log.getSerializedUids(), requestContext },
    (err, userInfo) => vaultSignatureCb(err, userInfo, log, callback));
};

/** authenticateV4Request
 * @param {object} params - contains accessKey (string),
 * signatureFromRequest (string), region (string),
 * stringToSign (string) and log (object)
 * @param {object} requestContext - info for policy auth check
 * @param {function} callback - callback with either error or user info
 * @return {undefined}
*/
vault.authenticateV4Request = (params, requestContext, callback) => {
    const accessKey = params.accessKey;
    const signatureFromRequest = params.signatureFromRequest;
    const region = params.region;
    const scopeDate = params.scopeDate;
    const stringToSign = params.stringToSign;
    const log = params.log;

    log.debug('authenticating V4 request');
    client.verifySignatureV4(stringToSign, signatureFromRequest,
        accessKey, region, scopeDate, { reqUid: log.getSerializedUids(),
            requestContext },
    (err, userInfo) => vaultSignatureCb(err, userInfo, log, callback));
};

/** getCanonicalIds -- call Vault to get canonicalIDs based on email addresses
 * @param {array} emailAddresses - list of emailAddresses
 * @param {object} log - log object
 * @param {function} callback - callback with either error or an array
 * of objects with each object containing the canonicalID and emailAddress
 * of an account as properties
 * @return {undefined}
*/
vault.getCanonicalIds = (emailAddresses, log, callback) => {
    log.trace('getting canonicalIDs from Vault based on emailAddresses',
        { emailAddresses });
    client.getCanonicalIds(emailAddresses, { reqUid: log.getSerializedUids() },
        (err, info) => {
            if (err) {
                log.error('received error message from vault',
                    { errorMessage: err });
                return callback(err);
            }
            const infoFromVault = info.message.body;
            log.trace('info received from vault', { infoFromVault });
            const foundIds = [];
            for (let i = 0; i < Object.keys(infoFromVault).length; i++) {
                const key = Object.keys(infoFromVault)[i];
                if (infoFromVault[key] === 'WrongFormat'
                || infoFromVault[key] === 'NotFound') {
                    return callback(errors.UnresolvableGrantByEmailAddress);
                }
                const obj = {};
                obj.email = key;
                obj.canonicalID = infoFromVault[key];
                foundIds.push(obj);
            }
            return callback(null, foundIds);
        });
};

/** getEmailAddresses -- call Vault to get email addresses based on canonicalIDs
 * @param {array} canonicalIDs - list of canonicalIDs
 * @param {object} log - log object
 * @param {function} callback - callback with either error or an object
 * with canonicalID keys and email address values
 * @return {undefined}
*/
vault.getEmailAddresses = (canonicalIDs, log, callback) => {
    log.trace('getting emailAddresses from Vault based on canonicalIDs',
        { canonicalIDs });
    client.getEmailAddresses(canonicalIDs, { reqUid: log.getSerializedUids() },
        (err, info) => {
            if (err) {
                log.error('received error message from vault',
                    { errorMessage: err });
                return callback(err);
            }
            const infoFromVault = info.message.body;
            log.trace('info received from vault', { infoFromVault });
            const result = {};
            /* If the email address was not found in Vault, do not
            send the canonicalID back to the API */
            Object.keys(infoFromVault).forEach(key => {
                if (infoFromVault[key] !== 'NotFound' &&
                infoFromVault[key] !== 'WrongFormat') {
                    result[key] = infoFromVault[key];
                }
            });
            return callback(null, result);
        });
};

module.exports = vault;
