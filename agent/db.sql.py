# -*- coding: utf-8 -*-
import sys, os, time
from datetime import datetime

from api import DB_USER, DB_PASS, DB_MYSQL_SERVER

db = None

class DB:
    def __init__(self, dbtype):
        self.dbtype = dbtype
        self.db = None
        self.keys = ['settings','profile','charms','location','friends','comments','events','statistics','miralax','calendar','iptracker','avatar','registration']
        
        if self.dbtype == 'mysql':
            import tornado.database
            self.db = tornado.database.Connection(DB_MYSQL_SERVER, 'ego', user=DB_USER, password=DB_PASS)
        elif self.dbtype == 'sqlite3':
            import sqlite3
            #self.conn = sqlite3.connect('ego.db')
            self.conn = sqlite3.connect(':memory:')
            self.db   = self.conn.cursor()
        else:
            print '*** invalid db type: %s' % self.dbtype
            sys.exit()
    
        try:
            self.execute('select count(id) from ego2_user')
            self.execute('select count(id) from ego2_capability')
            self.execute('select count(id) from ego2_data')
        except Exception, e:
            if str(e).startswith('no such table') and self.dbtype == 'sqlite3':
                self.setup()
            
        
    def setup(self):
        q = "CREATE TABLE `ego2_capability` ("
        q+= "`id` INTEGER PRIMARY KEY AUTOINCREMENT,"
        q+= "`name` varchar(100) NOT NULL"
        q+= ")"
        self.execute(q)
        
        for key in self.keys:
            q = "INSERT INTO `ego2_capability` (`id`,`name`) VALUES (%d,'%s');"
            q = q % (self.keys.index(key)+1, key)
            self.execute(q)

        q = "CREATE TABLE `ego2_data` ("
        q+= "`id` INTEGER PRIMARY KEY AUTOINCREMENT,"
        q+= "`cap_id` int(11) NOT NULL,"
        q+= "`usr_id` int(11) NOT NULL,"
        q+= "`key` varchar(1000) NOT NULL,"
        q+= "`val` varchar(1000) NOT NULL,"
        q+= "`tstamp` datetime NOT NULL"
        q+= ")"
        self.execute(q)

        q = "CREATE TABLE `ego2_user` ("
        q+= "`id` INTEGER PRIMARY KEY AUTOINCREMENT,"
        q+= "`name` varchar(100) NOT NULL"
        q+= ")"
        self.execute(q)
        
    def query(self, q):
        return eval('self.query_%s' % self.dbtype)(q)
    def execute(self, q):
        return eval('self.execute_%s' % self.dbtype)(q)
    def get(self, q):
        res = eval('self.get_%s' % self.dbtype)(q)
        #print '****res (%s): %s' % (self.dbtype, res)
        return res
    
    def query_mysql(self, q):
        return self.db.query(q)
    def execute_mysql(self, q):
        return self.db.execute(q)
    def get_mysql(self, q):
        return self.db.get(q)
        
    def query_sqlite3(self, q):
        self.db.execute(q)
        self.conn.commit()
        return self.db.fetchall()
    def execute_sqlite3(self, q):
        res = self.db.execute(q)
        self.conn.commit()
        return res
    def get_sqlite3(self, q):
        self.db.execute(q)
        self.conn.commit()
        dat = self.db.fetchone()
        res = {}
        if not dat: return res
        
        for i in xrange(len(self.db.description)):
            fnam = self.db.description[i][0]
            fval = dat[i]
            res[fnam] = fval
        return res
    
    def close(self):
        if self.dbtype == 'mysql':
            self.db.close()
        if self.dbtype == 'sqlite3':
            self.conn.close()
        
    def loadall(self, cap):
        sql = 'select * from ego2_data, ego2_capability, ego2_user '
        sql+= 'where ego2_data.cap_id="%s" ' % (self.keys.index(cap)+1)
        sql+= '  and ego2_data.cap_id=ego2_capability.id '
        sql+= '  and ego2_data.usr_id=ego2_user.id; ' 
        #print sql
        return self.query(sql)


