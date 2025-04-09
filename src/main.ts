import SlicedUpload from "./sliced-upload.ts";

document.querySelector<HTMLDivElement>('#upload')!.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const slicedUpload = new SlicedUpload(file);

    slicedUpload.on("upload", (e) => {
      document.querySelector<HTMLDivElement>('#progress')!.innerHTML = `${e.detail.progress}%`;
      console.log(e.detail);
    });

    slicedUpload.on('done', () => {
      document.querySelector<HTMLDivElement>('#progress')!.innerHTML = `Upload completed`;
    });

    slicedUpload.on('error', (e) => {
      console.error(e);
    });

    slicedUpload.upload("http://localhost/uploader/test.php").then(() => {
      console.log('Uploaded');
    }).catch((e) => {
      console.error(e);
    });
});