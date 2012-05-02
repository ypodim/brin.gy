define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  'views/nametag',
  'text!templates/welcome.html',
  'text!templates/activityEntry.html',
  ], function($, _, Backbone, router, nametagView, welcomeViewTemplate, activityViewTemplate){
  var welcomeView = Backbone.View.extend({
    el: $("#container"),
    events: {
        'click #contexts': 'contextsBtn',
        'click button#attributes': 'attributesBtn',
    },

    render: function(){
        var compiled_template = _.template( welcomeViewTemplate );
        this.el.html( compiled_template() );

        this.state.router.contents_view._lastContext = '';
        clearTimeout(this.state.timeoutid);
        clearTimeout(this.state.attrTimeout);
        
        this.poll();
    },

    activityTemplate: _.template(activityViewTemplate),
    poll: function(){
        var that = this;
        var url = this.state.satellite.url+'/randomstat';
        $.getJSON(url, function(json){
            html = that.activityTemplate(json);
            that.$('#activityEntry').fadeOut(200, function(){
                that.$('#activityEntry').html(html).show();    
            });
        })

        this.state.timeoutid = setTimeout(function(){
            that.poll();
        }, 4000);
    },

    contextsBtn: function(){
        this.state.router.navigate('/context', {trigger:true});
        return false;
    },
    attributesBtn: function(){
        this.state.router.navigate('/all', {trigger:true});
        return false;
    },

    initialize: function(options){
        this.state = options.state;
        _.bindAll(this, 'render');
        this.state = options.state;
    },
  });
  return welcomeView;
});
