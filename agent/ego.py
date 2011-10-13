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
from cron import Cron

        
class serve_index(tornado.web.RequestHandler):
    def options(self):
        self.write('')
    def prepare(self):
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/javascript; charset=UTF-8')
    def get(self):
        dic = dict(message='this is ego')
        self.write(dic)


#class manage_agent(tornado.web.RequestHandler):
    #def options(self):
        #self.write('')
    #def prepare(self):
        #self.start_time = time.time()
        #self.set_header('Access-Control-Allow-Origin', '*')
        #self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        #self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        #self.set_header('Content-Type','application/javascript; charset=UTF-8')
    #def post(self):
        #user_type = self.get_argument('user_type', 'bot')
        #flag = 1
        #while flag:
            #user_name = ''.join(chr(random.randint(97, 122)) for x in xrange(6)) # a-z
            
            #sql = 'select * from ego2_user where `name`="%s"' % user_name
            #flag = db.query(sql)
            ##print 'tried %s and found %s' % (user_name, flag)
            
        #profile = dict(user_name=user_name, user_type=user_type)
        #u, created = create_user_with_profile(profile, db)
        ##print '****', u, created
        
        #res = {'error':'', 'username':user_name, 'usertype':user_type}
        #self.write(res)
    #def delete(self):
        #sql = 'DELETE FROM `ego2_user`'
        #dat = db.execute(sql)
        #self.write({'error':'', 'res':'%s'%dat})
        
        
class new_agent(tornado.web.RequestHandler):
    def options(self):
        self.write('')
    def prepare(self):
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/javascript; charset=UTF-8')
    def post(self):
        authorized_users = ['ypod','jon','holtzman']
        authorized_user = ''

        user = self.get_cookie("MediaLabUser")
        if user: user = user.split('%',1)[0]
        
        #if user not in authorized_users:
            #self.write({'error':'only %s are allowed to play with this' % authorized_users})
            #return
        
        user_name = self.get_argument('username')
        
        created = db.create_user(user_name)
        
        res = {'error':'', 'username':user_name, 'created':created}
        self.write(res)
        
        
