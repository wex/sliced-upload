import HttpClient, { HttpClientProgressEventDetail } from "./httpclient";

export type SlicedUploadEventDetail = {
    progress: number;
    currentChunk: number;
    totalChunks: number;
    sentBytes: number;
    totalBytes: number;
}

export interface SlicedUploadEventMap {
    'upload': CustomEvent<SlicedUploadEventDetail>;
    'done': CustomEvent<SlicedUploadEventDetail>;
    'error': CustomEvent<never>;
    'abort': CustomEvent<never>;
}

const createCustomEvent = <T extends keyof GlobalEventHandlersEventMap>(
    type: T,
    eventInitDict: CustomEventInit<
        GlobalEventHandlersEventMap[T] extends CustomEvent<infer T> ? T : never
    >,
) => new CustomEvent(type, eventInitDict);

export default class SlicedUpload extends EventTarget {
    on<K extends keyof SlicedUploadEventMap>(
        type: K,
        listener: (ev: SlicedUploadEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        this.addEventListener(type, listener as EventListener, options);
    }

    off<K extends keyof SlicedUploadEventMap>(
        type: K,
        listener: (ev: SlicedUploadEventMap[K]) => void,
        options?: boolean | EventListenerOptions
    ): void {
        this.removeEventListener(type, listener as EventListener, options);
    }

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
     * Abort controller
     */
    private controller: AbortController;

    /**
     * File hash
     */
    private fileHash?: string;

    /**
     * Nonce
     */
    private nonce?: string;

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

    /**
     * Send chunk
     */
    private _sendChunk(index: number, url: string, params: Record<string, any> = {}, headers: Record<string, string> = {}): Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {

                const httpClient = new HttpClient('POST', url, headers, 60000);

                httpClient.on('progress', (e: CustomEvent<HttpClientProgressEventDetail>) => {

                    this.sentBytes = this.chunks.slice(0, index).reduce((i, t) => { return i + t.size; }, 0) + e.detail.loaded;
                    this.progress = Math.round(this.sentBytes / this.file!.size * 100);

                    this.dispatchEvent(
                        createCustomEvent("upload", {
                            detail: {
                                progress: this.progress,
                                currentChunk: index,
                                totalChunks: this.chunks.length,
                                sentBytes: this.sentBytes,
                                totalBytes: this.file!.size
                            }
                        })
                    );


                });

                const formData = new FormData();

                formData.append('sliced_upload', this.fileHash!);
                formData.append('chunk', this.chunks[index]);
                formData.append('index', index.toString());
                formData.append('nonce', this.nonce!);

                for (const key in params) {
                    formData.append(key, params[key]);
                }

                httpClient.send(formData).then((response: string) => {

                    try {

                        const result = JSON.parse(response);
                        this.nonce = result.nonce;

                        return resolve();

                    } catch (e) {

                        return reject(e);

                    }

                }).catch((error: string) => {
                    
                    return reject(error);

                });

            } catch (e) {

                return reject(e);

            }

        });

    }

    /**
     * Send handshake
     */
    private _sendHandshake(url: string, params: Record<string, any> = {}, headers: Record<string, string> = {}): Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {

                const httpClient = new HttpClient('POST', url, headers, 1000);

                const formData = new FormData();

                formData.append('sliced_upload', this.fileHash!);
                formData.append('filename', this.file!.name);
                formData.append('filesize', this.file!.size.toString());
                formData.append('filetype', this.file!.type);
                formData.append('chunks', this.chunks.length.toString());

                for (const key in params) {
                    formData.append(key, params[key]);
                }

                httpClient.send(formData).then((response: string) => {

                    try {

                        const result = JSON.parse(response);
                        this.nonce = result.nonce;
                        this.fileHash = result.uuid;

                        return resolve();

                    } catch (e) {

                        return reject(e);

                    }

                }).catch((error: string) => {
                    
                    return reject(error);

                });

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
                    this.dispatchEvent(
                        createCustomEvent("upload", {
                            detail: {
                                progress: this.progress,
                                currentChunk: this.chunkIndex,
                                totalChunks: this.chunks.length,
                                sentBytes: this.sentBytes,
                                totalBytes: this.file!.size
                            }
                        })
                    );

                }

                // Dispatch ready event
                this.dispatchEvent(
                    createCustomEvent("done", {
                        detail: {
                            progress: this.progress,
                            currentChunk: this.chunkIndex,
                            totalChunks: this.chunks.length,
                            sentBytes: this.sentBytes,
                            totalBytes: this.file!.size
                        }
                    })
                );
                return resolve();

            } catch (e) {

                // Dispatch error event
                this.dispatchEvent(createCustomEvent("error", {}));

                return reject(e);

            }

        });

    }

    public abort(): void {

        this.dispatchEvent(createCustomEvent("abort", {}));
        this.controller.abort();

    }


}
