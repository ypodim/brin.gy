
// cookie management

cookies = {};

var cookies.get_cookies = function()
{
    var names = {};
    other_names = $.cookie('other_names');
    if (typeof(other_names) == "string")
        names = JSON.parse(other_names);
    return names;
}

var cookies.set_cookie = function(name)
{
    other_names = $.cookie('other_names');
    if (typeof(other_names) == "string") {
        JSON.parse(other_names);
        other_names = other_names+","+E.agent.id;
    } else
        other_names = valid_username;
    $.cookie('other_names', other_names, {expires:7, path:"/"});
}



