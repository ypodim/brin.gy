def getK (context):            return 'profile:%s:keys'                 % (context)
def getKA(context, key):       return 'profile:%s:key:%s:agents'        % (context, key)
def getKV(context, key):       return 'profile:%s:key:%s:values'        % (context, key)
def getKVA(context, key, val): return 'profile:%s:key:%s:val:%s:agents' % (context, key, val)