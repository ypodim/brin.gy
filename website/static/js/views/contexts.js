
define([
    'jquery',
    'underscore', 
    'backbone',

    'order!button',
    'alerts',
    'modal',
    'order!twipsy',
    'order!popover',

    'text!templates/contexts.html',
    'views/contextEntry',

    'collections/contexts',
    
    'models/context',
    ], function(
        $, _, Backbone, 
        button, alerts, modal, popover, twipsy, 

        contextsViewTemplate, 
        contextEntryView,

        contextCollection,

        contextModel){
  var contextsView = Backbone.View.extend({
    el: $("#container"),
    template: _.template(contextsViewTemplate),
    events: {
        
    },

    addOneContext: function(model) {
        var cv = new contextEntryView({
            model : model,
            state: this.state,
        });
        this.$('#contexts').append($(cv.render().el));
    },
    
    initialize: function(options) {
        _.bindAll(this, 'render', 'addOneContext');
        this.state = options.state;
        this.controls = options.controls;
        this.cCollection = new contextCollection();
        this.cCollection.bind('add', this.addOneContext);
    },
    
    _isRendered: false,
    render: function(){
        if (this._isRendered)
            return false;
        var that = this;

        $(this.el).empty().html(this.template());

        var url = this.state.satellite.url+'/contexts';
        $.getJSON(url, {user:this.state.user.name}, function(json){
            for (var i in json.contexts) {
                var c = json.contexts[i];

                var cm = new contextModel({
                    name: c.name,
                    userno: c.count,
                    joined: c.userhasit,
                    description: c.description,
                });
                that.cCollection.add(cm);
            }
        });
        
        this._isRendered = true;
        return this;
    },
  });
  return contextsView;
});




