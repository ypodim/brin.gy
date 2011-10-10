#!/usr/bin/python
# -*- coding: utf-8 -*-

import random
import json, urllib
import socket
import time
from threading import Thread

import select
import sys

class Request(Thread):
    def __init__ (self, dic):
        Thread.__init__(self)
        self.dic = dic
        self.result = 0
        self.content = ''
        self.start_time = time.time()
        self.response_time = 0
    def send_request(self, request_url):
        
        params = urllib.urlencode(self.dic)
        length = len(params)
        
        HOST = 'localhost'
        PORT = 22222
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((HOST, PORT))
        data = 'POST %s HTTP/1.0\r\n' % request_url
        data+= 'From: frog@jmarshall.com\r\n'
        data+= 'User-Agent: HTTPTool/1.0\r\n'
        data+= 'Content-Type: application/x-www-form-urlencoded\r\n'
        data+= 'Content-Length: %d\r\n\r\n' % length
        data+= params
        sent = s.send(data)
        s.send('\r\n\r\n')
        

        string = ''
        data = s.recv(1024)
        
        while len(data):
            string = string + data
            data = s.recv(1024)
        
        s.close()
        
        self.content = string
        s.close()
        
        self.result = 200

    def run(self):
        self.send_request(self.url)
        self.response_time = time.time() - self.start_time


    

def get_random_paths():
    paths = []
    for p in xrange(5):
        points = []
        for i in xrange(5):
            x = random.randrange(10, 1000)
            y = random.randrange(10, 700)
            points.append((x,y))
            
        paths.append(points)
        
    return paths
    

def get_random_objects(n):
    res = ''
    for i in xrange(n):
        
        #// velocity
        res += '%03d' % random.randrange(10,100)
        #res += '%03d' % 49
        
        #// col
        r = random.randrange(0,255)
        g = random.randrange(0,255)
        b = random.randrange(0,255)
        #r = g = b = 127
        res += '%03d%03d%03d' % (r,g,b)
        
        #// type
        res += '%02d' % random.randrange(0,4)
        #res += '%02d' % 4
        
        #// size
        res += '%03d' % random.randrange(5,30)
        #res += '%03d' % 17
        
        #// group
        res += '%03d' % random.randrange(1,5)
        #res += '%03d' % 0
    
    if len(res) != n*20:
        print '*** invalid object generated', res
        sys.exit()

    return res
    
    
class OF:
    def __init__(self):
        PORT = 11999
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(('localhost', PORT))
        self.remote_addr = None
    
    def send_init_command(self, addr):
        #paths
        paths = get_random_paths()
        initcommand = '%02d' % len(paths)
        for p in paths:
            initcommand+= '%03d' % len(p)
            
        for p in paths:
            for x,y in p:
                initcommand+= '%04d%04d' % (x,y)
        
        # points
        objno = 50
        initcommand+= '%04d' % objno
        initcommand+= get_random_objects(objno)
        
        self.sock.sendto( initcommand, addr )
        
    def handle_incoming(self):
        data, addr = self.sock.recvfrom(1600)
        id = 0
        
        self.remote_addr = addr
        
        if data == 'beam me up Scotty!':
            self.send_init_command(addr)
            return 0
        
        cycle = {}
        for i in xrange(0, len(data), 12):
            id = data[i:i+4]
            x = data[i+4:i+8]
            y = data[i+8:i+12]
            
            cycle[id] = 1
            #print '%s: %s,%s' % (id, x, y)
            if len(cycle) == 1000:
                tot = sum([int(i) for i in cycle])
                print tot
                
                cycle = {}
            
            dic = dict(lat=x, lon=y, agent='agent%s' % id)
            r = Request(dic)
            r.send_request(request_url='/location')
        
        
    def modify_object(self, i):
        cmd = 1
        r = 255
        g = 1
        b = 10
        col = '%03d%03d%03d' % (r,g,b)
        command = '%c%04d%s' % (cmd, i, col)
        print 'sending', command
        self.sock.sendto( command, self.remote_addr )
        
    
    def modify_speed(self, dv):
        cmd = 2
        command = '%c%04d' % (cmd, dv)
        print 'sending', command
        self.sock.sendto( command, self.remote_addr )


of = OF()


input = [of.sock, sys.stdin]
running = 1
while running:
    inputready,outputready,exceptready = select.select(input,[],[])

    for s in inputready:

        if s == of.sock:
            of.handle_incoming()

        elif s == sys.stdin:
            junk = sys.stdin.readline().strip()
            
            if junk[0] == 's':
                of.modify_speed(int(junk[1:]))
            else:
                of.modify_object(int(junk))


of.sock.close()

