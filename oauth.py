# required imports to run
import os.path
import tornado.auth
import tornado.escape
import tornado.httpserver
import tornado.ioloop
# import tornado.options
import tornado.web
from tornado.httputil import url_concat
from tornado import httpclient


#Make sure you have these options, and please create your own...
#API Keys and Don't enter this into source control!! Set some environment variables
#in a config file or something
# from tornado.options import define, options
# define("port", default=3000, help="run on the given port", type=int)
# define("facebook_api_key", help="your Facebook application API key",
#        default="275214402583214")
# define("facebook_secret", help="your Facebook application secret",
#        default="bc9ba3efd1e28deec5e7d2061dd6fdfa")
# define("twitter_consumer_key", help="Twitter OAuth",
#        default="cicnNgg3nrEFqb3DdODw")
# define("twitter_consumer_secret", help="Twitter OAuth",
#        default="yvK2ecNU3JyQCpXkPEoBW4rHm8NL6dtKVRRqDO7tys")
    
facebook_api_key = '275214402583214'
facebook_secret = 'bc9ba3efd1e28deec5e7d2061dd6fdfa'
twitter_consumer_key = 'cicnNgg3nrEFqb3DdODw'
twitter_consumer_secret = 'yvK2ecNU3JyQCpXkPEoBW4rHm8NL6dtKVRRqDO7tys'

# class Application(tornado.web.Application):
#     def __init__(self):
        
#         # These are the only required urls be sure to swap out ExamplePage 
#         handlers = [
#             (r"/", ExamplePage),
#             (r"/oauth", ProviderHandler),
#             (r"/oauth/twitter", TwitterHandler),
#             (r"/oauth/facebook", FacebookHandler),
#         ]

#         settings = dict(
#             cookie_secret="12oETzKXQAGaYdkL5gEmGeJJFuYhghdskj3hHG8s/Vo=",# choose a cookie seed
#             login_url="/",# not sure if this is right or if it even matters
#             xsrf_cookies=True,
#             #setting keys is important!
#             facebook_api_key= facebook_api_key,
#             facebook_secret= facebook_secret,
#             twitter_consumer_key= twitter_consumer_key,
#             twitter_consumer_secret= twitter_consumer_secret,
#             debug=True,
#             autoescape=None,
#         )
#         tornado.web.Application.__init__(self, handlers, **settings)

class BaseAuthHandler(tornado.web.RequestHandler): # BaseAuthHandler provides access to cookies
    def get_current_user(self):# Current_user is not used at all, but it may prove useful for integrating into the Brin.gy Framework
        user_json = self.get_secure_cookie('user')
        if not user_json: return None
        return tornado.escape.json_decode(user_json)
    
    #copying the code from tornado.web from current user, rebranding it with provider cookie and method names:
    @property
    def current_facebook_user(self):
        if not hasattr(self, "_current_facebook_user"):
            self._current_facebook_user = self.get_current_facebook_user()
        return self._current_facebook_user
    
    def get_current_facebook_user(self):
        user_json = self.get_secure_cookie('facebookUser')
        if not user_json: return None
        return tornado.escape.json_decode(user_json)

    @property
    def current_twitter_user(self):
        if not hasattr(self, "_current_twitter_user"):
            self._current_twitter_user = self.get_current_twitter_user()
        return self._current_twitter_user

    def get_current_twitter_user(self):
        user_json = self.get_secure_cookie('twitterUser')
        if not user_json: return None
        return tornado.escape.json_decode(user_json)

class ExamplePage(BaseAuthHandler): # this is just a sample page for you to look at, showing method calls and what not. Delete it!!!
    def get(self):
        scripts = ("<script type='text/javascript' src='/oauth?provider=facebook&action=query&request=/me/friends'></script>"+
                   "<script type='text/javascript' src='/oauth?provider=twitter&request=/followers/ids&action=query'></script>")
        link1 = ("<a href='/oauth?provider=facebook&action=logout' id='facebook'>You have this many friends on Facebook:   (click to log out)</a></br>"
                 if self.current_facebook_user else "<a href='/oauth?provider=facebook&action=login'>Facebook login: </a></br>")
        link2 = ("<a href='/oauth?provider=twitter&action=logout' id ='twitter'>You have this many followers on Twitter:   (click to log out)</a>"
                 if self.current_twitter_user else "<a href='/oauth?provider=twitter&action=login'>Twitter login: </a>")
        self.write(link1+link2+scripts)


