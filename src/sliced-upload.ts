export interface SlicedUploadEvent extends Event {
    detail: {
        progress: number;
        currentChunk: number;
        totalChunks: number;
        sentBytes: number;
        totalBytes: number;
    };
}

export default class SlicedUpload extends EventTarget {
    /**
     * File to upload
     */
    private file?: File;

    /**
     * Size of each chunk in bytes
     */
    private chunkSize: number;

    /**
     * Chunks of the file
     */
    private chunks: Blob[];

    /**
     * Chunk index
     */
    private chunkIndex: number;

    /**
     * Bytes sent
     */
    private sentBytes: number;

    /**
     * Upload progress
     */
    private progress: number;

    /**
     * Error event
     */
    private _errorEvent: Event = new Event('error');

    /**
     * Abort event
     */
    private _abortEvent: Event = new Event('abort');

    /**
     * Progress event
     */
    private _progressEvent: SlicedUploadEvent = new Event('progress') as SlicedUploadEvent;

    /**
     * Load event
     */
    private _readyEvent: SlicedUploadEvent = new Event('done') as SlicedUploadEvent;

    /**
     * Abort controller
     */
    private controller: AbortController;

    /**
     * File hash
     */
    private fileHash?: string;

    /**
     * Constructor
     */
    constructor(
        file: File,
        controller: AbortController = new AbortController(),
        chunkSize: number = 1024 * 1024
    ) {
        super();

        this.file = file;
        this.chunkSize = chunkSize;
        this.chunks = [];
        this.chunkIndex = 0;
        this.sentBytes = 0;
        this.progress = 0;
        this.controller = controller;

        this._createChunks(file);
    }

    /**
     * Create chunks
     */
    private _createChunks(file: File): void {
        this.chunks = [];

        for (let i = 0; i < file.size; i += this.chunkSize) {
            this.chunks.push(file.slice(i, i + this.chunkSize));
        }
    }

    /**
     * Get file hash
     */
    private async _getFileHash(file: File): Promise<string> {
        const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private _sendChunk(index: number, url: string, params: Record<string, any> = {}, headers: Record<string, string> = {}): Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {

                const xhr = new XMLHttpRequest();

                xhr.open('POST', url, true);

                for (const key in headers) {

                    xhr.setRequestHeader(key, headers[key]);

                }

                xhr.addEventListener('load', () => {

                    if (xhr.status !== 200) {

                        return reject(new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`));

                    }

                    return resolve();

                });

                xhr.addEventListener('error', () => {

                    return reject(new Error('Upload failed'));

                });

                xhr.addEventListener('abort', () => {

                    return reject(new Error('Upload aborted'));

                });

                xhr.upload.addEventListener('progress', (event) => {

                    if (event.lengthComputable) {

                        this.sentBytes = this.chunks.slice(0, index).reduce((i, t) => { return i + t.size; }, 0) + event.loaded;
                        this.progress = Math.round(this.sentBytes / this.file!.size * 100);

                        this._progressEvent.detail = {
                            progress: this.progress,
                            currentChunk: index,
                            totalChunks: this.chunks.length,
                            sentBytes: this.sentBytes,
                            totalBytes: this.file!.size
                        };

                        this.dispatchEvent(this._progressEvent);

                    }

                });

                const formData = new FormData();

                formData.append('sliced_upload', this.fileHash!);
                formData.append('chunk', this.chunks[index]);
                formData.append('index', index.toString());

                for (const key in params) {
                    formData.append(key, params[key]);
                }

                xhr.send(formData);

            } catch (e) {

                return reject(e);

            }

        });

    }

    private _sendHandshake(url: string, params: Record<string, any> = {}, headers: Record<string, string> = {}): Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {

                const xhr = new XMLHttpRequest();

                xhr.open('POST', url, true);

                for (const key in headers) {

                    xhr.setRequestHeader(key, headers[key]);

                }

                xhr.addEventListener('load', () => {

                    if (xhr.status !== 200) {

                        return reject(new Error(`HTTP Error: ${xhr.status} ${xhr.statusText}`));

                    }

                    return resolve();

                });

                xhr.addEventListener('error', () => {

                    return reject(new Error('Upload failed'));

                });

                xhr.addEventListener('abort', () => {

                    return reject(new Error('Upload aborted'));

                });

                const formData = new FormData();

                formData.append('sliced_upload', this.fileHash!);
                formData.append('filename', this.file!.name);
                formData.append('filesize', this.file!.size.toString());
                formData.append('filetype', this.file!.type);
                formData.append('chunks', this.chunks.length.toString());

                for (const key in params) {
                    formData.append(key, params[key]);
                }

                xhr.send(formData);

            } catch (e) {

                return reject(e);

            }

        });

    }

    /**
     * Upload file
     */
    public async upload(url: string, params: Record<string, any> = {}, headers: Record<string, string> = {}): Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {

                // Verify file
                if (!this.file || this.file.size === 0) {

                    throw new Error('Invalid file');

                }

                // Get SHA-256 hash of the file
                this.fileHash = await this._getFileHash(this.file!);

                // Send handshake to the server
                await this._sendHandshake(url, params, headers);

                // Send chunks to the server
                for (this.chunkIndex = 0; this.chunkIndex < this.chunks.length; this.chunkIndex++) {

                    // Check if the upload is aborted
                    if (this.controller.signal.aborted) {

                        throw new Error('Upload aborted');

                    }

                    // Send chunk to the server
                    await this._sendChunk(this.chunkIndex, url, params, headers);

                    // Update progress
                    this.sentBytes = this.chunks.slice(0, this.chunkIndex).reduce((i, t) => { return i + t.size; }, 0) + this.chunks[this.chunkIndex].size;
                    this.progress = Math.round(this.sentBytes / this.file!.size * 100);

                    // Dispatch progress event
                    this._progressEvent.detail = {
                        progress: this.progress,
                        currentChunk: this.chunkIndex,
                        totalChunks: this.chunks.length,
                        sentBytes: this.sentBytes,
                        totalBytes: this.file!.size
                    };
                    this.dispatchEvent(this._progressEvent);

                }

                // Dispatch ready event
                this.dispatchEvent(this._readyEvent);

                return resolve();

            } catch (e) {

                // Dispatch error event
                this.dispatchEvent(this._errorEvent);

                return reject(e);

            }

        });

    }

    public abort(): void {

        this.dispatchEvent(this._abortEvent);
        this.controller.abort();

    }


}
