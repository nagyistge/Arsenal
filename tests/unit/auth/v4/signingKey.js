'use strict'; // eslint-disable-line strict

const assert = require('assert');

const calculateSigningKey =
    require('../../../../lib/auth/in_memory/vaultUtilities')
        .calculateSigningKey;

describe('v4 signing key calculation', () => {
    it('should calculate a signing key in accordance with AWS rules', () => {
        const secretKey = 'verySecretKey1';
        const region = 'us-east-1';
        const scopeDate = '20160209';
        const expectedOutput = '5c19c3be2935c2aa4fc296754904c2' +
            '8b6dc2aac285635fc2b47bc3a2c293c28b08c299177e5906c394c2b17221';
        const actualOutput = calculateSigningKey(secretKey, region, scopeDate);
        const buff =
            Buffer.from(actualOutput.toString('binary')).toString('hex');
        assert.strictEqual(buff, expectedOutput);
    });
});
