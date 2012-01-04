# -*- coding: utf-8 -*-
import redis
import time
import sys
import random
import unittest
import httplib2
import urllib
import json

from keys import *

h = httplib2.Http()

def post(dic, path='', method='POST', url='http://localhost:10007'):
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    body = urllib.urlencode(dic)
    uri = '%s%s'%(url,path)
    resp, content = h.request(uri, method, headers=headers, body=body)
    return json.loads(content)


r = redis.Redis(host='localhost', port=6379, db=0)
#r.flushall()

class State:
        #def setUp(self):
    print 'setup'
    
    u = 'tester'
    p = dict(key='name', val='pol')
    
    lat = 10.01
    lon = 20.02
    l = dict(key='current location', val=dict(lat=lat,lon=lon))
    bs = dict(key='', val=dict(action='buy',price=300,product='ipad'))
        
    if r.sismember('users', u):
        print 'oops user exists, deleting'
        s = r.hget('options:user:%s' % u, 'secret')
        res = post({'secret':s}, path='/%s'%u, method='DELETE')
        print res, s

state = State()

class TestSequenceFunctions(unittest.TestCase):
    def test_create_user(self):
        res = post(dict(username=state.u))
        self.assertTrue(r.sismember('users', state.u))
        state.secret = res['secret']
        
    def test_post_profile(self):
        context = 'context1'
        params = [[state.p['key'],state.p['val']]]
        
        body = dict(data=json.dumps(params), secret=state.secret, context=context)
        res = post(body, path='/%s/profile'%state.u)
        print 'PROFILE', res, state.secret
        self.assertTrue(res['result']=='')
        
        keys = r.smembers('%s:profile:keys' % state.u)
        self.assertTrue(list(keys)==[state.p['key']])
        
        vals = r.smembers('%s:profile:key:%s' % (state.u, state.p['key']))
        self.assertTrue(list(vals)==[state.p['val']])
        
        agents = r.smembers(getKA(context, state.p['key']))
        self.assertTrue(list(agents)==[state.u])
        
        agents = r.smembers(getKVA(context, state.p['key'],state.p['val']))
        self.assertTrue(list(agents)==[state.u])
        
        
        
        keys = r.zrevrangebyscore(getK(context), '+inf', '-inf')
        self.assertTrue(list(keys)==[state.p['key']])
        
        score = r.zscore(getK(context), state.p['key'])
        self.assertTrue(score==1)
        
        vals = r.zrevrangebyscore(getKV(context, state.p['key']), '+inf', '-inf')
        self.assertTrue((list(vals)==[state.p['val']]))
        
        score = r.zscore(getKV(context, state.p['key']), state.p['val'])
        self.assertTrue(score==1)
        
        
        
        body = dict(data=json.dumps(params), secret=state.secret, context=context)
        res = post(body, method='DELETE', path='/%s/profile'%state.u)
        self.assertTrue(res['error']=='')
        print res
        
        
    def notest_post_location(self):
        params = [[state.l['key'],state.l['val']]]
        
        body = dict(data=json.dumps(params))
        res = post(body, path='/%s/location'%state.u)
        self.assertTrue(res['result']=='')
        
        keys = r.smembers('%s:location:keys' % state.u)
        self.assertTrue(list(keys)==[state.l['key']])
        
        lat = r.get('%s:location:%s:lat' % (state.u, state.l['key']))
        self.assertTrue(float(lat)==state.l['val']['lat'])
        
        lon = r.get('%s:location:%s:lon' % (state.u, state.l['key']))
        self.assertTrue(float(lon)==state.l['val']['lon'])
        
        buckets = r.smembers('location:%s:buckets' % state.l['key'])
        match = '%s %s' % (state.l['val']['lat'], state.l['val']['lon'])
        self.assertTrue(list(buckets)==[match])
        
        agents = r.smembers('location:%s:latlon:%s' % (state.l['key'], match))
        self.assertTrue(list(agents)==[state.u])
        
        
    def notest_post_buysell(self):
        params = [[state.bs['key'],json.dumps(state.bs['val'])]]
        
        body = dict(data=json.dumps(params))
        res = post(body, path='/%s/buysell'%state.u)
        pid = res['result']['key']
        self.assertTrue(pid==1)
        
        pids = r.smembers('%s:buysell:pids' % state.u)
        self.assertTrue(list(pids)==[str(pid)])
        
        action = r.get('%s:buysell:pid:%s:action' % (state.u, pid))
        self.assertTrue(action==state.bs['val']['action'])
        
        price = r.get('%s:buysell:pid:%s:price' % (state.u, pid))
        self.assertTrue(int(price)==state.bs['val']['price'])
        
        product = r.get('%s:buysell:pid:%s:product' % (state.u, pid))
        self.assertTrue(product==state.bs['val']['product'])
        
        products = r.smembers('buysell:product')
        self.assertTrue(list(products)==[state.bs['val']['product']])
        
        agents = r.smembers('buysell:product:%s:action:%s' % (product, action))
        self.assertTrue(list(agents)==[state.u])
        
        
    def test_delete_user(self):
        res = post({'secret':state.secret}, path='/%s'%state.u, method='DELETE')
        self.assertTrue(res['deleted'])
        self.assertFalse(r.sismember('users', state.u))
        
    
    #def test_post_profile(self):
        #params = [[state.p['key'],state.p['val']]]
        
        #keys = r.smembers('%s:profile:keys' % state.u)
        #self.assertTrue(list(keys)==[])
        
        #vals = r.smembers('%s:profile:key:%s' % (state.u, state.p['key']))
        #self.assertTrue(list(vals)==[])
        
        #agents = r.smembers('profile:key:%s' % state.p['key'])
        #self.assertTrue(list(agents)==[])
        
        #agents = r.smembers('profile:key:%s:val:%s' % (state.p['key'],state.p['val']))
        #self.assertTrue(list(agents)==[])
        
        
        #keys = r.zrevrangebyscore('profile:keyscores', '+inf', '-inf')
        #self.assertTrue(list(keys)==[])
        
        #score = r.zscore('profile:keyscores', state.p['key'])
        #self.assertTrue(score==None)
        
        #keys = r.zrevrangebyscore('profile:keyvalscores:%s' % state.p['key'], '+inf', '-inf')
        #self.assertTrue((list(keys)==[]))
        
        #score = r.zscore('profile:keyvalscores:%s' % state.p['key'], state.p['val'])
        #self.assertTrue(score==None)
        
        
    def notest_deleted_location(self):
        keys = r.smembers('%s:location:keys' % state.u)
        self.assertTrue(list(keys)==[])
        
        lat = r.get('%s:location:%s:lat' % (state.u, state.l['key']))
        self.assertTrue(lat==None)
        
        lon = r.get('%s:location:%s:lon' % (state.u, state.l['key']))
        self.assertTrue(lon==None)
        
        buckets = r.smembers('location:%s:buckets' % state.l['key'])
        self.assertTrue(list(buckets)==[])
        
        match = '%s %s' % (state.l['val']['lat'], state.l['val']['lon'])
        agents = r.smembers('location:%s:latlon:%s' % (state.l['key'], match))
        self.assertTrue(list(agents)==[])
        
        
    def notest_deleted_buysell(self):        
        pids = r.smembers('%s:buysell:pids' % state.u)
        self.assertTrue(list(pids)==[])
        
        pid = 1
        
        action = r.get('%s:buysell:pid:%s:action' % (state.u, pid))
        self.assertTrue(action==None)
        
        price = r.get('%s:buysell:pid:%s:price' % (state.u, pid))
        self.assertTrue(price==None)
        
        product = r.get('%s:buysell:pid:%s:product' % (state.u, pid))
        self.assertTrue(product==None)
        
        products = r.smembers('buysell:product')
        self.assertTrue(list(products)==[])
        
        agents = r.smembers('buysell:product:%s:action:%s' % (product, state.bs['val']['action']))
        self.assertTrue(list(agents)==[])
        





