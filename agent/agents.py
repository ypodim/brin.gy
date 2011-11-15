#!/usr/bin/python
# -*- coding: utf-8 -*-

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.escape
import tornado.httpclient

import sys, os, time, random
from datetime import datetime
from optparse import OptionParser
from threading import Thread
from urllib import urlencode

from db import DB
#from cron import Cron

capability_names = ['profile','location','buysell']

class bringy_handler(tornado.web.RequestHandler):
    callback = None
    cap = ''
    username = ''
    
    def initialize(self):
        path = tornado.escape.url_unescape(self.request.uri)
        base = path.split('?')[0]
        path = base.split('/')
        
        while path and path[0] == '':
            path.pop(0)
        
        if not path:
            return
        
        self.username = path[0]
        if len(path) > 1 and path[1]:
            self.cap = path[1]
        
    def prepare(self):
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/json; charset=UTF-8')
        
        self.arguments ={}
        args = self.request.arguments.get('data')
        if type(args) == list:
            self.arguments = tornado.escape.json_decode(args[0])
        elif args:
            print '*** did not get a list as expected'
            print args, type(args)
            print self.request.arguments, type(self.request.arguments)
            print 'body', self.request.body
            print tornado.escape.url_unescape(self.request.body)
            
    def options(self):
        self.write('')

    def finilize_call(self, dic):
        now = time.time()
        rtime = now - self.start_time
        dic.__setitem__('capability', self.cap)
        dic.__setitem__('current_time', now)
        dic.__setitem__('response_time', rtime)
        dic.__setitem__('error', dic.get('error',''))
        dic.__setitem__('user', self.username)
        
        dic = tornado.escape.json_encode(dic)
        if self.callback:
            dic = '%s(%s)' % (self.callback, dic)
    
        return dic
        
    def on_response(self, dic={}):
        dic = self.finilize_call(dic)
        self.write(dic)
        self.finish()


class serve_index(bringy_handler):
    def post(self):
        user_name = self.get_argument('username')
        created = db.create_user(user_name)
        res = {'error':'', 'username':user_name, 'created':created}
        #print 'CREATE USER', res
        self.write(res)
    def get(self):
        dic = dict(message='this is ego')
        self.write(dic)
        
        
class serve_user(bringy_handler):
    def prepare(self):
        bringy_handler.prepare(self)
        if not db.user_exists(self.username):
            error = 'invalid user %s' % self.username
            self.on_response(dict(error=error))
            #print '%s: %s' % (self.request.headers.get('X-Real-Ip'), self.request.uri)
    def get(self):
        dic = dict(capabilities=capability_names)
        dic = self.finilize_call(dic)
        self.write(dic)
    def delete(self):
        deleted = db.delete_user(self.username)
        
        for capname in capability_names:
            exec 'from capabilities.%s import %s' % (capname, capname)
            capability = eval(capname)(self.username, self.arguments, db.r, self.on_response)
            capability.clear_all()
                
        res = {'error':'', 'username':self.username, 'deleted':deleted}
        self.write(res)
        
        
class serve_capability(bringy_handler):
    def prepare(self):
        bringy_handler.prepare(self)
        
        if self.cap not in capability_names:
            error = '%s is not a valid capability' % self.cap
            self.on_response(dict(error=error))
            print '%s: %s' % (self.request.headers.get('X-Real-Ip'), self.request.uri)
            return
        
    @tornado.web.asynchronous
    def get(self):
        self.callback = self.get_argument("callback", None)
        self.execute()
        
    def post(self):
        res = self.execute()
        if res: self.write(res)
        
    def delete(self):
        dic = tornado.escape.url_unescape(self.request.body)
        args = [x.split('=', 1) for x in self.request.body.split('&')]
        params = dict(args)
        arguments = tornado.escape.url_unescape(params['data'])
        arguments = tornado.escape.json_decode(arguments)
        print 'delete:', arguments, type(arguments)
        res = self.execute(arguments)
        if res: self.write(res)
        
    def execute(self, arguments=None):
        exec 'from capabilities.%s import %s' % (self.cap, self.cap)
        capability = eval(self.cap)(self.username, arguments or self.arguments, db.r, self.on_response)
        return eval('capability.%s' % (self.request.method.lower()) )()
    

        
        
