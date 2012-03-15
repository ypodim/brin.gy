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
  },
  urlArgs: "bust=" +  (new Date()).getTime(),
});

require([
    'underscore',
    // 'views/desktopFrame',
    // 'views/mobileFrame',
    // 'views/welcome',
    // 'views/manager',
    'router',
    'backbone',
], function(_, Router, Backbone){
    console.log('------');
    require.E = {};

    $.getJSON('/config', function(config){
        console.log(config);

        require.E.satellite = {};
        require.E.satellite.url = config.discov_url;
        require.E.agent = {};
        require.E.agent.id = config.agentid;
        require.E.agent.baseurl = config.ego_url_prefix;
        require.E.agent.url = config.ego_url_prefix+"/"+config.agentid;
        require.E.agent.url = config.ego_url_prefix+"/"+config.agentid;
        require.E.website_url = config.website_url_prefix;
        require.E.context = {context:"all"};
        require.E.device = config.device;

        var app_router = new Router;
        Backbone.history.start();
    });



    // var frame_view = new DesktopAppView;
    // frame_view.render();
    

    // var page_view;

    // if (E.agent.id) {
    //     console.log("going manager");
    //     page_view = new ManagerView;
    // } else {
    //     console.log("going index");
    //     page_view = new WelcomeView;
    // }
});
