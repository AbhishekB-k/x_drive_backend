const express = require("express");
const { getFileFolders,getFileFoldersBysearch } = require("../controller/fileFolderControllers");

const fileFolderRouter = express.Router();

fileFolderRouter.route("/").post(getFileFolders);
fileFolderRouter.route("/search").post(getFileFoldersBysearch);

module.exports = fileFolderRouter;
