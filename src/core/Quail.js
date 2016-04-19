/**
 * @providesModule Quail
 */

'use strict';

var globalQuail = window.globalQuail || {};

const DOM = require('DOM');
const Guideline = require('Guideline');
const TestCollection = require('TestCollection');
const _Assessments = require('_Assessments');

var Quail = {
  /**
   * Main run function for Quail.
   */
  run: function (options) {
    function buildTests (assessmentList, options) {
      let htmlElement = options.html || DOM.scry('html');
      let keys;
      // Create an empty TestCollection.
      var testCollection = TestCollection([], {
        scope: htmlElement
      });
      let assessmentsToRun = []
      if (assessmentList && assessmentList.length) {
        assessmentsToRun = assessmentList;
      }
      else {
        keys = _Assessments.keys();
        let key, next;
        do {
          next = keys.next();
          key = next.value;
          assessmentsToRun.push(key);
        }
        while (!next.done);
      }
      assessmentsToRun.forEach((name) => {
        let mod = _Assessments.get(name);
        if (mod) {
          testCollection.set(name, {
            scope: htmlElement,
            callback: mod.run,
            ...mod.meta
          });
        }
      });
      return testCollection;
    }

    /**
     * A private, internal run function.
     *
     * This function is called when the tests are collected, which might occur
     * after an AJAX request for a test JSON file.
     */
    function _run (testCollection) {
      // Set up Guideline-specific behaviors.
      var noop = function () {};
      for (var guideline in Guideline) {
        if (Guideline[guideline] && typeof Guideline[guideline].setup === 'function') {
          Guideline[guideline].setup(testCollection, Quail, {
            successCriteriaEvaluated: options.successCriteriaEvaluated || noop
          });
        }
      }

      // Invoke all the registered tests.
      testCollection.run({
        preFilter: options.preFilter || function () {},
        caseResolve: options.caseResolve || function () {},
        testComplete: options.testComplete || function () {},
        testCollectionComplete: options.testCollectionComplete || function () {},
        complete: options.complete || function () {}
      });
    }

    // Let wcag2 run itself, will call Quail again when it knows what
    // to
    // if (options.guideline === 'wcag2') {
    //   wcag2.run(options);
    // }

    // If a list of specific tests is provided, use them.
    _run(buildTests(
      options.assessments,
      options
    ));
  },

  // @todo, make this a set of methods that all classes extend.
  listenTo: function (dispatcher, eventName, handler) {
    handler = handler.bind(this);
    dispatcher.registerListener.call(dispatcher, eventName, handler);
  },

  getConfiguration: function (testName) {
    var test = this.tests.find(testName);
    var guidelines = test && test.get('guidelines');
    var guideline = guidelines && this.options.guidelineName && guidelines[this.options.guidelineName];
    var configuration = guideline && guideline.configuration;
    if (configuration) {
      return configuration;
    }
    return false;
  }
};

globalQuail.run = globalQuail.run || function (...args) {
  Quail.run(...args);
}

window.globalQuail = globalQuail;

module.exports = Quail;
