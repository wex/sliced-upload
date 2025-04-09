import HttpClient, { HttpClientProgressEventDetail, IHttpClientResponse } from "./httpclient";
import { IHandshakeRequest, IHandshakeResponse, IUploadRequest, IUploadResponse } from "./interfaces";

export type SlicedUploadEventDetail = {
    progress: number;
    sentBytes: number;
    totalBytes: number;
}

export interface SlicedUploadEventMap {
    'upload': CustomEvent<SlicedUploadEventDetail>;
    'done': CustomEvent<SlicedUploadEventDetail>;
    'error': CustomEvent<any>;
    'abort': CustomEvent<any>;
}

const createCustomEvent = <T extends keyof SlicedUploadEventMap>(
    type: T,
    eventInitDict: CustomEventInit<
    SlicedUploadEventMap[T] extends CustomEvent<infer T> ? T : never
    >,
) => new CustomEvent(type, eventInitDict);

export default class SlicedUpload extends EventTarget {

    /**
     * Bind event
     */
    on<K extends keyof SlicedUploadEventMap>(
        type: K,
        listener: (ev: SlicedUploadEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        this.addEventListener(type, listener as EventListener, options);
    }

    /**
     * Unbind event
     */
    off<K extends keyof SlicedUploadEventMap>(
        type: K,
        listener: (ev: SlicedUploadEventMap[K]) => void,
        options?: boolean | EventListenerOptions
    ): void {
        this.removeEventListener(type, listener as EventListener, options);
    }

    /**
     * Emit event
     */
    emit<K extends keyof SlicedUploadEventMap>(
        type: K,
        detail: SlicedUploadEventMap[K] extends CustomEvent<infer T> ? T : never
    ): void {
        this.dispatchEvent(createCustomEvent(type, { detail }));
    }

    /**
     * File to upload
     */
    private file?: File;

    /**
     * URL
     */
    private url?: string;

    /**
     * Params
     */
    private params: Record<string, any> = {};

    /**
     * Headers
     */
    private headers: Record<string, string> = {};

    /**
     * Size of each chunk in bytes
     */
    private chunkSize?: number;

    /**
     * Chunks of the file
     */
    private chunk?: Blob;

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
     * Nonce
     */
    private nonce?: string;

    /**
     * UUID
     */
    private uuid?: string;

    /**
     * Constructor
     * @todo rework
     */
    constructor(
        file: File,
        controller: AbortController = new AbortController(),
    ) {
        super();

        this.file = file;
        this.sentBytes = 0;
        this.progress = 0;
        this.controller = controller;
    }

    /**
     * Get file hash
     * @since 1.0.0
     */
    private async _getFileHash(file: File): Promise<string> {
        const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get chunk hash
     * @since 2.0.0
     */
    private async _getChunkHash(chunk: Blob): Promise<string> {
        const hash = await crypto.subtle.digest('SHA-256', await chunk.arrayBuffer());
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get form data
     * @since 2.0.0
     */
    private _getFormData(data: Record<string, any>): FormData {
        const formData = new FormData();

        for (const key in this.params) {
            formData.append(key, this.params[key]);
        }

        for (const key in data) {
            formData.append(key, data[key]);
        }

        return formData;
    }

    /**
     * Handshake
     * @since 2.0.0
     */
    private _handshake(): Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {

                const request: IHandshakeRequest = {
                    checksum: await this._getFileHash(this.file!),
                    name: this.file!.name,
                    size: this.file!.size,
                    type: this.file!.type
                };

                HttpClient.post(
                    this.url!,
                    this._getFormData(request),
                    this.headers
                ).then((response: IHttpClientResponse) => {

                    if (response.status !== 201) {
                        
                        return reject(response.text);

                    } else {

                        try {

                            const result: IHandshakeResponse = JSON.parse(response.text);
                            this.uuid = result.uuid;
                            this.nonce = result.nonce;
                            this.chunkSize = result.max_size;

                            return resolve();

                        } catch (e) {

                            return reject("JSON parse error");

                        }

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
     * Process next chunk
     * @since 2.0.0
     */
    private _process(): Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {

                this.chunk = this.file!.slice(this.sentBytes, this.sentBytes + this.chunkSize!);

                return resolve();

            } catch (e) {

                return reject(e);

            }

        });

    }

    /**
     * Send chunk
     * @since 2.0.0
     */
    private _send(): Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {

                await this._process();

                const request: IUploadRequest = {
                    uuid: this.uuid!,
                    chunk: this.chunk!,
                    nonce: this.nonce!,
                    checksum: await this._getChunkHash(this.chunk!)
                };

                HttpClient.patch(
                    this.url!,
                    this._getFormData(request),
                    this.headers,
                    60000,
                    (e: HttpClientProgressEventDetail) => {
                        this.progress = Math.round((this.sentBytes + e.loaded) / this.file!.size * 100);

                        this.emit("upload", {
                            progress: this.progress,
                            sentBytes: this.sentBytes + e.loaded,
                            totalBytes: this.file!.size
                        })
                    }
                ).then((response: IHttpClientResponse) => {

                    if (response.status === 202) {
                        
                        try {

                            const result: IUploadResponse = JSON.parse(response.text);
                            this.uuid = result.uuid;
                            this.nonce = result.nonce;
                            this.sentBytes += result.size;

                            return resolve();

                        } catch (e) {

                            return reject("JSON parse error");

                        }

                    } else if (response.status === 200) {

                        this.emit("done", {
                            progress: this.progress,
                            sentBytes: this.sentBytes,
                            totalBytes: this.file!.size
                        })

                        return resolve();

                    } else {

                        return reject(response.text);

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
     * Upload
     * @since 2.0.0
     */
    public upload(url: string, params: Record<string, any> = {}, headers: Record<string, string> = {}): Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {

                this.url = url;
                this.params = params;
                this.headers = headers;

                await this._handshake();

                while (this.sentBytes < this.file!.size) {

                    await this._send();

                }

                return resolve();

            } catch (e) {

                return reject(e);

            }

        });

    }

    /**
     * Abort
     * @since 2.0.0
     */
    public abort(): void {

        this.emit("abort", {});
        this.controller.abort();

    }


}
