// Author: Thomas Davis <thomasalwyndavis@gmail.com>
// Filename: main.js

// Require.js allows us to configure shortcut alias
require.config({
  paths: {
    jquery: '/static/js/libs/jquery/jquery-min',
    cookie: '/static/js/libs/jquery/jquery.cookie',
    underscore: '/static/js/libs/underscore/underscore-min',
    backbone: '/static/js/libs/backbone/backbone-optamd3-min',
    text: '/static/js/libs/require/text',
    order: '/static/js/libs/require/order',

    scroll: '/static/js/libs/scroller/jquery.scrollIntoView',

    alerts: '/static/js/libs/bootstrap/bootstrap-alerts',
    modal: '/static/js/libs/bootstrap/bootstrap-modal',
    twipsy: '/static/js/libs/bootstrap/bootstrap-twipsy',
    popover: '/static/js/libs/bootstrap/bootstrap-popover',
    button: '/static/js/libs/bootstrap/bootstrap-button',
  },
  urlArgs: "bust=" +  (new Date()).getTime(),
});

require([
    'underscore',
    'router',
    'backbone',
], function(_, Router, Backbone){
    var app_router = new Router();
    Backbone.history.start();
});
