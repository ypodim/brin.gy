#!/usr/bin/python
# -*- coding: utf-8 -*-

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.escape
import tornado.options

import logging
import sys, os, time, random
from optparse import OptionParser

import redis

from capability import *
from db import DB
from keys import *

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
            cap = eval('%s' % self.cap)(db.r)
            arguments = tornado.escape.url_unescape(self.get_argument('data', ''))
            res = cap.get(self.path, self.request.arguments)
            
        self.finilize_call(res)
        
    def post(self):
        cap = eval('%s' % self.cap)(r)
        
        if self.cap == 'profile':
            print self.params
            print self.arguments

        response = dict(res={}, cap=self.cap)
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
        #keys = db.r.smembers('profile:keys')
        
        zkey = 'profile:all:keys'
        keys = db.r.zrevrangebyscore(zkey, '+inf', '-inf') or []
        
        vals = 0
        for k in keys:
            #vals += db.r.scard('profile:key:%s' % k)
            vals += db.r.zscore('profile:all:keys', k)
        
        queries = 0
        
        dic = dict(churn=self.churn(), 
                   users=db.r.scard('users'),
                   keys=len(keys),
                   values=vals,
                   queries=queries)
        self.write(dic)
    def churn(self):
        dic = {}
        for cap in ['profile','location']:
            if cap not in dic: dic[cap] = {}
            for key in db.r.smembers('churn:%s:keys' % cap):
                if key not in dic[cap]: dic[cap][key] = {}
                for val in db.r.smembers('churn:%s:%s:vals' % (cap, key)):
                    add = db.r.get('churn:%s:%s:%s:add' % (cap, key, val))
                    rem = db.r.get('churn:%s:%s:%s:rem' % (cap, key, val))
                    dic[cap][key][val] = dict(add=add, rem=rem)
        return dic


# class multimatch(tornado.web.RequestHandler):
#     error = ''
#     def options(self):
#         self.write({})
#     def prepare(self):
#         statistics.hit()
        
#         self.start_time = time.time()
#         self.set_header('Access-Control-Allow-Origin', '*')
#         self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
#         self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
#         self.set_header('Content-Type','application/json; charset=UTF-8')
            
#         if self.request.body:
#             args = [x.split('=') for x in self.request.body.split('&')]
#             params = dict(args)
#         else:
#             params = {}
#             for k,v in self.request.arguments.items():
#                 params[k] = v[-1]
#         self.params = params
    
#     def get(self):
#         self.post()
#     def post(self):
#         matches = []
        
#         arguments = self.get_argument('data', '')
#         context = self.get_argument('context', 'all')
#         #print
#         #print self.request
#         #print escaped_data
#         #arguments = tornado.escape.url_unescape(escaped_data)
#         #print arguments
        
#         arguments = json.loads(arguments)
        
#         #matchreqs = [x for x in arguments if x[2]]
#         #if matchreqs:
#             #print
#             #print matchreqs
#         #print
#         #print arguments
#         for capname, key, val in arguments:
#             innerstart = time.time()
#             try:
#                 cap = eval('%s' % capname)(r)
#             except Exception, e:
#                 self.error = '%s' % e
#                 continue
#             if capname == 'profile':
#                 dic = cap.get_count(context, key, val)
#             else:
#                 dic = cap.get_count(key, val)
#             matches.append([capname, key, val, dic['count'], dic['matches']])
            
#             #if capname == 'location':
#                 #print 'entry completed in ', time.time()-innerstart
#                 #print '-%s- -%s- %s %s' % (key, val, dic['count'], len(dic['matches']))
            
