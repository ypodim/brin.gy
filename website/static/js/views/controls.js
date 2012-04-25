
define([
    'jquery',
    'underscore', 
    'backbone',

    'order!button',
    'alerts',
    'modal',
    'order!twipsy',
    'order!popover',

    'text!templates/controls.html',
    ], function($, _, Backbone, 
        button, alerts, modal, popover, twipsy, 
        controlsViewTemplate){
  var controlsView = Backbone.View.extend({
    el: $("#controls")[0],
    template: _.template(controlsViewTemplate),

    setUIstate: function(options){
        var frag = Backbone.history.fragment;

        if (options==undefined) 
            options = {fullscreen:false, footer:true};
        if (options.fullscreen == undefined)
            options.fullscreen = false;
        if (options.footer == undefined)
            options.footer = true;
        if (options.title == undefined)
            options.title = frag;

        this.doModal(options);

        // this.state.doFullscreen({switch:options.fullscreen});
        // $('#container').toggleClass('fullscreen', options.fullscreen);
        this.$('#title').toggleClass('noTitleTransform', options.fullscreen);

        $('#footer > a').removeClass('active');
        $('#footer > a[href="#/'+frag+'"]').addClass('active');

        if (frag in {all:1, me:1, filters:1}) {
            $('#footer > a[href="#/all"]').addClass('active');
            options.title = '';
            options.context = this.state.context.name;
            this.state.attrCollection.trigger('value:change');
        } else {
            this.state.router.contents_view._isRendered = false;
            options.context = '';
        }
        
        this.setTitle(options.title);
        this.toggleContext(options.context);
        
        // this.state.hideSplash();
    },
    setTitle: function(title) {
        this.$('#title').html(title);
    },
    toggleContext: function(ctx) {
        if (ctx.length) {
            this.$('#contextTitle').html('#'+ctx);
            this.$('#context').show();
        } else {
            this.$('#context').hide();
        }
    },

    setRightTitle: function(title){
        this.$('button#rightModalBtn').html(title);
    },

    doModal: function(options){
        this.$('button').hide();
        this.$('button.modalBtn').show();
        this.$('#context').hide();

        $('#footer').toggle(options.footer);

        // RIGHT BUTTON
        this.$('button#rightModalBtn').unbind();
        if (options.rightClb == undefined) {
            this.$('button#rightModalBtn').hide();
        } else {
            this.$('button#rightModalBtn').click(options.rightClb);
        }
        if (options.rightTitle == undefined)
            options.rightTitle = 'OK';
        
        this.setRightTitle(options.rightTitle);

        // LEFT BUTTON
        this.$('button#leftModalBtn').unbind();
        if (options.leftClb != undefined)
            this.$('button#leftModalBtn').click(options.leftClb);
        else
            if (options.footer)
                this.$('button#leftModalBtn').hide();
            else
                this.$('button#leftModalBtn').click(function(){history.go(-1);});
        if (options.leftTitle == undefined)
            options.leftTitle = 'Back';
        this.$('button#leftModalBtn').html(options.leftTitle);


        this.$('div#profileinfo').hide();
        if (options.profile != undefined) {
            this.$('div#profileinfo').show();
            this.$('div#profileinfo #username').html(username);
        }
    },
    initialize: function(options) {
        // _.bindAll(this, '');
        this.state = options.state;

        $(this.el).append(this.template());
    },
    
    render: function(){
        console.log("controls view rendered");
    },
  });
  return controlsView;
});
