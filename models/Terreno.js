const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Terreno = new Schema({
  titulo: {
    type: String,
    required: true
  },
  descricao: {
    type: String,
    required: true
  },
  endereco: {
    type: String,
    required: true
  },
  preco: {
    type: Number,
    required: true
  },
  area: {
    type: Number,
    required: true
  },
  imagens: [ // Array de imagens
    {
      filename: String,
      path: String,
    },
  ],
  distrito:{
    type: Schema.Types.ObjectId,
    ref: "distritos",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

mongoose.model('terrenos', Terreno);