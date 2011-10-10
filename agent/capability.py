# -*- coding: utf-8 -*-

import tornado.httpclient

import httplib2, thread, urllib
from datetime import datetime

CAP_INDEX = {}

class Cap:
    def __init__(self, name, usr, db):
        self.name = name
        self.user = usr['name']
        self.db   = db
        #caps = ['default','tags','profile','charms','location','friends','comments','events','statistics','anna','calendar','iptracker','avatar','registration']
        
        #self.cap_id = caps.index(name)
        
        if name not in CAP_INDEX:
            sql = 'select `id` from ego2_capability where `name`="%s"' % name
            cap_tuple = self.db.get(sql)
            cap_id = ''
            if cap_tuple:
                print '*** NEW CAP', self.db.get(sql).get('id')
                cap_id = cap_tuple.get('id')
                
            if not cap_id:
                sql = 'INSERT INTO ego2_capability (`id`, `name`) VALUES (NULL, "%s");' % (name)
                cap_id = self.db.execute(sql)
            
            CAP_INDEX[name] = cap_id
            
        self.cap_id = CAP_INDEX[name]
        self.usr_id = usr['id']
        
    def is_valid(self):
        cap = Capability.objects.filter(name=self.name)
        return len(cap) > 0
        
    def __str__(self):
        return name
        
    def __unicode__(self):
        return name
        
    # Save, Delete, Load
    def save(self, key, val, access='default', tstamp=None):
        if tstamp:
            res = self.load(key=key, val=val, tstamp=tstamp)
        else:
            res = self.load(key=key, val=val)
        if res:
            #print 'already in db:', res
            return res
        
        tstamp = tstamp or datetime.now()
        tstamp = str(tstamp).split('.')[0]
        
        key = key.replace("'", "''")
        val = val.replace("'", "''")
        sql  = "INSERT INTO ego2_data (`id`, `cap_id`,`usr_id`,`key`,`val`,`tstamp`)"
        sql += "VALUES                (NULL, '%s',    '%s',    '%s', '%s', '%s');"
        sql  = sql % (self.cap_id, self.usr_id, key, val, tstamp)
        #print sql
        dat = self.db.execute(sql)
        return dict(cap_id=self.cap_id, user=self.user, key=key, val=val, tstamp=tstamp)
        
    def remove(self, key, val, tstamp=None):
        print 'deleting', key, val, tstamp, '-'
        key = key.replace("'", "''")
        sql = "DELETE FROM `ego2_data` WHERE `cap_id`='%s' and `key`='%s'" % (self.cap_id, key)
        
        if val:
            val = val.replace("'", "''")
            sql += " and `val`='%s'" % val
        
        #sql = 'DELETE FROM `ego2_data` WHERE `key`="%s" and `val`="%s"' % (key,val)
        if tstamp:
            tstamp = str(tstamp).split('.')[0]
            sql += ' and `tstamp`="%s"' % tstamp
        dat = self.db.execute(sql)
        return dict(cap_id=self.cap_id, user=self.user, key=key, val=val, tstamp=tstamp)
        
    def load(self, key='', val='', tstamp=None):
        key = key.replace("'", "''")
        val = val.replace("'", "''")
        sql = 'select * from ego2_data where'
        sql           += "     `usr_id`='%s'" % self.usr_id
        sql           += " and `cap_id`='%s'" % self.cap_id
        if key:    sql+= " and `key`   ='%s'" % key
        if val:    sql+= " and `val`   ='%s'" % val
        if tstamp: sql+= " and `tstamp`='%s'" % tstamp
        #print '\nload:\n%s\n' % sql
        return self.db.query(sql)
        
    def handle_request(self, method, request_url, requester, params):
        return {'error':'handle_request method not implemented'}

    def set_access(self, data, who):
        acc, created = Access.objects.get_or_create(dat=data, who=who)
        
    def subscribe_to_output(self):
        pass
    
    
