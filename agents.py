#!/usr/bin/python
# -*- coding: utf-8 -*-

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.escape
import tornado.httpclient
import tornado.options

import sys, os, time, urlparse
from datetime import datetime
from optparse import OptionParser
from threading import Thread
from urllib import urlencode

import smtplib
from email.mime.text import MIMEText

from db import DB
from profile import profile
from location import location
from keys import *
from oauth import *

capability_names = ['profile','location']

class sendEmail:
    def __init__(self, to, fromuser, subject, message):
        if not to or not fromuser:
            return
        
        print message, to
        print

        msg = MIMEText(message)
        msg['Subject'] = subject
        msg['From'] = 'Brin.gy <%s>' % fromuser
        msg['To'] = to

        LOGIN = 'info@brin.gy'
        PASSWD = open('email.pwd').read()
        
        error = ''
        s = smtplib.SMTP('smtp.gmail.com', 587)
        s.ehlo()
        s.starttls()
        try:
            s.login(LOGIN, PASSWD)
            print 'sendmail', s.sendmail(fromuser, [to], msg.as_string())
            s.quit()
        except Exception,e:
            error = '%s'%e


class bringy_handler(tornado.web.RequestHandler):
    callback = None
    cap = ''
    username = ''
    error = ''
    
    #def initialize(self):
    def prepare(self):
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/json; charset=UTF-8')
        
        path = tornado.escape.url_unescape(self.request.uri)
        base = path.split('?')[0]
        path = base.split('/')
        
        while path and path[0] == '':
            path.pop(0)
        
        if not path:
            return
        
        if path[0] == 'a':
            if len(path) > 1 and path[1]:
                secret = path[1]
                user = db.r.get('options:reverse-secret:%s' % secret)
                if user:
                    self.username = user
                    self.path = path[1:]
                    if len(self.path) > 1 and self.path[1]:
                        self.cap = self.path[1]
                else:
                    self.send_error(404)
            else:
                self.send_error(404)
        else:
            self.path = path
            self.username = path[0]
            if len(path) > 1 and path[1]:
                self.cap = path[1]
        

        self.arguments = {}
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
        dic.__setitem__('error', dic.get('error', self.error))
        dic.__setitem__('user', self.username)
        
        dic = tornado.escape.json_encode(dic)
        if self.callback:
            dic = '%s(%s)' % (self.callback, dic)
    
        return dic
        
    def on_response(self, dic={}):
        if self._finished:
            return
        dic = self.finilize_call(dic)
        self.write(dic)
        self.finish()

# /
class serve_index(bringy_handler):
    def post(self):            
        user_name = self.get_argument('username')
        email = self.get_argument('email')
        created, secret = db.create_user(user_name)
        db.set_email(user_name, email)
        print user_name, email

        subject = 'Your Brin.gy username: %s' % user_name
        ip = self.request.headers.get('X-Real-Ip')
        message = 'Hello,\n\n'
        message+= 'You received this message because someone (probably you) created user "%s" on Brin.gy:\n\n' % user_name
        message+= 'Username: %s\n' % user_name
        message+= 'Password: %s\n' % secret
        message+= 'Login: http://brin.gy/a/%s\n\n' % secret
        message+= 'You can use the above URL to manage your pseudonym.\n\n'
        message+= 'Cheers\nBrin.gy\n\nPS: IP address that was used: %s' % ip
        sendEmail(email, 'info@brin.gy', subject, message)
        

        error = ''
        if not created: error = 'user already exists'
        res = dict(error=error, username=user_name, created=created, secret=secret)
        self.write(res)
    def get(self):
        dic = dict(message='this is ego')
        self.write(dic)
        

