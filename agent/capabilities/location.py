# -*- coding: utf-8 -*-
import tornado.escape

from datetime import datetime, timedelta
from urllib import urlencode

class location():
    def __init__(self, usr, arguments, db, finish):
        self.db = db
        self.finish = finish
        self.arguments = arguments
        self.cap = __name__.split('.')[-1]
        self.usr = usr
        self.resolution = 100000
    
    'location:LOCTYPE:allusers' # set of all users sharing a location
    'location:LOCTYPE:buckets' # set of buckets keyed on location types (eg "current location")
    'location:LOCTYPE:latlon:BUCKET' # set of agents in BUCKET area for this LOCTYPE
    
    'USER:location:keys' # set of available location types (eg "current location") that USER participates in
    'USER:location:LOCTYPE:lat' # lat value for USER's position and LOCTYPE
    'USER:location:LOCTYPE:lon' # lon value for USER's position and LOCTYPE
    
    def add_reverse(self, key, lat, lon):
        lat = float(lat)
        lon = float(lon)
        
        latbucket = 1.0 * int(lat * self.resolution) / self.resolution
        lonbucket = 1.0 * int(lon * self.resolution) / self.resolution

        bucket = '%s %s' % (latbucket, lonbucket)
        self.db.sadd('location:%s:buckets' % key, bucket)
        self.db.sadd('location:%s:latlon:%s' % (key, bucket), self.usr)
        
    
    def del_reverse(self, key, lat, lon):
        lat = float(lat)
        lon = float(lon)
        
        latbucket = 1.0 * int(lat * self.resolution) / self.resolution
        lonbucket = 1.0 * int(lon * self.resolution) / self.resolution

        bucket = '%s %s' % (latbucket, lonbucket)
        self.db.srem('location:%s:latlon:%s' % (key, bucket), self.usr)
        if not len(self.db.smembers('location:%s:latlon:%s' % (key, bucket))):
            self.db.srem('location:%s:buckets' % key, lonbucket)
        
    def add_key(self, key):
        return self.db.sadd('%s:location:keys' % self.usr, key)
    
    def del_key(self, key):
        return self.db.srem('%s:location:keys' % self.usr, key)
        
    def get_keys(self):
        return self.db.smembers('%s:location:keys' % self.usr)
        
    def get_location(self, key):
        lat = self.db.get('%s:location:%s:lat' % (self.usr, key))
        lon = self.db.get('%s:location:%s:lon' % (self.usr, key))
        if lat and lon:
            return dict(lat=lat, lon=lon)
        else:
            return {}
    
    def set_location(self, key, lat, lon):
        oldlat = self.db.getset('%s:location:%s:lat' % (self.usr, key), lat)
        oldlon = self.db.getset('%s:location:%s:lon' % (self.usr, key), lon)
        
        return oldlat, oldlon
        
    def del_location(self, key):
        self.db.delete('%s:location:%s:lat' % (self.usr, key))
        self.db.delete('%s:location:%s:lon' % (self.usr, key))
      
    def delete_entry(self, key, lat, lon):
        #remove location from reverse entries
        self.del_reverse(key, lat, lon)
        
        #remove location from main store
        self.del_location(key)
        
        # remove agent from set of agents under this key
        self.db.srem('location:%s:allusers' % key, self.usr)
        
        #remove key from list of keys
        # ALERT: if you're gonna uncomment the following del_key, make sure you check
        #that the key is not being used before deleting it
        #self.del_key(key)
    
    def clear_all(self):
        for key in self.get_keys() or []:
            dic = self.get_location(key)
            self.delete_entry(key, dic['lat'], dic['lon'])
            
    def get(self):
        saved_items = {}
        #print 'keys', self.get_keys()
        
        for key in self.get_keys() or []:
            dic = self.get_location(key)
            
            if dic:
                saved_items[key] = dic
            
        res = {'data':saved_items}
        self.finish(res)
            
    def post(self):
        #print 'location post arguments:', self.arguments
        for key, valstr in self.arguments:
            val = tornado.escape.json_decode(valstr)
            #print val, type(val)
            lat = float(val['lat'])
            lon = float(val['lon'])
            
            # possible keys: "current location", "destination", etc
            oldlat, oldlon = self.set_location(key, lat, lon)
            
            # handle reverse entries for the satellite
            if oldlat and oldlon:
                self.del_reverse(key, oldlat, oldlon)
            else:
                print 'will add', self.usr
                self.db.sadd('location:%s:allusers' % key, self.usr)
                print self.db.scard('location:%s:allusers' % key)
                
            self.add_reverse(key, lat, lon)
            
            self.add_key(key)
            #self.usr, self.get_location(key)
            
        return {'result':'', 'data':self.arguments, 'error':''}
    
    def delete(self):
        error = ''
        for key, valstr in self.arguments:
            val = tornado.escape.json_decode(valstr)
            #print 'deleting location', key, val, type(val)
            lat = val['lat']
            lon = val['lon']
            
            self.delete_entry(key, lat, lon)
                
        return dict(error=error)
    
    
    
    