#!/usr/bin/env python
# -*- coding: utf-8 -*-

import tornado.httpserver
import tornado.ioloop
import tornado.web

import markdown
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
            
        paths = ('index', 'UROP', 'manage', 'responses', 'about', 'letter')
        if not function: function = "index"
        
        if function not in paths:
            raise tornado.web.HTTPError(404)
        self.render(function + ".html", 
                    markdown=self.markdown, 
                    discov_url=discov_url,
                    ego_url_prefix=ego_url_prefix,
                    website_url_prefix=website_url_prefix,
                    title='' if function=='index' else '- %s'%function,
                    args=args,
                    path=json.dumps(path))

    def markdown(self, path, toc=False):
        if not hasattr(ContentHandler, "_md") or self.settings.get("debug"):
            ContentHandler._md = {}
        if path not in ContentHandler._md:
            full_path = os.path.join(self.settings["template_path"], path)
            f = open(full_path, "r")
            contents = f.read().decode("utf-8")
            f.close()
            if toc: contents = u"[TOC]\n\n" + contents
            md = markdown.Markdown(extensions=["toc"] if toc else [])
            ContentHandler._md[path] = md.convert(contents).encode("utf-8")
        return ContentHandler._md[path]



if __name__ == "__main__":
     
    debug = os.environ.get("SERVER_SOFTWARE", "").startswith("Development/")
    
    parser = OptionParser(add_help_option=False)
    parser.add_option("-h", "--host", dest="host", default='localhost')
    parser.add_option("-p", "--port", dest="port", default='8889')
    parser.add_option("-d", "--db", dest="db", default='mysql')
    (options, args) = parser.parse_args()
    
    PORT = int(options.port)
    HOST = options.host
    
    discov_url = 'http://ypod.media.mit.edu:22222'
    ego_url_prefix = 'http://ypod.media.mit.edu:10007'
    #static_url_prefix = '/ego'
    website_url_prefix = 'http://%s:%s' % (HOST, PORT)
    
    mode = ''
    if debug:
        mode = '(debug)'
        #static_url_prefix = ''
    
    #website_url_prefix += static_url_prefix
    
    print 'Ego website running at %s:%s %s' % (HOST,PORT,mode)
    
    settings = {
        "template_path": os.path.join(os.path.dirname(__file__), "templates"),
        "xsrf_cookies": True,
        "debug": debug,
        "static_path": os.path.join(os.path.dirname(__file__), "static"),
        #"static_url_prefix": '%s/static/' % static_url_prefix,
        "static_url_prefix": '/static/'
    }
    
    application = tornado.web.Application([
        (r"/([a-zA-Z0-9/]*)", ContentHandler),
        #(r"%s/static/.*" % prefix, tornado.web.RedirectHandler,
        #dict(url="http://github.com/downloads/facebook/tornado/tornado-0.1.tar.gz")),
    ], **settings)

    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT, address=HOST)
    tornado.ioloop.IOLoop.instance().start()