# /USERNAME
class serve_user(bringy_handler):
    def prepare(self):
        bringy_handler.prepare(self)
        if not db.user_exists(self.username):
            error = 'invalid user %s' % self.username
            self.on_response(dict(error=error))
    def get(self):
        dic = dict(capabilities=capability_names)

        secret = self.get_argument('secret','')
        passed = db.authenticate_user(self.username, secret)
        if passed:
            dic['options'] = db.r.hgetall('options:user:%s' % self.username)
            for k in dic['options']:
                if dic['options'][k] == 'True':
                    dic['options'][k] = 1
                if dic['options'][k] == 'False':
                    dic['options'][k] = 0

            dic['alerts'] = []
            rkey = 'user:%s:alerts' % self.username
            llen = db.r.llen(rkey)
            for i in xrange(llen):
                alert = db.r.lpop(rkey)
                alert = tornado.escape.json_decode(alert)
                dic['alerts'].append(alert)
                alert = tornado.escape.json_encode(alert)
                db.r.rpush(rkey, alert)
        
        dic = self.finilize_call(dic)
        self.write(dic)
    def delete(self):
        dic = urlparse.parse_qs(self.request.body)
        deleted = ''
        error = ''
        secret = dic.get('secret',[''])[0]
        
        # if self.request.body:
            # secret = self.request.body.split('=')[1]
        
        passed = db.authenticate_user(self.username, secret)
        print 'DELETE', passed, dic
        if passed:
            deleted = db.delete_user(self.username)
            print 'deleted'
            for capname in capability_names:
                print 'deleting cap', capname
                capability = eval(capname)(self.username, self.arguments, self.path, db.r, self.on_response)
                capability.clear_all()
        else:
            error='authentication failed for user:%s secret:%s' % (self.username, secret)
            
        res = {'error':error, 'username':self.username, 'deleted':deleted}
        self.write(res)
    def post(self):
        error = ''
        secret = self.get_argument('secret','')
        context = self.get_argument('context','')
        action = self.get_argument('action','')
        passed = db.authenticate_user(self.username, secret)
        options = self.get_argument('options','')
        
        if not passed:
            error = 'authentication failed for user:%s secret:%s' % (self.username, secret)
        if not options and not context:
            error = 'invalid context'
        if action == 'leave' and context == 'all':
            error = 'You can check in any time you like, but you can never leave'
        if action == 'options' and not options:
            error = 'No valid options'

        if not error and action == 'join':
            db.join_context(context, self.username)
        if not error and action == 'leave':
            #db.leave_context(context, self.username)
            p = profile(self.username, [], self.request.path.split('/'), db.r, None)
            p.leave_context(context)
        if not error and action == 'options':
            options = tornado.escape.json_decode(options)
            if not options.get('option') in ['onvalueadded','onvaluecreated','onapplication','onattribute']:
                error = 'invalid option %s' % options.get('option')
            else:
                set_user_option(db.r, self.username, options['option'], options['value'])
        if not error and action == 'email':
            msg = self.get_argument('msg')
            to = self.get_argument('to')
            selectedAttrs = self.get_argument('selectedAttrs')
            subject = 'Brin.gy message from user: %s' % self.username

            to = tornado.escape.json_decode(to)
            selectedAttrs = tornado.escape.json_decode(selectedAttrs)
            replyTo = db.get_email(self.username)
            sendTo = [dict(email=db.get_email(x), username=x) for x in to]

            body = 'User %s (%s) sent you (%%s) a message based on your attributes:\n\n' % (self.username, replyTo, )
            for attr in selectedAttrs:
                body += '%s:%s\n' % (attr['key'], attr['val'])
            body += '\nATTENTION: Please reply to the user\'s email, NOT to this message directly!\n'
            body += 'User\'s message follows:\n'
            body += '====================\n\n'
            body += msg

            
            for destination in sendTo:
                body = body % destination['username']
                print destination, subject, body
                sendEmail(destination['email'], 'info@brin.gy', subject, body)

        res = {'error':error, 'username':self.username}
        self.write(res)
        
