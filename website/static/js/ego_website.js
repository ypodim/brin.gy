
// cookie management

cookies = {};

cookies.get_cookie = function()
{
    names = {};
    other_names = $.cookie('other_names', {path:"/"});
    if (typeof(other_names) == "string")
        names = JSON.parse(other_names);
    return names;
}

cookies.set_cookie = function(name)
{
    other_names = $.cookie('other_names', {path:"/"});
//     console.log("set_cookie other_names1", other_names, name);
    if (typeof(other_names) != "string") 
        other_names = "{}";
    
    names = JSON.parse(other_names);
    names[name] = 1;    
    other_names = JSON.stringify(names);
    $.cookie('other_names', other_names, {expires:7, path:"/"});
}

cookies.del_cookie = function(name)
{
    names = {};
    other_names = $.cookie('other_names', {path:"/"});
//     console.log("delete: other_names is:", other_names);
    if (typeof(other_names) == "string")
        names = JSON.parse(other_names);
//     console.log("names before", names);
    delete names[name];
//     console.log("names after", names);
    other_names = JSON.stringify(names);
    $.cookie('other_names', other_names, {expires:7, path:"/"});
}

