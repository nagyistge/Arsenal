'use strict'; // eslint-disable-line strict

/**
* Running tests with multiple configurations using varying parameters
* @constructor
*/
class TestMatrix {
    /**
    * Builds a new testing Matrix
    *
    * @param {Object.<string, string|string[]>} params - Argument of the matrix
    *
    * @returns {TestMatrix} new testing Matrix
    */
    constructor(params) {
        /**
        * Create deep copy for prevent the user to modify the object outside
        * the class
        **/
        this.params = Object.assign({}, params);
        this.paramsToString = JSON.stringify(this.params);
        this.callback = null;
        this.elementsToSpecialize = [];
        this.description = '';
        this.listOfExceptions = [];
    }

    /**
    * Callback used for prevent mocha that the test is over
    * Must be call in the end of every test
    * @callback Done
    *
    * @return {undefined}
    */
    /**
    * Callback used for a generated matrix
    * Used by @generate and @if method
    *
    * @callback GenerateMatrixCallback
    * @param {TestMatrix} matrix - The following generate matrix.
    * @param {Done} done - Callback for prevent mocha that we finish
    * the current test. This callback will be empty if not all elements are
    * specialize
    *
    * @return {undefined}
    */

    /**
    * Generate testing matrix, call execute method to run callback
    *
    * @param {string[]} elementsToSpecialize - key element we want to
    *                    specialize on the matrix
    * @param {GenerateMatrixCallback} callback - callback function
    *                    who want to be call on execute method
    *                    for the current generate matrix
    * @param {string} Description - description of the test
    *
    * @returns {TestMatrix} Return current instance of Matrix object
    */
    generate(elementsToSpecialize, callback, description) {
        this.elementsToSpecialize = elementsToSpecialize;
        this.callback = callback;
        this.description = typeof description === 'undefined'
        ? ''
        : description;
        return this;
    }

    /**
    * Method to prevent an exception during the tests.
    *
    * @param {Object.<string, string[]>} exception - The keys of the hash table
    is the element we want to do an exception, the value
    *                      is the value we want to do an exception for the
    *                      specific key.
    *                      All key of the object must be validate with at least
    *                      one value for execute an exception.
    *                      ex: for a hashmap with 'auth' as key and 'v4' as
    *                      value, if we found a matrix with this following
    *                      paramater, it will call the special callback
    * @argument {GenerateMatrixCallback} callbackException - Callback who the
    *                       execute method will call when
    *                       this exception is found.
    *
    * @returns {TestMatrix} Return current instance of Matrix object
    */
    if(exception, callbackException, description) {
        const pair = {
            key: exception,
            callback: callbackException,
            description: typeof description === 'undefined' ? '' : description,
        };
        this.listOfExceptions.push(pair);

        return this;
    }

    /**
    * Return the parameters of the matrix into a Json format
    *
    * @returns {string} JSON format of parameters
    */
    serialize() {
        return this.paramsToString;
    }

    /**
    * Generate the matrix and call all callback enter on @generate and
    * if methods. Must be run as the father matrix for running all the test
    *
    * @returns {undefined}
    */
    execute() {
        /**
        * Check if @generate method has been already called
        */
        if (this.callback) {
            /**
            * Generate matrix element by element, we call the @execute
            * method until that we specialize all element send
            * by generate method
            */
            if (this.elementsToSpecialize.length !== 0) {
                /**
                * Make copy for restore object in the end of recursive function
                */
                const elementToSpecialize = this.elementsToSpecialize[0];
                const originalValues = this.params[elementToSpecialize];

                this.elementsToSpecialize.shift();
                if (!(elementToSpecialize in this.params)) {
                    const errMessage = 'No key of specialization found: ';
                    throw new Error(errMessage + elementToSpecialize);
                } else if (Object.prototype.toString.call(this.
                    params[elementToSpecialize]).indexOf('Array') === -1) {
                    const errMessage = 'Element already specialized: ';
                    throw new Error(errMessage + elementToSpecialize);
                } else {
                    originalValues.forEach(currentElement => {
                        this.params[elementToSpecialize] = currentElement;
                        this.execute();
                    });
                }
                this.params[elementToSpecialize] = originalValues;
                this.elementsToSpecialize.unshift(elementToSpecialize);
            } else {
                /**
                * Create copy for not modify the current instance of the object
                * during the call of the callback function
                */
                const matrixGenerated = new TestMatrix(this.params);
                /**
                * Search if the matrix we generated is an exception
                */

                const callFunction = (matrixFather, matrixChild, callback,
                    description) => {
                    const result = Object.keys(matrixChild.params)
                    .every(currentKey => {
                        return Object.prototype.toString.call(matrixChild.
                            params[currentKey]).indexOf('Array') === -1;
                    });

                    if (result === true) {
                        describe(matrixChild.serialize(), () => {
                            it(description, (done) => {
                                callback(matrixChild, done);
                            });
                        });
                    } else {
                        describe(matrixChild.serialize(), () => {
                            callback(matrixChild, () => {});
                            matrixChild.execute();
                        });
                    }
                };
                let anExceptionWasFound = false;
                this.listOfExceptions.forEach(exception => {
                    const keyExcept = exception.key;
                    const result = Object.keys(keyExcept).every(currentKey => {
                        if (this.params.hasOwnProperty(currentKey) === false) {
                            return false;
                        }
                        const keyParam = this.params[currentKey];
                        return keyExcept[currentKey].indexOf(keyParam) !== -1;
                    });

                    /**
                    * An exception was found, execute the special callback
                    * otherwise, execute the callback send by @generate methode
                    */
                    if (result === true) {
                        callFunction(this, matrixGenerated, exception.callback,
                        exception.description);
                        anExceptionWasFound = true;
                    }
                });
                if (anExceptionWasFound !== true) {
                    callFunction(this, matrixGenerated, this.callback,
                        this.description);
                }
            }
        }
    }
}

module.exports = {
    TestMatrix,
};
