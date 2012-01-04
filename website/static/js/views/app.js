define([
  'jquery',
  'underscore', 
  'backbone',
  'common/ego_website',
//   'collections/todos',
//   'views/todos',
//   'text!templates/stats.html'
  ], function($, _, Backbone, common){
  var headerView = Backbone.View.extend({
    el: $("body"),
    events: {
        "click #whatisthis":  "emailAdminUrl",
        "click #account-btn":  "showUserDropdown",
        "click .urllabel":  "selectUrlAddress",
        "keydown .urllabel":  "editUrlAddress",
        "click #start-btn":  "showStartDropdown",
        "submit #context-name-form": "submitNewContext",
        "click #context-btn": "showContextDropdown",
        "click #context-dropdown > a": "selectContextDropdown",
        
        "keyup #username": "newUsernameChange",
        "submit #newuserform": "newUserSubmit", 
        "click #start-dropdown": "catchClicks",
        "click #btn1": "newUser",
        "click #btn2": "redirectUser",
        "change select": "redirectUser",
    },
    
    initialize: function() {
//         _.bindAll(this, 'addOne', 'addAll', 'render', 'toggleAllComplete');

//         this.input    = this.$("#new-todo");
//         this.allCheckbox = this.$(".mark-all-done")[0];

//         Todos.bind('add',     this.addOne);
//         Todos.bind('reset',   this.addAll);
//         Todos.bind('all',     this.render);
// 
//         Todos.fetch();

//         console.log("lat,lon", geoip_latitude(), geoip_longitude());
        
        for (name in common.cookies.get_cookie().pseudonyms) {
            $("select").append("<option>"+name+"</option>")
            $("#previous_pseudonym").show();
        }
        
        $.getJSON(E.satellite.url+"/stats", function(json){
            $("#users").html(json.users);
            $("#values").html(json.values);
            $("#queries").html(json.queries);
        });
        
        this.roll_ticker();
    },
    
    valid_username: null,
    
    check_username: function() {
        username = $("#username").val();
        $.getJSON(E.agent.baseurl+"/"+username, function(json){
            if (username && username != "<username>" && typeof json == "object" && json.error) {
                $("#btn1").html("get it!").removeClass("primary").addClass("success");
                this.valid_username = username;
            } else {
                $("#btn1").html("check").removeClass("primary success").addClass("danger").html("pseudonym taken!");
                this.valid_username = undefined;
            }
        });
    },
    
    post_new_user: function() {
        $.post(E.agent.baseurl, {username:this.valid_username}, function(data) {
            error = data.error;
            if (data.error)
                alert(data.error);
            console.log(data);
            if (! error.length) {
                common.cookies.set_cookie(data.username, data.secret);
                this.redirect(data.username);
            }
        }, "json");
    },
    
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
    
    redirect: function(username) {
        window.location.href = E.website_url+"/"+username+"#tour";
    },

    
    newUsernameChange: function() {
        if ($(event.target).val().length)
            this.check_username();
        else
            $("#btn1").html("check").removeClass("danger success").addClass("primary").html("check");
        return true;
    },
    newUser: function() {
        console.log("newuser", $("#newuserform"));
        $("#newuserform").trigger("submit");
    },
    redirectUser: function() {
        this.redirect($("select").val());
    },
    newUserSubmit: function(){
        
        username = $("#username").val();
        res = /\W/.test(username);
        console.log("submit", $("#username"), username, res);
        if (res) {
            this.valid_username = undefined;
            $("#btn1").removeClass("primary success").addClass("danger").html("Please use only letters and/or numbers");
        } else {
            if (this.valid_username) {
                this.post_new_user();
            } else {
                this.check_username();
            }
        }
        return false;
    },
    catchClicks: function(event) {
        event.stopPropagation();
    },
    
    //////////////// END OF Index stuff
    
    

    
    populateContexts: function(json) {
        $("#context-dropdown > ul").empty();
        
        for (i in json.contexts) {
            context = json.contexts[i].name;
            count = json.contexts[i].count;
            userhasit = json.contexts[i].userhasit;
            
            btn = $("<button class='btn'></button>");
            if (userhasit) {
                action = "leave";
                btn.addClass("danger").html("Leave");
            } else {
                action = "join";
                btn.addClass("success").html("Join");
            }
            attr = {context:context, action:action};
            btn.attr(attr).click(function(event){
                context = $(this).attr("context");
                action = $(this).attr("action");
                count = parseInt($(this).siblings("span").html());
                if (action == "join") {
                    count += 1;
                    $(this).removeClass("success").addClass("danger").html("Leave").attr("action","leave");
                    this.join_context(context);
                } else {
                    count -= 1;
                    $(this).removeClass("danger").addClass("success").html("Join").attr("action","join");
                    
                    this.leave_context(context);
                    console.log("context is now", this.contextName);
                }
                $(this).siblings("span").html(count);
                console.log("result", json);
                
                event.stopPropagation();
            });
            
            counter = $("<span class='count'></span>").html(count);
            
            libtn = "# "+context;
            li = $("<li class='context-entry'></li>");
            li.append(counter).append(libtn);
            if (context != "all")
                li.append(btn);
            
            li.attr("context",context).click(function(){
                context = $(this).attr("context");
                console.log("I SHOULD GO TO #"+context);
//                 app_router.navigate(context, true);
            });
            $("#context-dropdown > ul").append(li);
        }
    },
    
    showContextDropdown: function(){
        if ($("#context-dropdown").is(':visible')) {
            $("#context-dropdown").hide();
            $("#context-btn").removeClass("clicked");
        } else {
            offset = $(this).prev().offset();
            left = $(window).width() - offset.left + 10;
            $("#context-dropdown").css("right",left);
            
            $.getJSON(E.satellite.url+"/contexts", {user:E.agent.id}, this.populateContexts);

            $("#context-btn").addClass("clicked");
            $("#context-dropdown").fadeIn(200, function(){
                $("body").one("click", function(obj){
                    $("#context-dropdown").hide();
                    $("#context-btn").removeClass("clicked");
                });
            });
        }
    },
    selectContextDropdown: function() {
        $("#new-context-modal").modal({backdrop:"static", show:true, keyboard:true}).bind('shown', function () {
            $("#context-name").val("").focus();
        });
    },
    submitNewContext: function(){
        context = $("#context-name").val();
        $("#new-context-modal").modal("hide");
        console.log("submit context", context);
        this.join_context(context);
        return false;
    },
    emailAdminUrl: function() {
        return false;
    },
    showStartDropdown: function () {
        if ($("#start-dropdown").is(':visible')) {
            $("#start-dropdown").hide();
            $("#start-btn").removeClass("clicked");
        } else {
            $("#start-btn").addClass("clicked");
            $("#start-dropdown").fadeIn(200, function(){
                $("body").one("click", function(obj){
                    $("#start-dropdown").hide();
                    $("#start-btn").removeClass("clicked");
                });
            });
        }
    },
    showUserDropdown: function () {
        if ($("#user-dropdown").is(':visible')) {
            $("#user-dropdown").hide();
            $("#account-btn").removeClass("clicked");
        } else {
            $("#account-btn").addClass("clicked");
            $("#user-dropdown").fadeIn(200, function(){
                $("body").one("click", function(obj){
                    $("#user-dropdown").hide();
                    $("#account-btn").removeClass("clicked");
                });
            });
        }
    },
    selectUrlAddress: function (event) {
        event.stopPropagation();
        $(event.target).select();
    },
    editUrlAddress: function(e){
        return false;
    },
    
    contextName: "all", 
    trigger_context_changed: function(cntx){
        this.contextName = cntx;
        E.last_fetched = "";
        clb = E.populate_attrs;
        E.fetch_initial_info(clb);
        $("#context-title").html("# "+this.contextName);
    },
    join_context: function(context) {
        action = 'join';
        secret = common.cookies.get_cookie().pseudonyms[E.agent.id];
        data = {context:context, secret:secret, action:action};
        $.post(E.agent.url, data, function(json){
            this.trigger_context_changed(context);
        }, "json");
    },
    leave_context: function(context) {
        action = 'leave';
        secret = common.cookies.get_cookie().pseudonyms[E.agent.id];
        data = {context:context, secret:secret, action:action};
        $.post(E.agent.url, data, function(json){
            this.trigger_context_changed(context);
        }, "json");
    },
  });
  return headerView;
});
