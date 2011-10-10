# -*- coding: utf-8 -*-
from capability import *
from datetime import datetime, timedelta
from api import cache
import tornado.escape

class gametracker(Cap):
    def __init__(self, usr, parameters, db, on_response):
        self.on_response = on_response
        self.parameters = parameters
        name = __name__.split('.')[-1]
        Cap.__init__(self, name, usr, db)
        
    def get(self):
        json = dict(json=[])
        for entry in self.load():
            json['json'].append( (entry['key'], entry['val']) )
        self.on_response(json)
    
    def delete(self):
        params = self.parameters.get('params')
        items = params.get('json', "[]")
        
        items = tornado.escape.url_unescape(items)
        items = tornado.escape.json_decode(items)
        
        for item in items:
            print 'deleting', item, type(item), items, type(items)
            k, v = item
            print 'deleting', k, v
            self.remove('%s'%k, '%s'%v)
            
        res = {}
        return res
        
    def post(self):
        params = self.parameters.get('params')
        items = params.get('json', "[]")
        
        items = tornado.escape.url_unescape(items)
        items = tornado.escape.json_decode(items)
        
        for item in items:
            k, v = item
            print 'saving', k, v
            self.save('%s'%k, '%s'%v)
        
        res = {}
        return res
        