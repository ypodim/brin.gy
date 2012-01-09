// Author: Thomas Davis <thomasalwyndavis@gmail.com>
// Filename: main.js

// Require.js allows us to configure shortcut alias
require.config({
  paths: {
    jquery: 'libs/jquery/jquery-min',
    cookie: 'libs/jquery/jquery.cookie',
    underscore: 'libs/underscore/underscore-min',
    backbone: 'libs/backbone/backbone-optamd3-min',
    text: 'libs/require/text',
    order: 'libs/require/order',

    alerts: 'libs/bootstrap/bootstrap-alerts',
    modal: 'libs/bootstrap/bootstrap-modal',
    twipsy: 'libs/bootstrap/bootstrap-twipsy',
    popover: 'libs/bootstrap/bootstrap-popover',
    
  }

});

require([
    'views/app',
    'views/welcome',
    'views/manager',
    'router',
    'backbone',
], function(AppView, WelcomeView, ManagerView, Router, Backbone){
    var app_view = new AppView;
    app_view.render();
    
    var page_view;

    if (E.agent.id) {
        console.log("going manager");
        page_view = new ManagerView;
    } else {
        console.log("going index");
        page_view = new WelcomeView;
    }
    page_view.render();

    var app_router = new Router;
    Backbone.history.start();
});
