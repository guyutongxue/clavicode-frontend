// Copyright (C) 2022 Clavicode Team
// 
// This file is part of clavicode-frontend.
// 
// clavicode-frontend is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// clavicode-frontend is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with clavicode-frontend.  If not, see <http://www.gnu.org/licenses/>.

export const MT_DONE = 0;
export const MT_LEN = 1;
export const MT_CREATE = 1;
export const MT_OFFSET = 2;
export const MT_PATH = 3;

export const C_NONE = 0;
export const C_CREATE = 1;
export const C_EXCLUSIVE = 2;

export const E_NO_LOCALFS = -1;
export const E_NO_ENTRY = -2;
export const E_FILE_EXIST = -3;
export const E_PERM_DENIED = -4;
export const E_OFFSET = -5;
export const E_MAX_PATH = -64;
export const E_INTERNAL = -127;
export const E_EXCEPTION = -128;

export const FS_PATCH = `
__open = open
def patch_fs():
    from js import open_local, close_local
    from pathlib import Path
    import os
    PREFIX = '/mnt/local/'
    def patched_open(file, *args, **kwargs):
        if not isinstance(file, str):
            return __open(file, *args, **kwargs)
        path = Path(file).resolve()
        pathstr = str(path)
        if not pathstr.startswith(PREFIX):
            return __open(file, *args, **kwargs)
        mode = args[0] if len(args) > 0 else kwargs.get('mode', 'r') 
        res = open_local(pathstr[len(PREFIX):], mode)
        if res.success:
            if 'x' not in mode:
                os.makedirs(str(path.parent), exist_ok=True)
                with __open(pathstr, 'wb') as pf:
                    pf.write(res.data.to_py().tobytes())
        else:
            raise OSError("Failed to load %s from local fs. Errno: %d" % (file, res.errno))
        f = __open(file, *args, **kwargs)
        if f.writable():
            __close = f.close
            def patched_close():
                __close()
                with __open(pathstr, 'rb') as pf:
                    data = pf.read()
                    res = close_local(pathstr[len(PREFIX):], data)
                    if res < 0:
                        raise OSError("Failed to store %s to local fs. Errno: %d" % (file, res))
            f.close = patched_close
        return f
    os.chdir(PREFIX)
    return patched_open
open = patch_fs()
del patch_fs
`;
export const FS_PATCH_LINENO = FS_PATCH.match(/\n/g)?.length ?? 0;

export const MAX_PATH = 256;
export const CHUNK_SIZE = 4096;
