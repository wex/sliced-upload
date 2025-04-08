import SlicedUpload, { SlicedUploadEventDetail } from "./sliced-upload.ts";

document.querySelector<HTMLDivElement>('#upload')!.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const slicedUpload = new SlicedUpload(file);

    slicedUpload.addEventListener("upload", (e) => {
      document.querySelector<HTMLDivElement>('#progress')!.innerHTML = `${(e as CustomEvent<SlicedUploadEventDetail>).detail.progress}%`;
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