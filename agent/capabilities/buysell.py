# -*- coding: utf-8 -*-
import tornado.escape
import tornado.httpclient

from urllib import urlencode

class buysell():
    def __init__(self, usr, arguments, path, db, finish):
        self.db = db
        self.finish = finish
        self.arguments = arguments
        self.cap = __name__.split('.')[-1]
        self.usr = usr
        
    def clb(self, response):
        if response.code != 200:
            print response.code, response.error
    
    'buysell:product' # set of all product descriptions in use
    'buysell:product:PRODUCT:action:ACTION' # set of agents under product description and actions
    
    'USER:buysell:pids' # set of pids
    'USER:buysell:pid:PID:action' # val
    'USER:buysell:pid:PID:price' # val
    'USER:buysell:pid:PID:product' # val
    
    def add_reverse(self, product, action):
        self.db.sadd('buysell:product', product)
        self.db.sadd('buysell:product:%s:action:%s' % (product, action), self.usr)
        
    def del_reverse(self, product, action):
        self.db.srem('buysell:product:%s:action:%s' % (product, action), self.usr)
        #if not self.db.scard('buysell:product:%s:action:%s' % (product, action)):
            #self.db.srem('buysell:product', product)
    
    def get_reverse(self, product, action):
        return self.db.scard('buysell:product:%s:action:%s' % (product, action))
    
    def generate_pid(self):
        error = ''
        for pid in xrange(1, 100000):
            if not self.db.sismember('%s:buysell:pids' % self.usr, pid):
                return pid, error

        error = 'Could not create new pid. Too many products already?'
        return -1, error
    
    def clear_all(self):
        for pid in self.get_pids():
            action = self.db.get('%s:buysell:pid:%s:action' % (self.usr, pid))
            product = self.db.get('%s:buysell:pid:%s:product' % (self.usr, pid))
            self.del_reverse(product, action)
            self.del_product(pid)
            self.del_pid(pid)
            
    def get_pids(self):
        return self.db.smembers('%s:buysell:pids' % self.usr)
    
    def add_pid(self, pid):
        return self.db.sadd('%s:buysell:pids' % self.usr, pid)
                
    def del_pid(self, pid):
        return self.db.srem('%s:buysell:pids' % self.usr, pid)
    
    def get_product(self, pid):
        action = self.db.get('%s:buysell:pid:%s:action' % (self.usr, pid))
        price = self.db.get('%s:buysell:pid:%s:price' % (self.usr, pid))
        product = self.db.get('%s:buysell:pid:%s:product' % (self.usr, pid))
        key = pid
        val = dict(action=action, price=price, product=product)
        return dict(key=key, val=tornado.escape.json_encode(val))
        
    def set_product(self, pid, action, product, price):
        # pid might be empty (new entry), in which case it should not be 
        # found in the pids set and added.
        error = ''
        if not self.db.sismember('%s:buysell:pids' % self.usr, pid):
            pid, error = self.generate_pid()
            
        if not error and pid > 0:
            self.add_pid(pid)
            self.db.set('%s:buysell:pid:%s:action' % (self.usr, pid), action)
            self.db.set('%s:buysell:pid:%s:price' % (self.usr, pid), price)
            self.db.set('%s:buysell:pid:%s:product' % (self.usr, pid), product)
        
        val = dict(action=action, price=price, product=product)
        return dict(key=pid, val=tornado.escape.json_encode(val), error=error)
        
    def del_product(self, pid):
        error = 'pid %s not found' % pid
        if self.db.sismember('%s:buysell:pids' % self.usr, pid):
            self.del_pid(pid)
            self.db.delete('%s:buysell:pid:%s:action' % (self.usr, pid))
            self.db.delete('%s:buysell:pid:%s:price' % (self.usr, pid))
            self.db.delete('%s:buysell:pid:%s:product' % (self.usr, pid))
            error = ''
        return error
        
    def get(self):
        saved_items = []
        for pid in self.get_pids():
            dic = self.get_product(pid)
            saved_items.append(dic)
        
        res = {'data':saved_items}
        self.finish( res )
    
    def delete(self):
        error = ''
        for key, val in self.arguments:
            print 'deleting', key
            if key:
                error = self.del_product(key)
                
                action = self.db.get('%s:buysell:pid:%s:action' % (self.usr, key))
                product = self.db.get('%s:buysell:pid:%s:product' % (self.usr, key))
                self.del_reverse(product, action)
            else:
                error = 'invalid key: %s' % (key)
        
        return dict(error=error)
        
    def post(self):
        res = {}
        for key, val in self.arguments:
            dic = tornado.escape.json_decode(val)
            print 'saving buysell', key, dic, type(dic)
            res = self.set_product(key, dic['action'], dic['product'], dic['price'])
            self.add_reverse(dic['product'], dic['action'])
            
        return {'result':res, 'data':self.arguments, 'error':res['error']}
        