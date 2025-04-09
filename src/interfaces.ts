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
    chunk: Blob;
    nonce: string;
    checksum: string;
}

export interface IUploadResponse {
    uuid: string;
    nonce: string;
    size: number;
}

export interface IStatusRequest {
    uuid: string;
    nonce: string;
}

export interface IStatusResponse {
    uuid: string;
    nonce: string;
    size: number;
}

export interface ICancelRequest {
    uuid: string;
    nonce: string;
}

export interface IError {
    message: string;
}
