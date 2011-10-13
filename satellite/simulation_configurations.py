# -*- coding: utf-8 -*-
#bld_side = 150
x = 50
y = 50
road_width = 50
road_margin1 = 15
road_margin2 = 30
        
#configuration0 = {
    #'groups': [
        #{'name':'road2', 'n':97, 'x':350, 'y':250, 'path':[
            #{'x':x + 0*road_width + 1*bld_side + road_margin2 - 5, 'y':y + 0*road_width + 1*bld_side + road_margin2 + 5}, # NW
            #{'x':x + 0*road_width + 1*bld_side + road_margin2 + 5, 'y':y + 1*road_width + 3*bld_side + road_margin1 + 10}, # SW
            #{'x':x + 1*road_width + 4*bld_side + road_margin1 + 10, 'y':y + 1*road_width + 3*bld_side + road_margin1}, # SE
            #{'x':x + 1*road_width + 4*bld_side + road_margin1, 'y':y + 0*road_width + 1*bld_side + road_margin2 - 5}, # NE
        #]},                
        #{'name':'road1', 'n':97, 'x':350, 'y':250, 'path':[
            #{'x':x + 0*road_width + 1*bld_side + road_margin1 + 3, 'y':y + 0*road_width + 1*bld_side + road_margin1 - 10}, # NW
            #{'x':x + 1*road_width + 4*bld_side + road_margin2 + 19, 'y':y + 0*road_width + 1*bld_side + road_margin1}, # NE
            #{'x':x + 1*road_width + 4*bld_side + road_margin2 + 5, 'y':y + 1*road_width + 3*bld_side + road_margin2 + 15}, # SE
            #{'x':x + 0*road_width + 1*bld_side + road_margin1 - 10, 'y':y + 1*road_width + 3*bld_side + road_margin2}, # SW
        #]},
        
        #{'name':'pucks', 'n':6, 'x':650, 'y':550},
        
        ## periphery
        #{'name':'bld0', 'n':50, 'x':x+ 1*road_width + 1*bld_side, 'y':y+ 0*road_width + 0*bld_side},
        #{'name':'bld1', 'n':50, 'x':x+ 1*road_width + 2*bld_side, 'y':y+ 0*road_width + 0*bld_side},
        #{'name':'bld2', 'n':50, 'x':x+ 1*road_width + 3*bld_side, 'y':y+ 0*road_width + 0*bld_side},
        
        #{'name':'bld3', 'n':50, 'x':x+ 0*road_width + 0*bld_side, 'y':y+ 1*road_width + 1*bld_side},
        #{'name':'bld4', 'n':50, 'x':x+ 2*road_width + 4*bld_side, 'y':y+ 1*road_width + 1*bld_side},
        #{'name':'bld5', 'n':50, 'x':x+ 0*road_width + 0*bld_side, 'y':y+ 1*road_width + 2*bld_side},
        #{'name':'bld6', 'n':50, 'x':x+ 2*road_width + 4*bld_side, 'y':y+ 1*road_width + 2*bld_side},
        
        #{'name':'bld7', 'n':50, 'x':x+ 1*road_width + 1*bld_side, 'y':y+ 2*road_width + 3*bld_side},
        #{'name':'bld8', 'n':50, 'x':x+ 1*road_width + 2*bld_side, 'y':y+ 2*road_width + 3*bld_side},
        #{'name':'bld9', 'n':50, 'x':x+ 1*road_width + 3*bld_side, 'y':y+ 2*road_width + 3*bld_side},
        
        ## inside
        #{'name':'bld10', 'n':50, 'x':x+ 1*road_width + 1*bld_side, 'y':y+ 1*road_width + 1*bld_side},
        #{'name':'bld11', 'n':50, 'x':x+ 1*road_width + 2*bld_side, 'y':y+ 1*road_width + 1*bld_side},
        #{'name':'bld12', 'n':50, 'x':x+ 1*road_width + 3*bld_side, 'y':y+ 1*road_width + 1*bld_side},
        #{'name':'bld13', 'n':50, 'x':x+ 1*road_width + 1*bld_side, 'y':y+ 1*road_width + 2*bld_side},
        #{'name':'bld14', 'n':50, 'x':x+ 1*road_width + 2*bld_side, 'y':y+ 1*road_width + 2*bld_side},
        #{'name':'bld15', 'n':50, 'x':x+ 1*road_width + 3*bld_side, 'y':y+ 1*road_width + 2*bld_side},        
    #]
