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
    'collections/persons',

    'views/world',
    'views/navbar',
    'views/login'
], function($, bootstrap, _, app, common, Router, Backbone, appState, Attributes, Persons,
    worldView, navbarView, loginView
    ){

    var appp = app.getState();
    console.log('appp', appp)

    state = new appState();
    this.state.progress('static files loaded, getting config');

    $.getJSON('/config', function(config){
        appp.setConfig(config);

        var cookie = common.cookies.get_cookie();
        var pseudonyms = cookie.pseudonyms;
        for (username in pseudonyms) {
            // state.user.name = username;
            // state.user.pwd = pseudonyms[username].secret;
            // state.user.email = pseudonyms[username].email;
            appp.usernames[username] = {
                name: username,
                pwd: pseudonyms[username].secret,
                email: pseudonyms[username].email,
            };
            appp.user = username;
        }

        console.log('context in cookie', cookie.last_context);
        if (!cookie.last_context) {
            cookie.last_context = 'all';
            common.cookies.set_context_in_cookie(cookie.last_context);
        }
        appp.context = {name:cookie.last_context};
        console.log('now context in cookie', common.cookies.get_cookie().last_context);

        var attrCollection = new Attributes([], {state:state});
        attrCollection.state = state;
        state.attrCollection = attrCollection;

        var personCollection = new Persons([], {state:state});
        personCollection.state = state;
        state.personCollection = personCollection;

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
        wldView.login.bind('reminder', wldView.showReminder);

        var app_router = new Router({
            // controlsView: cview,
            // state: state,
        });
        state.router = app_router;
        Backbone.history.start();
    });
});