class ProviderHandler(BaseAuthHandler):
    # Make all requests in this format for ease of use: /oauth?provider=['provider of your choice']&action=[desired action]&request=[data request]
    # ie /oauth?provider=twitter&action=login or /auth?provider=facebook&action=query&request=/me/friends
    #currently providers = facebook, twitter. Actions = login, logout, query. Request only if query = any valid api URI
    #NB: you can override this and skip it by going directly to /auth/[specific provider]/
    def get(self):
        options = {'facebook' : '/oauth/facebook?action=',
            'twitter' : '/oauth/twitter?action=',
            #'google' : '/oauth/google?action=' #an example of adding more providers
            'no_request' : '/'}
        provider = self.get_argument('provider', 'no_request')
        action = self.get_argument('action', 'no_request')
        request = self.get_argument('request', 'no_request')
        self.redirect(options[provider]+action+'&request='+request)

class FacebookHandler(BaseAuthHandler, tornado.auth.FacebookGraphMixin):
    def get(self):
        options = {'login' : self.facebook_login,
            'logout' : self.facebook_logout,
            'query' : self.make_facebook_request,
            #'example' : self.example_function, # allows for a function url alias. 
            'no_request' : str}#making a string should be benign, but maybe something better can be done if the user navigates to /oauth/facebook with no args
        action = self.get_argument('action', 'no_request')
        options[action]() # call the right function
    
    @tornado.web.asynchronous
    def facebook_login(self): # login function, don't fully understand this stuff
        my_url = (self.request.protocol + "://" + self.request.host +
                  "/oauth/facebook?action=login&next=" +
                  tornado.escape.url_escape(self.get_argument("next", "/"))) #callback url
        if self.get_argument("code", False): # if url doesn't have a code args
            self.get_authenticated_user(
                                    redirect_uri=my_url,
                                    client_id=self.settings["facebook_api_key"],
                                    client_secret=self.settings["facebook_secret"],
                                    code=self.get_argument("code"),
                                    callback=self.async_callback(self._on_facebook_auth)) # get the proper tokens
            return
        self.authorize_redirect(redirect_uri=my_url,
                                client_id=self.settings["facebook_api_key"],
                                extra_params={"scope": "read_stream, offline_access"})# and then get confirmation?
                
    
    def _on_facebook_auth(self, user):
        if not user:
            raise tornado.web.HTTPError(500, "Facebook auth failed")
        self.set_secure_cookie("facebookUser", tornado.escape.json_encode(user))#save the user to cookie
        self.redirect(self.get_argument("next", "/"))#take it home
        self.finish()

    def facebook_logout(self): # logout function
        self.clear_cookie("facebookUser") # erase user cookie
        self.redirect(self.get_argument("next", "/"))
            
    @tornado.web.asynchronous
    def make_facebook_request(self):#makes a Graph API request
        request = self.get_argument('request', '/me/friends') 
        print
        print self.current_facebook_user
        self.facebook_request(request, callback=self.async_callback(self._on_info),
                              access_token=self.current_facebook_user["access_token"])#send the request to facebook, process info in callback
        return
    def _on_info(self, info):#TODO: change what happens to data!!!
        self.set_header("Content-Type", "text/javascript") # set mimetypes
        if info is None:
            self.write('0')
        else:
            self.write("document.getElementById('facebook').innerHTML = 'You have this many friends on Facebook: "+ str(len(info['data']))+ " (click to log out)';")# write date
        self.finish()

class TwitterHandler(BaseAuthHandler, tornado.auth.TwitterMixin): # See FacebookHandler for documentation they are similar
    def get(self):
        options = {'login' : self.twitter_login,
            'logout' : self.twitter_logout,
            'query' : self.make_twitter_request,
            'no_request' : str}
        action = self.get_argument('action', 'no_request')
        options[action]()

    @tornado.web.asynchronous
    def twitter_login(self):
        my_url = (self.request.protocol + "://" + self.request.host +"/oauth/twitter?action=login")
        if self.get_argument("oauth_token", None):
            self.get_authenticated_user(self.async_callback(self._on_twitter_auth))
            return
        self.authorize_redirect(my_url)
    
    def _on_twitter_auth(self, user):
        if not user:
            raise tornado.web.HTTPError(500, "Twitter auth failed")
        # Save the user using, e.g., set_secure_cookie()
        self.set_secure_cookie("twitterUser", tornado.escape.json_encode(user))
        self.redirect(self.get_argument("next", "/"))
    
    def twitter_logout(self):
        self.clear_cookie("twitterUser")
        self.redirect(self.get_argument("next", "/"))
    
    @tornado.web.asynchronous
    def make_twitter_request(self):
        request = self.get_argument('request', "/followers/ids") #default request to followers/ids
        self.twitter_request(request, callback=self.async_callback(self._on_data),
                             access_token=self.current_twitter_user["access_token"])
        return
    
    def _on_data(self, data):
        self.set_header("Content-Type", "text/javascript")
        if data is None:
            self.write('0')
        else:
            self.write("document.getElementById('twitter').innerHTML = 'You have this many followers on Twitter: "+ str(len(data['ids']))+ " (click to log out)';")
        self.finish()


def main(): # run the app
    # tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