# /USERNAME/CAPABILITY
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
        error = ''
        secret = self.get_argument('secret', None)
        context = self.get_argument('context')
        context = tornado.escape.json_decode(context)
        
        passed = db.authenticate_user(self.username, secret)
        if passed:
            res = self.execute(context=context)
            res['error'] = error
            if type(passed) == str:
                res['secret'] = passed
            if res: self.write(res)
        else:
            res = dict(error='authentication failed for user:%s secret:%s' % (self.username, secret))
            self.write(res)
            
    def delete(self):
        dic = tornado.escape.url_unescape(self.request.body)
        args = [x.split('=', 1) for x in self.request.body.split('&')]
        params = dict(args)
        arguments = tornado.escape.url_unescape(params['data'])
        arguments = tornado.escape.json_decode(arguments)
        # print 'delete:', arguments, params
        secret = params.get('secret')
        context = tornado.escape.url_unescape(params['context'])
        context = tornado.escape.json_decode(context)

        passed = db.authenticate_user(self.username, secret)
        if passed:
            res = self.execute(context=context, arguments=arguments)
            if type(passed) == str:
                res['secret'] = passed
            if res: self.write(res)
        else:
            res = dict(error='authentication failed for user:%s secret:%s' % (self.username, secret))
            self.write(res)
        
    def execute(self, context='all', arguments=None):
        capability = eval(self.cap)(
            self.username, 
            arguments or self.arguments, 
            self.path, 
            db.r, 
            self.on_response)
        return eval('capability.%s' % (self.request.method.lower()) )(context)
        
        
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
        for agent in arguments:
            
            if not db.user_exists(agent):
                print '*** user does not exist:', agent
                continue
            
            if self.request.method == 'GET':
                p = profile(agent, [], self.request.path.split('/'), db.r, clb)
                p.get("")
                
            if self.request.method == 'POST':
                p = profile(agent, arguments[agent].items(), db.r, clb)
                #print 'arguments', arguments[agent].items()
                p.post()
                
        
        self.finilize_call(res)
    
    def api_batch_location(self):
        res = dict(locations={})
        arguments = tornado.escape.json_decode(self.get_argument('data'))
        
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
        
    def api_batch_location2(self):
        arguments = tornado.escape.json_decode(self.get_argument('data'))
        
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
        
    def api_authenticate_user(self):
        user = self.get_argument('user')
        secret = self.get_argument('secret')
        res = (db.r.hget('options:user:%s' % user, 'secret') == secret)
        email = db.r.hget('options:user:%s' % user, 'email')
        self.write(dict(result=res, email=email))
    
    def api_authenticate_admin_secret(self):
        error = ''
        secret = self.get_argument('secret')
        user = db.r.get('options:reverse-secret:%s' % secret)
        if not user:
            error = 'user not found'
            email = ''
        else:
            email = db.r.hget('options:user:%s' % user, 'email')
        self.write(dict(secret=secret, user=user, email=email, error=error))
        
    def api_cleanup(self):
        #for user in db.r.smembers('users'):
            #for key in db.r.smembers('%s:profile:visited:keys' % user):
                #print db.r.delete('%s:profile:visited:key:%s' % (user, key))
            #print db.r.delete('%s:profile:visited:keys' % user)
        self.write("ok")
        
    def api_clear_context(self):
        context = self.get_argument('context')
        if type(context) == list: context = context[0]
        print context
        if context != 'all':
            db.clear_context(context)

    def api_email_reminder(self):
        error = ''
        result = []
        email = self.get_argument('email','')
        result = db.usernames_by_email(email)
        if not result:
            error = 'invalid email address'

        subject = 'Brin.gy password reminder'
        ip = self.request.headers.get('X-Real-Ip')
        ip = ip or self.request.remote_ip
        print self.request
        message = 'Hello,\n\n'
        message = 'You received this message because someone (probably you) requested a password reminder on Brin.gy:\n\n'
        
        for user_name, secret in result:
            message+= 'Username: %s\n' % user_name
            message+= 'Password: %s\n' % secret
            # message+= 'Direct access: http://brin.gy/a/%s\n\n' % secret
            message+= '\n\n'

        message+= 'Cheers\nBrin.gy\n\nPS: IP address that was used: %s' % ip
        if not error:
            sendEmail(email, 'info@brin.gy', subject, message)
        self.write(dict(error=error, result=result))

    def api_feedback(self):
        error = ''
        result = []
        feedback = self.get_argument('feedback','')
        username = self.get_argument('username','')
        secret = self.get_argument('secret','')
        passed = db.authenticate_user(username, secret)
        print 'authentication', username, secret, passed

        subject = 'Brin.gy feedback'
        ip = self.request.headers.get('X-Real-Ip')
        message = 'Dude,\n\n'
        message+= 'You got feedback from: -%s- (verified:%s)\n\n' % (username, passed)
        message+= '=====================\n'
        message+= feedback
        message+= '\n=====================\n'
        message+= 'IP address that was used: %s' % ip
        email = 'ypodim@gmail.com'
        sendEmail(email, 'info@brin.gy', subject, message)
        self.write(dict(error=error, result=result))


