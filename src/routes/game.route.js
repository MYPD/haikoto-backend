const router = require("express").Router();
const authGuard = require("../middlewares/auth.middleware");
const GameCtrl = require("../controllers/game.controller.js");

// @route   GET /api/game/
router.get("/", authGuard(), GameCtrl.getAll);

// @route   GET /api/game/me
router.get("/me", authGuard(), GameCtrl.getAllByUser);

// @route   GET /api/game/:gameId
router.get("/:gameId", authGuard(), GameCtrl.getOne);

// @route   GET /api/game/:gameId
router.get("/:gameId", authGuard(), GameCtrl.getOne);

// @route   GET /api/game/:gameId/addAnswer
router.post("/:gameId/addAnswer", authGuard(), GameCtrl.addAnswer);

// @route   POST /api/game/create
router.post("/create", authGuard(), GameCtrl.create);

module.exports = router;
