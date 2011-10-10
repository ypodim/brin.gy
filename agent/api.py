# -*- coding: utf-8 -*-
# ===============================================
#
#   Ego
#   Polychronis Ypodimatopoulos
#   Media Lab
#   2010
#
# ===============================================

import tornado.httpclient
import tornado.web

import time, httplib2, random, hashlib, memcache, os, ConfigParser
from datetime import datetime, timedelta

from urllib import quote
from string import lower

PROFILE_CAP = 2
#CHARMS_CAP = 3
LOCATION_CAP = 4
#EVENTS_CAP = 7

DEFAULT_USER_PICTURE_URL    = 'http://pldb.media.mit.edu/research/images/nophoto.gif'
DEFAULT_PROJECT_PICTURE_URL = ''
DB_USER = 'ego'
DB_PASS = 'Pmt,MBakaYP'
DB_MYSQL_SERVER = 'sql.media.mit.edu'

configfile = 'ego.conf'

cache = memcache.Client(['127.0.0.1:11211'], debug=0)



config = ConfigParser.ConfigParser()
if os.path.isfile(configfile):
    config.read([configfile])
    for item, value in config.items('main'):
        if item in ('debug'):    debug  = int(value)
        if item in ('server'):   server = value
        if item in ('port'):     port   = int(value)
        if item in ('auth'):     password = value

    if config.has_section('calibration'):
        for item, value in config.items('calibration'):
            if item in ('offsetx'):    offsetX  = int(value)
            if item in ('offsety'):    offsetY  = int(value)



def debug(s):
    print s
    

def get_usr_obj(username, db):
    label = str('usr_obj_%s' % username)
    usr = cache.get(label)
    if not usr:
        usr = db.get('select * from ego2_user where name="%s"' % username)
        if usr:
            cache.set(label, usr, 30)
    return usr


def create_user(user_name, db):
    usr = get_usr_obj(user_name, db)
    
    if usr:
        return usr['id'], False
    else:
        sql  = 'INSERT INTO ego2_user (`id`, `name`) '
        sql += 'VALUES                (NULL, "%s");' % user_name
        usr_id = db.execute(sql)
        
        return usr_id, True
        
        
###############  utils

class Async_profile:
    def __init__(self, username, use_cache=True, create_user=False, callback=None, db=None):
        self.username = username
        self.use_cache = use_cache
        self.callback = callback
        self.create_user = create_user
        self.db = db
        self.cache_key = str('profile-%s' % self.username)
        
    def lookup_user_in_ml_databases(self):
        """
        HTTP Call: Looks up a username against MLdir and SPM. Returns user's profile, if it exists.\n
        Params: *username*, *use_cache (optional)*
        """
        
        profile = cache.get(self.cache_key)
        if profile and self.use_cache and self.callback:
            #print 'used cache', profile
            self.callback(profile)
        else:
            print 'did not use cache', profile
            url = 'http://data.media.mit.edu/people/json/?filter=(cn=%s)' % self.username
            if '@' in self.username:
                url = 'http://data.media.mit.edu/spm/contacts/json?username=%s' % self.username
            
            print 'looking up %s at %s' % (self.username, url)
            
            http = tornado.httpclient.AsyncHTTPClient()
            http.fetch(url, callback=self.remote_profile_clb)
        
        #print 'finished looking up'
        
    def remote_profile_clb(self, response):
        
        if response.error:
            raise tornado.web.HTTPError(500)
        
        clean_content = ''
        
        b1 = 0
        b2 = 0
        for c in response.body:
            if ord(c) >= 32 and ord(c) <= 126:
                clean_content += c
            else:
                if b1: b2 = ord(c)
                else:  b1 = ord(c)
                if b1==195 and b2==169:
                    clean_content += 'e'
                    b1=b2=0
                if b1==233 and b2==146:
                    clean_content += 'e'
                    b1=b2=0
                if b1==146 and b2==146:
                    clean_content += "'"
                    b1=b2=0
                    
        profile = tornado.escape.json_decode(clean_content)
        if profile:
            profile = profile['profile']
        else:
            if self.callback: self.callback({})
            return
        
        user_type = 'guest'
        if 'sponsor' in profile and profile['sponsor'].lower() == 'yes':
            user_type = 'sponsor'
        if 'prospect' in profile and profile['prospect'].lower() == 'yes':
            user_type = 'prospect'
        if 'keywords' in profile and 'Press' in profile['keywords']:
            user_type = 'press'
        
        if 'student' in profile and profile['student'].lower() == 'yes':
            user_type = 'student'
        elif 'pi' in profile and profile['pi'].lower() == 'yes':
            user_type = 'faculty'
        elif 'employee' in profile and profile['employee'].lower() == 'yes':
            user_type = 'staff'
        
        if 'user_type' in profile and profile['user_type'].lower() != '<not set>':
            user_type = profile['user_type']
        
        usr_id = None
        if profile:
            #if user_type in ['guest', '<not set>']:
                #problem = 'lookup user type: I tried %s and got from:\n%s' % (self.username, profile)
                #debug(problem)
            #else:
            profile['user_type'] = user_type
            
            if self.create_user and not self.use_cache:
                usr_id, created = create_user_with_profile(profile, self.db)
        
        if profile and usr_id:
            profile['id'] = usr_id
        
        if self.callback:
            day = 24 * 3600
            cache.set(self.cache_key, profile, day)
            self.callback(profile)
            
        