#         dic = dict(matches=matches, error=self.error, count=0)
#         dic.__setitem__('response_time', time.time() - self.start_time)
#         dic.__setitem__('error', dic.get('error',self.error))
#         #print 'response_time', dic['response_time'], [type(x) for x in matches]
#         self.write(dic)


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
            keys = db.r.zrevrangebyscore(getK('all'), '+inf', '-inf', withscores=True)
            
            if not keys:
                self.write(dict(error='No data. Nichts.'))
                return
                
            key, score = random.choice(keys)
            
            zkey = 'profile:all:key:%s:values' % key
            kvlist = db.r.zrevrangebyscore(zkey, '+inf', '-inf', withscores=True) or []
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

    def get_by_cid(self, cid):
        username = self.get_argument('username','')
        title = db.r.hget('context:cid:%s' % cid, 'title')
        if not title:
            return {}
        count = db.r.scard('context:cid:%s:users' % cid)
        userhasit = (username!='' and db.r.sismember('context:cid:%s:users' % cid, username))
        description = db.r.hget('context:cid:%s' % cid, 'description')
        lid = db.r.hget('context:cid:%s' % cid, 'lid')
        loc = db.r.hgetall('location:lid:%s' % lid)
        permissions = db.r.hget('context:cid:%s' % cid, 'permissions')
        if permissions == 'url':
            secret = self.get_argument('secret','')
            passed = db.authenticate_user(username, secret)
            if not passed:
                return {}

        context = dict(title=title, 
                       count=count, 
                       userhasit=userhasit, 
                       description=description,
                       id=cid,
                       lid=lid,
                       permissions=permissions,
                       location=loc)

        return context

    def get(self, cid=None):
        dic = dict(contexts=[])
        
        if cid:
            cids = [cid]
        else:
            topcid = int(db.r.get('global:nextcid'))
            cids = xrange(1001, topcid+1)

        for cid in cids:
            context = self.get_by_cid(cid)
            if context:
                dic['contexts'].append(context)

        tempc = sorted(dic['contexts'], key=lambda cntx: cntx['count'], reverse=True)
        for i in xrange(len(tempc)):
            if tempc[i]['title'] == 'all':
                allc = tempc[i]
                tempc = tempc[:i]+tempc[i+1:]+[allc]
        
        dic['contexts'] = tempc
        self.write(dic)

    def post(self):
        error = ''
        cid = None
        secret = self.get_argument('secret','')
        username = self.get_argument('username','')
        context = self.get_argument('context','')

        passed = db.authenticate_user(username, secret)
        if not passed:
            error = 'authentication failed for user:%s secret:%s' % (username, secret)
        if not context:
            error = 'no valid context params'

        if not error:
            context = tornado.escape.json_decode(context)
            cid = add_context(db.r, context, username)

        res = dict(error=error, username=username, cid=cid)
        self.write(res)



class chat(tornado.web.RequestHandler):
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
        cid = self.get_argument('cid','')
        key = self.get_argument('key','')
        val = self.get_argument('val','')

        ckey = 'chat:cid:%s:key:%s:val:%s' % (cid, key, val)
        clen = db.r.llen(ckey)
        res = []
        for mdicstr in db.r.lrange(ckey, 0, clen):
            mdic = tornado.escape.json_decode(mdicstr)
            res.append(mdic)
        
        self.write(dict(chats=res))

    def post(self):
        error = ''
        secret = self.get_argument('secret','')
        username = self.get_argument('username','')
        cid = self.get_argument('cid','')
        key = self.get_argument('key','')
        val = self.get_argument('val','')
        message = self.get_argument('message','')

        if cid and key and val and username and secret:
            if db.authenticate_user(username, secret):
                ctitle = db.r.hget('context:cid:%s' % cid, 'title')
                print ctitle
                if db.r.scard(getKVA(ctitle, key, val)):
                    if message:
                        ckey = 'chat:cid:%s:key:%s:val:%s' % (cid, key, val)
                        print 'ckey', ckey
                        mdic = dict(message=message, tstamp=time.time(), username=username)
                        mdicstr = tornado.escape.json_encode(mdic)
                        print mdic
                        print db.r.rpush(ckey, mdicstr)

                        atype = 'onchat'
                        doalert(db.r, atype, ctitle, key, val, username)
                else:
                    error = 'context/key/val does not exist'
            else:
                error = 'authentication failure'
        else:
            error = 'missing parameters'

        res = dict(error=error, chat=dict(cid=cid, key=key, val=val, message=message, username=username))
        self.write(res)


#########################################

settings = {
    "debug": os.environ.get("SERVER_SOFTWARE", "").startswith("Development/"),
    "static_path": os.path.join(os.path.dirname(__file__), "static",),
}
application = tornado.web.Application([
    # (r"/multimatch", multimatch),
    (r"/stats", stats),
    (r"/randomstat", randomstat),
    (r"/contexts", contexts),
    (r"/contexts/(.*)", contexts),
    
    (r"/chat", chat),

    (r"/.+", serve_request),
], **settings)    


if __name__ == "__main__":
    logging.getLogger().setLevel(getattr(logging, 'INFO'))
    tornado.options.enable_pretty_logging()

    statistics = Statistics()
    
    db = DB(0)
    # r = redis.Redis(host='localhost', port=6379, db=0)
    
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
        