class api_call(tornado.web.RequestHandler):
    def prepare(self):
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/json; charset=UTF-8')
    def options(self):
        self.write('')
        
    def get(self):
        self.start_time = time.time()
        self.callback = self.get_argument("callback", None)
        path = self.request.path.split('/')
        eval('self.api_%s' % path[1])()
        
    def post(self):
        self.start_time = time.time()
        self.callback = self.get_argument("callback", None)
        path = self.request.path.split('/')
        eval('self.api_%s' % path[1])()
    
    def finilize_call(self, dic):
        now = time.time()
        rtime = now - self.start_time
        dic.__setitem__('current_time', now)
        dic.__setitem__('response_time', rtime)
        dic.__setitem__('error', dic.get('error',''))
        dic = tornado.escape.json_encode(dic)
        self.write(dic)

    def clb(self, response):
        #print response.code, response.body
        pass
        
    def api_batch_profile(self):
        res = dict(profiles={})
        #print self.request.arguments, type(self.request.arguments)
        
        def clb(dic):
            #print dic
            res['profiles'][dic['user']] = dic
            
        arguments = tornado.escape.json_decode(self.get_argument('data'))
        from capabilities.profile import profile
        for agent in arguments:
            
            if not db.user_exists(agent):
                print '*** user does not exist:', agent
                continue
            
            if self.request.method == 'GET':
                p = profile(agent, [], db.r, clb)
                p.get()
                
            if self.request.method == 'POST':
                p = profile(agent, arguments[agent].items(), db.r, clb)
                #print 'arguments', arguments[agent].items()
                p.post()
                
        
        self.finilize_call(res)
    
    def api_batch_location(self):
        res = dict(locations={})
        arguments = tornado.escape.json_decode(self.get_argument('data'))
        from capabilities.location import location
        
        key = 'my location'
        #print 'LOCATION update for', arguments
        pipe = db.r.pipeline()
        for agent in arguments:
            pipe.get('%s:location:%s:lat' % (agent, key))
            pipe.get('%s:location:%s:lon' % (agent, key))
        result = pipe.execute()
        
        for x in xrange(len(result)/2):
            res['locations'][arguments[x]] = dict(lat=result[2*x], lon=result[2*x+1])
            
        self.finilize_call(res)
        
    def api_batch_buysell(self):
        arguments = tornado.escape.json_decode(self.get_argument('data'))
        from capabilities.buysell import buysell
        #agents = {}
        for agent, prof in arguments.items():
            
            if not db.user_exists(agent):
                print '*** user does not exist:', agent
                continue
            
            print agent, prof
            p = buysell(agent, prof.items(), db.r, None)
            p.clear_all()
            #p.post()
        
        self.finilize_call({})
        
    def api_batch_location2(self):
        arguments = tornado.escape.json_decode(self.get_argument('data'))
        from capabilities.location import location
        
        key = 'my location'
        resolution = 10000
        pipe = db.r.pipeline()
        t1 = 0
        t2 = 0
        
        for agent, loc in arguments.items():
            #if not db.user_exists(agent):
                #print '*** user does not exist:', agent
                #continue
            
            #print agent, loc
            t = time.time()
            
            lat = loc[key]['lat']
            lon = loc[key]['lon']
            #l = location(agent, loc.items(), db.r, None)
            pipe.getset('%s:location:%s:lat' % (agent, key), lat)
            pipe.getset('%s:location:%s:lon' % (agent, key), lon)
            t1 += time.time() - t
            t = time.time()
            
            #l.post()
            t2 += time.time() - t
            
        result = pipe.execute()
        pipe = db.r.pipeline()
        
        for i, agent in enumerate(arguments.keys()):
            oldlat = result[2*i]
            oldlon = result[2*i+1]
            
            if oldlat and oldlon:
                lat = float(oldlat)
                lon = float(oldlon)
                latbucket = 1.0 * int(lat * resolution) / resolution
                lonbucket = 1.0 * int(lon * resolution) / resolution

                bucket = '%s %s' % (latbucket, lonbucket)
                pipe.srem('location:%s:latlon:%s' % (key, bucket), agent)
            else:
                print 'errr', agent, 'didnt exist?'
                pipe.incr('location:count:%s' % key)
            
            lat = float(arguments[agent][key]['lat'])
            lon = float(arguments[agent][key]['lon'])
            
            latbucket = 1.0 * int(lat * resolution) / resolution
            lonbucket = 1.0 * int(lon * resolution) / resolution

            bucket = '%s %s' % (latbucket, lonbucket)
            pipe.sadd('location:%s:buckets' % key, bucket)
            pipe.sadd('location:%s:latlon:%s' % (key, bucket), agent)
        
        result = pipe.execute()
        
        #print len(result)
        
        #print t1
        #print t2
        #print
        self.finilize_call({})
        
    def api_controller(self):
        data = self.get_argument('data')
        controller = self.get_argument('controller')
        
        db.r.set('control:controller', controller)
        db.r.set('control:entries', data)
        
        res = dict(data=data, controller=controller)
        self.write(res)
        
    def api_ustats(self):
        dic = dict(users=list(db.get_agents()))
        self.write(dic)
#########################################

settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static",),
    "debug": os.environ.get("SERVER_SOFTWARE", "").startswith("Development/"),
}
application = tornado.web.Application([
    (r"/ustats", api_call),
    (r"/batch_profile", api_call),
    (r"/batch_location", api_call),
    (r"/batch_buysell", api_call),
    (r"/controller", api_call),
    
    (r"/[a-zA-Z0-9]+/?$", serve_user),
    (r"/.+", serve_capability),
    (r"/$", serve_index),
    
], **settings)    
    

    
    
if __name__ == "__main__":
    
    parser = OptionParser(add_help_option=False)
    parser.add_option("-h", "--host", dest="host", default='')
    parser.add_option("-p", "--port", dest="port", default='10007')
    (options, args) = parser.parse_args()
    
    HOST    = options.host
    PORT    = int(options.port)
    
    satellite_url = 'http://localhost:22222'
    
    mode = ''
    if settings['debug']:
        mode = '(debug)'
        
    db = DB()
    
    print 'Ego agent running at %s:%s using %s' % (HOST,PORT,mode)
    
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT, address=HOST)
    ioloop = tornado.ioloop.IOLoop.instance()
    
    try:
        ioloop.start()
    except:
        print 'exiting'