class stats(tornado.web.RequestHandler):
    def options(self):
        self.write('')
    def prepare(self):
        self.start_time = time.time()
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.set_header('Content-Type','application/json; charset=UTF-8')
    def post(self):
        dic = {}
        dic['tstamp'] = time.time()
        dic['type'] = self.get_argument('type')

        dic['user'] = self.get_argument('user','')
        dic['user'] = dic['user']

        dic['body'] = self.get_argument('body','{}')
        dic['body'] = tornado.escape.json_decode(dic['body'])

        db.r.sadd('stat:etypes', dic['type'])
        db.r.lpush('stat:type:%s' % dic['type'], tornado.escape.json_encode(dic))
        db.r.lpush('stat:timeline', tornado.escape.json_encode(dic))
        
        # print dic
        self.write(dict(error=''))
    def get(self):
        if (self.get_argument('clear','')):
            return self.clearstats()
        if (self.get_argument('trans','')):
            return self.trans()

        res = dict(summary={'emptyfilters':0, 'filtersbyuser':{}})

        last = self.get_argument('last','10')
        try:
            last = int(last)
        except:
            last = 10
        if last == 0:
            last = db.r.llen('stat:timeline')

        for etype in db.r.smembers('stat:etypes'):
            res[etype] = []
            elen = db.r.llen('stat:type:%s'%etype)
            
            res['summary'][etype] = db.r.llen('stat:type:%s' % etype)

            for evtstr in db.r.lrange('stat:type:%s'%etype, 0, elen):
                evt = tornado.escape.json_decode( evtstr )
                res[etype].append(evt)
                
                if etype == 'filters' and evt['body'] == {}:
                    res['summary']['emptyfilters'] += 1
                if etype == 'filters' and evt['body']:
                    if evt['user'] not in res['summary']['filtersbyuser']:
                        res['summary']['filtersbyuser'][evt['user']] = 0    
                    res['summary']['filtersbyuser'][evt['user']] += 1
                    
        res['timeline'] = db.r.lrange('stat:timeline', 0, last-1)

        db.r.llen('stat:type:filters')
        
        self.write(res)
    def clearstats(self):
        for etype in db.r.smembers('stat:etypes'):
            db.r.delete('stat:type:%s'%etype)
        db.r.delete('stat:etypes')
        db.r.delete('stat:timeline')
        self.write(dict(error=''))
        return 
    def trans(self):
        res = []
        for evtstr in db.r.smembers('statbag'):
            evt = evtstr.replace('\'','"')
            evt = tornado.escape.json_decode(evt)

            dic = {}
            dic['user'] = evt.get('user',[''])[0]
            dic['type'] = evt.get('type',[''])[0]
            dic['tstamp'] = evt['tstamp']
            dic['body'] = {}

            if dic['user'] == 'ypodim':
                db.r.srem('statbag', evtstr)
                continue

            if dic['type'] == 'filters':
                keys = evt.keys()
                keys.remove('type')
                if 'user' in keys: keys.remove('user') 
                keys.remove('tstamp')
                if keys:
                    for i in xrange(len(keys)/2):
                        tdic = []
                        _dic = dict(key=evt['filters[%i][key]' % i])
                        if 'filters[%i][val]' % i in evt:
                            _dic['val'] = evt['filters[%i][val]' % i]
                        tdic.append(_dic)
                    dic['body'] = tdic

            if dic['type'] == 'profile':
                dic['body'] = evt['targetUser'][0]

            # if evt['type'] == 'newattrbtnTop':
                # continue

            # if evt['type'] == 'newattrbtnBottom':
                # continue

            res.append(dic)

            db.r.sadd('stat:etypes', dic['type'])
            db.r.lpush('stat:type:%s' % dic['type'], tornado.escape.json_encode(dic))

            print db.r.srem('statbag', evtstr)

        print db.r.scard('statbag')
        print db.r.smembers('statbag')
        self.write(dict(res=res))

