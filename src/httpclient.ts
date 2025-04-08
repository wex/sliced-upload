export type HttpClientMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type HttpClientProgressEventDetail = {
    lengthComputable: boolean;
    progress: number;
    loaded: number;
    total: number;
}

export default class HttpClient extends EventTarget {

    private _request: XMLHttpRequest;

    constructor(method: HttpClientMethod, url: string, headers: Record<string, string> = {}, timeout: number = 5000) {

        super();

        this._request = new XMLHttpRequest();

        this._request.open(method, url);

        for (const key in headers) {
            this._request.setRequestHeader(key, headers[key]);
        }

        this._request.timeout = timeout;

    }

    on<K extends keyof HttpClientEventMap>(
        type: K,
        listener: (ev: HttpClientEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        this.addEventListener(type, listener as EventListener, options);
    }

    off<K extends keyof HttpClientEventMap>(
        type: K,
        listener: (ev: HttpClientEventMap[K]) => void,
        options?: boolean | EventListenerOptions
    ): void {
        this.removeEventListener(type, listener as EventListener, options);
    }

    public async send(payload: FormData | null = null): Promise<string> {

        return new Promise((resolve, reject) => {

            this._request.addEventListener('readystatechange', () => {

                if (this._request.readyState === XMLHttpRequest.DONE) {

                    if (this._request.status >= 200 && this._request.status < 300) {

                        return resolve(this._request.responseText ?? '');

                    } else {

                        return reject(this._request.statusText);

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
                    this.dispatchEvent(new CustomEvent<HttpClientProgressEventDetail>('progress', { detail: {
                        lengthComputable: e.lengthComputable,
                        loaded: e.loaded,
                        total: e.total,
                        progress: (e.total > 0) ? (e.loaded / e.total) : 0
                    } }));
                }

            });

            this._request.send(payload);

        });

    }

    public static async post(url: string, payload: FormData | null = null, headers: Record<string, string> = {}, timeout: number = 5000): Promise<string> {

        return new HttpClient('POST', url, headers, timeout).send(payload);

    }

}