





export const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: Function) => {

    // console.log({ file });
    if (!file) return cb(new Error('File is empty'), false);

    const fileExtension = file.mimetype.split('/')[1];
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif']; // possible env var

    if (validExtensions.includes(fileExtension)) {
        return cb(null, true)
    }

    cb(null, false);

}


