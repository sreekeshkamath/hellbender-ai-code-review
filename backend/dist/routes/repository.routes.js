"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RepositoryController_1 = require("../controllers/RepositoryController");
const router = (0, express_1.Router)();
router.post('/clone', RepositoryController_1.RepositoryController.clone);
router.post('/sync/:repoId', RepositoryController_1.RepositoryController.sync);
router.get('/files/:repoId', RepositoryController_1.RepositoryController.getFiles);
// router.get('/file/:repoId/(.*)', RepositoryController.getFile); // TODO: fix route
router.delete('/:repoId', RepositoryController_1.RepositoryController.delete);
exports.default = router;
