

import sys
from bisect import bisect_left, bisect_right



a = ['a', 'asdf', 'badsg', 'dasdf', 'aaa', 'asasss']
a.sort()
print a

while 1:
    inp = sys.stdin.readline()
    left = bisect_left( a, inp ) - 1
    right = bisect_right( a, inp ) - 1
    if left < 0:
        print 'got nothing'
    else:
        print left, a[left]
        print right, a[right]