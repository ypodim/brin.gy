define([
  'jquery',
  'underscore', 
  'backbone',
  'router',
  'text!templates/welcome.html'
  ], function($, _, Backbone, router, welcomeViewTemplate){
  var welcomeView = Backbone.View.extend({
    el: $("#container"),
    
    roll_ticker: function() {
        $.getJSON(E.satellite.url+"/randomstat", function(json){
            if (json.error) {
                $("#ticker").html(json.error);
                return;
            }
            
            $("#ticker").fadeOut(1000, function(){
                $("#ticker-key").text(json.key);
                $("#ticker-val").text(json.val);
                $("#ticker-score").text(json.score);
                
                $("#ticker").fadeIn(1000, function(){
                    setTimeout(this.roll_ticker, 1500);
                });
            });
        });
    },

    render: function(){
        var compiled_template = _.template( welcomeViewTemplate );
        this.el.html( compiled_template() );
        
        $.getJSON(E.satellite.url+"/stats", function(json){
            $("#users").html(json.users);
            $("#values").html(json.values);
            $("#queries").html(json.queries);
        });
        
        this.roll_ticker();       
    },

  });
  return welcomeView;
});
