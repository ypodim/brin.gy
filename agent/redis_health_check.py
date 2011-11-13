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
#r.flushall()

class TestSequenceFunctions(unittest.TestCase):

    def setUp(self):
        self.seq = range(10)
        self.u = 'tester'
        self.p = dict(key='name', val='pol')
        
    def test_health(self):
        users = r.smembers('users')
        self.assertTrue(type(users)==set)
        
        for u in users:
            for k in r.smembers('%s:profile:keys' % (u)):
                l = len(r.smembers('%s:profile:key:%s' % (u,k)))
                self.assertTrue(l>0)
                

if __name__ == '__main__':
    #unittest.main()
    
    resolution = 100000
    key = 'my location'
    for b in r.smembers('location:%s:buckets' % (key)):
        lat, lon = b.split()
        for aid in r.smembers('location:%s:latlon:%s' % (key, b)):
            lat = float(lat)
            lon = float(lon)
            
            lattest = r.get('%s:location:%s:lat' % (aid, key))
            lontest = r.get('%s:location:%s:lon' % (aid, key))
            if lattest and lontest:
                lattest = float(lattest)
                lontest = float(lontest)
                lattest = 1.0*int(lattest * resolution)/resolution
                lontest = 1.0*int(lontest * resolution)/resolution
            
            if not (lat==lattest and lon==lontest):
                print aid, lat, lon
                print 'removed', r.srem('location:%s:latlon:%s' % (key, b), aid)
            
    sys.exit()
    users = r.smembers('users') 
    for u in users:   
        for k in r.smembers('%s:profile:keys' % (u)):
            l = len(r.smembers('%s:profile:key:%s' % (u,k)))
            if (l == 0):
                print 
                print 'problem with', u, k
                print r.smembers('profile:key:%s' % k)
                s = r.zrangebyscore('profile:keyscores', '-inf','+inf')
                print (k in s)
                s = r.zrangebyscore('profile:keyscores:%s' % k, '-inf','+inf')
                print (k in s)
                
                r.srem('%s:profile:keys' % u, k)
                
