
import sys
import random
import math
import os
import pygame
from pygame.locals import *

import socket
import time
from struct import pack
import select
#from threading import Thread
import json
import httplib2
import urllib

DEFAULT_MODE = 0
LOCATION_MODE = 1
BUYSELL_MODE = 2
INTERSECTION_MODE = 3
MONITOR_MODE = 5


def load_png(name):
    """ Load image and return image object"""
    fullname = os.path.join('', name)
    try:
            image = pygame.image.load(fullname)
            if image.get_alpha is None:
                    image = image.convert()
            else:
                    image = image.convert_alpha()
    except pygame.error, message:
            print 'Cannot load image:', fullname
            raise SystemExit, message
    return image
    
    
class Point:
    def __init__(self, x=300, y=500):
        self.x = x
        self.y = y
    def noise(self, n=1):
        self.x += random.random() - 0.5
        self.y += random.random() - 0.5
        self.x = max(self.x, 0)
        self.y = max(self.y, 0)
        return self
    def distance(self, p):
        dx = p.x - self.x
        dy = p.y - self.y
        return math.sqrt(dx*dx + dy*dy)
    def randomize_in_rect(self, x, y, w, h):
        self.x = random.randrange(x, x+w)
        self.y = random.randrange(y, y+h)
    def copy(self):
        return Point(self.x, self.y)


class Ball():
    def __init__(self, id):
        self.name = 'agent%s' % id
        self.rect = pygame.Rect(0,0,10,10)
        screen = pygame.display.get_surface()
        self.area = screen.get_rect()
        self.hit = 0
        
        self.id = id
        self.p = Point()
        self.group = None
        self.col = (125,125,125)
        self.segment = 0
        self.segment_origin = None
        self.segment_statime = None
        self.last_move = time.time()
        self.size = 3 # 1 byte
        self.speed = random.randrange(10,40)
        self.mode = 0
        self.type = 0
        
        self.mon = False
        self.threshold = 0

    def update(self):
        if self.group and self.group.name != 'pucks':
            self.p.noise()
            self.group.move(self)
        
    def color(self):
        if self.get_mode(MONITOR_MODE):
            return Color(51, 255, 204)
            
        if self.get_mode(LOCATION_MODE) and self.get_mode(BUYSELL_MODE):
            return Color(20,0,200)
            
        if self.get_mode(LOCATION_MODE):
            return Color(255,0,0)
            
        if self.get_mode(BUYSELL_MODE):
            return Color(51,102,0)
        
        return self.col
            
    def set_mode(self, mode):
        self.mode |= 2**mode
    def unset_mode(self, mode):
        self.mode &= (~(2**mode))
    def get_mode(self, mode):
        return ( self.mode & (2**mode) > 0)
        
    def draw(self, surface):
        pygame.draw.circle(surface, self.col, (int(self.p.x), int(self.p.y)), self.size)
        if self.mon:
            pygame.draw.circle(surface, (255,10,10), (int(self.p.x), int(self.p.y)), self.threshold, 1)
        
        

class Group:
    def __init__(self, name, x=0, y=0, w=150, h=150):
        self.name = name
        self.p = Point(x, y)
        self.w = w
        self.h = h
        self.path = []
    def reposition_inside(self, p):
        p.x = max(p.x, self.p.x)
        p.x = min(p.x, self.p.x+self.w)
        p.y = max(p.y, self.p.y)
        p.y = min(p.y, self.p.y+self.h)
    def move_on_path(self, obj):
        if obj.segment >= len(self.path):
            obj.segment = 0
        
        now = time.time()
        destination = self.path[obj.segment]
        if not obj.segment_origin:
            obj.segment_origin = obj.p.copy()
            obj.segment_statime = now
        
        
        seg_distance = obj.segment_origin.distance( destination )
        
        T  = seg_distance / obj.speed
        dt = now - obj.segment_statime
        dx = destination.x * dt / T + obj.segment_origin.x * (T - dt) / T
        dy = destination.y * dt / T + obj.segment_origin.y * (T - dt) / T
        
        obj.p.x = dx
        obj.p.y = dy
        
        new_distance = obj.p.distance( destination )
        traveled_distance = obj.segment_origin.distance( obj.p )
        if (traveled_distance > seg_distance):
            #print '***WE LOST POINT', obj.id
            obj.segment += 1
            obj.segment_origin = obj.p.copy()
            obj.segment_statime = now
            
        elif (new_distance < 15):
            obj.segment += 1
            obj.segment_origin = obj.p.copy()
            obj.segment_statime = now
            
        obj.last_move = now
  
    def move(self, obj):
        if self.path:
            self.move_on_path(obj)
        else:
            self.reposition_inside(obj.p)


