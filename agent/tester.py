import httplib2
import urllib
import random
import json
import time
import sys

h = httplib2.Http()

def post(dic):
    headers = {}
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    uri = "http://localhost:10002/asdf/location"
    resp, content = h.request(uri, "POST", headers=headers, body=urllib.urlencode(dic))
    return content

pos1 = dict(data=json.dumps({'current location': dict(lat=42.3616, lon=-71.0841)}.items()))
pos2 = dict(data=json.dumps({'current location': dict(lat=42.3616, lon=-71.0838)}.items()))

while 1:
    print post(pos1)
    time.sleep(2)
    print post(pos2)
    time.sleep(2)



