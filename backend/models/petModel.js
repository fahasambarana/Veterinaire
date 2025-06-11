const mongoose = require('mongoose')

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  species: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // ou "PetOwner" si tu as un modèle distinct
    required: true,
  },
  image: {
    type: String, // URL ou chemin vers l'image
  },
}, { timestamps: true });

module.exports= mongoose.model("Pet", petSchema);
