#!/usr/bin/python
# -*- coding: utf-8 -*-

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.escape

import sys, os, time, random
from optparse import OptionParser

from capability import *

import redis

CAPS = ['buysell','location','profile']

class Statistics:
    statistics = dict(hit_rate=0, last_measurement=0, interval=5, hits=0)
    
    def hit(self):
        self.statistics['hits'] += 1
        diff =  time.time() - self.statistics['last_measurement']
        if diff > self.statistics['interval']:
            self.statistics['hit_rate'] = 1.0 * self.statistics['hits'] / diff
            self.statistics['hits'] = 0
            self.statistics['last_measurement'] = time.time()
            
            print 'stats', self.statistics['hit_rate']
    
class serve_request(tornado.web.RequestHandler):
    cap = ''
    error = ''
    
    def initialize(self):
        path = tornado.escape.url_unescape(self.request.uri)
        path = path.split('?')[0].split('/')[1:]
        self.path = path[1:]
        self.cap = path[0]
    
    def options(self):
        self.write({})
        
    def prepare(self):
        statistics.hit()
        
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Content-Type','application/json; charset=UTF-8')
        
        if self.cap not in CAPS:
            self.error = '%s is not a valid capability' % self.cap
            print '%s: %s' % (self.request.headers.get('X-Real-Ip'), self.request.uri)
            return
            
        if self.request.body:
            args = [x.split('=') for x in self.request.body.split('&')]
            params = dict(args)
        else:
            params = {}
            for k,v in self.request.arguments.items():
                params[k] = v[-1]
        self.params = params
        
    def options(self):
        self.finilize_call({})
        
    def get(self):
        res = {}
        if not self.error:
            cap = eval('%s' % self.cap)(r)
            arguments = tornado.escape.url_unescape(self.get_argument('data', ''))
            res = cap.get(self.path, self.request.arguments)
            
        self.finilize_call(res)
        
    def post(self):
        cap = eval('%s' % self.cap)(r)
        
        agents = self.params.get('agents')
        if agents:
            agents = tornado.escape.url_unescape(agents)
            agents = tornado.escape.json_decode(agents)
        else:
            agent = self.params.get('agent')
            if agent:
                agents = {agent:self.params}
            else:
                response = dict(error='*** Post error: No valid "agent" or "agents" param')
                #print response
                #print self.params
                self.finilize_call(response)
                return
        
        
        response = dict(agents={}, cap=self.cap)
        
        
        for agent, params in agents.items():
            #agent = tornado.escape.url_unescape(agent)
            res = {}
            
            
            if self.cap == 'location':
                #print params
                aid = params.get('agent')
                quantsize = 0.000005
                lat = float(params.get('lat'))
                lat = lat - lat % quantsize
                lon = float(params.get('lon'))
                lon = lon - lon % quantsize
                thres = params.get('threshold')
                res['matched'] = cap.mutate(aid, lat, lon, thres)
            
            if self.cap == 'profile':
                for key, val in params:
                    #res['matched'] = cap.mutate(agent, key, val)
                    #res['matched'] = cap.set(agent, key, val)
                    cap.set(agent, key, val)
                
            if self.cap == 'buysell':
                for key, val in params:
                    dic = tornado.escape.json_decode(val)
                    #print dic
                    res['matched'] = cap.mutate(dic['action'], dic['product'], dic['price'], agent)

            response['agents'][agent] = res
        
        self.finilize_call(response)
        
    def delete(self):
        self.finilize_call({})
        
    def finilize_call(self, dic):
        rtime = time.time() - self.start_time
        dic.__setitem__('response_time', rtime)
        dic.__setitem__('error', dic.get('error',self.error))
        self.write(dic)
        
        
class stats(tornado.web.RequestHandler):
    def options(self):
        self.write({})
    def prepare(self):
        statistics.hit()    
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/json; charset=UTF-8')
    def get(self):
        #keys = r.smembers('profile:keys')
        
        zkey = 'profile:all:keys'
        keys = r.zrevrangebyscore(zkey, '+inf', '-inf') or []
        
        vals = 0
        for k in keys:
            #vals += r.scard('profile:key:%s' % k)
            vals += r.zscore('profile:all:keys', k)
        
        queries = 0
        
        dic = dict(churn=self.churn(), 
                   users=r.scard('users'),
                   keys=len(keys),
                   values=vals,
                   queries=queries)
        self.write(dic)
    def churn(self):
        dic = {}
        for cap in ['profile','location']:
            if cap not in dic: dic[cap] = {}
            for key in r.smembers('churn:%s:keys' % cap):
                if key not in dic[cap]: dic[cap][key] = {}
                for val in r.smembers('churn:%s:%s:vals' % (cap, key)):
                    add = r.get('churn:%s:%s:%s:add' % (cap, key, val))
                    rem = r.get('churn:%s:%s:%s:rem' % (cap, key, val))
                    dic[cap][key][val] = dict(add=add, rem=rem)
        return dic