class Scenario():
    def post_to_satellite(self):
        if time.time() - self.last_post['location'] >= 0.01:
            
            for obj in self.obj:
                obj.col = (125,125,125)
            
            bucket = 10
            for i in xrange(0, self.n, bucket):
                agents = {}
                for j in xrange(bucket):
                    a = self.obj[i+j]
                    
                    dic = dict(agent=a.name, signature='nosign', lat=a.p.x, lon=a.p.y, threshold=a.threshold)
                    agents[a.name] = dic
                
                try:
                    res = self.post('location', dict(agents=json.dumps(agents)))
                except:
                    continue
                
                for mon in ['agent1', 'agent99']:
                    for x in res['agents'].get(mon, {}).get('matched', []):
                        self.obj[int(x[5:])].col = (255,0,0)
            
            self.last_post['location'] = time.time()
            
        elif time.time() - self.last_post['profile'] > 10:
            
            keylist = ['name', 'age', 'ages', 'Age', 'language']
            for k in keylist:
                agents = {}
                for i in xrange(1):
                    aid = 'agent%s'%i
                    dic = dict(agent=aid, signature='nosign', key=k, val='')
                    agents[aid] = dic
            
                try:
                    res = self.post('profile', dict(agents=json.dumps(agents)))
                except:
                    continue
        
    def post(self, url_suffix, data):
        uri = "http://localhost:22222/%s" % url_suffix
        resp, content = self.h.request(uri, "POST", body=urllib.urlencode(data))
        res = json.loads(content)
        if res['error']:
            print res['error']
        return res
        
    def __init__(self, width, height, n=1000):
        #Thread.__init__(self)
        self.width = width
        self.height = height
        self.n = n
        self.obj = []
        self.paths = []
        
        self.threshold = 100
        self.h = httplib2.Http()
        self.go = 1
        self.last_post = dict(location=0, profile=0)
        
        # Initialise pygame stuff
        pygame.init()
        pygame.display.set_caption('Ego table')
        
        self.screen = pygame.display.set_mode((self.width, self.height))
        
        # Fill background
        #image = load_png('background.png')
        self.background = pygame.Surface(self.screen.get_size())
        self.background = self.background.convert()
        self.background.fill((255,255,255))
        #background.set_alpha(0) 
        self.fullscreen = False
        
        # Initialise clock
        self.clock = pygame.time.Clock()
        self.fps_font = pygame.font.SysFont('Verdana', 15)
        #font = pygame.font.SysFont('Verdana', 40)
        
        #Initialize scenario stuff
        x = 50
        y = 50
        road_width = 50
        self.bld_side = 150
        road_margin1 = 15
        road_margin2 = 30
        self.configuration = {
            'groups': [
                {'name':'road2', 'n':97, 'x':350, 'y':250, 'path':[
                    {'x':x + 0*road_width + 1*self.bld_side + road_margin2 - 5, 'y':y + 0*road_width + 1*self.bld_side + road_margin2 + 5}, # NW
                    {'x':x + 0*road_width + 1*self.bld_side + road_margin2 + 5, 'y':y + 1*road_width + 3*self.bld_side + road_margin1 + 10}, # SW
                    {'x':x + 1*road_width + 4*self.bld_side + road_margin1 + 10, 'y':y + 1*road_width + 3*self.bld_side + road_margin1}, # SE
                    {'x':x + 1*road_width + 4*self.bld_side + road_margin1, 'y':y + 0*road_width + 1*self.bld_side + road_margin2 - 5}, # NE
                ]},                
                {'name':'road1', 'n':97, 'x':350, 'y':250, 'path':[
                    {'x':x + 0*road_width + 1*self.bld_side + road_margin1 + 3, 'y':y + 0*road_width + 1*self.bld_side + road_margin1 - 10}, # NW
                    {'x':x + 1*road_width + 4*self.bld_side + road_margin2 + 19, 'y':y + 0*road_width + 1*self.bld_side + road_margin1}, # NE
                    {'x':x + 1*road_width + 4*self.bld_side + road_margin2 + 5, 'y':y + 1*road_width + 3*self.bld_side + road_margin2 + 15}, # SE
                    {'x':x + 0*road_width + 1*self.bld_side + road_margin1 - 10, 'y':y + 1*road_width + 3*self.bld_side + road_margin2}, # SW
                ]},
                
                {'name':'pucks', 'n':6, 'x':650, 'y':550},
                
                # periphery
                {'name':'bld0', 'n':50, 'x':x+ 1*road_width + 1*self.bld_side, 'y':y+ 0*road_width + 0*self.bld_side},
                {'name':'bld1', 'n':50, 'x':x+ 1*road_width + 2*self.bld_side, 'y':y+ 0*road_width + 0*self.bld_side},
                {'name':'bld2', 'n':50, 'x':x+ 1*road_width + 3*self.bld_side, 'y':y+ 0*road_width + 0*self.bld_side},
                
                {'name':'bld3', 'n':50, 'x':x+ 0*road_width + 0*self.bld_side, 'y':y+ 1*road_width + 1*self.bld_side},
                {'name':'bld4', 'n':50, 'x':x+ 2*road_width + 4*self.bld_side, 'y':y+ 1*road_width + 1*self.bld_side},
                {'name':'bld5', 'n':50, 'x':x+ 0*road_width + 0*self.bld_side, 'y':y+ 1*road_width + 2*self.bld_side},
                {'name':'bld6', 'n':50, 'x':x+ 2*road_width + 4*self.bld_side, 'y':y+ 1*road_width + 2*self.bld_side},
                
                {'name':'bld7', 'n':50, 'x':x+ 1*road_width + 1*self.bld_side, 'y':y+ 2*road_width + 3*self.bld_side},
                {'name':'bld8', 'n':50, 'x':x+ 1*road_width + 2*self.bld_side, 'y':y+ 2*road_width + 3*self.bld_side},
                {'name':'bld9', 'n':50, 'x':x+ 1*road_width + 3*self.bld_side, 'y':y+ 2*road_width + 3*self.bld_side},
                
                # inside
                {'name':'bld10', 'n':50, 'x':x+ 1*road_width + 1*self.bld_side, 'y':y+ 1*road_width + 1*self.bld_side},
                {'name':'bld11', 'n':50, 'x':x+ 1*road_width + 2*self.bld_side, 'y':y+ 1*road_width + 1*self.bld_side},
                {'name':'bld12', 'n':50, 'x':x+ 1*road_width + 3*self.bld_side, 'y':y+ 1*road_width + 1*self.bld_side},
                {'name':'bld13', 'n':50, 'x':x+ 1*road_width + 1*self.bld_side, 'y':y+ 1*road_width + 2*self.bld_side},
                {'name':'bld14', 'n':50, 'x':x+ 1*road_width + 2*self.bld_side, 'y':y+ 1*road_width + 2*self.bld_side},
                {'name':'bld15', 'n':50, 'x':x+ 1*road_width + 3*self.bld_side, 'y':y+ 1*road_width + 2*self.bld_side},
                
                
            ]
        }
        
        bucket_ceiling = i = 0
        
        for group in self.configuration['groups']:
            g = Group(group['name'], x=group['x'], y=group['y'], w=self.bld_side, h=self.bld_side)
            
            path = group.get('path', [])
            for p in path:
                g.path.append(Point(p['x'], p['y']))
            
            if g.path:
                self.paths.append(g.path)
            
            
            bucket_ceiling += group['n']
            while i < self.n and i < bucket_ceiling:
                x = random.randint(0, self.width)
                y = random.randint(0, self.height)
                speed = 0.01 * random.randint(5, 1300)
                z = 0.0001 * random.randint(5, 13000)
                
                o = Ball(i)
                o.group = g
                o.p.randomize_in_rect(o.group.p.x, o.group.p.y, o.group.w, o.group.h)
                self.obj.append(o)
                i += 1
        
        self.obj[1].mon = 1
        self.obj[1].threshold = 100
        
        self.obj[99].mon = 1
        self.obj[99].threshold = 100
        

    def draw(self):
        self.clock.tick(10)

        for event in pygame.event.get():
            if event.type == QUIT:
                go = 0
            elif event.type == MOUSEBUTTONDOWN:
                for obj in self.obj:
                    if abs(obj.p.x - event.pos[0]) < 3 and abs(obj.p.y - event.pos[1]) < 3:
                        print obj.id, obj.p.x, obj.p.y
            elif event.type == KEYDOWN:
                if event.key > 48 and event.key < 58:
                    for o in self.obj:
                        o.col = (125,125,125)
                        o.size = 3
                        if o.id > 100 *(event.key-48) and o.id < 100*(event.key-48) + 100:
                            o.col = (255,0,0)
                            o.size = 8
                if event.key == K_f:
                    if self.fullscreen:
                        pygame.display.set_mode((width, height), pygame.DOUBLEBUF)
                    else:
                        pygame.display.set_mode((width, height), pygame.FULLSCREEN)
                    self.fullscreen = not self.fullscreen
                if event.key in [K_q,27]:
                    go = 0
                    

        self.screen.blit(self.background, (0, 0))
        #screen.blit(image, (100,100))
        
        for o in self.obj:
            o.update()
            o.draw(self.screen)
        
        for group in self.configuration['groups']:
            if group['name'][:3] == 'bld':
                pygame.draw.rect(self.screen, (10,10,10), (group['x'],group['y'], self.bld_side, self.bld_side), 4)
        
        #pygame.draw.circle(self.screen, (255,10,10), (int(self.obj[self.mon].p.x), int(self.obj[self.mon].p.y)), self.threshold, 1)
        #pygame.draw.rect(self.screen, (255,10,10), pygame.Rect(int(self.obj[self.mon].p.x)-self.threshold, int(self.obj[self.mon].p.y)-self.threshold, 2*self.threshold, 2*self.threshold), 1)
            
        
        fps_text = self.fps_font.render('fps: ' + str('%.2f' % self.clock.get_fps()), True, (0,0,0), (255,255,255))
        fps_rect = fps_text.get_rect()
        self.screen.blit(fps_text, fps_rect)
        
        pygame.display.flip()
        