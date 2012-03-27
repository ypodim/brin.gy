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
    'underscore',
    
    'router',
    'backbone',
    'models/state',
    'collections/attributes',

    'views/desktopFrame',
    'views/mobileManager',
    'views/controls',
    'views/manager',
], function(_, Router, Backbone, appState, Attributes,
    DesktopAppView, mobileManagerView, controlsView, ManagerView
    ){

    state = new appState();

    $.getJSON('/config', function(config){
        state.satellite = {};
        state.satellite.url = config.discov_url;
        state.agent = {};
        state.agent.id = config.agentid;
        state.agent.baseurl = config.ego_url_prefix;
        state.agent.url = config.ego_url_prefix+"/"+config.agentid;
        state.website_url = config.website_url_prefix;
        state.context = {context:"all"};
        state.device = config.device;

        var frame_view = new DesktopAppView();
        frame_view.render();

        var attrCollection = new Attributes([], {state:state});
        attrCollection.state = state;
        attrCollection.ffetch();

        var cview = new controlsView({
            state:state,
            attrCollection: attrCollection,
        });

        var contents_view = new mobileManagerView({
            state: state,
            attrCollection: attrCollection,
        });
        // var contents_view = new ManagerView();
        contents_view.render();
    });

    var app_router = new Router();
    Backbone.history.start();
});
