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

import smtplib
from email.mime.text import MIMEText





class Config():
    discov_url = ''
    ego_url_prefix = ''
    website_url_prefix = ''
    agentid = ''
    agent_url_private = ''
    agent_url = ''

class config_handler(tornado.web.RequestHandler):
    def get(self):
        options = dict(
            discov_url=config.discov_url,
            ego_url_prefix=config.ego_url_prefix,
            website_url_prefix=config.website_url_prefix,
            agentid=config.agentid,
            agent_url_private=config.agent_url_private,
            agent_url=config.agent_url,
            device='mobile',
        )
        self.write(options)
    
        
class serve_index(tornado.web.RequestHandler):
    def get(self):
        self.render('static/index.html')

class serve_context(tornado.web.RequestHandler):
    def get(self):
        username = self.request.uri.split('/')[1:][0]
        self.redirect("/#/c/%s" % username)


class serve_authuser(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        path = self.request.uri.split('/')[1:]

        self.secret = path[1]
        http_client = tornado.httpclient.AsyncHTTPClient()
        http_client.fetch("%s/authenticate_admin_secret?secret=%s" % (config.ego_url_prefix, self.secret), self.evaluate_agentid_clb)
            
    def evaluate_agentid_clb(self, response):
        try:
            dic = json.loads(response.body)
        except:
            error = '*** serve_authuser clb: error parsing json: %s' % response.body
            dic = dict(error=error)
        
        if dic.get('error') and not dic.get('user'):
            print dic['error']
            self.redirect('/')
        else:
            cookie = dict(pseudonyms={dic['user']:dic})
            cookiestr = tornado.escape.json_encode(cookie).replace(' ','')
            self.set_cookie('bringy', str(cookiestr))
            self.redirect("/#/all")

class presentation(tornado.web.RequestHandler):
    def get(self):
        self.render('static/presentation/index.html')

class context(tornado.web.RequestHandler):
    def get(self, cname):
        print tornado.escape.url_escape('/#/c/'+cname)
        print cname, '/#/c/'+cname
        self.redirect('/#/c/'+cname)

class oauth(tornado.web.RequestHandler):
    def get(self):
        print self.request
        self.write('ok')

debug = os.environ.get("SERVER_SOFTWARE", "").startswith("Development/")

settings = {
    # "template_path": os.path.join(os.path.dirname(__file__), "static"),
    "cookie_secret": "61oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
    "xsrf_cookies": True,
    "debug": debug,
    "static_path": os.path.join(os.path.dirname(__file__), "static"),
    "static_url_prefix": '/static/'
}

application = tornado.web.Application([
    (r"/config", config_handler),
    (r"/presentation", presentation),
    (r"/c/(.*)", context),
    (r"/oauth", oauth),

    (r"/a/[a-zA-Z0-9]+/?$", serve_authuser),
    (r"/[a-zA-Z0-9]+/?$", serve_context),
    (r"/", serve_index),
], **settings)

if __name__ == "__main__":
    
    config = Config()
    
    parser = OptionParser(add_help_option=False)
    parser.add_option("-h", "--host", dest="host", default='0.0.0.0')
    parser.add_option("-p", "--port", dest="port", default='8889')
    
    parser.add_option("-w", "--websiteurl", dest="website_url", default='localhost')
    parser.add_option("-d", "--discovurl", dest="discov_url", default='localhost')
    parser.add_option("-a", "--agentsurl", dest="agents_url", default='localhost')
    (options, args) = parser.parse_args()
    
    PORT = int(options.port)
    HOST = options.host
    
    website_url = 'http://%s:%s' % (HOST, PORT)
    discov_url = 'http://%s' % options.discov_url
    agents_url = 'http://%s' % options.agents_url
    
        
    config.website_url_prefix = website_url
    config.discov_url = discov_url
    config.ego_url_prefix = agents_url
    
    print 'Brin.gy website running at %s' % options.website_url
    print 'Discovery at: %s' % discov_url
    print 'Agents at: %s' % agents_url
    


    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT, address=HOST)
    tornado.ioloop.IOLoop.instance().start()
