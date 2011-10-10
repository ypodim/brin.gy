import httplib2
import urllib
import random
import json
import time
import sys

h = httplib2.Http()

def post(url_suffix, data):
    uri = "http://localhost:22222/%s" % url_suffix
    resp, content = h.request(uri, "POST", body=urllib.urlencode(data))
    res = json.loads(content)
    if res['error']:
        print res['error']
    return res

#print post(10,   'buysell', dict(itemid='item', action='buy', price=10))
#print post(10,   'profile', dict(itemid='item', action='buy', price=10))

post()

sys.exit()

N = 1000
threshold=10
lat = []
lon = []
for i in xrange(N):
    lat.append( 70 + random.random()*20 )
    lon.append( 20 + random.random()*20 )
lastpost = 0

while 1:
    agents = {}
    for i in xrange(N):
        agent = 'agent%s'%i
        dic = dict(agent=agent, signature='nosign', lat=lat[i], lon=lon[i], threshold=0)
        
        #if i==0:
            #dic['threshold'] = threshold
        agents[agent] = dic
    
    start = time.time()
    res = post('location', dict(agents=json.dumps(agents)))
    res['response_time'], time.time()-start
    
    print lat[0]-threshold, lat[0]+threshold, lon[0]-threshold, lon[0]+threshold
    print [(lat[int(x[5:])],lon[int(x[5:])]) for x in res['agents']['agent0']['moved']]
    print
    
    if time.time() - lastpost < 0.1:
        time.sleep(0.1)
        pass
    lastpost = time.time()

