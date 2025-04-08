interface GlobalEventHandlersEventMap {
    upload: CustomEvent<SlicedUploadEventDetail>;
    done: CustomEvent<SlicedUploadEventDetail>;
}

interface HttpClientEventMap {
    progress: CustomEvent<HttpClientProgressEventDetail>;
}
