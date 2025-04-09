export interface IHandshakeRequest {
    checksum: string;
    name: string;
    size: number;
    type: string;
}

export interface IHandshakeResponse {
    uuid: string;
    max_size: number;
    nonce: string;
}

export interface IUploadRequest {
    uuid: string;
    chunk: Blob;
    nonce: string;
    checksum: string;
}

export interface IUploadResponse {
    nonce: string;
    size: number;
}

export interface IStatusRequest {
    uuid: string;
    nonce: string;
}

export interface IStatusResponse {
    nonce: string;
    size: number;
}

export interface ICancelRequest {
    uuid: string;
}

export interface IError {
    message: string;
}