#}

configuration2 = {
    'groups': [        
        {'name':'bld1', 'n':50, 'x':50, 'y':50, 'w':50, 'h':50},
        {'name':'bld2', 'n':50, 'x':100, 'y':50, 'w':50, 'h':50},
        {'name':'bld3', 'n':50, 'x':150, 'y':50, 'w':50, 'h':50},
        {'name':'bld4', 'n':50, 'x':200, 'y':50, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':250, 'y':50, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':300, 'y':50, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':350, 'y':50, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':400, 'y':50, 'w':50, 'h':50},
        
        {'name':'bld1', 'n':50, 'x':50, 'y':150, 'w':50, 'h':50},
        {'name':'bld2', 'n':50, 'x':100, 'y':150, 'w':50, 'h':50},
        {'name':'bld3', 'n':50, 'x':150, 'y':150, 'w':50, 'h':50},
        {'name':'bld4', 'n':50, 'x':200, 'y':150, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':250, 'y':150, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':300, 'y':150, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':350, 'y':150, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':400, 'y':150, 'w':50, 'h':50},
        
        {'name':'bld1', 'n':50, 'x':50, 'y':250, 'w':50, 'h':50},
        {'name':'bld2', 'n':50, 'x':100, 'y':250, 'w':50, 'h':50},
        {'name':'bld3', 'n':50, 'x':150, 'y':250, 'w':50, 'h':50},
        {'name':'bld4', 'n':50, 'x':200, 'y':250, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':250, 'y':250, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':300, 'y':250, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':350, 'y':250, 'w':50, 'h':50},
        {'name':'bld5', 'n':50, 'x':400, 'y':250, 'w':50, 'h':50},
    ]
}

configuration1 = {
    'groups': [
        
        {'name':'road2', 'n':550, 'x':350, 'y':250, 'w':501, 'h':351, 'waypoints':[
            
            {'id':0, 'y': 650, 'x': 411, 'next':[1,2]}, 
            {'id':1, 'y': 607, 'x': 420, 'next':[3,4]}, 
            {'id':2, 'y': 483, 'x': 414, 'next':[5,6]}, 
            {'id':3, 'y': 357, 'x': 494, 'next':[7,8]}, 
            {'id':4, 'y': 371, 'x': 552, 'next':[9,1]}, 
            {'id':5, 'y': 588, 'x': 864, 'next':[1,2]}, 
            {'id':6, 'y': 621, 'x': 829, 'next':[2,3]}, 
            {'id':7, 'y': 608, 'x': 405, 'next':[4,5]}, 
            {'id':8, 'y': 485, 'x': 414, 'next':[6,7]}, 
            {'id':9, 'y': 494, 'x': 47, 'next':[7,8]},
        ]},
        
        {'name':'E14', 'n':50, 'x':73, 'y':361, 'w':70, 'h':116},
        {'name':'bld2', 'n':50, 'x':376, 'y':507, 'w':30, 'h':74},
        {'name':'bld3', 'n':50, 'x':121, 'y':232, 'w':40, 'h':68},
        {'name':'Google', 'n':50, 'x':284, 'y':169, 'w':36, 'h':44},
        {'name':'E55', 'n':50, 'x':488, 'y':415, 'w':36, 'h':35},
        {'name':'OLPC', 'n':50, 'x':407, 'y':248, 'w':40, 'h':40},
        {'name':'bld5', 'n':5, 'x':483, 'y':420, 'w':30, 'h':30},
        {'name':'Dewey', 'n':50, 'x':474, 'y':494, 'w':45, 'h':45},
        {'name':'bld5', 'n':500, 'x':337, 'y':453, 'w':70, 'h':70},
    ]
}


