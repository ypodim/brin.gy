define([
  'jquery',
  'underscore', 
  'backbone',
  'text!templates/nametag.html'
  ], function($, _, Backbone, nametagTemplate){
  var nametagView = Backbone.View.extend({
    template: _.template( nametagTemplate ),
    events: {
        
    },
    initialize: function(options) {
        _.bindAll(this, 'render');
        // this.state = options.state;
        this.attr = options.attr;
        this.value = options.value;
    },
    animate: function(){
        var deg = Math.floor(Math.random()*40) - 20;
        var that = this;
        setTimeout(function(){
            $(that.el).css('-webkit-transform', 'rotate('+deg+'deg) scale(0.4)');    
        }, 1);
        $(this.el).attr('id','nametag').addClass('welcome anime');
        
        return this;
    },
    render: function(x, y){
        var left = x + Math.random() * 80;
        var top  = y + Math.random() * 80;
        
        $(this.el).html(this.template({attr:this.attr, value:this.value}));
        $(this.el).css({left:left, top:top});
        return this;
    },
  });
  return nametagView;
});
