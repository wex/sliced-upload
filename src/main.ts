import SlicedUpload, { SlicedUploadEvent } from "./sliced-upload.ts";

document.querySelector<HTMLDivElement>('#upload')!.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const slicedUpload = new SlicedUpload(file);

    slicedUpload.addEventListener('progress', (e) => {
      console.log(e);
      document.querySelector<HTMLDivElement>('#progress')!.innerHTML = `${(e as SlicedUploadEvent).detail.progress}%`;
    });
    slicedUpload.addEventListener('ready', (e) => {
      console.log(e);
    });
    slicedUpload.addEventListener('error', (e) => {
      console.error(e);
    });

    slicedUpload.upload("http://localhost/uploader/test.php").then(() => {
      console.log('Uploaded');
    }).catch((e) => {
      console.error(e);
    });
});