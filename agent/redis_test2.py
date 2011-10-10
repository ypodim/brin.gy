import redis
import time
import sys

r = redis.Redis(host='localhost', port=6379, db=0)


#r.hset('monitor', 'agent2', 'red')
#a= r.hgetall('monitor')
#print a, type(a)

#sys.exit()

if len(sys.argv) > 1:
    r.flushall()
    sys.exit()

print 'keyvalstore entries:'
for m in r.smembers('keyvalstore'):
    print m

print 'users:'
for u in r.smembers('users'):
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






