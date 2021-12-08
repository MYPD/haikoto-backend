const Card = require("./../models/card.model");
const Hashtag = require("./../models/hashtag.model");
const HashtagService = require("./hashtag.service");
const ObjectId = require("mongoose").Types.ObjectId;
const CustomError = require("./../utils/custom-error");
const EloRatingAlgorithm = require("../utils/elo-rating-algorithm");

class CardService {
  async create(data, user) {
    if (!data.title) throw new CustomError("Card Title is required");
    if (!data.image) throw new CustomError("Card Image is required");
    // if (!data.hashtags) throw new CustomError("Card Hashtag is required");

    if (data.hashtags) {
      // Get #hashtags ID from database
      data.hashtags = await Promise.all(
        data.hashtags.map(async (hashtag) => {
          const createHashtag = await HashtagService.create({ name: hashtag });
          return createHashtag._id;
        })
      );
    } else {
      data.hashtags = [];
    }

    return await new Card({ userId: user._id, ...data }).save();
  }

  async getAll() {
    return await Card.find({ isDeleted: false }, { __v: 0 });
  }

  async getAllCardsAsHashtag() {
    // Get all hashtags
    const hashtags = await Hashtag.find({ isDeleted: false }).select(
      "_id name"
    );
    const cardTitles = await Card.find({ isDeleted: false }).select("title");

    const hashtagsMergedWithCards = [
      ...new Set([
        ...hashtags.map((hashtags) => hashtags.name),
        ...cardTitles.map((card) => card.title.toLowerCase())
      ])
    ];

    return hashtagsMergedWithCards;
  }

  async getOne(cardId) {
    if (!ObjectId.isValid(cardId)) throw new CustomError("Card does not exist");

    const card = await Card.findOne({ _id: cardId }).populate(
      "userId hashtags",
      "_id codeName name"
    );
    if (!card) throw new CustomError("Card does not exist");

    return card;
  }

  async getAllByUser(user) {
    return await Card.find({ userId: user._id, isDeleted: false }, { __v: 0 });
  }

  async eloRatingUpdate(data) {
    if (!data.winner || !ObjectId.isValid(data.winner))
      throw new CustomError("Valid Card Winner is required");
    if (!data.loser || !ObjectId.isValid(data.loser))
      throw new CustomError("Valid Card Loser is required");

    const winner = await Card.findOne({ _id: data.winner });
    const loser = await Card.findOne({ _id: data.loser });

    const new_elo_for_winner_card = EloRatingAlgorithm.getNewRating(
      winner.eloRating,
      loser.eloRating,
      1
    );
    const new_elo_for_loser_card = EloRatingAlgorithm.getNewRating(
      loser.eloRating,
      winner.eloRating,
      0
    );

    // Update winner card and loser card
    await Card.findOneAndUpdate(
      { _id: data.winner },
      { eloRating: new_elo_for_winner_card }
    );
    await Card.findOneAndUpdate(
      { _id: data.loser },
      { eloRating: new_elo_for_loser_card }
    );

    return {
      winner: new_elo_for_winner_card,
      loser: new_elo_for_loser_card
    };
  }

  async delete(cardId) {
    if (!ObjectId.isValid(cardId)) throw new CustomError("Card does not exist");

    const card = await Card.findOneAndUpdate(
      { _id: cardId },
      { isDeleted: true },
      { new: true }
    );

    if (!card) throw new CustomError("Card does not exist");

    return card;
  }
}

module.exports = new CardService();
