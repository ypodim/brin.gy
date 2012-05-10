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
import profile

h = httplib2.Http()

def post(dic, path='', method='POST', url='http://localhost:10007'):
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    body = urllib.urlencode(dic)
    uri = '%s%s'%(url,path)
    resp, content = h.request(uri, method, headers=headers, body=body)
    return json.loads(content)


r = redis.Redis(host='localhost', port=6379, db=0)
#r.flushall()

# for c in r.smembers('contexts'):
#     for u in r.smembers('context:%s' % c):
#         print r.sadd('context:users:%s' % c, u), c, u

def users():
    return r.smembers('users')
def ukeys(username):
    return r.smembers('%s:profile:keys' % username)
def uvals(username, key):
    return r.smembers('%s:profile:key:%s' % (username,key))


def keys():
    return r.zrevrangebyscore('profile:all:keys', '+inf', '-inf')
def vals(key):
    return r.zrevrangebyscore('profile:all:key:%s:values' % key, '+inf', '-inf', withscores=True)
def revkey(key):
    return r.smembers('profile:all:key:%s:agents' % key)
def revkeyval(key, val):
    return r.smembers('profile:all:key:%s:val:%s:agents' % (key, val))


def clb(arg):
    print arg['data']

def ignite():
    cntx = 'Ignite Boston 9'
    dscr = 'O\'Reilly Ignite Boston 9 event, at MIT Media Lab, 03/29/2012'
    r.set('context:description:%s' % cntx, dscr)

kBuckets = {}
vBuckets = {}
actualUsers = {}
nonUniqueVals = 0
uniqueVals = {}
revkvBuckets = {}

for u in users():
    if ukeys(u):
        if u not in ['ypodim']:
            totvals = 0
            
            klen = len(ukeys(u))
            if klen not in kBuckets:
                kBuckets[klen] = 0
            kBuckets[klen] += 1

            for k in ukeys(u):    
                totvals += len(uvals(u, k))
                for v in uvals(u, k):
                    uniqueVals[k+v] = 1

            nonUniqueVals += totvals

            if totvals not in vBuckets:
                vBuckets[totvals] = 0
            vBuckets[totvals] += 1

            actualUsers[u] = [klen, totvals]

kvratioBuckets = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0, 10:0}
print len(users()), len(actualUsers), nonUniqueVals, len(uniqueVals)
for u in actualUsers:
    kvratio = 1.0*actualUsers[u][0]/actualUsers[u][1]
    kvrBucket = int(kvratio*10)
    kvratioBuckets[kvrBucket] += 1

    # print u, actualUsers[u], kvratio

simpleFormat = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

scale = 2
data = ''
for b in kvratioBuckets:
    data += simpleFormat[kvratioBuckets[b]*scale]


for k in keys():
    for v, score in vals(k):
        score = int(score)
        # revkv = len(revkeyval(k, v))
        if score not in revkvBuckets:
            revkvBuckets[score] = 0
        revkvBuckets[score] += 1



from GChartWrapper import *
G = Line(data, encoding='simple')
G.size(600,300)
G.axes('xy')
G.axes.label(0, '0','0.1','0.2','0.3','0.4','0.5','0.6','0.7','0.8','0.9','1.0')
G.axes.range(1, 0, 100/scale)
G.grid(20,20)
# G.axes.label(1, None, '50 Kb')
print G.url
G.show()


data1 = []
data2 = []
data3 = []
scale = 4
scale2=0.8
maxkeys = max(kBuckets.keys())
maxvals = max(vBuckets.keys())
maxrevkv = max(revkvBuckets.keys())
print maxkeys+1, maxvals+1, maxrevkv+1
print revkvBuckets

for i in xrange(1, maxkeys+1):
    data1.append(kBuckets.get(i,0)*scale)
for i in xrange(1, maxvals+1):
    data2.append(vBuckets.get(i,0)*scale)
for i in xrange(1, maxrevkv+1):
    data3.append(revkvBuckets.get(i,0)*scale2)


data = [data1, data2]

G = Line(data1)
G.size(600,300)
G.axes('xy')
G.axes.label(0, '0',maxkeys/5,2*maxkeys/5,3*maxkeys/5,4*maxkeys/5,5*maxkeys/5)
G.axes.range(1, 0, 100/scale)
G.grid(20,20)
G.show()

G = Line(data2)
G.size(600,300)
G.axes('xy')
G.axes.label(0, '0',maxvals/5,2*maxvals/5,3*maxvals/5,4*maxvals/5,5*maxvals/5)
G.axes.range(1, 0, 100/scale)
G.grid(20,20)
G.show()


G = Line(data3)
G.size(600,300)
G.axes('xy')
G.axes.label(0, '0',maxrevkv/5,2*maxrevkv/5,3*maxrevkv/5,4*maxrevkv/5,5*maxrevkv/5)
G.axes.range(1, 0, 100/scale2)
G.grid(20,20)
G.show()




sys.exit()

print r.smembers('context:users:%s' % cntx)
for u in users():
    if u in ['ValenciaTrujillo', 'julie.valastyan', 'Bettina', 'appnik']:
        continue

    # p = profile.profile(u, [], [''], r, clb)
    # p.leave_context(cntx)

    kvlist = []
    for k in ukeys(u):
        for v in uvals(u,k):
            if not k:
                print cntx, u, v, 'but no KEY', len(k)
            if not v:
                print cntx, u, k, 'but no VAL', len(v)

            kvlist.append([k,v])

    p = profile.profile(u, kvlist, [''], r, clb)
    print 'post', u, len(kvlist)
    if kvlist:
        p.post(cntx)

sys.exit()

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






