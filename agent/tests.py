# -*- coding: utf-8 -*-
import redis
import time
import sys
import random
import unittest
import httplib2
import urllib
import json

h = httplib2.Http()

def post(dic, path='', method='POST', url='http://localhost:10007'):
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    body = urllib.urlencode(dic)
    uri = '%s%s'%(url,path)
    resp, content = h.request(uri, method, headers=headers, body=body)
    return json.loads(content)


r = redis.Redis(host='localhost', port=6379, db=0)
r.flushall()

class TestSequenceFunctions(unittest.TestCase):

    def setUp(self):
        self.seq = range(10)
        self.u = 'tester'
        self.p = dict(key='name', val='pol')
        
        lat = 10.01
        lon = 20.02
        self.l = dict(key='current location', val=dict(lat=lat,lon=lon))
        
        self.bs = dict(key='', val=dict(action='buy',price=300,product='ipad'))
        
    def test_create_user(self):
        res = post(dict(username=self.u))
        self.assertTrue(res['created'])
        self.assertTrue(r.sismember('users', self.u))
    
    def test_post_profile(self):
        params = [[self.p['key'],self.p['val']]]
        
        body = dict(data=json.dumps(params))
        res = post(body, path='/%s/profile'%self.u)
        self.assertTrue(res['result']=='')
        
        keys = r.smembers('%s:profile:keys' % self.u)
        self.assertTrue(list(keys)==[self.p['key']])
        
        vals = r.smembers('%s:profile:key:%s' % (self.u, self.p['key']))
        self.assertTrue(list(vals)==[self.p['val']])
        
        agents = r.smembers('profile:key:%s' % self.p['key'])
        self.assertTrue(list(agents)==[self.u])
        
        agents = r.smembers('profile:key:%s:val:%s' % (self.p['key'],self.p['val']))
        self.assertTrue(list(agents)==[self.u])
        
        
        
        keys = r.zrevrangebyscore('profile:keyscores', '+inf', '-inf')
        self.assertTrue(list(keys)==[self.p['key']])
        
        score = r.zscore('profile:keyscores', self.p['key'])
        self.assertTrue(score==1)
        
        keys = r.zrevrangebyscore('profile:keyvalscores:%s' % self.p['key'], '+inf', '-inf')
        self.assertTrue((list(keys)==[self.p['val']]))
        
        score = r.zscore('profile:keyvalscores:%s' % self.p['key'], self.p['val'])
        self.assertTrue(score==1)
        
        
    def test_post_location(self):
        params = [[self.l['key'],self.l['val']]]
        
        body = dict(data=json.dumps(params))
        res = post(body, path='/%s/location'%self.u)
        self.assertTrue(res['result']=='')
        
        keys = r.smembers('%s:location:keys' % self.u)
        self.assertTrue(list(keys)==[self.l['key']])
        
        lat = r.get('%s:location:%s:lat' % (self.u, self.l['key']))
        self.assertTrue(float(lat)==self.l['val']['lat'])
        
        lon = r.get('%s:location:%s:lon' % (self.u, self.l['key']))
        self.assertTrue(float(lon)==self.l['val']['lon'])
        
        buckets = r.smembers('location:%s:buckets' % self.l['key'])
        match = '%s %s' % (self.l['val']['lat'], self.l['val']['lon'])
        self.assertTrue(list(buckets)==[match])
        
        agents = r.smembers('location:%s:latlon:%s' % (self.l['key'], match))
        self.assertTrue(list(agents)==[self.u])
        
        
    def test_post_buysell(self):
        params = [[self.bs['key'],json.dumps(self.bs['val'])]]
        
        body = dict(data=json.dumps(params))
        res = post(body, path='/%s/buysell'%self.u)
        pid = res['result']['key']
        self.assertTrue(pid==1)
        
        pids = r.smembers('%s:buysell:pids' % self.u)
        self.assertTrue(list(pids)==[str(pid)])
        
        action = r.get('%s:buysell:pid:%s:action' % (self.u, pid))
        self.assertTrue(action==self.bs['val']['action'])
        
        price = r.get('%s:buysell:pid:%s:price' % (self.u, pid))
        self.assertTrue(int(price)==self.bs['val']['price'])
        
        product = r.get('%s:buysell:pid:%s:product' % (self.u, pid))
        self.assertTrue(product==self.bs['val']['product'])
        
        products = r.smembers('buysell:product')
        self.assertTrue(list(products)==[self.bs['val']['product']])
        
        agents = r.smembers('buysell:product:%s:action:%s' % (product, action))
        self.assertTrue(list(agents)==[self.u])
        
        
    def test_delete_user(self):
        res = post({}, path='/%s'%self.u, method='DELETE')
        self.assertTrue(res['deleted'])
        self.assertTrue(r.smembers('users')==set([]))
        
    
    def test_post_profile(self):
        params = [[self.p['key'],self.p['val']]]
        
        keys = r.smembers('%s:profile:keys' % self.u)
        self.assertTrue(list(keys)==[])
        
        vals = r.smembers('%s:profile:key:%s' % (self.u, self.p['key']))
        self.assertTrue(list(vals)==[])
        
        agents = r.smembers('profile:key:%s' % self.p['key'])
        self.assertTrue(list(agents)==[])
        
        agents = r.smembers('profile:key:%s:val:%s' % (self.p['key'],self.p['val']))
        self.assertTrue(list(agents)==[])
        
        
        keys = r.zrevrangebyscore('profile:keyscores', '+inf', '-inf')
        self.assertTrue(list(keys)==[])
        
        score = r.zscore('profile:keyscores', self.p['key'])
        self.assertTrue(score==None)
        
        keys = r.zrevrangebyscore('profile:keyvalscores:%s' % self.p['key'], '+inf', '-inf')
        self.assertTrue((list(keys)==[]))
        
        score = r.zscore('profile:keyvalscores:%s' % self.p['key'], self.p['val'])
        self.assertTrue(score==None)
        
        
    def test_deleted_location(self):
        keys = r.smembers('%s:location:keys' % self.u)
        self.assertTrue(list(keys)==[])
        
        lat = r.get('%s:location:%s:lat' % (self.u, self.l['key']))
        self.assertTrue(lat==None)
        
        lon = r.get('%s:location:%s:lon' % (self.u, self.l['key']))
        self.assertTrue(lon==None)
        
        buckets = r.smembers('location:%s:buckets' % self.l['key'])
        self.assertTrue(list(buckets)==[])
        
        match = '%s %s' % (self.l['val']['lat'], self.l['val']['lon'])
        agents = r.smembers('location:%s:latlon:%s' % (self.l['key'], match))
        self.assertTrue(list(agents)==[])
        
        
    def test_deleted_buysell(self):        
        pids = r.smembers('%s:buysell:pids' % self.u)
        self.assertTrue(list(pids)==[])
        
        pid = 1
        
        action = r.get('%s:buysell:pid:%s:action' % (self.u, pid))
        self.assertTrue(action==None)
        
        price = r.get('%s:buysell:pid:%s:price' % (self.u, pid))
        self.assertTrue(price==None)
        
        product = r.get('%s:buysell:pid:%s:product' % (self.u, pid))
        self.assertTrue(product==None)
        
        products = r.smembers('buysell:product')
        self.assertTrue(list(products)==[])
        
        agents = r.smembers('buysell:product:%s:action:%s' % (product, self.bs['val']['action']))
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






