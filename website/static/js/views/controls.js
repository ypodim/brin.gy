
define([
    'jquery',
    'underscore', 
    'backbone',

    'order!button',
    'alerts',
    'modal',
    'order!twipsy',
    'order!popover',

    'models/person',

    'text!templates/controls.html',
    ], function($, _, Backbone, 
        button, alerts, modal, popover, twipsy, 
        userModel,
        controlsViewTemplate){
  var controlsView = Backbone.View.extend({
    el: $("#controls")[0],
    template: _.template(controlsViewTemplate),
    events: {
        // "click #clear-filters-btn": "clearFilters",
        // "click nav > a": "navFilter",
        // "search #searchinput": "searchAttributes",
        // "keyup #searchinput": "searchAttributes",
        // "click div.controls > button": "newAttributeModal",
        // "submit #searchbox": "submitNewAttribute", 

        'click .controlFilters': 'filterBtn',
        'click .controlSorters': 'sortBtn',
        'click #resultsBtn': 'showResults',
    },

    filterBtn: function(evt) {
        var btnid = $(evt.target).attr('id');
        this.$('.secondOrder').hide();

        if (btnid == 'all') {
            this.$('.controlSorters').show();
            $('attribute').show();
            $('.valcontainer').show();
        } else {
            $('attribute').hide();
            $('.valcontainer').hide();
        }

        if (btnid == 'me') {
            $('.haveitTag').show();
            this.$('#likemeBtn').show();
            _.each($('attribute'), function(attr){
                if ($(attr).children('.valpartdetailed').children('.haveitTag').length)
                    $(attr).show();
            });
            this.$('#likemeBtn').show();
        }

        if (btnid == 'filters') {
            $('.filterTag').show();
            _.each($('attribute'), function(attr){
                if ($(attr).children('.valpartdetailed').children('.filterTag').length)
                    $(attr).show();
            });
            this.$('#resultsBtn').show();
            this.state.getMatches(this.matchesClb);
        }
    },
    sortBtn: function(evt) {
        var btnid = $(evt.target).attr('id');
        if (btnid == 'all');
        if (btnid == 'me');
        if (btnid == 'filters');
    },

    animateMatchesTo: function(target) {
        this.$('#resultsBtn').html(target+' matches!');
    },
    matchesClb: function(matches){
        var that = this;
        this.animateMatchesTo(matches.length);
        that.state.personCollection.reset();
        _.each(matches, function(username){
            uModel = new userModel({username:username});
            that.state.personCollection.add(uModel);
        });
    },
    showResults: function() {
        this.state.router.navigate('matches', {trigger:true});
    },

    doDefault: function(){
        this.$('*').hide();
        this.$('div').show();
        this.$('div > button').show();
    },
    doLogin: function() {
        $('.controlSorters, .controlFilters').hide();
        this.$('#loginBtn').show();
    },
    initialize: function(options) {
        _.bindAll(this, 'animateMatchesTo', 'matchesClb');
        this.state = options.state;
        this.attrCollection = options.attrCollection;

        $(this.el).append(this.template());
    },
    
    render: function(){
        console.log("controls view rendered");
    },
  });
  return controlsView;
});
