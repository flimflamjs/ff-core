'use strict';

var R = require('ramda');
var h = require('snabbdom/h');
var flyd = require('flyd');
flyd.filter = require('flyd/module/filter');
var mapIndex = R.addIndex(R.map);

// User can pass in any default state data
var init = function init(state) {
  // set defaults
  state = R.merge({
    currentStep$: flyd.stream(0),
    jump$: flyd.stream() // Stream of step jumps: pairs of [destinationStep, currentStep]
    , isCompleted$: flyd.stream(false) // Is the wizard completed?
  }, state || {});

  // Stream of valid jump step indexes -- can only jump backwards
  // Filter out all jumps where the destinationStep (first in pair) is less than currentStep (second in pair)
  var validJump$ = flyd.map(R.head, flyd.filter(R.apply(R.lte), state.jump$));
  // Merge in valid jumps into the existing currentStep stream
  state.currentStep$ = flyd.merge(state.currentStep$, validJump$);
  return state;
};

// index view for keeping track of step 
// content should be an array of vnodes or strings 
var labels = function labels(state, content) {
  var width = 100 / content.length + '%';
  return h('div', {
    attrs: { 'data-ff-wizard-label-wrapper': state.isCompleted$() ? 'complete' : 'incomplete' }
  }, mapIndex(labelStep(state, width), content));
};

var labelStep = function labelStep(state, width) {
  return function (content, idx) {
    return h('span', {
      style: { width: width },
      attrs: {
        'data-ff-wizard-label': state.currentStep$() === idx ? 'current' : state.currentStep$() > idx ? 'accessible' : 'inaccessible'
      },
      on: { click: function click(ev) {
          return state.jump$([idx, state.currentStep$()]);
        } }
    }, [content]);
  };
};

// content should be an array of vnodes or strings
var content = function content(state, _content, followup) {
  return h('div', {
    attrs: { 'data-ff-wizard-content-wrapper': state.isCompleted$() ? 'complete' : 'incomplete' }
  }, [bodySteps(state, _content), followupDiv(state, followup || '')]);
};

var bodySteps = function bodySteps(state, content) {
  return h('div', {
    attrs: { 'data-ff-wizard-steps': state.isCompleted$() ? 'complete' : 'incomplete' }
  }, mapIndex(bodyStepDiv(state), content));
};

var bodyStepDiv = function bodyStepDiv(state) {
  return function (content, idx) {
    return h('div', {
      attrs: { 'data-ff-wizard-content': state.currentStep$() === idx ? 'current' : 'not-current' }
    }, [content]);
  };
};

var followupDiv = function followupDiv(state, content) {
  return h('div', {
    attrs: { 'data-ff-wizard-followup': state.isCompleted$() ? 'complete' : 'incomplete' }
  }, [content]);
};

module.exports = { init: init, labels: labels, content: content };