class serve_request(tornado.web.RequestHandler):
    callback = None
    cap = ''
    
    def initialize(self):
        path = tornado.escape.url_unescape(self.request.uri)
        
        base = path.split('?')[0]
        path = base.split('/')[1:]
        
        if len(path) > 1 and path[1]:
            self.cap = path[1]
        
        self.username = path[0]
        self.path = path[2:]
        self.agent_url = '%s/%s' % (self.request.host, path[0])
        
    def die(self, error):
        if type(error) == dict:
            dic = error
        if type(error) in (str, unicode):
            dic = {'error':error}
            print '*** %s' % dic
            
        self.on_response(dic)
    
    def prepare(self):
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/json; charset=UTF-8')
        
        #print self.usr, self.request.headers.get('X-Real-Ip')
        
        # if user exists in ML dir
        if not db.user_exists(self.username):
            self.die('invalid user %s' % self.username)
            #print '%s: %s' % (self.request.headers.get('X-Real-Ip'), self.request.uri)
            return

        capabilities = []
        for capability_source in os.listdir(capabilities_dir):

            if capability_source[-3:] == '.py' and \
            capability_source[:2]  != '__':
                try:
                    capabilities.append( capability_source.split('.')[0] )
                except:
                    print 'Ignoring %s' % capability_source
        
        if not self.cap:
            self.die({'error':'', 'capabilities':capabilities})
            return
            
        if self.cap not in capabilities:
            self.die('%s is not a valid capability' % self.cap)
            print '%s: %s' % (self.request.headers.get('X-Real-Ip'), self.request.uri)
            return
            
        authenticated_user = self.get_cookie("MediaLabUser")
        if authenticated_user: authenticated_user = authenticated_user.split('%',1)[0]
            
        
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
        #print self.cap, self.username, arguments, self.arguments
        capability = eval(self.cap)(self.username, arguments or self.arguments, db.r, self.on_response)
        return eval('capability.%s' % (self.request.method.lower()) )()
    
    def finilize_call(self, dic):
        now = time.time()
        rtime = now - self.start_time
        dic.__setitem__('capability', self.cap)
        dic.__setitem__('current_time', now)
        dic.__setitem__('response_time', rtime)
        dic.__setitem__('error', dic.get('error',''))
        dic.__setitem__('user', self.username)
        
        alert = ''
        if rtime > 1:
            alert = '\n***** TOO SLOW ***'
            print '%sresponse time: %s %s' % (alert, rtime, self.request.uri)
        
        dic = tornado.escape.json_encode(dic)
        if self.callback:
            dic = '%s(%s)' % (self.callback, dic)
    
        return dic
        
    def on_response(self, dic={}):
        dic = self.finilize_call(dic)
        self.write(dic)
        self.finish()
        
        
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
        
    def api_show_agents(self):
        
        dic = {'agents':db.get_agents()}
        if self.callback:
            dic = '%s(%s)' % (self.callback, tornado.escape.json_encode(dic))
            
        self.finilize_call(dic)
    
    def clb(self, response):
        #print response.code, response.body
        pass
        
    def api_batch_profile(self):
        arguments = tornado.escape.json_decode(self.get_argument('data'))
        from capabilities.profile import profile
        #agents = {}
        for agent, prof in arguments.items():
            
            if not db.user_exists(agent):
                print '*** user does not exist:', agent
                continue
            
            p = profile(agent, prof.items(), db.r, None)
            p.clear_all()
            p.post()
        
        self.finilize_call({})
        
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
    
    def api_batch_location(self):
        arguments = tornado.escape.json_decode(self.get_argument('data'))
        from capabilities.location import location
        
        key = 'current location'
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
        
    def api_test(self):
        self.render('test.html')
        
    def api_jobs(self):
        if 'html' in self.request.path.split('/'):
            self.render('jobs.html')
        else:
            jobs = cron.get_jobs()
            self.write(dict(jobs=jobs))
        
    def api_stopjob(self):
        name = self.request.path.split('/', 2)[-1]
        
        res = cron.stop_job(name)
        self.write(res)
        
    def api_startjob(self):
        name = self.request.path.split('/', 2)[-1]
        ttl = self.get_argument('ttl', 5)
        ttl = int(ttl)
        
        request_url = '%s/buysell' % satellite_url
        
        #data = dict(agent=name)
        #if random.random() > 0.1:
            #data['name'] = random.choice(['gandalf','galadriel'])
        #if random.random() > 0.1:
            #data['sex'] = random.choice(['male','female'])
        #if random.random() > 0.1:
            #data['age'] = random.randint(20, 30)
        
        data = dict(itemid="theproduct", price=1000, action="sell", agent="pol")
        
        res = cron.start_job(name, request_url, data, ttl)
        self.write(res)
        
    def api_polljob(self):
        name = self.request.path.split('/', 2)[-1]
        res = cron.get_responses(name)
        self.write(res)

    def api_controller(self):
        data = self.get_argument('data')
        controller = self.get_argument('controller')
        
        db.r.set('control:controller', controller)
        db.r.set('control:entries', data)
        
        res = dict(data=data, controller=controller)
        self.write(res)
        
#########################################

settings = {
    "static_path": os.path.join(os.path.dirname(__file__), "static",),
    "debug": os.environ.get("SERVER_SOFTWARE", "").startswith("Development/"),
}
application = tornado.web.Application([
    (r"/show_agents", api_call),
    (r"/test", api_call),
    (r"/batch_profile", api_call),
    (r"/batch_location", api_call),
    (r"/batch_buysell", api_call),
    
    (r"/controller", api_call),
    
    
    (r"/jobs.*", api_call),
    (r"/startjob/[\/\:_a-zA-Z0-9]*", api_call),
    (r"/stopjob/[\/\:_a-zA-Z0-9]*", api_call),
    (r"/polljob/[\/\:_a-zA-Z0-9]*", api_call),
    
    #(r"/manage_agent", manage_agent),
    (r"/new_agent", new_agent),
    
    (r"/.+", serve_request),
    (r"/$", serve_index),
    
], **settings)    
    

    
    
if __name__ == "__main__":
    
    parser = OptionParser(add_help_option=False)
    parser.add_option("-h", "--host", dest="host", default='')
    parser.add_option("-p", "--port", dest="port", default='10007')
    (options, args) = parser.parse_args()
    
    HOST    = options.host
    PORT    = int(options.port)
    
    capabilities_dir = 'capabilities'
    
    cron = Cron()

    satellite_url = 'http://localhost:22222'
    
    mode = ''
    if settings['debug']:
        mode = '(debug)'
        
    db = DB()
    
    print 'Ego agent running at %s:%s using %s' % (HOST,PORT,mode)
    
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT, address=HOST)
    ioloop = tornado.ioloop.IOLoop.instance()
    
    #poster = Poster()
    
    #caller = tornado.ioloop.PeriodicCallback(poster.execute, 1000, ioloop)
    #caller.start()
    
    
    try:
        ioloop.start()
    except:
        print 'exiting'

