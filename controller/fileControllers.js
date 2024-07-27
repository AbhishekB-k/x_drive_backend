const cloudinary = require("../config/cloudinary");
const FileFolderModel = require("../model/fileSchema");
const fsPromises = require("fs/promises");

const createFileDocumentInMongoDB = async (req, res) => {
    try {
        const data = req.file;
        const { parentId } = req.body;
        const { _id } = req.user;

        const file = await FileFolderModel.create({
            name: data.originalname,
            userId: _id,
            type: "file",
            parentId: parentId === "null" ? undefined : parentId,
            metaData: { multer: data },
        });

        return file;
    } catch (err) {
        console.error("MongoDB Create Error:", err);
        res.status(500).json({
            status: "fail",
            message: "Internal Server Error",
        });
        return false;
    }
};

const uploadFileToCloudinary = async (req, file) => {
    try {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const folderPath = `Cloud-Home/${file.userId}/${file.parentId || ''}`.trim();
        console.log(`Uploading to: ${folderPath}`);

        const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: "auto",
            folder: folderPath,
            timeout: 60000,
        });

        await FileFolderModel.findByIdAndUpdate(file._id, {
            link: result.secure_url || result.url,
            "metaData.cloudinary": result,
        });

        return result.secure_url || result.url;
    } catch (err) {
        console.log("---------------------------------");
        console.log("❌❌❌❌ Cloudinary Error ❌❌❌❌");
        console.log(err);
        console.log("---------------------------------");
        return null;
    }
};

const deleteFileFromServer = async (file) => {
    try {
        await fsPromises.rm(file.metaData.multer.path);
        console.log("File deleted ✅");
    } catch (err) {
        console.error("File Deletion from Server Failed:", err);
        return false;
    }
};

const createFile = async (req, res) => {
    try {
        const documentCreated = await createFileDocumentInMongoDB(req, res);
        if (documentCreated) {
            const fileUrl = await uploadFileToCloudinary(req, documentCreated);
            if (fileUrl) {
                res.status(201).json({
                    status: "success",
                    data: {
                        file: documentCreated,
                        url: fileUrl,
                    },
                });
                // deleteFileFromServer(documentCreated); // Uncomment if you need to delete the file from the server
            } else {
                res.status(500).json({
                    status: "fail",
                    message: "File upload to Cloudinary failed",
                });
            }
        }
    } catch (err) {
        console.log("------------------------");
        console.log(err);
        console.log("------------------------");
        res.status(500).json({
            status: "fail",
            message: "Internal Server Error",
        });
    }
};

module.exports = { createFile };
