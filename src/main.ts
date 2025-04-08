import SlicedUpload from "./sliced-upload.ts";

document.querySelector<HTMLDivElement>('#upload')!.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const slicedUpload = new SlicedUpload(file);

    slicedUpload.on("upload", (e) => {
      document.querySelector<HTMLDivElement>('#progress')!.innerHTML = `${e.detail.progress}%`;
    });

    slicedUpload.on('done', (e) => {
      console.log(e);
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