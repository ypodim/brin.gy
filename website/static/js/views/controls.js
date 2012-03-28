
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
    events: {
        'click .controlFilters': 'filterBtn',
        'click #resultsBtn': 'showResults',
    },

    filterBtn: function(evt) {
        var btnid = $(evt.target).attr('id');
        this.$('.secondOrder').hide();
        
        if (btnid == 'all') {
            // this.$('.controlSorters').show();
            this.state.router.navigate('#', {trigger:true});
        }
        if (btnid == 'me') {
            this.$('#likemeBtn').show();
            this.state.router.navigate('#me', {trigger:true});
        }

        if (btnid == 'filters') {
            this.$('#resultsBtn').show();
            this.state.router.navigate('filters', {trigger:true});
        }
    },
    
    animateMatchesTo: function(target) {
        this.$('#resultsBtn').html('Send Message');
    },
    
    // when you press the button on the right-hand side
    showResults: function() {
        this.state.router.navigate('sendmessage', {trigger:true});
    },

    doDefault: function(){
        this.$('.controlFilters').show();
        this.$('.secondOrder').hide();
    },
    doLogin: function() {
        // $('.controlSorters, .controlFilters').hide();
        this.$('.controlFilters').hide();
        this.$('#loginBtn').show();
    },
    doMessage: function() {
        this.$('.controlFilters').hide();
        this.$('button.secondOrder').hide();
        this.$('#cancelMessageBtn').show();
        this.$('#sendMessageBtn').show();
    },
    initialize: function(options) {
        _.bindAll(this, 'animateMatchesTo');
        this.state = options.state;
        $(this.el).append(this.template());
    },
    
    render: function(){
        console.log("controls view rendered");
    },
  });
  return controlsView;
});
