const Case = require('Case');
const Quail = {};
const SuccessCriteria = require('SuccessCriteria');
const Test = require('Test');
const TestCollection = require('TestCollection');

const newElement = require('../ext/new-element');

describe('SuccessCriteria', function () {
  var _successCriteria;

  beforeEach(function () {
    _successCriteria = new SuccessCriteria();
  });

  it('should be an instance of SuccessCriteria', function () {
    expect(_successCriteria).to.be.instanceof(SuccessCriteria);
  });

  describe('get/set', function () {
    it('should set and get properties', function () {
      _successCriteria.set('name', 'Pidgeon');
      expect(_successCriteria.get('name')).to.equal('Pidgeon');
    });
  });

  describe('filterTests', function () {
    var _testCollection;
    var _requiredTests;

    beforeEach(function () {
      _testCollection = new TestCollection();
      _successCriteria = new SuccessCriteria({
        'name': 'wcag:1.1.1'
      });
      var g = {
        'wcag': {
          '1.1.1': {
            'techniques': [
              'F65',
              'G74',
              'H24'
            ]
          }
        }
      };
      // Create a few fake tests and add them to the collection.
      var test;
      _requiredTests = [];
      for (var i = 0; i < 5; ++i) {
        test = new Test('fakeTest-' + i, {
          'type': 'selector',
          'options': {
            'selector': 'i.unittest'
          },
          'guidelines': g
        });
        _testCollection.add(test);
        _requiredTests.push('fakeTest-' + i);
      }
    });

    it('should filter tests', function () {
      var criteriaTests = _successCriteria.filterTests(_testCollection, _requiredTests);
      expect(criteriaTests).to.have.length(5);
    });
  });

  describe('addConclusion', function () {
    var _case;

    beforeEach(function () {
      _case = new Case();
    });

    it('should add a Case indexed by conclusion', function () {
      _successCriteria.addConclusion('untested', _case);
      expect(_successCriteria.get('results')['untested'][0]).to.equal(_case);
    });
  });

  xdescribe('event dispatching', function () {
    var _testCollection;
    var evaluator;
    var listener;

    describe('successCriteriaEvaluated', function () {

      beforeEach(function () {
        _testCollection = new TestCollection();
        evaluator = function () {
          _successCriteria.set('status', 'passed');
        };
        _successCriteria = SuccessCriteria({
          'name': 'wcag:1.1.1',
          'evaluator': evaluator
        });
        // @todo, we need a mockable object that will listen to events.
        listener = new TestCollection();
      });

      it('should dispatch the successCriteriaEvaluated event', function (done) {
        listener.listenTo(_successCriteria, 'successCriteriaEvaluated', function (eventName, successCriteria, testCollection) {
          expect(testCollection).to.have.length(5);
          expect(eventName).to.equal('successCriteriaEvaluated');
          done();
        });
        // Create a few fake tests and add them to the collection.
        var test;
        var testName;
        for (var i = 0; i < 5; ++i) {
          testName = 'fakeTest-' + i;
          Quail[testName] = function () {};
          test = new Test(testName, {
            'type': 'selector',
            'options': {
              'selector': 'i.unittest'
            }
          });
          _testCollection.add(test);
        }
        _successCriteria.registerTests(_testCollection);
        _testCollection.run();
        });
    });
  });

  xdescribe('preEvaluator', function () {
    var _testCollection;
    var listener;

    beforeEach(function () {
      _testCollection = new TestCollection();
      _successCriteria = new SuccessCriteria({
        'name': 'wcag:1.1.1'
      });
      _successCriteria.set('preEvaluator', function () {
        // We skip all the tests.
        // This will set the status as 'inapplicable'.
        return false;
      });
      // @todo, we need a mockable object that will listen to events.
      listener = new TestCollection();
    });

    it('should should skip all tests if it fails', function (done) {
      listener.listenTo(_successCriteria, 'successCriteriaEvaluated', function (eventName, successCriteria) {
        expect(successCriteria.get('status')).to.equal('inapplicable');
        done();
      });
      // Create a few fake tests and add them to the collection.
      var test;
      var g = {
        'wcag': {
          '1.1.1': {
            'techniques': [
              'F65',
              'G74',
              'H24'
            ]
          }
        }
      }
      for (var i = 0; i < 5; ++i) {
        test = new Test('fakeTest-' + i, {
          'type': 'selector',
          'options': {
            'selector': 'i.unittest'
          },
          'guidelines': g
        });
        _testCollection.add(test);
      }
      _successCriteria.registerTests(_testCollection);
      _successCriteria.get('tests').run();
    });
  });

  describe('status', function () {
    var _testCollection;
    var evaluator;
    var listener;

    beforeEach(function () {
      _testCollection = new TestCollection();
      evaluator = function () {
        _successCriteria.set('status', 'passed');
      };
      _successCriteria = SuccessCriteria({
        'name': 'wcag:1.1.1',
        'evaluator': evaluator
      });
      listener = new TestCollection();
    });

    xdescribe('noTestCoverage', function () {

      it('should be returned when no tests are available for the SuccessCriteria', function (done) {
        listener.listenTo(_successCriteria, 'successCriteriaEvaluated', function (eventName, successCriteria) {
          expect(successCriteria.get('status')).to.equal('noTestCoverage');
          done();
        });
        // Create a few fake tests and add them to the collection.
        var test;
        var testName;
        var g = {
          'wcag': {
            '1.3.2': {
              'techniques': ['G57']
            },
            '4.1.1': {
              'techniques': ['F49']
            }
          }
        }
        for (var i = 0; i < 5; ++i) {
          testName = 'fakeTest-' + i;
          Quail[testName] = function () {};
          test = new Test(testName, {
            'type': 'custom',
            'guidelines': g
          });
          _testCollection.add(test);
        }
        _successCriteria.registerTests(_testCollection);
        _testCollection.run();
      });
    });

    xdescribe('noResults', function () {
      it('should be returned when tests do not produce results for the SuccessCriteria', function (done) {
        listener.listenTo(_successCriteria, 'successCriteriaEvaluated', function (eventName, successCriteria) {
          expect(successCriteria.get('status')).to.equal('noResults');
          done();
        });
        // Create a few fake tests and add them to the collection.
        var test;
        var testName;
        var g = {
        'wcag': {
          '1.1.1': {
            'techniques': [
              'F65',
              'G74',
              'H24'
            ]
          }
        }
      }
        for (var i = 0; i < 5; ++i) {
          testName = 'fakeTest-' + i;
          Quail[testName] = function () {};
          test = new Test(testName, {
            'type': 'custom',
            'guidelines': g
          });
          _testCollection.add(test);
        }
        _successCriteria.registerTests(_testCollection);
        _testCollection.run();
      });
    });
  });

  describe('totals', function () {
    var _testCollection;
    var listener;

    beforeEach(function () {
      _testCollection = new TestCollection();
      _successCriteria = SuccessCriteria({
        'name': 'wcag:1.1.1'
      });
      listener = new TestCollection();
    });

    xit('should return the correct test totals', function (done) {
      listener.listenTo(_successCriteria, 'successCriteriaEvaluated', function (eventName, successCriteria) {
        expect(successCriteria.get('totals')['passed']).to.equal(1);
        expect(successCriteria.get('totals')['failed']).to.equal(10);
        expect(successCriteria.get('totals')['cases']).to.equal(11);
        done();
      });
      // Create a few fake tests and add them to the collection.
      var test;
      var g = {
        'wcag': {
          '1.1.1': {
            'techniques': [
              'F65',
              'G74',
              'H24'
            ]
          }
        }
      }
      Quail['fakeTest-0'] = function (test) {
        // Fail 10 times.
        for (var i = 0, il = 10; i < il; ++i) {
          test.add(Case({
            element: newElement('<span></span>'),
            status: 'failed'
          }));
        }
      };
      // Test that will fail 10 times
      test = new Test('fakeTest-0', {
        'guidelines': g
      });
      _testCollection.add(test);
      // Test that will pass once
      Quail['fakeTest-1'] = function (test) {
        test.add(Case({
          element: newElement('<span></span>'),
          status: 'passed'
        }));
      };
      test = new Test('fakeTest-1', {
        'guidelines': g
      });
      _testCollection.add(test);
      _successCriteria.registerTests(_testCollection);
      _testCollection.run();
    });
  });
});
