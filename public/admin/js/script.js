

// upload preview image
const uploadImage = document.querySelector('[upload-image]');
if(uploadImage){
    const uploadImageInput = uploadImage.querySelector("[upload-image-input]");
    const uploadImagePreview = uploadImage.querySelector("[upload-image-preview]");
    const closeImage = uploadImage.querySelector("[close-image]");

    uploadImageInput.addEventListener("change", (event) => {
        const image = event.target.files[0]; // corresponding: uploadImageInput.files[0]
        
        if(image){
            uploadImagePreview.src = URL.createObjectURL(image);
            closeImage.classList.toggle("hide");
        }
    });

    // close image
    if(closeImage){
        closeImage.addEventListener("click", (event) => {
            closeImage.classList.add("hide");
            uploadImagePreview.src = "";
            uploadImageInput.value = "";
        });
    }
    // end close image
}
// end upload preview image

// upload preview audio
const uploadAudio = document.querySelector("[upload-audio]");
if(uploadAudio){
    const uploadAudioInput = uploadAudio.querySelector("[upload-audio-input]");
    const uploadAudioPreview = uploadAudio.querySelector("[upload-audio-preview]");
    const sourceUploadAudioPreview = uploadAudioPreview.querySelector("source");

    uploadAudioInput.addEventListener("change", (event) => {
        const audio = uploadAudioInput.files[0];
        
        if(audio){
            sourceUploadAudioPreview.src = URL.createObjectURL(audio);
            uploadAudioPreview.load();
        }
    });
}
// end upload preview audio