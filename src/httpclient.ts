export type HttpClientMethod = 'POST' | 'DELETE' | 'PATCH' | 'HEAD';

export interface HttpClientEventMap {
    progress: CustomEvent<HttpClientProgressEventDetail>;
}

export type HttpClientProgressEventDetail = {
    progress: number;
    loaded: number;
    total: number;
}

export interface IHttpClientResponse {
    status: number;
    text: string;
}

const createCustomEvent = <T extends keyof HttpClientEventMap>(
    type: T,
    eventInitDict: CustomEventInit<
    HttpClientEventMap[T] extends CustomEvent<infer T> ? T : never
    >,
) => new CustomEvent(type, eventInitDict);

export default class HttpClient extends EventTarget {

    /**
     * HTTP method override
     */
    static HTTP_METHOD_OVERRIDE = false;

    /**
     * XMLHttpRequest
     */
    private _request: XMLHttpRequest;

    /**
     * Constructor
     */
    constructor(method: HttpClientMethod, url: string, headers: Record<string, string> = {}, timeout: number = 5000) {

        super();

        this._request = new XMLHttpRequest();

        this._request.open(method, url, true);

        for (const key in headers) {
            this._request.setRequestHeader(key, headers[key]);
        }

        this._request.timeout = timeout;

    }

    /**
     * Bind event
     */
    public on<K extends keyof HttpClientEventMap>(
        type: K,
        listener: (ev: HttpClientEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        this.addEventListener(type, listener as EventListener, options);
    }

    /**
     * Unbind event
     */
    public off<K extends keyof HttpClientEventMap>(
        type: K,
        listener: (ev: HttpClientEventMap[K]) => void,
        options?: boolean | EventListenerOptions
    ): void {
        this.removeEventListener(type, listener as EventListener, options);
    }

    /**
     * Emit event
     */
    public emit<K extends keyof HttpClientEventMap>(
        type: K,
        detail: HttpClientEventMap[K] extends CustomEvent<infer T> ? T : never
    ): void {
        this.dispatchEvent(createCustomEvent(type, { detail }));
    }

    public async send(payload: FormData | null = null): Promise<IHttpClientResponse> {

        return new Promise((resolve, reject) => {

            this._request.addEventListener('readystatechange', () => {

                if (this._request.readyState === XMLHttpRequest.DONE) {

                    if (this._request.status >= 200 && this._request.status < 300) {

                        return resolve({ status: this._request.status, text: this._request.responseText ?? '' });

                    } else {

                        return reject({ status: this._request.status, text: this._request.statusText });

                    }

                }

            });

            this._request.addEventListener('error', () => {

                return reject(this._request.statusText);

            });

            this._request.addEventListener('abort', () => {
                
                return reject('Aborted');

            });

            this._request.addEventListener('timeout', () => {

                return reject('Timeout');

            });

            this._request.upload.addEventListener('progress', (e) => {

                if (e.lengthComputable) {
                    this.emit("progress", {
                        loaded: e.loaded,
                        total: e.total,
                        progress: (e.total > 0) ? (e.loaded / e.total) : 0        
                    })
                }

            });

            this._request.send(payload);

        });

    }

    public static async post(url: string, payload: FormData | null = null, headers: Record<string, string> = {}, timeout: number = 5000): Promise<IHttpClientResponse> {

        const client = new HttpClient(
            'POST',
            url,
            headers,
            timeout
        );

        return client.send(payload);

    }

    public static async patch(url: string, payload: FormData | null = null, headers: Record<string, string> = {}, timeout: number = 5000, progressCallback?: (e: HttpClientProgressEventDetail) => void): Promise<IHttpClientResponse> {

        const client = new HttpClient(
            HttpClient.HTTP_METHOD_OVERRIDE ? 'POST' : 'PATCH',
            url,
            headers,
            timeout
        );

        client.on('progress', (e) => {
            progressCallback?.(e.detail);
        });

        if (HttpClient.HTTP_METHOD_OVERRIDE) {
            payload = payload ? payload : new FormData();
            payload.append('_method', 'PATCH');
        }

        return client.send(payload);

    }

    public static async delete(url: string, payload: FormData | null = null, headers: Record<string, string> = {}, timeout: number = 5000): Promise<IHttpClientResponse> {

        const client = new HttpClient(
            HttpClient.HTTP_METHOD_OVERRIDE ? 'POST' : 'DELETE',
            url,
            headers,
            timeout
        );

        if (HttpClient.HTTP_METHOD_OVERRIDE) {
            payload = payload ? payload : new FormData();
            payload.append('_method', 'DELETE');
        }

        return client.send(payload);

    }

    public static async head(url: string, query: Record<string, string> = {}, headers: Record<string, string> = {}, timeout: number = 5000): Promise<IHttpClientResponse> {

        const queryString = new URLSearchParams(query).toString();
        
        const client = new HttpClient(
            'HEAD',
            `${url}${url.includes('?') ? '&' : '?'}${queryString}`,
            headers,
            timeout
        );

        return client.send();

    }

}