if __name__ == '__main__':
    unittest.main()

sys.exit()








#r.hset('monitor', 'agent2', 'red')
#a= r.hgetall('monitor')
#print a, type(a)

#sys.exit()

#if len(sys.argv) > 1:
    #r.flushall()
    #sys.exit()

print 'keyvalstore entries:'
for m in r.smembers('keyvalstore'):
    print m

print 'users:'
for u in r.smembers('users'):
    if u.startswith('agent'):
        continue
    
    print '===\nuser', u

    print 'profile:'
    for k in r.smembers('%s:profile:keys' % u):
        print '\tkey/val:', k,
    
        for v in r.smembers('%s:profile:key:%s' % (u, k)):
            print v,
        print
        
    print 'location:'
    for k in r.smembers('%s:location:keys' % u):
        print '\t', k, r.get('%s:location:%s:lat' % (u, k)), r.get('%s:location:%s:lon' % (u, k))
            
    print 'buysell:'
    for pid in r.smembers('%s:buysell:pids' % u):
        action = r.get('%s:buysell:pid:%s:action' % (u, pid))
        product = r.get('%s:buysell:pid:%s:descr' % (u, pid))
        price = r.get('%s:buysell:pid:%s:price' % (u, pid))
        print '\tpid:%s action:%s product:%s price:%s' % (pid, action, product, price)
        
print

sys.exit()

lat = float(r.get('asdf:location:current location:lat'))
lon = float(r.get('asdf:location:current location:lon'))

for u in r.smembers('users'):
    if u != 'asdf':
        testlat = float(r.get('%s:location:current location:lat' % u))
        testlon = float(r.get('%s:location:current location:lon' % u))
        
        latdiff = abs(lat-testlat)
        londiff = abs(lon-testlon)
        print (latdiff<=0.0002 and londiff<=0.0002), u, latdiff, londiff






