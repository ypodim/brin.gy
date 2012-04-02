
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
        'click #backBtn': 'goBack',
        'click #newBtn': 'newAttribute',
        'click #saveAttrBtn': 'saveNewAttribute',
        'click #homeBtn': 'goHome',
        
    },

    goHome: function(){
        this.state.router.navigate('#', {trigger:true});
    },
    saveNewAttribute: function(){

    },
    newAttribute: function(){
        if (! this.state.isLoggedin())
            return false;

        this.state.stats('newattr:btnTop');
        this.state.router.navigate('#/new', {trigger:true});
    },
    goBack: function(){
        this.state.router.navigate('#/filters', {trigger:true});
    },
    filterBtn: function(evt) {
        var btnid = $(evt.target).attr('id');
        if (btnid == 'all') {
            this.state.router.navigate('#/all', {trigger:true});
        }
        if (btnid == 'me') {
            this.state.router.navigate('#me', {trigger:true});
        }
        if (btnid == 'filters') {
            this.state.router.navigate('filters', {trigger:true});
        }
    },
    
    animateMatchesTo: function(target) {
        this.$('#resultsBtn').html('Send Message');
    },
    
    // when you press the button on the right-hand side
    showResults: function() {
        if (this.state.personCollection.included().length > 5)
            this.state.showMessage('You can only contact up to 5 people at a time. Please choose 5 among your matches, or add more filters.');
        else
            this.state.router.navigate('sendmessage', {trigger:true});
    },

    doDefault: function(){
        this.$('.controlFilters').show();
        this.$('.secondOrder').hide();
        this.$('div#profileinfo').hide();
        this.$('#newBtn').show();
    },
    doMe: function() {
        this.$('.controlFilters').show();
        this.$('.secondOrder').hide();
        // this.$('#likemeBtn').show();
    },
    doFilters: function() {
        this.$('.controlFilters').show();
        this.$('.secondOrder').hide();
        this.$('#resultsBtn').show();
    },

    doLogin: function() {
        this.$('.controlFilters').hide();
        this.$('.secondOrder').hide();
        this.$('#loginBtn').show();
        this.$('div#profileinfo').hide();
    },
    doMessage: function() {
        this.$('.controlFilters').hide();
        this.$('button.secondOrder').hide();
        this.$('#cancelMessageBtn').show();
        this.$('#sendMessageBtn').show();
        this.$('div#profileinfo').hide();
    },
    doProfile: function(username) {
        this.$('.controlFilters').hide();
        this.$('button.secondOrder').hide();
        this.$('button#backBtn').show();
        this.$('div#profileinfo').show();
        this.$('div#profileinfo #username').html(username);
    },
    doNewAttr: function() {
        this.$('.controlFilters').hide();
        this.$('button.secondOrder').hide();
        // this.$('div#profileinfo').show();
        // this.$('div#profileinfo #username').html(username);
        this.$('button#backBtn').show();
        this.$('button#saveAttrBtn').show();
    },
    initialize: function(options) {
        _.bindAll(this, 'animateMatchesTo', 'showResults', 'doNewAttr');
        this.state = options.state;
        $(this.el).append(this.template());
    },
    
    render: function(){
        console.log("controls view rendered");
    },
  });
  return controlsView;
});
