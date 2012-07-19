// Author: Thomas Davis <thomasalwyndavis@gmail.com>
// Filename: main.js

// Require.js allows us to configure shortcut alias
require.config({
  paths: {
    jquery: 'libs/jquery/jquery-min',
    cookie: 'libs/jquery/jquery.cookie',

    backbone: 'libs/backbone/backbone-min',
    underscore: 'libs/underscore/underscore-min',
    text: 'libs/require/text',
    order: 'libs/require/order',

    scroll: 'libs/scroller/jquery.scrollIntoView',

    bootstrap: 'libs/bootstrap/bootstrap',
    alerts: 'libs/bootstrap/bootstrap-alerts',
    modal: 'libs/bootstrap/bootstrap-modal',
    tooltip: 'libs/bootstrap/bootstrap-tooltip',
    // popover: 'libs/bootstrap/bootstrap-popover',
    button: 'libs/bootstrap/bootstrap-button',

    maps: 'libs/gmaps/gmaps',
  },
  urlArgs: "bust=" +  (new Date()).getTime(),
});

require([
    'jquery',
    'bootstrap',
    'underscore',
    'app',
    'common/ego_website',

    'router',
    'backbone',
    'models/state',
    'collections/attributes',

    'views/world',
    'views/navbar',
    'views/login'
], function($, bootstrap, _, app, common, Router, Backbone, appState, Attributes,
    worldView, navbarView, loginView
    ){

    var appp = app.getState();
    console.log('appp', appp)

    state = new appState();
    this.state.progress('static files loaded, getting config');

    $.getJSON('/config', function(config){
        appp.setConfig(config);
        appp.initConfig();

        var attrCollection = new Attributes([], {state:state});
        attrCollection.state = state;
        state.attrCollection = attrCollection;

        // var personCollection = new Persons([], {state:state});
        // personCollection.state = state;
        // state.personCollection = personCollection;

        var navview = new navbarView({});
        navview.render();

        var wldView = new worldView({
            navbar: navview,
        });
        wldView.render();


        navview.bind('signin', wldView.showLoginBox);
        navview.bind('signup', wldView.showLoginBox);
        navview.bind('account', wldView.showAccount);
        

        wldView.login = new loginView();
        appp.bind('login', navview.render);
        appp.bind('signedup', navview.render);
        appp.bind('deleted', navview.render);
        wldView.login.bind('reminder', wldView.showReminder);

        var app_router = new Router({
            // controlsView: cview,
            // state: state,
        });
        state.router = app_router;
        Backbone.history.start();
    });
});
