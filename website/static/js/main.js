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

    alerts: 'libs/bootstrap/bootstrap-alerts',
    modal: 'libs/bootstrap/bootstrap-modal',
    twipsy: 'libs/bootstrap/bootstrap-twipsy',
    popover: 'libs/bootstrap/bootstrap-popover',
    button: 'libs/bootstrap/bootstrap-button',
  },
  urlArgs: "bust=" +  (new Date()).getTime(),
});

require([
    'jquery',
    'underscore',
    'common/ego_website',

    'router',
    'backbone',
    'models/state',
    'collections/attributes',
    'collections/persons',

    'views/controls',
], function($, _, common, Router, Backbone, appState, Attributes, Persons,
    controlsView
    ){

    state = new appState();
    this.state.progress('static files loaded, getting config');

    $.getJSON('/config', function(config){
        state.satellite = {};
        state.satellite.url = config.discov_url;
        state.agent = {};
        state.agent.id = config.agentid;
        state.agent.baseurl = config.ego_url_prefix;
        state.agent.url = config.ego_url_prefix+"/"+config.agentid;
        state.website_url = config.website_url_prefix;
        state.device = config.device;

        var cookie = common.cookies.get_cookie();
        var pseudonyms = cookie.pseudonyms;
        for (username in pseudonyms) {
            state.user.name = username;
            state.user.pwd = pseudonyms[username].secret;
            state.user.email = pseudonyms[username].email;
        }

        console.log('context in cookie', cookie.last_context);
        if (!cookie.last_context) {
            cookie.last_context = 'all';
            common.cookies.set_context_in_cookie(cookie.last_context);
        }
        state.context = {name:cookie.last_context};
        console.log('now context in cookie', common.cookies.get_cookie().last_context);

        var attrCollection = new Attributes([], {state:state});
        attrCollection.state = state;
        state.attrCollection = attrCollection;

        var personCollection = new Persons([], {state:state});
        personCollection.state = state;
        state.personCollection = personCollection;

        var cview = new controlsView({
            state:state,
        });

        var app_router = new Router({
            controlsView: cview,
            state: state,
        });
        state.router = app_router;
        Backbone.history.start();
    });
});
