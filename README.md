# SlicedUpload

JS-library to overcome limitations of stateless servers and upload limits.

## How it works?

1. New `SlicedUpload` is created with given `File` and `upload()` is used to initialize the upload.
2. A `handshake` is made with servers - SHA256 -hash, meta information and count of slices are provided to server.
3. Server responds with `uuid` and `nonce` - `uuid` is unique identifier for all slices and `nonce` is updated after every slice.
4. For every slice (chunk) a `POST` request will be sent with `uuid`, `nonce`, `chunk` and `index`
5. After server has received all slices (chunks), we are completed and SHA256 is verified.

## What about server side?

There is a prototype implementation with PHP under `php/` - upload state is kept with `MySQL`.

**This is not the final implementation!**

## Server libraries

TBA!

## License

Copyright 2025 Niko Hujanen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.