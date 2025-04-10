# SlicedUpload

JS-library to overcome limitations of stateless servers and upload limits.

## TODO

- Allow pause/continue with `HEAD`

## How it works?

1. Client-side uses `SlicedUpload` to send the file in chunks that server can handle
2. Server handles chunks one-by-one and validates every chunk and file with `SHA256`.
3. Database is used to manage the state of uploads.

See [docs/protocol.md](docs/protocol.md) for more information about protocol itself.

## Server libraries

- PHP
  - https://github.com/wex/sliced-upload-php

## License

Copyright 2025 Niko Hujanen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.