class debug(tornado.web.RequestHandler):
    def get(self):
        res = {}
        for u in db.r.smembers('users'):
            db.r.smembers('users')
            res[u] = db.r.hgetall('options:user:%s' % u)
        self.write(res)



#########################################

settings = dict(
    cookie_secret="12oETzKXQAGaYdkL5gEmGeJJFuYhghdskj3hHG8s/Vo=",# choose a cookie seed
    login_url="/",# not sure if this is right or if it even matters
    xsrf_cookies=True,
    #setting keys is important!
    facebook_api_key= facebook_api_key,
    facebook_secret= facebook_secret,
    twitter_consumer_key= twitter_consumer_key,
    twitter_consumer_secret= twitter_consumer_secret,
    autoescape=None,

    static_path=os.path.join(os.path.dirname(__file__), "static",),
    debug=os.environ.get("SERVER_SOFTWARE", "").startswith("Development/"),
)


application = tornado.web.Application([
    (r"/ustats", api_call),
    (r"/batch_profile", api_call),
    (r"/batch_location", api_call),
    (r"/controller", api_call),
    (r"/authenticate_user", api_call),
    (r"/email_reminder", api_call),
    (r"/authenticate_admin_secret", api_call),
    (r"/cleanup", api_call),
    (r"/clear_context", api_call),
    (r"/feedback", api_call),
    (r"/stats", stats),

    (r"/oauth", ProviderHandler),
    (r"/oauth/twitter", TwitterHandler),
    (r"/oauth/facebook", FacebookHandler),
    (r"/example", ExamplePage),

    (r"/users", debug),    
    
    # (r"/a/[a-zA-Z0-9]+/?$", serve_user),
    (r"/[a-zA-Z0-9]+/?$", serve_user),
    (r"/.+", serve_capability),
    (r"/$", serve_index),
    
], **settings)    
    

    
    
if __name__ == "__main__":
    
    parser = OptionParser(add_help_option=False)
    parser.add_option("-h", "--host", dest="host", default='')
    parser.add_option("-p", "--port", dest="port", default='10007')
    parser.add_option("-d", "--dbnumber", dest="dbno", default='0')
    (options, args) = parser.parse_args()
    
    HOST    = options.host
    PORT    = int(options.port)
    dbno    = int(options.dbno)
    
    satellite_url = 'http://localhost:22222'
    
    mode = ''
    if settings['debug']:
        mode = '(debug)'
        
    db = DB(dbno)
    
    print 'Ego agent running at %s:%s using %s' % (HOST,PORT,mode)
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(PORT, address=HOST)
    ioloop = tornado.ioloop.IOLoop.instance()
    
    try:
        ioloop.start()
    except:
        print 'exiting'

