#!/usr/bin/env python
# -*- coding: utf-8 -*-

import tornado.httpserver
import tornado.httpclient
import tornado.ioloop
import tornado.web

import os
import os.path
import time
from optparse import OptionParser
import json

class Config:
    discov_url = ''
    ego_url_prefix = ''
    website_url_prefix = ''
    agentid = ''
    
    
class website_call(tornado.web.RequestHandler):
    def get(self):
        self.start_time = time.time()
        self.callback = self.get_argument("callback", None)
        self.render("%s.html" % self.path, config=config)
        
    def prepare(self):
        path = self.request.path.split('/')
        self.path = path[1] or 'index'
        
        
class serve_user(tornado.web.RequestHandler):
    def clb(self, response):
        try:
            dic = json.loads(response.body)
        except:
            print '*** serve_user clb: error parsing json: %s' % response.body
            self.redirect('/')
            return 
            
        if not dic.get('error'):
            #secret = cookie_dic.get('secret')
            #if secret == 
            self.render("manage.html", config=config)
        else:
            self.redirect('/')
    @tornado.web.asynchronous
    def get(self, agentid):
        config.agentid = agentid
                
        #cookie = self.get_cookie('bringy')
        #if cookie == None:
            #cookie = '{}'
            #self.set_cookie('bringy', cookie)
        
        #try:
            #cookie_dic = json.loads(tornado.escape.url_unescape(cookie))
        #except:
            #print '*** serve_user get: error parsing cookie: %s' % cookie
            #self.redirect('/')
            #return
        
        #if agentid in cookie_dic.get('pseudonyms',{}):
            #secret = cookie_dic['pseudonyms'][agentid]
            #print 'secret in cookie', secret
        #else:
            #print '*** serve_user get: Illegal attempt to access %s' % agentid
            #self.redirect('/')
            #return
            
        http_client = tornado.httpclient.AsyncHTTPClient()
        http_client.fetch("%s/%s" % (config.ego_url_prefix, config.agentid), self.clb)
        

debug = os.environ.get("SERVER_SOFTWARE", "").startswith("Development/")

settings = {
    "template_path": os.path.join(os.path.dirname(__file__), "templates"),
    #"xsrf_cookies": True,
    "debug": debug,
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    #"static_url_prefix": '%s/static/' % static_url_prefix,
    "static_url_prefix": '/static/'
}

application = tornado.web.Application([
    (r"/", website_call),
    (r"/api", website_call),
    (r"/about", website_call),
    (r"/UROP", website_call),
    (r"/about", website_call),
    
    (r"/([a-zA-Z0-9]+/?)$", serve_user),
    #(r"/.+", serve_capability),
    #(r"/$", serve_index),
    
    #(r"/([a-zA-Z0-9/]*)", ContentHandler),
    #(r"/([a-zA-Z0-9./]*)", ContentHandler),
    #(r"%s/static/.*" % prefix, tornado.web.RedirectHandler,
    #dict(url="http://github.com/downloads/facebook/tornado/tornado-0.1.tar.gz")),
], **settings)

if __name__ == "__main__":
    
    config = Config()
    
    parser = OptionParser(add_help_option=False)
    parser.add_option("-h", "--host", dest="host", default='localhost')
    parser.add_option("-p", "--port", dest="port", default='8889')
    
    parser.add_option("-w", "--websiteurl", dest="website_url")
    parser.add_option("-d", "--discovurl", dest="discov_url")
    parser.add_option("-a", "--agentsurl", dest="agents_url")
    (options, args) = parser.parse_args()
    
    PORT = int(options.port)
    HOST = options.host
    
    website_url = 'http://%s:%s' % (HOST, PORT)
    discov_url = 'http://%s:22222' % HOST
    agents_url = 'http://%s:10007' % HOST
    
    if (options.website_url):
        website_url = 'http://%s' % options.website_url
    if (options.discov_url):
        discov_url = 'http://%s' % options.discov_url
    if (options.agents_url):
        agents_url = 'http://%s' % options.agents_url
        
    config.website_url_prefix = website_url
    config.discov_url = discov_url
    config.ego_url_prefix = agents_url
    
    print 'Brin.gy website running at %s' % website_url
    print 'Discovery at: %s' % discov_url
    print 'Agents at: %s' % agents_url
    


    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT, address=HOST)
    tornado.ioloop.IOLoop.instance().start()