class multimatch(tornado.web.RequestHandler):
    error = ''
    def options(self):
        self.write({})
    def prepare(self):
        statistics.hit()
        
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/json; charset=UTF-8')
            
        if self.request.body:
            args = [x.split('=') for x in self.request.body.split('&')]
            params = dict(args)
        else:
            params = {}
            for k,v in self.request.arguments.items():
                params[k] = v[-1]
        self.params = params
    
    def get(self):
        self.post()
    def post(self):
        matches = []
        
        arguments = self.get_argument('data', '')
        context = self.get_argument('context', 'all')
        #print
        #print self.request
        #print escaped_data
        #arguments = tornado.escape.url_unescape(escaped_data)
        #print arguments
        
        arguments = json.loads(arguments)
        
        #matchreqs = [x for x in arguments if x[2]]
        #if matchreqs:
            #print
            #print matchreqs
        #print
        #print arguments
        for capname, key, val in arguments:
            innerstart = time.time()
            try:
                cap = eval('%s' % capname)(r)
            except Exception, e:
                self.error = '%s' % e
                continue
            if capname == 'profile':
                dic = cap.get_count(context, key, val)
            else:
                dic = cap.get_count(key, val)
            matches.append([capname, key, val, dic['count'], dic['matches']])
            
            #if capname == 'location':
                #print 'entry completed in ', time.time()-innerstart
                #print '-%s- -%s- %s %s' % (key, val, dic['count'], len(dic['matches']))
            
        dic = dict(matches=matches, error=self.error, count=0)
        dic.__setitem__('response_time', time.time() - self.start_time)
        dic.__setitem__('error', dic.get('error',self.error))
        #print 'response_time', dic['response_time'], [type(x) for x in matches]
        self.write(dic)


class randomstat(tornado.web.RequestHandler):
    def options(self):
        self.write({})
    def prepare(self):
        statistics.hit()
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/json; charset=UTF-8')    
    def get(self):
        kvlist = []
        while not kvlist:
            keys = r.zrevrangebyscore(getK('all'), '+inf', '-inf', withscores=True)
            
            if not keys:
                self.write(dict(error='No data. Nichts.'))
                return
                
            key, score = random.choice(keys)
            
            zkey = 'profile:all:key:%s:values' % key
            kvlist = r.zrevrangebyscore(zkey, '+inf', '-inf', withscores=True) or []
        val, score = random.choice(kvlist)
        
        res = dict(key=key, val=val, score=score)
        self.write(res)
        

class contexts(tornado.web.RequestHandler):
    def options(self):
        self.write({})
    def prepare(self):
        statistics.hit()
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/json; charset=UTF-8')    
    def get(self):
        user = self.get_argument('user','')
        dic = dict(contexts=[])
        contexts=list(r.smembers('contexts'))
        for c in contexts:
            count = r.scard('context:users:%s' % c)
            
            description = r.get('context:description:%s' % c)
            if c == 'all':
                description = 'This is the top level context that includes everything and everyone.'
            context = dict(name=c, 
                           count=count, 
                           userhasit=0, 
                           description=description)
            if user:
                context['userhasit'] = r.sismember('context:users:%s' % c, user)
            dic['contexts'].append(context)    
        self.write(dic)

            
            
#########################################

settings = {
    "debug": os.environ.get("SERVER_SOFTWARE", "").startswith("Development/"),
    "static_path": os.path.join(os.path.dirname(__file__), "static",),
}
application = tornado.web.Application([
    (r"/multimatch", multimatch),
    (r"/stats", stats),
    (r"/randomstat", randomstat),
    (r"/contexts", contexts),
    
    (r"/.+", serve_request),
], **settings)    


if __name__ == "__main__":
    
    statistics = Statistics()
    
    r = redis.Redis(host='localhost', port=6379, db=0)
    
    parser = OptionParser(add_help_option=False)
    parser.add_option("-h", "--host", dest="host", default='')
    parser.add_option("-p", "--port", dest="port", default='22222')
    (options, args) = parser.parse_args()
    
    HOST    = options.host
    PORT    = int(options.port)
    
    mode = ''
    if settings['debug']:
        mode = '(debug)'
    
    print 'Satellite running at %s:%s %s' % (HOST,PORT,mode)
    
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT, address=HOST)
    ioloop = tornado.ioloop.IOLoop.instance()
    
    try:
        ioloop.start()
    except:
        print 'exiting'
        

