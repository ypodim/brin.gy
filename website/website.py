#!/usr/bin/env python
# -*- coding: utf-8 -*-

import tornado.httpserver
import tornado.ioloop
import tornado.web

import os
import os.path
from optparse import OptionParser
import json

class ContentHandler(tornado.web.RequestHandler):
    def get(self, path):
        path = path.split('/')
        function = path[0]
        args = ''
        if len(path) > 1:
            args = path[1]
            
        paths = ('API', 'index', 'UROP', 'manage', 'manageold', 'responses', 'about')
        if not function: function = "index"
        
        other_names = self.get_cookie('other_names')
        print 'cookie', other_names
        
        if function not in paths:
            raise tornado.web.HTTPError(404)
        self.render(function + ".html", 
                    discov_url=discov_url,
                    ego_url_prefix=agents_url,
                    website_url_prefix=website_url,
                    title='' if function=='index' else '- %s'%function,
                    args=args,
                    other_names=other_names,
                    path=json.dumps(path))

    def post(self):
        print 'post', self.request.arguments
        self.write('ok')
        


if __name__ == "__main__":
     
    debug = os.environ.get("SERVER_SOFTWARE", "").startswith("Development/")
    
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
        
    
    print 'Brin.gy website running at %s' % website_url
    print 'Discovery at: %s' % discov_url
    print 'Agents at: %s' % agents_url
    
    settings = {
        "template_path": os.path.join(os.path.dirname(__file__), "templates"),
        #"xsrf_cookies": True,
        "debug": debug,
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
        #"static_url_prefix": '%s/static/' % static_url_prefix,
        "static_url_prefix": '/static/'
    }
    
    application = tornado.web.Application([
        (r"/([a-zA-Z0-9/]*)", ContentHandler),
        #(r"/([a-zA-Z0-9./]*)", ContentHandler),
        #(r"%s/static/.*" % prefix, tornado.web.RedirectHandler,
        #dict(url="http://github.com/downloads/facebook/tornado/tornado-0.1.tar.gz")),
    ], **settings)

    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT, address=HOST)
    tornado.ioloop.IOLoop.instance().start()
