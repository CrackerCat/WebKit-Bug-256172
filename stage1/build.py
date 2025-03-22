#!/usr/bin/env python3

import subprocess

subprocess.run(['make', 'all'], check=True)

# Convert the payload to a JS array literal
payload = open('stage1', 'rb').read()

js = 'var stage1 = new Uint8Array(['
js += ','.join(map(str, payload))
js += ']);\n'
js += '''
stage1.replace = function(oldVal, newVal) {
    for (var idx = 0; idx < this.length; idx++) {
        var found = true;
        for (var j = idx; j < idx + 8; j++) {
            if (this[j] != oldVal.byteAt(j - idx)) {
                found = false;
                break;
            }
        }
        if (found)
            break;
    }
    this.set(newVal.bytes(), idx);
};
'''

with open('stage1.js', 'w') as f:
    f.write(js)

EXPORTS = [
        {'path': 'stage1.js', 'content_type': 'text/javascript; charset=UTF-8'}
]

subprocess.run(['cp', 'stage1.js', '..'], check=True)
subprocess.run(['rm', 'stage1.js'], check=True)
subprocess.run(['rm', 'stage1.o'], check=True)
subprocess.run(['rm', 'stage1_sc.h'], check=True)
# subprocess.run(['rm', 'stage1.bin'], check=True)
subprocess.run(['rm', 'stage1'], check=True)