def getK (context):            return 'profile:%s:keys'                 % (context)
def getKA(context, key):       return 'profile:%s:key:%s:agents'        % (context, key)
def getKV(context, key):       return 'profile:%s:key:%s:values'        % (context, key)
def getKVA(context, key, val): return 'profile:%s:key:%s:val:%s:agents' % (context, key, val)


def getvid(r, k,v):
    return r.get('profile:composite:key:%s:val:%s' % (k, v))

def getcid(r, context):
    return r.get('context:%s:cid' % context)

def getlid(r, k,v):
    return r.get('profile:composite:key:%s:val:%s' % (k, v))


def annotate(r, c, k, v, ktype, dic):
    r.sadd('profile:keytypes', 'string', 'location', 'time', 'user')
    r.set('profile:key:%s:type' % k, ktype)

    vid = getlid(r, k,v) or r.incr('global:nextlid')

    r.hmset('location:lid:%s' % vid, dic)
    r.set('profile:composite:key:%s:val:%s' % (k, v), vid)


def deannotate(r, c, k, v):
    # r.sadd('profile:keytypes', 'string', 'location', 'time', 'user')
    # r.set('profile:key:%s:type' % k, ktype)

    vid = getvid(r, k,v)
    if vid:
        r.delete('location:lid:%s' % vid)
        r.delete('profile:composite:key:%s:val:%s' % (k, v), vid) 


def getfullkv(r, c,k,v):
    vid = getvid(r, k,v)
    dic = r.hgetall('location:lid:%s' % vid)
    dic['ktype'] = r.get('profile:key:%s:type' % k)
    return dic