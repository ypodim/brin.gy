# -*- coding: utf-8 -*-
import redis
import time
import sys
import random
import json
from collections import defaultdict

r = redis.Redis(host='localhost', port=6379, db=0)
text = ''

keyscores = r.zrevrangebyscore('profile:keyscores', '+inf', '-inf', withscores=True)
for key, score in keyscores:
    zkey = 'profile:keyvalscores:%s' % key
    for v, score in r.zrevrangebyscore(zkey, '+inf', '-inf', withscores=True):
        s = ('%s' % v).replace(' ','')
        #s = '"%s"' % v
        
        text += int(score) * ('%s ' % s)
print text


print


for cap in ['profile','location']:
    churn = ''
    for key in r.smembers('churn:%s:keys' % cap):
        for v in r.smembers('churn:%s:%s:vals' % (cap, key)):
            add = r.get('churn:%s:%s:%s:add' % (cap, key, v)) or 0
            rem = r.get('churn:%s:%s:%s:rem' % (cap, key, v)) or 0
            
            if len(v) > 50:
                continue
            
            #s = ('%s' % v).replace(' ','')
            if add:
                churn += '%s:%s:008000\n' % (v, int(add))
            if rem:
                churn += '%s:%s:FF0000\n' % (v, int(rem))
            
    print churn

print

nokia = ''
count = defaultdict(int)
for u in ['kellyfj','LordGro','bkizzy','drink','m']:
    for k in r.smembers('%s:profile:keys' % u):
        for v in r.smembers('%s:profile:key:%s' % (u,k)):
            count[v] += 1

for k,v in count.items():
    nokia += '%s:%s:6495ED\n' % (k, int(v))
print nokia
print len(count)

